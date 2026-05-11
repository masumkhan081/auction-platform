import { z } from 'zod';
import { PublicRoleSchema, RoleSchema } from '../enums/role';
import {
  EmailSchema,
  FullNameSchema,
  PasswordSchema,
  PhoneSchema,
  UuidSchema,
} from './primitives';

/**
 * Authentication request/response schemas. Both the NestJS pipe and the Next.js
 * RHF resolver consume these — drift impossible by construction.
 */

// ─── Requests ────────────────────────────────────────────────────────────────

export const RegisterRequestSchema = z.object({
  email: EmailSchema,
  password: PasswordSchema,
  fullName: FullNameSchema,
  phone: PhoneSchema.optional(),
  role: PublicRoleSchema, // SELLER or BIDDER; ADMIN cannot self-register
});
export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;

export const LoginRequestSchema = z.object({
  email: EmailSchema,
  // Verifying — NOT the strict creation policy. Don't reject pre-existing passwords.
  password: z.string().min(1, 'Password is required'),
});
export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const RequestEmailVerificationRequestSchema = z.object({
  email: EmailSchema,
});
export type RequestEmailVerificationRequest = z.infer<
  typeof RequestEmailVerificationRequestSchema
>;

export const VerifyEmailRequestSchema = z.object({
  email: EmailSchema,
  otp: z.string().regex(/^\d{6}$/, 'OTP must be 6 digits'),
});
export type VerifyEmailRequest = z.infer<typeof VerifyEmailRequestSchema>;

export const ForgotPasswordRequestSchema = z.object({
  email: EmailSchema,
});
export type ForgotPasswordRequest = z.infer<typeof ForgotPasswordRequestSchema>;

export const ResetPasswordRequestSchema = z.object({
  token: z.string().min(20, 'Invalid token'),
  newPassword: PasswordSchema,
});
export type ResetPasswordRequest = z.infer<typeof ResetPasswordRequestSchema>;

// ─── Responses ───────────────────────────────────────────────────────────────

export const AuthUserSchema = z.object({
  id: UuidSchema,
  email: EmailSchema,
  role: RoleSchema,
  fullName: FullNameSchema,
  emailVerified: z.boolean(),
  mfaEnabled: z.boolean(),
});
export type AuthUser = z.infer<typeof AuthUserSchema>;

export const AuthSessionSchema = z.object({
  user: AuthUserSchema,
});
export type AuthSession = z.infer<typeof AuthSessionSchema>;
