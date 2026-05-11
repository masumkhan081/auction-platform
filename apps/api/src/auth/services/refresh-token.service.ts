import { Injectable, Logger } from '@nestjs/common';
import { and, eq, isNull } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { AppException } from '../../common';
import { EnvService } from '../../config/env.service';
import { InjectDb } from '../../database/database.module';
import type { DrizzleClient } from '../../database/database.tokens';
import { refreshTokens } from '../../database/schema';
import { InjectRedis } from '../../redis/redis.module';
import type { RedisClient } from '../../redis/redis.tokens';
import { RedisKeys } from '../../redis/redis.keys';
import { TokenService } from './token.service';

type IssueArgs = {
  userId: string;
  userAgent: string | null;
  ipAddress: string | null;
};

type RotateArgs = {
  presentedRefreshJwt: string;
  userAgent: string | null;
  ipAddress: string | null;
};

type IssueResult = {
  refreshJwt: string;
  jti: string;
  familyId: string;
  expiresAt: Date;
};

/**
 * Refresh-token rotation with family-based reuse detection.
 *
 * INVARIANTS:
 *   1. A refresh token is valid iff (Redis allowlist contains its jti) AND
 *      (the family is not in the killed-set).
 *   2. `rotate()` flips the old token to ROTATED in one DB transaction; on
 *      commit, Redis is updated. If Redis update fails, the *new* token
 *      becomes invalid on next use — fail-safe direction.
 *   3. If a token's jti is missing from the allowlist BUT its DB row shows
 *      `used_at` set, that's reuse: the entire family is killed.
 *   4. Logout calls `revokeFamily()` to invalidate every device in the family.
 */
@Injectable()
export class RefreshTokenService {
  private readonly logger = new Logger(RefreshTokenService.name);

  constructor(
    @InjectDb() private readonly db: DrizzleClient,
    @InjectRedis() private readonly redis: RedisClient,
    private readonly env: EnvService,
    private readonly tokens: TokenService,
  ) {}

  /** First token of a brand-new login session. */
  async issueNewFamily(args: IssueArgs): Promise<IssueResult> {
    return this.issueIntoFamily({
      userId: args.userId,
      userAgent: args.userAgent,
      ipAddress: args.ipAddress,
      familyId: randomUUID(),
      replacedById: null,
    });
  }

  /** Verify-and-rotate. Returns the new refresh token. */
  async rotate(args: RotateArgs): Promise<IssueResult & { userId: string }> {
    const presented = this.tokens.verifyRefreshToken(args.presentedRefreshJwt);

    if (await this.isFamilyKilled(presented.fid)) {
      throw AppException.unauthorized('auth.token_revoked', 'Session revoked');
    }

    const oldAllowlistKey = RedisKeys.refreshAllowlist(presented.jti);
    const allowed = await this.redis.get(oldAllowlistKey);
    if (!allowed) {
      // Signed correctly but no longer live. If DB shows it was used, that's reuse.
      const row = await this.db.query.refreshTokens.findFirst({
        where: eq(refreshTokens.jti, presented.jti),
      });
      if (row?.usedAt) {
        await this.killFamily(presented.fid, 'REUSE_DETECTED');
        this.logger.warn(
          `Refresh reuse detected — family killed user=${presented.sub} family=${presented.fid}`,
        );
      }
      throw AppException.unauthorized('auth.token_revoked', 'Session revoked');
    }

    const ttlSeconds = this.env.config.JWT_REFRESH_TTL_SECONDS;
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
    const newJti = randomUUID();

    // Atomic rotate in a single SQL transaction.
    await this.db.transaction(async (tx) => {
      const [oldRow] = await tx
        .update(refreshTokens)
        .set({
          usedAt: new Date(),
          revokedAt: new Date(),
          revokedReason: 'ROTATED',
        })
        .where(
          and(eq(refreshTokens.jti, presented.jti), isNull(refreshTokens.usedAt)),
        )
        .returning();

      if (!oldRow) {
        // Lost the race — another rotate already consumed this token.
        throw AppException.unauthorized('auth.token_reused', 'Session token reused');
      }

      const [newRow] = await tx
        .insert(refreshTokens)
        .values({
          userId: presented.sub,
          familyId: presented.fid,
          jti: newJti,
          expiresAt,
          userAgent: args.userAgent,
          ipAddress: args.ipAddress,
        })
        .returning();

      if (!newRow) {
        throw new Error('Failed to insert new refresh token');
      }

      await tx
        .update(refreshTokens)
        .set({ replacedById: newRow.id })
        .where(eq(refreshTokens.id, oldRow.id));
    });

    // Post-commit Redis updates. If these fail, the new token is unusable on
    // next request (missing from allowlist) — safe direction.
    await this.redis.set(
      RedisKeys.refreshAllowlist(newJti),
      presented.sub,
      'EX',
      ttlSeconds,
    );
    await this.redis.del(oldAllowlistKey);

    const refreshJwt = this.tokens.signRefreshToken({
      userId: presented.sub,
      familyId: presented.fid,
      jti: newJti,
    });

    return {
      refreshJwt,
      jti: newJti,
      familyId: presented.fid,
      expiresAt,
      userId: presented.sub,
    };
  }

