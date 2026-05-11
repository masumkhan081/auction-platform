import { z } from 'zod';

export const PRODUCT_APPROVAL_STATUSES = ['PENDING', 'APPROVED', 'REJECTED'] as const;
export const ProductApprovalStatusSchema = z.enum(PRODUCT_APPROVAL_STATUSES);
export type ProductApprovalStatus = z.infer<typeof ProductApprovalStatusSchema>;

export const PRODUCT_LIFECYCLE_STATUSES = ['DRAFT', 'LISTED', 'IN_AUCTION', 'SOLD', 'ARCHIVED'] as const;
export const ProductLifecycleStatusSchema = z.enum(PRODUCT_LIFECYCLE_STATUSES);
export type ProductLifecycleStatus = z.infer<typeof ProductLifecycleStatusSchema>;
