import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { InjectDb } from '../database/database.module';
import type { DrizzleClient } from '../database/database.tokens';
import { profiles, type ProfileRow } from '../database/schema';

type UpdateProfilePatch = {
  fullName?: string;
  phone?: string | null;
  gender?: ProfileRow['gender'];
  address?: string | null;
  avatarUrl?: string | null;
};

@Injectable()
export class ProfileRepository {
  constructor(@InjectDb() private readonly db: DrizzleClient) {}

  async findByUserId(userId: string): Promise<ProfileRow | null> {
    const row = await this.db.query.profiles.findFirst({
      where: eq(profiles.userId, userId),
    });
    return row ?? null;
  }

  async updateByUserId(userId: string, patch: UpdateProfilePatch): Promise<ProfileRow | null> {
    const [row] = await this.db
      .update(profiles)
      .set({ ...patch, updatedAt: new Date() })
      .where(eq(profiles.userId, userId))
      .returning();
    return row ?? null;
  }
}
