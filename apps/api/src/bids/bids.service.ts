import { Injectable, Logger } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import {
  type BidDto,
  type Paginated,
  type PaginationQuery,
  type PlaceBidRequest,
} from '@auction/shared';
import { AppException, paginate } from '../common';
import { InjectDb } from '../database/database.module';
import type { DrizzleClient } from '../database/database.tokens';
import {
  auctionEvents,
  auctions,
  bids,
  type BidRow,
} from '../database/schema';
import { type NotificationsService } from '../notifications/notifications.service';
import { type RealtimeEmitter } from '../realtime/realtime.emitter';
import { type BidsRepository } from './bids.repository';

const MAX_RETRIES = 5;
const PG_SERIALIZATION_FAILURE = '40001';

type PlaceArgs = PlaceBidRequest & { bidderId: string };

type CommitOutcome = {
  bid: BidRow;
  newCurrentHighestMinor: number;
  newEndsAt: Date;
  previousHighestBidderId: string | null;
  previousEndsAt: Date;
  extended: boolean;
  bidderDisplayName: string;
};

/**
 * Bid placement under SERIALIZABLE isolation. The retry loop is the only
 * place that handles serialization failures (`40001`). Every other error is
 * a domain exception thrown synchronously.
 *
 * Inside the transaction, in order:
 *
 *   1. Read auction; verify LIVE + not ended + bidder ≠ seller.
 *   2. Compute minimum acceptable bid:
 *        - first bid:  `start_price_minor`
 *        - subsequent: `current_highest_minor + min_bid_increment_minor`
 *   3. Insert bid (append-only).
 *   4. Anti-sniping: if `now ≥ ends_at − soft_close_seconds`, extend
 *      `ends_at` to `now + soft_close_seconds`. Same transaction.
 *   5. Update denormalized auction state (current_highest_*, bid_count, ends_at).
 *   6. Write `auction_events` rows: BID_PLACED + (optionally) EXTENDED_ANTI_SNIPING.
 *
 * Post-commit: socket emissions + outbid notification (persist-first).
 *
 * Invariant maintained: at commit, `current_highest_minor` matches
 * MAX(amount_minor) across this auction's bids — verified by the math above
 * combined with the `bid.too_low` rejection.
 */
@Injectable()
export class BidsService {
  private readonly logger = new Logger(BidsService.name);

  constructor(
    @InjectDb() private readonly db: DrizzleClient,
    private readonly repo: BidsRepository,
    private readonly emitter: RealtimeEmitter,
    private readonly notifications: NotificationsService,
  ) {}

  // ─── Reads ───────────────────────────────────────────────────────────────

  async listForAuction(
    auctionId: string,
    query: PaginationQuery,
  ): Promise<Paginated<BidDto>> {
    return paginate({
      query,
      fetchTotal: () => this.repo.total(auctionId),
      fetchItems: async (limit, offset) => {
        const rows = await this.repo.list(auctionId, limit, offset);
        return rows.map(this.toDto);
      },
    });
  }

  async listForBidder(
    bidderId: string,
    query: PaginationQuery,
  ): Promise<Paginated<BidDto>> {
    return paginate({
      query,
      fetchTotal: () => this.repo.totalForBidder(bidderId),
      fetchItems: async (limit, offset) => {
        const rows = await this.repo.listForBidder(bidderId, limit, offset);
        return rows.map(this.toDto);
      },
    });
  }

  // ─── Place ───────────────────────────────────────────────────────────────

