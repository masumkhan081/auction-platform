import { z } from 'zod';

export const AUCTION_STATUSES = [
  'SCHEDULED',
  'LIVE',
  'SOLD',
  'UNSOLD',
  'CANCELLED',
] as const;

export const AuctionStatusSchema = z.enum(AUCTION_STATUSES);
export type AuctionStatus = z.infer<typeof AuctionStatusSchema>;

export const ACTIVE_AUCTION_STATUSES = ['SCHEDULED', 'LIVE'] as const satisfies ReadonlyArray<AuctionStatus>;
export const TERMINAL_AUCTION_STATUSES = ['SOLD', 'UNSOLD', 'CANCELLED'] as const satisfies ReadonlyArray<AuctionStatus>;
