import { z } from 'zod';
import { SlugSchema, UuidSchema } from './primitives';

const NameSchema = z.string().trim().min(2).max(80);
const DescriptionSchema = z.string().trim().max(500);

export const CreateCategoryRequestSchema = z.object({
  name: NameSchema,
  slug: SlugSchema,
  description: DescriptionSchema.optional(),
});
export type CreateCategoryRequest = z.infer<typeof CreateCategoryRequestSchema>;

export const UpdateCategoryRequestSchema = CreateCategoryRequestSchema.partial().strict();
export type UpdateCategoryRequest = z.infer<typeof UpdateCategoryRequestSchema>;

export const CategoryDtoSchema = z.object({
  id: UuidSchema,
  name: NameSchema,
  slug: SlugSchema,
  description: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type CategoryDto = z.infer<typeof CategoryDtoSchema>;
