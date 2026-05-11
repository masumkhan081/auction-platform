import { sql } from 'drizzle-orm';
import {
  bigint,
  check,
  index,
  integer,
  pgTable,
  text,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { auctionStatusEnum } from './enums';
import {
  createdAt,
  deletedAt,
  idPrimaryKey,
  optionalTimestampAt,
  requiredTimestampAt,
  updatedAt,
} from './_helpers';
import { products } from './products';
import { users } from './users';

/**
 * Auction lifecycle: SCHEDULED → LIVE → SOLD | UNSOLD | CANCELLED.
 * State transitions live in `AuctionService` (centralized rules; no triggers).
 *
 * Money columns are `_minor` (integer cents, bigint). Times are stored UTC.
 *
 * Denormalized fields (`current_highest_minor`, `current_highest_bid_id`,
 * `bid_count`) exist for read performance and in-transaction validation, but
 * the **bids table remains the authoritative history**. The reconciliation
 * invariant: at txn commit, `current_highest_*` matches `MAX(amount_minor)`
 * over the auction's bids.
 *
 * Anti-sniping prep: `soft_close_seconds`. When > 0, a bid placed within the
 * last N seconds extends `ends_at` by N seconds. Off (0) by default.
 *
 * Reserve-price prep: `reserve_price_minor` (nullable). When set, an auction
 * with no bid ≥ reserve closes UNSOLD even if bids exist. Logic in P1F.
 *
 * Concurrency: `version` integer for optimistic locking on infrequent admin
 * edits (status flips done under SERIALIZABLE inside the bid path).
 */
export const auctions = pgTable(
  'auctions',
  {
    id: idPrimaryKey(),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'restrict' }),
    sellerId: uuid('seller_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),

    status: auctionStatusEnum('status').notNull().default('SCHEDULED'),

    startsAt: requiredTimestampAt('starts_at'),
    endsAt: requiredTimestampAt('ends_at'),
    startedAt: optionalTimestampAt('started_at'),
    closedAt: optionalTimestampAt('closed_at'),

    startPriceMinor: bigint('start_price_minor', { mode: 'number' }).notNull(),
    minBidIncrementMinor: bigint('min_bid_increment_minor', { mode: 'number' }).notNull(),
    reservePriceMinor: bigint('reserve_price_minor', { mode: 'number' }),

    softCloseSeconds: integer('soft_close_seconds').notNull().default(0),

    currentHighestMinor: bigint('current_highest_minor', { mode: 'number' }),
    currentHighestBidId: uuid('current_highest_bid_id'),
    bidCount: integer('bid_count').notNull().default(0),

    winnerUserId: uuid('winner_user_id').references(() => users.id, { onDelete: 'set null' }),
    winningBidId: uuid('winning_bid_id'),

    cancellationReason: text('cancellation_reason'),

    version: integer('version').notNull().default(1),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    deletedAt: deletedAt(),
  },
  (t) => ({
    auctionsProductIdx: index('auctions_product_id_idx').on(t.productId),
    auctionsSellerIdx: index('auctions_seller_id_idx').on(t.sellerId),
    auctionsStatusIdx: index('auctions_status_idx').on(t.status),
    auctionsEndsAtIdx: index('auctions_ends_at_idx').on(t.endsAt),
    auctionsStatusEndsAtIdx: index('auctions_status_ends_at_idx').on(t.status, t.endsAt),

    // Only one active (SCHEDULED or LIVE) auction per product at a time.
    auctionsActiveProductUq: uniqueIndex('auctions_active_product_uq')
      .on(t.productId)
      .where(sql`status in ('SCHEDULED','LIVE')`),

    auctionsTimeRangeChk: check('auctions_time_range_chk', sql`${t.startsAt} < ${t.endsAt}`),
    auctionsStartPriceChk: check('auctions_start_price_chk', sql`${t.startPriceMinor} >= 0`),
    auctionsIncrementChk: check(
      'auctions_increment_chk',
      sql`${t.minBidIncrementMinor} > 0`,
    ),
    auctionsSoftCloseChk: check(
      'auctions_soft_close_chk',
      sql`${t.softCloseSeconds} >= 0 AND ${t.softCloseSeconds} <= 600`,
    ),
  }),
);

export type AuctionRow = typeof auctions.$inferSelect;
export type NewAuctionRow = typeof auctions.$inferInsert;
