import { boolean, index, pgTable, text, uniqueIndex } from 'drizzle-orm/pg-core';
import { roleEnum } from './enums';
import { createdAt, idPrimaryKey, optionalTimestampAt, updatedAt } from './_helpers';

/**
 * Authentication identity. State is expressed via timestamps (`*_at`) rather
 * than booleans where intent matters: `email_verified_at`, `deactivated_at`.
 * `is_locked` is the rare boolean that doesn't carry useful "when" semantics
 * for the runtime path (lockout windows live in Redis).
 */
export const users = pgTable(
  'users',
  {
    id: idPrimaryKey(),
    email: text('email').notNull(),
    passwordHash: text('password_hash').notNull(),
    role: roleEnum('role').notNull(),
    emailVerifiedAt: optionalTimestampAt('email_verified_at'),
    deactivatedAt: optionalTimestampAt('deactivated_at'),
    isLocked: boolean('is_locked').notNull().default(false),
    lastLoginAt: optionalTimestampAt('last_login_at'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => ({
    usersEmailUq: uniqueIndex('users_email_uq').on(t.email),
    usersRoleIdx: index('users_role_idx').on(t.role),
  }),
);

export type UserRow = typeof users.$inferSelect;
export type NewUserRow = typeof users.$inferInsert;
