import { Injectable, Logger } from '@nestjs/common';
import { randomBytes, randomInt } from 'node:crypto';
import { AppException } from '../../common';
import { InjectRedis } from '../../redis/redis.module';
import { RedisKeys, RedisTtls } from '../../redis/redis.keys';
import type { RedisClient } from '../../redis/redis.tokens';

/**
 * Email-verification OTPs and password-reset tokens. Both live in Redis with
 * explicit TTLs from `RedisTtls`. No DB persistence — short-lived secrets that
 * shouldn't outlive the user's session of using them.
 */
@Injectable()
export class VerificationService {
  private readonly logger = new Logger(VerificationService.name);

  constructor(@InjectRedis() private readonly redis: RedisClient) {}

  // ─── Forgot-password silent throttle ─────────────────────────────────────

  /**
   * Returns `true` if the caller may proceed to send a reset email. Silent
   * by design — never throws, never differentiates "throttled" from "no
   * such email" externally. Logs at WARN so ops can spot abuse.
   */
  async tryClaimForgotPasswordSlot(email: string): Promise<boolean> {
    // 1) Min-interval guard: SET NX with 60s TTL acts as a lock.
    const intervalKey = RedisKeys.forgotPasswordInterval(email);
    const intervalOk = await this.redis.set(
      intervalKey,
      '1',
      'EX',
      RedisTtls.forgotPasswordIntervalSeconds,
      'NX',
    );
    if (intervalOk === null) {
      this.logger.warn(`forgot_password.throttled email=${email} reason=interval`);
      return false;
    }

    // 2) Hourly cap: increment + cap.
    const countKey = RedisKeys.forgotPasswordCount(email);
    const count = await this.redis.incr(countKey);
    if (count === 1) {
      await this.redis.expire(countKey, RedisTtls.forgotPasswordWindowSeconds);
    }
    if (count > RedisTtls.forgotPasswordMaxPerWindow) {
      this.logger.warn(
        `forgot_password.throttled email=${email} reason=window count=${count}`,
      );
      return false;
    }
    return true;
  }

  // ─── Email verification OTP ──────────────────────────────────────────────

  /** Generates a 6-digit OTP and stashes it in Redis under the user's id. */
  async issueEmailVerificationOtp(userId: string): Promise<string> {
    const otp = randomInt(0, 1_000_000).toString().padStart(6, '0');
    await this.redis.set(
      RedisKeys.emailVerifyOtp(userId),
      otp,
      'EX',
      RedisTtls.emailVerifyOtpSeconds,
    );
    return otp;
  }

  /** Throws if mismatched or expired. Single-use: deletes on success. */
  async consumeEmailVerificationOtp(userId: string, presentedOtp: string): Promise<void> {
    const key = RedisKeys.emailVerifyOtp(userId);
    const stored = await this.redis.get(key);
    if (!stored) {
      throw AppException.unprocessable('auth.otp_expired', 'Verification code expired');
    }
    if (stored !== presentedOtp) {
      throw AppException.unprocessable('auth.otp_invalid', 'Verification code is incorrect');
    }
    await this.redis.del(key);
  }

  // ─── Password reset token ────────────────────────────────────────────────

  /** 32-byte URL-safe token. Returns the token; caller emails it. */
  async issuePasswordResetToken(userId: string): Promise<string> {
    const token = randomBytes(32).toString('base64url');
    await this.redis.set(
      RedisKeys.passwordResetToken(token),
      userId,
      'EX',
      RedisTtls.passwordResetSeconds,
    );
    return token;
  }

  /** Returns the userId; deletes on success. Throws on miss. */
  async consumePasswordResetToken(token: string): Promise<string> {
    const key = RedisKeys.passwordResetToken(token);
    const userId = await this.redis.get(key);
    if (!userId) {
      throw AppException.unprocessable('auth.reset_token_invalid', 'Reset link is invalid or expired');
    }
    await this.redis.del(key);
    return userId;
  }
}
