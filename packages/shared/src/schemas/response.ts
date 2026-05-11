import { z } from 'zod';

/**
 * Standardized API response envelope. Every NestJS controller returns this shape;
 * every web fetcher unwraps it. Defining it once keeps client/server in lockstep.
 */

export const ApiErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.unknown().optional(),
});
export type ApiError = z.infer<typeof ApiErrorSchema>;

export const apiSuccessSchema = <TData extends z.ZodTypeAny>(data: TData) =>
  z.object({
    success: z.literal(true),
    data,
    message: z.string().optional(),
  });

export const ApiFailureSchema = z.object({
  success: z.literal(false),
  error: ApiErrorSchema,
});
export type ApiFailure = z.infer<typeof ApiFailureSchema>;

export type ApiSuccess<TData> = {
  success: true;
  data: TData;
  message?: string;
};

export type ApiResponse<TData> = ApiSuccess<TData> | ApiFailure;

export const paginatedSchema = <TItem extends z.ZodTypeAny>(item: TItem) =>
  z.object({
    items: z.array(item),
    total: z.number().int().nonnegative(),
    page: z.number().int().positive(),
    pageSize: z.number().int().positive(),
    totalPages: z.number().int().nonnegative(),
  });

export type Paginated<TItem> = {
  items: TItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};
