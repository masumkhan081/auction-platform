import { type AnyPgColumn, index, pgTable, text, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { refreshRevokedReasonEnum } from './enums';
import { createdAt, idPrimaryKey, optionalTimestampAt, requiredTimestampAt } from './_helpers';
import { users } from './users';

/**
 * Refresh token audit log. Authoritative *liveness* check is Redis (fast jti
 * allowlist with TTL); this table is the durable history used to:
 *   - detect token-family reuse (any `used_at` set on an already-rotated token
 *     ⇒ kill the whole family)
 *   - enable admin/security tooling to inspect "who logged in from where, when"
 *   - support explicit revocation with attributable reason
 *
 * `family_id` groups every token derived from the same login session via
 * rotation. `replaced_by` chains successive tokens within a family.
 */
export const refreshTokens = pgTable(
  'refresh_tokens',
  {
    id: idPrimaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    familyId: uuid('family_id').notNull(),
    jti: uuid('jti').notNull(),

    issuedAt: createdAt(),
    expiresAt: requiredTimestampAt('expires_at'),
    usedAt: optionalTimestampAt('used_at'),
    revokedAt: optionalTimestampAt('revoked_at'),
    revokedReason: refreshRevokedReasonEnum('revoked_reason'),

    replacedById: uuid('replaced_by_id').references((): AnyPgColumn => refreshTokens.id, {
      onDelete: 'set null',
    }),

    userAgent: text('user_agent'),
    ipAddress: text('ip_address'),
  },
  (t) => ({
    refreshTokensJtiUq: uniqueIndex('refresh_tokens_jti_uq').on(t.jti),
    refreshTokensUserIdx: index('refresh_tokens_user_id_idx').on(t.userId),
    refreshTokensFamilyIdx: index('refresh_tokens_family_id_idx').on(t.familyId),
    refreshTokensActiveIdx: index('refresh_tokens_active_idx').on(t.userId, t.revokedAt),
  }),
);

export type RefreshTokenRow = typeof refreshTokens.$inferSelect;
export type NewRefreshTokenRow = typeof refreshTokens.$inferInsert;
