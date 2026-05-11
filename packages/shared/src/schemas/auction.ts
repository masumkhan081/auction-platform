import { z } from 'zod';
import { AuctionStatusSchema } from '../enums/auction-status';
import { IsoDateSchema, MoneyMinorSchema, UuidSchema } from './primitives';

// ─── Requests ────────────────────────────────────────────────────────────────

export const CreateAuctionRequestSchema = z
  .object({
    productId: UuidSchema,
    startsAt: IsoDateSchema,
    endsAt: IsoDateSchema,
    startPriceMinor: MoneyMinorSchema,
    minBidIncrementMinor: MoneyMinorSchema.refine((v) => v > 0, 'Increment must be positive'),
    reservePriceMinor: MoneyMinorSchema.optional(),
    softCloseSeconds: z.number().int().min(0).max(600).default(0),
  })
  .refine((v) => v.startsAt < v.endsAt, {
    path: ['endsAt'],
    message: 'endsAt must be after startsAt',
  })
  .refine(
    (v) => v.reservePriceMinor === undefined || v.reservePriceMinor >= v.startPriceMinor,
    { path: ['reservePriceMinor'], message: 'Reserve price cannot be below start price' },
  );
export type CreateAuctionRequest = z.infer<typeof CreateAuctionRequestSchema>;

export const UpdateAuctionRequestSchema = z
  .object({
    startsAt: IsoDateSchema.optional(),
    endsAt: IsoDateSchema.optional(),
    startPriceMinor: MoneyMinorSchema.optional(),
    minBidIncrementMinor: MoneyMinorSchema.optional(),
    reservePriceMinor: MoneyMinorSchema.nullish(),
    softCloseSeconds: z.number().int().min(0).max(600).optional(),
  })
  .strict();
export type UpdateAuctionRequest = z.infer<typeof UpdateAuctionRequestSchema>;

export const CancelAuctionRequestSchema = z.object({
  reason: z.string().trim().min(3).max(300),
});
export type CancelAuctionRequest = z.infer<typeof CancelAuctionRequestSchema>;

// ─── Responses ───────────────────────────────────────────────────────────────

const AuctionBase = {
  id: UuidSchema,
  productId: UuidSchema,
  sellerId: UuidSchema,
  status: AuctionStatusSchema,
  startsAt: z.string(),
  endsAt: z.string(),
  startedAt: z.string().nullable(),
  closedAt: z.string().nullable(),
  startPriceMinor: MoneyMinorSchema,
  minBidIncrementMinor: MoneyMinorSchema,
  reservePriceMinor: MoneyMinorSchema.nullable(),
  softCloseSeconds: z.number().int(),
  currentHighestMinor: MoneyMinorSchema.nullable(),
  bidCount: z.number().int().nonnegative(),
  createdAt: z.string(),
  updatedAt: z.string(),
};

/** Public listing/detail — no moderation/cancellation reasons exposed. */
export const PublicAuctionDtoSchema = z.object(AuctionBase);
export type PublicAuctionDto = z.infer<typeof PublicAuctionDtoSchema>;

/** Seller-owned auction — adds cancellation reason and winner if any. */
export const SellerAuctionDtoSchema = z.object({
  ...AuctionBase,
  cancellationReason: z.string().nullable(),
  winnerUserId: UuidSchema.nullable(),
});
export type SellerAuctionDto = z.infer<typeof SellerAuctionDtoSchema>;

/** Admin — everything (no extra fields beyond seller view in P1D, but kept distinct
 *  so future audit fields land here without leaking to seller). */
export const AdminAuctionDtoSchema = SellerAuctionDtoSchema;
export type AdminAuctionDto = z.infer<typeof AdminAuctionDtoSchema>;
