import { Injectable } from '@nestjs/common';
import { and, count, desc, eq, inArray, isNull, lt, sql } from 'drizzle-orm';
import type { AuctionStatus } from '@auction/shared';
import { InjectDb } from '../database/database.module';
import type { DrizzleClient } from '../database/database.tokens';
import {
  auctions,
  type AuctionRow,
  type NewAuctionRow,
} from '../database/schema';

type ListFilters = {
  sellerId?: string;
  productId?: string;
  statusIn?: AuctionStatus[];
  includeDeleted?: boolean;
};

@Injectable()
export class AuctionsRepository {
  constructor(@InjectDb() private readonly db: DrizzleClient) {}

  async findById(id: string): Promise<AuctionRow | null> {
    const row = await this.db.query.auctions.findFirst({
      where: and(eq(auctions.id, id), isNull(auctions.deletedAt)),
    });
    return row ?? null;
  }

  list(limit: number, offset: number, filters: ListFilters = {}): Promise<AuctionRow[]> {
    return this.db
      .select()
      .from(auctions)
      .where(this.buildWhere(filters))
      .orderBy(desc(auctions.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async total(filters: ListFilters = {}): Promise<number> {
    const [row] = await this.db
      .select({ value: count() })
      .from(auctions)
      .where(this.buildWhere(filters));
    return row?.value ?? 0;
  }

  async insert(values: NewAuctionRow): Promise<AuctionRow> {
    const [row] = await this.db.insert(auctions).values(values).returning();
    if (!row) throw new Error('Auction insert returned no row');
    return row;
  }

  async update(id: string, patch: Partial<NewAuctionRow>): Promise<AuctionRow | null> {
    const [row] = await this.db
      .update(auctions)
      .set({ ...patch, updatedAt: new Date() })
      .where(eq(auctions.id, id))
      .returning();
    return row ?? null;
  }

  /**
   * Find LIVE auctions whose `ends_at` is past `now − graceMs`. Used by the
   * sweeper to recover from worker/Redis loss; the worker close path remains
   * authoritative.
   */
  async findOverdueLive(graceMs: number, limit = 100): Promise<{ id: string }[]> {
    return this.db
      .select({ id: auctions.id })
      .from(auctions)
      .where(
        and(
          eq(auctions.status, 'LIVE'),
          isNull(auctions.deletedAt),
          lt(auctions.endsAt, sql`now() - make_interval(secs => ${graceMs / 1000})`),
        ),
      )
      .limit(limit);
  }

  private buildWhere(filters: ListFilters) {
    const conds = [];
    if (!filters.includeDeleted) conds.push(isNull(auctions.deletedAt));
    if (filters.sellerId) conds.push(eq(auctions.sellerId, filters.sellerId));
    if (filters.productId) conds.push(eq(auctions.productId, filters.productId));
    if (filters.statusIn?.length) {
      conds.push(inArray(auctions.status, filters.statusIn));
    }
    return conds.length === 0 ? undefined : and(...conds);
  }
}
