import { index, jsonb, pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { productApprovalStatusEnum, productLifecycleStatusEnum } from './enums';
import {
  createdAt,
  deletedAt,
  idPrimaryKey,
  optionalTimestampAt,
  updatedAt,
} from './_helpers';
import { categories } from './categories';
import { users } from './users';

/**
 * Two orthogonal state axes — kept as separate enums to express intent clearly:
 *   - `approval_status`  admin gating: PENDING → APPROVED | REJECTED
 *   - `lifecycle_status` business state: DRAFT → LISTED → IN_AUCTION → SOLD | ARCHIVED
 *
 * `images` is a typed JSONB array of Cloudinary references (id + url + size).
 * Validation lives in shared Zod schemas (P1F).
 */

export type ProductImageRef = {
  publicId: string;
  url: string;
  width: number;
  height: number;
  bytes: number;
};

export const products = pgTable(
  'products',
  {
    id: idPrimaryKey(),
    sellerId: uuid('seller_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    categoryId: uuid('category_id')
      .notNull()
      .references(() => categories.id, { onDelete: 'restrict' }),

    name: text('name').notNull(),
    description: text('description').notNull(),
    images: jsonb('images').$type<ProductImageRef[]>().notNull().default([]),

    approvalStatus: productApprovalStatusEnum('approval_status').notNull().default('PENDING'),
    lifecycleStatus: productLifecycleStatusEnum('lifecycle_status').notNull().default('DRAFT'),

    reviewNote: text('review_note'),
    reviewedById: uuid('reviewed_by_id').references(() => users.id, { onDelete: 'set null' }),
    reviewedAt: optionalTimestampAt('reviewed_at'),

    createdAt: createdAt(),
    updatedAt: updatedAt(),
    deletedAt: deletedAt(),
  },
  (t) => ({
    productsSellerIdx: index('products_seller_id_idx').on(t.sellerId),
    productsCategoryIdx: index('products_category_id_idx').on(t.categoryId),
    productsApprovalIdx: index('products_approval_status_idx').on(t.approvalStatus),
    productsLifecycleIdx: index('products_lifecycle_status_idx').on(t.lifecycleStatus),
  }),
);

export type ProductRow = typeof products.$inferSelect;
export type NewProductRow = typeof products.$inferInsert;