  async place(input: PlaceArgs): Promise<BidDto> {
    let lastSerializationError: unknown;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const outcome = await this.commitBid(input, attempt);
        await this.afterCommit(input, outcome);
        return this.toDto(outcome.bid);
      } catch (err) {
        if (this.isSerializationFailure(err) && attempt < MAX_RETRIES) {
          lastSerializationError = err;
          this.logger.warn(
            `bid.serialization_retry auctionId=${input.auctionId} bidderId=${input.bidderId} attempt=${attempt}`,
          );
          await this.backoff(attempt);
          continue;
        }
        throw err;
      }
    }

    this.logger.error(
      `bid.contention_exhausted auctionId=${input.auctionId} bidderId=${input.bidderId} attempts=${MAX_RETRIES} lastErr=${(lastSerializationError as Error | undefined)?.message ?? '?'}`,
    );
    throw AppException.unprocessable(
      'bid.contention',
      'Auction is under heavy contention — please retry',
    );
  }

  // ─── Internal: the SERIALIZABLE transaction ──────────────────────────────

  private async commitBid(input: PlaceArgs, attempt: number): Promise<CommitOutcome> {
    return this.db.transaction(
      async (tx) => {
        // 1. Read auction + bidder display name
        const auction = await tx.query.auctions.findFirst({
          where: eq(auctions.id, input.auctionId),
        });
        if (!auction) {
          throw AppException.notFound('auction.not_found', 'Auction not found');
        }
        if (auction.status !== 'LIVE') {
          throw AppException.unprocessable('auction.not_live', 'Auction is not live');
        }
        const now = Date.now();
        if (auction.endsAt.getTime() <= now) {
          throw AppException.unprocessable('auction.ended', 'Auction has already ended');
        }
        if (auction.sellerId === input.bidderId) {
          throw AppException.forbidden('bid.cannot_bid_own_auction', 'Cannot bid on your own auction');
        }

        // 2. Validate amount against the authoritative minimum.
        const minAcceptable =
          auction.currentHighestMinor === null
            ? auction.startPriceMinor
            : auction.currentHighestMinor + auction.minBidIncrementMinor;
        if (input.amountMinor < minAcceptable) {
          throw AppException.unprocessable('bid.too_low', `Minimum acceptable bid is ${minAcceptable}`, {
            minAcceptable,
            currentHighestMinor: auction.currentHighestMinor,
          });
        }

        // 3. Insert bid (append-only).
        const [bid] = await tx
          .insert(bids)
          .values({
            auctionId: auction.id,
            bidderId: input.bidderId,
            amountMinor: input.amountMinor,
          })
          .returning();
        if (!bid) throw new Error('Bid insert returned no row');

        // 4. Anti-sniping check.
        const previousEndsAt = auction.endsAt;
        let newEndsAt = auction.endsAt;
        let extended = false;
        if (auction.softCloseSeconds > 0) {
          const threshold = auction.endsAt.getTime() - auction.softCloseSeconds * 1000;
          if (now >= threshold) {
            newEndsAt = new Date(now + auction.softCloseSeconds * 1000);
            extended = true;
          }
        }

        // 5. Update denormalized auction state.
        await tx
          .update(auctions)
          .set({
            currentHighestMinor: input.amountMinor,
            currentHighestBidId: bid.id,
            bidCount: auction.bidCount + 1,
            endsAt: newEndsAt,
            updatedAt: new Date(),
          })
          .where(eq(auctions.id, auction.id));

        // 6. Audit events.
        await tx.insert(auctionEvents).values({
          auctionId: auction.id,
          actorId: input.bidderId,
          eventType: 'BID_PLACED',
          payload: {
            bidId: bid.id,
            amountMinor: input.amountMinor,
            previousHighestMinor: auction.currentHighestMinor,
            attempt,
          },
        });
        if (extended) {
          await tx.insert(auctionEvents).values({
            auctionId: auction.id,
            actorId: null,
            eventType: 'EXTENDED_ANTI_SNIPING',
            payload: {
              previousEndsAt: previousEndsAt.toISOString(),
              newEndsAt: newEndsAt.toISOString(),
              triggeredByBidId: bid.id,
            },
          });
        }

        // Resolve the previous highest bidder (for outbid notification) — read
        // the prior current_highest_bid_id BEFORE we updated it above is the
        // value captured in `auction.currentHighestBidId`.
        let previousHighestBidderId: string | null = null;
        if (auction.currentHighestBidId !== null) {
          const prior = await tx.query.bids.findFirst({
            where: eq(bids.id, auction.currentHighestBidId),
          });
          previousHighestBidderId = prior?.bidderId ?? null;
        }

        // Display name for the public bid-placed event (best effort).
        const profile = await tx.query.profiles.findFirst({
          where: (profiles, ops) => ops.eq(profiles.userId, input.bidderId),
        });

        return {
          bid,
          newCurrentHighestMinor: input.amountMinor,
          newEndsAt,
          previousHighestBidderId,
          previousEndsAt,
          extended,
          bidderDisplayName: profile?.fullName ?? 'Bidder',
        };
      },
      { isolationLevel: 'serializable' },
    );
  }

  // ─── Internal: post-commit emissions ─────────────────────────────────────

  private async afterCommit(input: PlaceArgs, outcome: CommitOutcome): Promise<void> {
    this.logger.log(
      `bid.placed auctionId=${input.auctionId} bidId=${outcome.bid.id} bidderId=${input.bidderId} amountMinor=${input.amountMinor} extended=${outcome.extended}`,
    );

    this.emitter.emitBidPlaced({
      auctionId: input.auctionId,
      bidId: outcome.bid.id,
      bidderId: input.bidderId,
      bidderDisplayName: outcome.bidderDisplayName,
      amountMinor: input.amountMinor,
      placedAt: outcome.bid.placedAt,
      newCurrentHighestMinor: outcome.newCurrentHighestMinor,
    });

    if (outcome.extended) {
      this.emitter.emitAuctionTick({
        auctionId: input.auctionId,
        serverNow: new Date(),
        endsAt: outcome.newEndsAt,
        status: 'LIVE',
      });
    }

    if (
      outcome.previousHighestBidderId &&
      outcome.previousHighestBidderId !== input.bidderId
    ) {
      // Persist-first: the inbox row is the source of truth even if the socket fails.
      await this.notifications.create({
        recipientId: outcome.previousHighestBidderId,
        type: 'OUTBID',
        payload: {
          auctionId: input.auctionId,
          newCurrentHighestMinor: outcome.newCurrentHighestMinor,
        },
      });
      this.emitter.emitOutbid({
        auctionId: input.auctionId,
        previousBidderId: outcome.previousHighestBidderId,
        newCurrentHighestMinor: outcome.newCurrentHighestMinor,
      });
    }
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────

  private isSerializationFailure(err: unknown): boolean {
    if (typeof err !== 'object' || err === null) return false;
    const code = (err as { code?: unknown }).code;
    return code === PG_SERIALIZATION_FAILURE;
  }

  private async backoff(attempt: number): Promise<void> {
    const ms = 10 * 2 ** (attempt - 1) + Math.floor(Math.random() * 10);
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private toDto = (row: BidRow): BidDto => ({
    id: row.id,
    auctionId: row.auctionId,
    bidderId: row.bidderId,
    amountMinor: row.amountMinor,
    placedAt: row.placedAt.toISOString(),
  });
}
