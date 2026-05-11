import { z } from 'zod';
import { MoneyMinorSchema, UuidSchema } from './primitives';

export const PlaceBidRequestSchema = z.object({
  auctionId: UuidSchema,
  amountMinor: MoneyMinorSchema.refine((v) => v > 0, 'Amount must be positive'),
});
export type PlaceBidRequest = z.infer<typeof PlaceBidRequestSchema>;

export const BidDtoSchema = z.object({
  id: UuidSchema,
  auctionId: UuidSchema,
  bidderId: UuidSchema,
  amountMinor: MoneyMinorSchema,
  placedAt: z.string(),
});
export type BidDto = z.infer<typeof BidDtoSchema>;
