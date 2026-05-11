import { z } from 'zod';

/**
 * Reusable Zod primitives that every feature schema composes from.
 * Adjust here to change validation across the entire stack at once.
 */

export const UuidSchema = z.string().uuid('Invalid identifier');
export type Uuid = z.infer<typeof UuidSchema>;

export const EmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(5, 'Email is too short')
  .max(254, 'Email is too long')
  .email('Invalid email address');

export const PasswordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password is too long')
  .regex(/[A-Z]/, 'Password must contain an uppercase letter')
  .regex(/[a-z]/, 'Password must contain a lowercase letter')
  .regex(/[0-9]/, 'Password must contain a digit');

export const PhoneSchema = z
  .string()
  .trim()
  .min(7, 'Phone number is too short')
  .max(20, 'Phone number is too long')
  .regex(/^\+?[0-9 ()-]+$/, 'Invalid phone number');

export const FullNameSchema = z
  .string()
  .trim()
  .min(2, 'Name is too short')
  .max(80, 'Name is too long');

export const SlugSchema = z
  .string()
  .trim()
  .min(2)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers, and dashes');

/** Money amount in minor units (cents) — integer to avoid float rounding. */
export const MoneyMinorSchema = z
  .number()
  .int('Amount must be a whole number')
  .nonnegative('Amount cannot be negative')
  .max(1_000_000_000_00, 'Amount exceeds limit');
export type MoneyMinor = z.infer<typeof MoneyMinorSchema>;

/** ISO-8601 date-time string; Zod parses to a `Date` for ergonomic use. */
export const IsoDateSchema = z
  .string()
  .datetime({ offset: true })
  .or(z.date())
  .pipe(z.coerce.date());

export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});
export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;

export const SortOrderSchema = z.enum(['asc', 'desc']);
export type SortOrder = z.infer<typeof SortOrderSchema>;
