import { sql } from 'drizzle-orm';
import { check, index, integer, pgTable, text, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { createdAt, idPrimaryKey, updatedAt } from './_helpers';
import { auctions } from './auctions';
import { users } from './users';

/**
 * Post-auction feedback. One feedback per (auction, reviewer) pair — enforced
 * by unique index. Authorization (only winner/seller can review) lives in the
 * service layer.
 */
export const feedbacks = pgTable(
  'feedbacks',
  {
    id: idPrimaryKey(),
    auctionId: uuid('auction_id')
      .notNull()
      .references(() => auctions.id, { onDelete: 'cascade' }),
    reviewerId: uuid('reviewer_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    rating: integer('rating').notNull(),
    body: text('body').notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => ({
    feedbacksAuctionReviewerUq: uniqueIndex('feedbacks_auction_reviewer_uq').on(
      t.auctionId,
      t.reviewerId,
    ),
    feedbacksAuctionIdx: index('feedbacks_auction_id_idx').on(t.auctionId),
    feedbacksRatingChk: check(
      'feedbacks_rating_chk',
      sql`${t.rating} between 1 and 5`,
    ),
  }),
);

export type FeedbackRow = typeof feedbacks.$inferSelect;
export type NewFeedbackRow = typeof feedbacks.$inferInsert;
