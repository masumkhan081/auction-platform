import { Injectable } from '@nestjs/common';
import { and, count, desc, eq, isNull } from 'drizzle-orm';
import type { NotificationType } from '@auction/shared';
import { InjectDb } from '../database/database.module';
import type { DrizzleClient } from '../database/database.tokens';
import {
  notifications,
  type NewNotificationRow,
  type NotificationRow,
} from '../database/schema';

@Injectable()
export class NotificationsRepository {
  constructor(@InjectDb() private readonly db: DrizzleClient) {}

  async insert(values: {
    recipientId: string;
    type: NotificationType;
    payload: Record<string, unknown>;
  }): Promise<NotificationRow> {
    const insertValues: NewNotificationRow = {
      recipientId: values.recipientId,
      type: values.type,
      payload: values.payload,
    };
    const [row] = await this.db.insert(notifications).values(insertValues).returning();
    if (!row) throw new Error('Notification insert returned no row');
    return row;
  }

  list(
    recipientId: string,
    limit: number,
    offset: number,
    opts: { unreadOnly?: boolean } = {},
  ): Promise<NotificationRow[]> {
    const conds = [eq(notifications.recipientId, recipientId)];
    if (opts.unreadOnly) conds.push(isNull(notifications.readAt));
    return this.db
      .select()
      .from(notifications)
      .where(and(...conds))
      .orderBy(desc(notifications.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async total(recipientId: string, opts: { unreadOnly?: boolean } = {}): Promise<number> {
    const conds = [eq(notifications.recipientId, recipientId)];
    if (opts.unreadOnly) conds.push(isNull(notifications.readAt));
    const [row] = await this.db
      .select({ value: count() })
      .from(notifications)
      .where(and(...conds));
    return row?.value ?? 0;
  }

  async markRead(recipientId: string, id: string): Promise<NotificationRow | null> {
    const [row] = await this.db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(
        and(
          eq(notifications.id, id),
          eq(notifications.recipientId, recipientId),
          isNull(notifications.readAt),
        ),
      )
      .returning();
    return row ?? null;
  }
}
