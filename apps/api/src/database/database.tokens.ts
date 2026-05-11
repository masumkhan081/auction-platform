import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type * as schema from './schema';

/**
 * Single inject token for the Drizzle client. Importing it from one place keeps
 * services from grabbing the underlying pool by accident.
 */
export const DRIZZLE = Symbol('DRIZZLE');

export type DrizzleClient = NodePgDatabase<typeof schema>;
