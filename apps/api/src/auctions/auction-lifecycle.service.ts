import { Injectable, Logger } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { InjectDb } from '../database/database.module';
import type { DrizzleClient } from '../database/database.tokens';
import {
  auctionEvents,
  auctions,
  bids,
  products,
} from '../database/schema';
import { transition as productTransition } from '../products/product-state';
import { NotificationsService } from '../notifications/notifications.service';
import { RealtimeEmitter } from '../realtime/realtime.emitter';

export type StartOutcome = 'started' | 'gone' | 'wrong_status' | 'too_early';
export type CloseOutcome = 'sold' | 'unsold' | 'not_yet' | 'wrong_status' | 'gone';

type StartResult = { outcome: StartOutcome };
type CloseResult =
  | { outcome: 'sold' | 'unsold' }
  | { outcome: 'not_yet'; requeueAt: Date }
  | { outcome: 'wrong_status' | 'gone' };

/**
 * Authoritative auction lifecycle transitions: `SCHEDULED → LIVE` and
 * `LIVE → SOLD|UNSOLD`. Both methods are idempotent and replay-safe:
 *
 *   - re-read state inside the transaction; no-op if already past the target
 *   - if too early (worker fired before `endsAt`), return `not_yet` so the
 *     worker requeues
 *   - SERIALIZABLE isolation prevents two workers from racing the same close
 *
 * Side effects (notifications, socket emissions) happen AFTER commit.
 */
@Injectable()
export class AuctionLifecycleService {
  private readonly logger = new Logger(AuctionLifecycleService.name);

  constructor(
    @InjectDb() private readonly db: DrizzleClient,
    private readonly emitter: RealtimeEmitter,
    private readonly notifications: NotificationsService,
  ) {}

  // ─── Admin force-start (sets startsAt=now and runs the start path) ───────

  async forceStart(auctionId: string): Promise<StartResult> {
    await this.db
      .update(auctions)
      .set({ startsAt: new Date(), updatedAt: new Date() })
      .where(eq(auctions.id, auctionId));
    return this.startIfDue(auctionId);
  }

  // ─── Start ───────────────────────────────────────────────────────────────

  async startIfDue(auctionId: string): Promise<StartResult> {
    const result = await this.db.transaction(
      async (tx) => {
        const auction = await tx.query.auctions.findFirst({
          where: eq(auctions.id, auctionId),
        });
        if (!auction) return { outcome: 'gone' as const };
        if (auction.status !== 'SCHEDULED') return { outcome: 'wrong_status' as const };
        if (auction.startsAt.getTime() > Date.now()) {
          return { outcome: 'too_early' as const };
        }

        await tx
          .update(auctions)
          .set({ status: 'LIVE', startedAt: new Date(), updatedAt: new Date() })
          .where(eq(auctions.id, auctionId));

        await tx.insert(auctionEvents).values({
          auctionId,
          actorId: null,
          eventType: 'STATUS_CHANGED',
          payload: { from: 'SCHEDULED', to: 'LIVE' },
        });

        return { outcome: 'started' as const, endsAt: auction.endsAt };
      },
      { isolationLevel: 'serializable' },
    );

    if (result.outcome === 'started') {
      this.emitter.emitAuctionTick({
        auctionId,
        serverNow: new Date(),
        endsAt: result.endsAt,
        status: 'LIVE',
      });
    }
    return { outcome: result.outcome };
  }

  // ─── Close ───────────────────────────────────────────────────────────────

