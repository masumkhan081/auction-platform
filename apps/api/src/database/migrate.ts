import 'dotenv/config';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

/**
 * Standalone migrate runner. Invoked via `pnpm db:migrate`. Idempotent —
 * Drizzle skips migrations already applied (tracked in `__drizzle_migrations`).
 */
async function main(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL is required');
  }
  const pool = new Pool({ connectionString: url, max: 1 });
  const db = drizzle(pool);

  // eslint-disable-next-line no-console
  console.log('[migrate] applying migrations…');
  await migrate(db, { migrationsFolder: './src/database/migrations' });
  // eslint-disable-next-line no-console
  console.log('[migrate] done');

  await pool.end();
}

main().catch((err: unknown) => {
  // eslint-disable-next-line no-console
  console.error('[migrate] failed:', err);
  process.exit(1);
});
