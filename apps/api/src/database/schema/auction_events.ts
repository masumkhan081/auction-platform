import { index, jsonb, pgTable, uuid } from 'drizzle-orm/pg-core';
import { auctionEventTypeEnum } from './enums';
import { createdAt, idPrimaryKey } from './_helpers';
import { auctions } from './auctions';
import { users } from './users';

/**
 * Append-only audit log for an auction. Captures every state-affecting event
 * (creation, status flips, bids, anti-sniping extensions, cancellations).
 *
 * Read by admin tooling and used to reconstruct timelines for disputes.
 * Bids are *also* logged here as `BID_PLACED` events so a single timeline
 * query needs no UNION across tables.
 */
export const auctionEvents = pgTable(
  'auction_events',
  {
    id: idPrimaryKey(),
    auctionId: uuid('auction_id')
      .notNull()
      .references(() => auctions.id, { onDelete: 'cascade' }),
    actorId: uuid('actor_id').references(() => users.id, { onDelete: 'set null' }),
    eventType: auctionEventTypeEnum('event_type').notNull(),
    payload: jsonb('payload').$type<Record<string, unknown>>().notNull().default({}),
    createdAt: createdAt(),
  },
  (t) => ({
    auctionEventsAuctionIdx: index('auction_events_auction_id_idx').on(t.auctionId),
    auctionEventsTypeIdx: index('auction_events_event_type_idx').on(t.eventType),
    auctionEventsCreatedIdx: index('auction_events_created_at_idx').on(t.createdAt),
  }),
);

export type AuctionEventRow = typeof auctionEvents.$inferSelect;
export type NewAuctionEventRow = typeof auctionEvents.$inferInsert;
