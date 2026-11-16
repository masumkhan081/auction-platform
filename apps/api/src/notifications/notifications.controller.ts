import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
} from '@nestjs/common';
import { z } from 'zod';
import {
  PaginationQuerySchema,
  type NotificationDto,
  type Paginated,
} from '@auction/shared';
import { ZodQuery } from '../common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { RequestUser } from '../auth/auth.types';
import { NotificationsService } from './notifications.service';

const InboxQuerySchema = PaginationQuerySchema.extend({
  unread: z
    .union([z.literal('true'), z.literal('false')])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true')),
});

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  list(
    @CurrentUser() user: RequestUser,
    @ZodQuery(InboxQuerySchema) query: z.infer<typeof InboxQuerySchema>,
  ): Promise<Paginated<NotificationDto>> {
    return this.notifications.list(
      user.id,
      { page: query.page, pageSize: query.pageSize },
      { ...(query.unread !== undefined ? { unreadOnly: query.unread } : {}) },
    );
  }

  @Patch(':id/read')
  markRead(
    @CurrentUser() user: RequestUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<NotificationDto> {
    return this.notifications.markRead(user.id, id);
  }
}