  /** Explicit logout / admin revocation — invalidates every token in the family. */
  async revokeFamily(
    familyId: string,
    reason: 'USER_LOGOUT' | 'ADMIN_REVOKED' = 'USER_LOGOUT',
  ): Promise<void> {
    await this.killFamily(familyId, reason);
  }

  // ─── internals ───────────────────────────────────────────────────────────

  private async issueIntoFamily(args: {
    userId: string;
    userAgent: string | null;
    ipAddress: string | null;
    familyId: string;
    replacedById: string | null;
  }): Promise<IssueResult> {
    const jti = randomUUID();
    const ttlSeconds = this.env.config.JWT_REFRESH_TTL_SECONDS;
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

    const [row] = await this.db
      .insert(refreshTokens)
      .values({
        userId: args.userId,
        familyId: args.familyId,
        jti,
        expiresAt,
        replacedById: args.replacedById,
        userAgent: args.userAgent,
        ipAddress: args.ipAddress,
      })
      .returning();

    if (!row) {
      throw new Error('Failed to insert refresh token');
    }

    await this.redis.set(
      RedisKeys.refreshAllowlist(jti),
      args.userId,
      'EX',
      ttlSeconds,
    );

    const refreshJwt = this.tokens.signRefreshToken({
      userId: args.userId,
      familyId: args.familyId,
      jti,
    });

    return { refreshJwt, jti, familyId: args.familyId, expiresAt };
  }

  private async isFamilyKilled(familyId: string): Promise<boolean> {
    const v = await this.redis.get(RedisKeys.refreshFamilyKilled(familyId));
    return v !== null;
  }

  private async killFamily(
    familyId: string,
    reason: 'REUSE_DETECTED' | 'USER_LOGOUT' | 'ADMIN_REVOKED',
  ): Promise<void> {
    const ttlSeconds = this.env.config.JWT_REFRESH_TTL_SECONDS;
    await this.redis.set(
      RedisKeys.refreshFamilyKilled(familyId),
      reason,
      'EX',
      ttlSeconds,
    );

    const live = await this.db.query.refreshTokens.findMany({
      where: and(eq(refreshTokens.familyId, familyId), isNull(refreshTokens.revokedAt)),
    });

    if (live.length === 0) return;

    await this.db.transaction(async (tx) => {
      for (const row of live) {
        await tx
          .update(refreshTokens)
          .set({ revokedAt: new Date(), revokedReason: reason })
          .where(eq(refreshTokens.id, row.id));
      }
    });

    await Promise.all(
      live.map((row) => this.redis.del(RedisKeys.refreshAllowlist(row.jti))),
    );
  }
}
