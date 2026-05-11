import { bigint, index, jsonb, pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { paymentStatusEnum } from './enums';
import { createdAt, idPrimaryKey, optionalTimestampAt, updatedAt } from './_helpers';
import { auctions } from './auctions';
import { users } from './users';

/**
 * Payment placeholder. Schema is laid out so a real provider (Stripe/Razorpay)
 * can be wired in without further migrations:
 *   - `provider` + `provider_ref` for the external charge id
 *   - `payload` for raw provider response (audit)
 *   - status enum for the lifecycle
 */
export const payments = pgTable(
  'payments',
  {
    id: idPrimaryKey(),
    auctionId: uuid('auction_id')
      .notNull()
      .references(() => auctions.id, { onDelete: 'restrict' }),
    buyerId: uuid('buyer_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    sellerId: uuid('seller_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),

    amountMinor: bigint('amount_minor', { mode: 'number' }).notNull(),
    status: paymentStatusEnum('status').notNull().default('PENDING'),

    provider: text('provider'),
    providerRef: text('provider_ref'),
    payload: jsonb('payload').$type<Record<string, unknown>>().notNull().default({}),

    paidAt: optionalTimestampAt('paid_at'),
    refundedAt: optionalTimestampAt('refunded_at'),
    failedAt: optionalTimestampAt('failed_at'),

    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => ({
    paymentsAuctionIdx: index('payments_auction_id_idx').on(t.auctionId),
    paymentsBuyerIdx: index('payments_buyer_id_idx').on(t.buyerId),
    paymentsSellerIdx: index('payments_seller_id_idx').on(t.sellerId),
    paymentsStatusIdx: index('payments_status_idx').on(t.status),
  }),
);

export type PaymentRow = typeof payments.$inferSelect;
export type NewPaymentRow = typeof payments.$inferInsert;
