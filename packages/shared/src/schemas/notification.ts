import { z } from 'zod';
import { NotificationTypeSchema } from '../enums/notification';
import { UuidSchema } from './primitives';

export const NotificationDtoSchema = z.object({
  id: UuidSchema,
  recipientId: UuidSchema,
  type: NotificationTypeSchema,
  payload: z.record(z.unknown()),
  readAt: z.string().nullable(),
  createdAt: z.string(),
});
export type NotificationDto = z.infer<typeof NotificationDtoSchema>;
