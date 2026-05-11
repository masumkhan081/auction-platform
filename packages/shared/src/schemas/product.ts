import { z } from 'zod';
import {
  ProductApprovalStatusSchema,
  ProductLifecycleStatusSchema,
} from '../enums/product-status';
import { UuidSchema } from './primitives';

const ProductNameSchema = z.string().trim().min(2).max(120);
const ProductDescriptionSchema = z.string().trim().min(10).max(5_000);

/** Cloudinary asset reference. Created during signed-upload flow (P1F). */
export const ProductImageRefSchema = z.object({
  publicId: z.string().min(1),
  url: z.string().url(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  bytes: z.number().int().positive(),
});
export type ProductImageRef = z.infer<typeof ProductImageRefSchema>;

const ImagesSchema = z.array(ProductImageRefSchema).min(1).max(8);

// ─── Requests ────────────────────────────────────────────────────────────────

export const CreateProductRequestSchema = z.object({
  name: ProductNameSchema,
  description: ProductDescriptionSchema,
  categoryId: UuidSchema,
  images: ImagesSchema,
});
export type CreateProductRequest = z.infer<typeof CreateProductRequestSchema>;

export const UpdateProductRequestSchema = CreateProductRequestSchema.partial().strict();
export type UpdateProductRequest = z.infer<typeof UpdateProductRequestSchema>;

export const RejectProductRequestSchema = z.object({
  reviewNote: z.string().trim().min(5).max(500),
});
export type RejectProductRequest = z.infer<typeof RejectProductRequestSchema>;

// ─── Responses ───────────────────────────────────────────────────────────────

const ProductBase = {
  id: UuidSchema,
  name: ProductNameSchema,
  description: ProductDescriptionSchema,
  categoryId: UuidSchema,
  sellerId: UuidSchema,
  images: ImagesSchema,
  approvalStatus: ProductApprovalStatusSchema,
  lifecycleStatus: ProductLifecycleStatusSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
};

/** Visible to anyone — public catalog. No moderation metadata exposed. */
export const PublicProductDtoSchema = z.object({
  id: UuidSchema,
  name: ProductNameSchema,
  description: ProductDescriptionSchema,
  categoryId: UuidSchema,
  sellerId: UuidSchema,
  images: ImagesSchema,
  lifecycleStatus: ProductLifecycleStatusSchema,
  createdAt: z.string(),
});
export type PublicProductDto = z.infer<typeof PublicProductDtoSchema>;

/** Returned to the seller for their own products — adds review feedback. */
export const SellerProductDtoSchema = z.object({
  ...ProductBase,
  reviewNote: z.string().nullable(),
});
export type SellerProductDto = z.infer<typeof SellerProductDtoSchema>;

/** Admin moderation — full audit trail. */
export const AdminProductDtoSchema = z.object({
  ...ProductBase,
  reviewNote: z.string().nullable(),
  reviewedById: UuidSchema.nullable(),
  reviewedAt: z.string().nullable(),
});
export type AdminProductDto = z.infer<typeof AdminProductDtoSchema>;
