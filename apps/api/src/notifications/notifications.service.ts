import { Injectable, Logger } from '@nestjs/common';
import type {
  NotificationDto,
  NotificationType,
  Paginated,
  PaginationQuery,
} from '@auction/shared';
import { AppException, paginate } from '../common';
import type { NotificationRow } from '../database/schema';
import { RealtimeEmitter } from '../realtime/realtime.emitter';
import { NotificationsRepository } from './notifications.repository';

/**
 * Persist-first delivery. The DB row is the source of truth; the socket
 * emission is best-effort delivery (a socket loss never loses the notification
 * because the user can still fetch via the inbox endpoint).
 */
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly repo: NotificationsRepository,
    private readonly emitter: RealtimeEmitter,
  ) {}

  /**
   * Persist + emit. Emission failures are logged but do not throw — the row
   * is committed and discoverable via the inbox endpoint.
   */
  async create(input: {
    recipientId: string;
    type: NotificationType;
    payload: Record<string, unknown>;
  }): Promise<NotificationDto> {
    const row = await this.repo.insert(input);
    const dto = this.toDto(row);
    try {
      this.emitter.emitNotificationCreated(dto);
    } catch (err) {
      this.logger.error(
        `notification.emit_failed id=${dto.id} recipientId=${dto.recipientId} type=${dto.type}: ${(err as Error).message}`,
      );
    }
    return dto;
  }

  async list(
    recipientId: string,
    query: PaginationQuery,
    filters: { unreadOnly?: boolean },
  ): Promise<Paginated<NotificationDto>> {
    return paginate({
      query,
      fetchTotal: () =>
        this.repo.total(recipientId, {
          ...(filters.unreadOnly !== undefined ? { unreadOnly: filters.unreadOnly } : {}),
        }),
      fetchItems: async (limit, offset) => {
        const rows = await this.repo.list(recipientId, limit, offset, {
          ...(filters.unreadOnly !== undefined ? { unreadOnly: filters.unreadOnly } : {}),
        });
        return rows.map(this.toDto);
      },
    });
  }

  async markRead(recipientId: string, id: string): Promise<NotificationDto> {
    const row = await this.repo.markRead(recipientId, id);
    if (!row) {
      throw AppException.notFound('notification.not_found', 'Notification not found');
    }
    return this.toDto(row);
  }

  private toDto = (row: NotificationRow): NotificationDto => ({
    id: row.id,
    recipientId: row.recipientId,
    type: row.type,
    payload: row.payload,
    readAt: row.readAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  });
}
