import { Injectable, Logger } from '@nestjs/common';
import { AppException } from '../../common';
import { InjectRedis } from '../../redis/redis.module';
import { RedisKeys, RedisTtls } from '../../redis/redis.keys';
import type { RedisClient } from '../../redis/redis.tokens';

/**
 * Brute-force throttle for the auth path. Two independent counters:
 *   - per-email (so one IP attacking many accounts gets per-account locks too)
 *   - per-ip    (so one account being attacked from many IPs gets IP locks too)
 *
 * On every failure, both counters increment. The threshold table in
 * `RedisTtls.lockoutBackoffSeconds` maps fail-count → lock duration. The lock
 * is set as a `*_until` epoch-ms key with TTL = lockSeconds; the `*_fails`
 * counter has a long sliding window so escalation persists across attempts.
 *
 * Emits structured warn-level logs on lock + clear so operators can spot abuse.
 */
@Injectable()
export class LockoutService {
  private readonly logger = new Logger(LockoutService.name);

  constructor(@InjectRedis() private readonly redis: RedisClient) {}

  /** Throws `auth.locked` if either email or IP is currently locked. */
  async assertNotLocked(email: string, ip: string | null): Promise<void> {
    const [emailUntil, ipUntil] = await Promise.all([
      this.redis.get(RedisKeys.lockoutEmailUntil(email)),
      ip ? this.redis.get(RedisKeys.lockoutIpUntil(ip)) : Promise.resolve(null),
    ]);

    const now = Date.now();
    const emailUntilMs = emailUntil ? Number.parseInt(emailUntil, 10) : 0;
    const ipUntilMs = ipUntil ? Number.parseInt(ipUntil, 10) : 0;
    const lockedUntilMs = Math.max(emailUntilMs, ipUntilMs);

    if (lockedUntilMs > now) {
      const retryAfterSeconds = Math.ceil((lockedUntilMs - now) / 1000);
      throw AppException.unauthorized('auth.locked', 'Too many failed attempts', {
        retryAfterSeconds,
      });
    }
  }

  /** Records a failure on both counters; sets a lock if a threshold is crossed. */
  async recordFailure(email: string, ip: string | null): Promise<void> {
    const emailFails = await this.bumpCounter(RedisKeys.lockoutEmailFails(email));
    const ipFails = ip
      ? await this.bumpCounter(RedisKeys.lockoutIpFails(ip))
      : 0;

    const emailLockSeconds = this.lockSecondsForFailCount(emailFails);
    const ipLockSeconds = this.lockSecondsForFailCount(ipFails);

    if (emailLockSeconds > 0) {
      const until = Date.now() + emailLockSeconds * 1000;
      await this.redis.set(
        RedisKeys.lockoutEmailUntil(email),
        until.toString(),
        'EX',
        emailLockSeconds,
      );
      this.logger.warn(
        `auth.lockout email=${email} fails=${emailFails} lockSeconds=${emailLockSeconds}`,
      );
    }

    if (ip && ipLockSeconds > 0) {
      const until = Date.now() + ipLockSeconds * 1000;
      await this.redis.set(
        RedisKeys.lockoutIpUntil(ip),
        until.toString(),
        'EX',
        ipLockSeconds,
      );
      this.logger.warn(
        `auth.lockout ip=${ip} fails=${ipFails} lockSeconds=${ipLockSeconds}`,
      );
    }
  }

  /** Successful login — clear both counters (and any lock) for this email. */
  async clearOnSuccess(email: string, ip: string | null): Promise<void> {
    const keys: string[] = [
      RedisKeys.lockoutEmailFails(email),
      RedisKeys.lockoutEmailUntil(email),
    ];
    if (ip) {
      keys.push(RedisKeys.lockoutIpFails(ip), RedisKeys.lockoutIpUntil(ip));
    }
    await this.redis.del(...keys);
  }

  private async bumpCounter(key: string): Promise<number> {
    const value = await this.redis.incr(key);
    if (value === 1) {
      // Counter just created — set window TTL.
      await this.redis.expire(key, RedisTtls.lockoutCounterWindowSeconds);
    }
    return value;
  }

  /**
   * Maps fail count to lock duration via the configured table.
   * Returns 0 if no threshold has been crossed.
   */
  private lockSecondsForFailCount(fails: number): number {
    let lock = 0;
    for (const step of RedisTtls.lockoutBackoffSeconds) {
      if (fails >= step.atFails) lock = step.lockSeconds;
    }
    return lock;
  }
}
