import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error('DATABASE_URL is required for drizzle-kit. Set it in apps/api/.env');
}

/**
 * Generate composable migrations into `src/database/migrations/`.
 * `breakpoints` produces statement breakpoints so multi-statement migrations
 * are easier to review and roll back.
 */
export default defineConfig({
  dialect: 'postgresql',
  schema: './src/database/schema/index.ts',
  out: './src/database/migrations',
  dbCredentials: { url },
  strict: true,
  verbose: true,
  breakpoints: true,
});
