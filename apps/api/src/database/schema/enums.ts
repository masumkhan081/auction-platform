import { pgEnum } from 'drizzle-orm/pg-core';
import {
  AUCTION_STATUSES,
  GENDERS,
  NOTIFICATION_TYPES,
  PRODUCT_APPROVAL_STATUSES,
  PRODUCT_LIFECYCLE_STATUSES,
  ROLES,
} from '@auction/shared';

/**
 * Postgres enum types driven from `@auction/shared` constants. Single source
 * of truth: TS type, Zod parser, and DB enum all derive from the same array.
 *
 * Tradeoff: adding a value requires a migration. For domain enums that change
 * rarely (role, status), this strictness is the point.
 */

export const roleEnum = pgEnum('role', ROLES);
export const auctionStatusEnum = pgEnum('auction_status', AUCTION_STATUSES);
export const productApprovalStatusEnum = pgEnum('product_approval_status', PRODUCT_APPROVAL_STATUSES);
export const productLifecycleStatusEnum = pgEnum('product_lifecycle_status', PRODUCT_LIFECYCLE_STATUSES);
export const genderEnum = pgEnum('gender', GENDERS);
export const notificationTypeEnum = pgEnum('notification_type', NOTIFICATION_TYPES);

/**
 * Local-only enums (no shared client representation needed).
 */
export const refreshRevokedReasonEnum = pgEnum('refresh_revoked_reason', [
  'ROTATED',
  'USER_LOGOUT',
  'REUSE_DETECTED',
  'ADMIN_REVOKED',
  'EXPIRED',
]);

export const auctionEventTypeEnum = pgEnum('auction_event_type', [
  'CREATED',
  'STATUS_CHANGED',
  'BID_PLACED',
  'EXTENDED_ANTI_SNIPING',
  'CLOSED',
  'CANCELLED',
]);

export const paymentStatusEnum = pgEnum('payment_status', [
  'PENDING',
  'AUTHORIZED',
  'PAID',
  'REFUNDED',
  'FAILED',
]);
