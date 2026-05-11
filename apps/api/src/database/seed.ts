import 'dotenv/config';
import argon2 from 'argon2';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import { Pool } from 'pg';
import * as schema from './schema';

/**
 * Idempotent dev seed. Inserts a baseline admin and a small set of categories
 * if they don't already exist. Real auction/product data should NOT be seeded
 * here — it's created via the API in dev to exercise the real code path.
 */

const SEED_CATEGORIES = [
  { name: 'Electronics', slug: 'electronics' },
  { name: 'Art', slug: 'art' },
  { name: 'Collectibles', slug: 'collectibles' },
  { name: 'Home & Garden', slug: 'home-and-garden' },
  { name: 'Vehicles', slug: 'vehicles' },
] as const;

const ADMIN_EMAIL = 'admin@auction.local';
const ADMIN_PASSWORD = 'Admin12345!';

async function main(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is required');

  const pool = new Pool({ connectionString: url, max: 1 });
  const db = drizzle(pool, { schema });

  // eslint-disable-next-line no-console
  console.log('[seed] starting');

  for (const c of SEED_CATEGORIES) {
    await db
      .insert(schema.categories)
      .values({ name: c.name, slug: c.slug })
      .onConflictDoNothing({ target: schema.categories.slug });
  }
  // eslint-disable-next-line no-console
  console.log(`[seed] categories ensured (${SEED_CATEGORIES.length})`);

  const existing = await db.query.users.findFirst({ where: eq(schema.users.email, ADMIN_EMAIL) });
  if (!existing) {
    const passwordHash = await argon2.hash(ADMIN_PASSWORD);
    const [admin] = await db
      .insert(schema.users)
      .values({
        email: ADMIN_EMAIL,
        passwordHash,
        role: 'ADMIN',
        emailVerifiedAt: new Date(),
      })
      .returning();
    if (admin) {
      await db.insert(schema.profiles).values({
        userId: admin.id,
        fullName: 'Auction Admin',
      });
    }
    // eslint-disable-next-line no-console
    console.log(`[seed] admin created: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  } else {
    // eslint-disable-next-line no-console
    console.log('[seed] admin already exists');
  }

  await pool.end();
  // eslint-disable-next-line no-console
  console.log('[seed] done');
}

main().catch((err: unknown) => {
  // eslint-disable-next-line no-console
  console.error('[seed] failed:', err);
  process.exit(1);
});
