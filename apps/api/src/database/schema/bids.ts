import { sql } from 'drizzle-orm';
import { bigint, check, index, pgTable, uuid } from 'drizzle-orm/pg-core';
import { idPrimaryKey, requiredTimestampAt } from './_helpers';
import { auctions } from './auctions';
import { users } from './users';

/**
 * Append-only bid log. There is **no `updated_at`, no `deleted_at`** on this
 * table by design — bid history is immutable once written. Corrections
 * (admin retractions, fraud) are expressed as separate audit rows in
 * `auction_events`, never as in-place mutations of bids.
 *
 * Highest-bid lookup index: `(auction_id, amount_minor DESC, placed_at ASC)`.
 * The amount-desc / placed-at-asc ordering means earliest bid wins ties,
 * matching the user expectation "first to that price holds it".
 *
 * Note: the timestamp column is `placed_at` (not `created_at`) — it carries
 * domain meaning, and `BidPlacedEvent.placedAt` mirrors it on the wire.
 */
export const bids = pgTable(
  'bids',
  {
    id: idPrimaryKey(),
    auctionId: uuid('auction_id')
      .notNull()
      .references(() => auctions.id, { onDelete: 'restrict' }),
    bidderId: uuid('bidder_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),

    amountMinor: bigint('amount_minor', { mode: 'number' }).notNull(),
    placedAt: requiredTimestampAt('placed_at').default(sql`now()`),
  },
  (t) => ({
    bidsAuctionIdx: index('bids_auction_id_idx').on(t.auctionId),
    bidsBidderIdx: index('bids_bidder_id_idx').on(t.bidderId),
    bidsHighestIdx: index('bids_highest_idx').on(
      t.auctionId,
      sql`${t.amountMinor} desc`,
      t.placedAt,
    ),
    bidsAmountChk: check('bids_amount_chk', sql`${t.amountMinor} > 0`),
  }),
);

export type BidRow = typeof bids.$inferSelect;
export type NewBidRow = typeof bids.$inferInsert;