  async closeIfDue(auctionId: string): Promise<CloseResult> {
    const txResult = await this.db.transaction(
      async (tx) => {
        const auction = await tx.query.auctions.findFirst({
          where: eq(auctions.id, auctionId),
        });
        if (!auction) return { kind: 'gone' as const };
        if (auction.status !== 'LIVE') return { kind: 'wrong_status' as const };
        if (auction.endsAt.getTime() > Date.now()) {
          return { kind: 'not_yet' as const, requeueAt: auction.endsAt };
        }

        // Resolve winner — must clear reserve, if any.
        let winnerBidderId: string | null = null;
        let winnerBidId: string | null = null;
        let winningAmountMinor: number | null = null;

        if (
          auction.currentHighestMinor !== null &&
          auction.currentHighestBidId !== null &&
          (auction.reservePriceMinor === null ||
            auction.currentHighestMinor >= auction.reservePriceMinor)
        ) {
          const winner = await tx.query.bids.findFirst({
            where: eq(bids.id, auction.currentHighestBidId),
          });
          if (winner) {
            winnerBidderId = winner.bidderId;
            winnerBidId = winner.id;
            winningAmountMinor = winner.amountMinor;
          }
        }

        if (winnerBidderId && winnerBidId && winningAmountMinor !== null) {
          await tx
            .update(auctions)
            .set({
              status: 'SOLD',
              closedAt: new Date(),
              winnerUserId: winnerBidderId,
              winningBidId: winnerBidId,
              updatedAt: new Date(),
            })
            .where(eq(auctions.id, auctionId));

          const productNext = productTransition.markSold({ lifecycle: 'IN_AUCTION' });
          if (productNext.lifecycle) {
            await tx
              .update(products)
              .set({ lifecycleStatus: productNext.lifecycle, updatedAt: new Date() })
              .where(eq(products.id, auction.productId));
          }

          await tx.insert(auctionEvents).values({
            auctionId,
            actorId: null,
            eventType: 'CLOSED',
            payload: {
              outcome: 'SOLD',
              winnerUserId: winnerBidderId,
              winningBidId: winnerBidId,
              winningAmountMinor,
            },
          });

          return {
            kind: 'sold' as const,
            sellerId: auction.sellerId,
            winnerBidderId,
            winnerBidId,
            winningAmountMinor,
          };
        }

        await tx
          .update(auctions)
          .set({ status: 'UNSOLD', closedAt: new Date(), updatedAt: new Date() })
          .where(eq(auctions.id, auctionId));

        const productNext = productTransition.returnToListing({ lifecycle: 'IN_AUCTION' });
        if (productNext.lifecycle) {
          await tx
            .update(products)
            .set({ lifecycleStatus: productNext.lifecycle, updatedAt: new Date() })
            .where(eq(products.id, auction.productId));
        }

        const reason = auction.currentHighestMinor === null ? 'no_bids' : 'reserve_not_met';
        await tx.insert(auctionEvents).values({
          auctionId,
          actorId: null,
          eventType: 'CLOSED',
          payload: {
            outcome: 'UNSOLD',
            reason,
            highestMinor: auction.currentHighestMinor,
            reserveMinor: auction.reservePriceMinor,
          },
        });

        return { kind: 'unsold' as const, sellerId: auction.sellerId };
      },
      { isolationLevel: 'serializable' },
    );

    // Post-commit side effects.
    if (txResult.kind === 'sold') {
      this.emitter.emitAuctionClosed({
        auctionId,
        status: 'SOLD',
        winnerBidId: txResult.winnerBidId,
        winningAmountMinor: txResult.winningAmountMinor,
        closedAt: new Date(),
      });
      await this.notifications.create({
        recipientId: txResult.winnerBidderId,
        type: 'AUCTION_WON',
        payload: { auctionId, amountMinor: txResult.winningAmountMinor },
      });
      await this.notifications.create({
        recipientId: txResult.sellerId,
        type: 'AUCTION_WON',
        payload: { auctionId, outcome: 'SOLD', amountMinor: txResult.winningAmountMinor, asSeller: true },
      });
      return { outcome: 'sold' };
    }

    if (txResult.kind === 'unsold') {
      this.emitter.emitAuctionClosed({
        auctionId,
        status: 'UNSOLD',
        winnerBidId: null,
        winningAmountMinor: null,
        closedAt: new Date(),
      });
      await this.notifications.create({
        recipientId: txResult.sellerId,
        type: 'AUCTION_CLOSED_NO_WINNER',
        payload: { auctionId },
      });
      return { outcome: 'unsold' };
    }

    if (txResult.kind === 'not_yet') {
      return { outcome: 'not_yet', requeueAt: txResult.requeueAt };
    }
    return { outcome: txResult.kind };
  }
}
