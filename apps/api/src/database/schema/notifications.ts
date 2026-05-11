import { index, jsonb, pgTable, uuid } from 'drizzle-orm/pg-core';
import { notificationTypeEnum } from './enums';
import { createdAt, idPrimaryKey, optionalTimestampAt } from './_helpers';
import { users } from './users';

/**
 * Read-state expressed by `read_at` (nullable timestamp), not a boolean.
 * Payload schema is per-type and validated by Zod at insert/select time.
 */
export const notifications = pgTable(
  'notifications',
  {
    id: idPrimaryKey(),
    recipientId: uuid('recipient_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: notificationTypeEnum('type').notNull(),
    payload: jsonb('payload').$type<Record<string, unknown>>().notNull().default({}),
    readAt: optionalTimestampAt('read_at'),
    createdAt: createdAt(),
  },
  (t) => ({
    notificationsRecipientIdx: index('notifications_recipient_id_idx').on(t.recipientId),
    notificationsRecipientUnreadIdx: index(
      'notifications_recipient_unread_idx',
    ).on(t.recipientId, t.readAt),
    notificationsCreatedIdx: index('notifications_created_at_idx').on(t.createdAt),
  }),
);

export type NotificationRow = typeof notifications.$inferSelect;
export type NewNotificationRow = typeof notifications.$inferInsert;
