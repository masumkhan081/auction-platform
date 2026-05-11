import { sql } from 'drizzle-orm';
import { timestamp, uuid } from 'drizzle-orm/pg-core';

/**
 * Reusable column factories. Splitting required vs. optional into separate
 * factories keeps Drizzle's `.notNull()` inference correct (a single helper
 * with a conditional return widens the inferred type).
 */

export const idPrimaryKey = () =>
  uuid('id').primaryKey().default(sql`gen_random_uuid()`);

export const createdAt = () =>
  timestamp('created_at', { withTimezone: true, mode: 'date' })
    .notNull()
    .default(sql`now()`);

export const updatedAt = () =>
  timestamp('updated_at', { withTimezone: true, mode: 'date' })
    .notNull()
    .default(sql`now()`);

export const deletedAt = () => timestamp('deleted_at', { withTimezone: true, mode: 'date' });

/** Required timestamp column with no default. */
export const requiredTimestampAt = (name: string) =>
  timestamp(name, { withTimezone: true, mode: 'date' }).notNull();

/** Nullable timestamp column with no default. */
export const optionalTimestampAt = (name: string) =>
  timestamp(name, { withTimezone: true, mode: 'date' });
