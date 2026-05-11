import { Injectable } from '@nestjs/common';
import { and, asc, count, desc, eq } from 'drizzle-orm';
import { InjectDb } from '../database/database.module';
import type { DrizzleClient } from '../database/database.tokens';
import { bids, type BidRow } from '../database/schema';

@Injectable()
export class BidsRepository {
  constructor(@InjectDb() private readonly db: DrizzleClient) {}

  /** Bid history for an auction, newest first. Used for `GET /api/auctions/:id/bids`. */
  list(auctionId: string, limit: number, offset: number): Promise<BidRow[]> {
    return this.db
      .select()
      .from(bids)
      .where(eq(bids.auctionId, auctionId))
      .orderBy(desc(bids.amountMinor), asc(bids.placedAt))
      .limit(limit)
      .offset(offset);
  }

  async total(auctionId: string): Promise<number> {
    const [row] = await this.db
      .select({ value: count() })
      .from(bids)
      .where(eq(bids.auctionId, auctionId));
    return row?.value ?? 0;
  }

  /** A bidder's own bids — used for "my bids" view. */
  listForBidder(bidderId: string, limit: number, offset: number): Promise<BidRow[]> {
    return this.db
      .select()
      .from(bids)
      .where(eq(bids.bidderId, bidderId))
      .orderBy(desc(bids.placedAt))
      .limit(limit)
      .offset(offset);
  }

  async totalForBidder(bidderId: string): Promise<number> {
    const [row] = await this.db
      .select({ value: count() })
      .from(bids)
      .where(eq(bids.bidderId, bidderId));
    return row?.value ?? 0;
  }

  async findById(id: string): Promise<BidRow | null> {
    const row = await this.db.query.bids.findFirst({
      where: eq(bids.id, id),
    });
    return row ?? null;
  }

  async findByAuctionAndBidder(
    auctionId: string,
    bidderId: string,
  ): Promise<BidRow | null> {
    const row = await this.db.query.bids.findFirst({
      where: and(eq(bids.auctionId, auctionId), eq(bids.bidderId, bidderId)),
      orderBy: desc(bids.placedAt),
    });
    return row ?? null;
  }
}
