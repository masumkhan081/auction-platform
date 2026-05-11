import { z } from 'zod';

export const NOTIFICATION_TYPES = [
  'BID_PLACED',
  'OUTBID',
  'AUCTION_STARTED',
  'AUCTION_ENDING_SOON',
  'AUCTION_WON',
  'AUCTION_LOST',
  'AUCTION_CLOSED_NO_WINNER',
  'PRODUCT_APPROVED',
  'PRODUCT_REJECTED',
  'FEEDBACK_RECEIVED',
] as const;

export const NotificationTypeSchema = z.enum(NOTIFICATION_TYPES);
export type NotificationType = z.infer<typeof NotificationTypeSchema>;
