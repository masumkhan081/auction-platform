import { z } from 'zod';
import { GenderSchema } from '../enums/gender';
import { RoleSchema } from '../enums/role';
import { EmailSchema, FullNameSchema, PhoneSchema, UuidSchema } from './primitives';

/**
 * Self-service profile editing. Only fields the user is allowed to touch are
 * exposed — role, email, deactivatedAt, etc. are managed elsewhere.
 */
export const UpdateProfileRequestSchema = z
  .object({
    fullName: FullNameSchema.optional(),
    phone: PhoneSchema.nullish(),
    gender: GenderSchema.nullish(),
    address: z.string().trim().max(500).nullish(),
    avatarUrl: z.string().url().nullish(),
  })
  .strict();
export type UpdateProfileRequest = z.infer<typeof UpdateProfileRequestSchema>;

export const ProfileDtoSchema = z.object({
  userId: UuidSchema,
  email: EmailSchema,
  role: RoleSchema,
  fullName: FullNameSchema,
  phone: PhoneSchema.nullable(),
  gender: GenderSchema.nullable(),
  address: z.string().nullable(),
  avatarUrl: z.string().url().nullable(),
  emailVerified: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type ProfileDto = z.infer<typeof ProfileDtoSchema>;
