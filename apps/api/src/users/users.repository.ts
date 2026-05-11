import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { InjectDb } from '../database/database.module';
import type { DrizzleClient } from '../database/database.tokens';
import { profiles, users, type ProfileRow, type UserRow } from '../database/schema';

export type UserWithProfile = UserRow & { profile: ProfileRow | null };

/**
 * Owns user/profile read queries used during auth flows. Writes for self-service
 * profile editing live in the profile module (P1E) — kept separate so auth
 * doesn't take a dependency on profile mutation logic.
 */
@Injectable()
export class UsersRepository {
  constructor(@InjectDb() private readonly db: DrizzleClient) {}

  async findById(id: string): Promise<UserWithProfile | null> {
    const row = await this.db.query.users.findFirst({
      where: eq(users.id, id),
    });
    if (!row) return null;
    const profile =
      (await this.db.query.profiles.findFirst({ where: eq(profiles.userId, id) })) ?? null;
    return { ...row, profile };
  }

  async findByEmail(email: string): Promise<UserWithProfile | null> {
    const normalized = email.trim().toLowerCase();
    const row = await this.db.query.users.findFirst({
      where: eq(users.email, normalized),
    });
    if (!row) return null;
    const profile =
      (await this.db.query.profiles.findFirst({ where: eq(profiles.userId, row.id) })) ?? null;
    return { ...row, profile };
  }
}
