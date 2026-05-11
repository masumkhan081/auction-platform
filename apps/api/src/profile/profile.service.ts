import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import type { ProfileDto, UpdateProfileRequest } from '@auction/shared';
import { AppException, compact } from '../common';
import { InjectDb } from '../database/database.module';
import type { DrizzleClient } from '../database/database.tokens';
import { users, type ProfileRow, type UserRow } from '../database/schema';
import { UsersRepository } from '../users/users.repository';
import { ProfileRepository } from './profile.repository';

@Injectable()
export class ProfileService {
  constructor(
    @InjectDb() private readonly db: DrizzleClient,
    private readonly profiles: ProfileRepository,
    private readonly usersRepo: UsersRepository,
  ) {}

  async getOwn(userId: string): Promise<ProfileDto> {
    const user = await this.usersRepo.findById(userId);
    if (!user || !user.profile) {
      throw AppException.notFound('profile.not_found', 'Profile not found');
    }
    return this.toDto(user, user.profile);
  }

  async updateOwn(userId: string, patch: UpdateProfileRequest): Promise<ProfileDto> {
    const updated = await this.profiles.updateByUserId(userId, compact(patch));
    if (!updated) {
      throw AppException.notFound('profile.not_found', 'Profile not found');
    }
    const user = await this.usersRepo.findById(userId);
    if (!user) {
      throw AppException.notFound('profile.not_found', 'Profile not found');
    }
    return this.toDto(user, updated);
  }

  /** Soft-deactivation: stamp users.deactivated_at; auth lookups will then reject login. */
  async deactivateOwn(userId: string): Promise<void> {
    await this.db
      .update(users)
      .set({ deactivatedAt: new Date(), updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  private toDto(user: UserRow, profile: ProfileRow): ProfileDto {
    return {
      userId: user.id,
      email: user.email,
      role: user.role,
      fullName: profile.fullName,
      phone: profile.phone,
      gender: profile.gender,
      address: profile.address,
      avatarUrl: profile.avatarUrl,
      emailVerified: user.emailVerifiedAt !== null,
      createdAt: profile.createdAt.toISOString(),
      updatedAt: profile.updatedAt.toISOString(),
    };
  }
}
