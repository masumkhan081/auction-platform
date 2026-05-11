/**
 * Centralized Redis key namespace. EVERY consumer uses these builders;
 * scattered string-concat is forbidden.
 *
 * Layout: `auction:<domain>:<subject>[:<discriminator>]`.
 */

const NS = 'auction';

export const RedisKeys = {
  // Auth — refresh-token allowlist (jti membership). Liveness check.
  refreshAllowlist: (jti: string) => `${NS}:auth:rt:active:${jti}` as const,

  // Auth — entire family revocation marker. Set when reuse is detected.
  refreshFamilyKilled: (familyId: string) =>
    `${NS}:auth:rt:killed:${familyId}` as const,

  // Auth — lockout counters and timers.
  lockoutEmailFails: (email: string) =>
    `${NS}:auth:lockout:email:fails:${email}` as const,
  lockoutEmailUntil: (email: string) =>
    `${NS}:auth:lockout:email:until:${email}` as const,
  lockoutIpFails: (ip: string) => `${NS}:auth:lockout:ip:fails:${ip}` as const,
  lockoutIpUntil: (ip: string) => `${NS}:auth:lockout:ip:until:${ip}` as const,

  // Auth — email verification OTP keyed by user id.
  emailVerifyOtp: (userId: string) =>
    `${NS}:auth:verify:email:${userId}` as const,

  // Auth — password reset token (token is the lookup key).
  passwordResetToken: (token: string) =>
    `${NS}:auth:reset:pw:${token}` as const,

  // Auth — forgot-password throttle (silent: hourly count + min-interval guard).
  forgotPasswordCount: (email: string) =>
    `${NS}:auth:fp:count:${email}` as const,
  forgotPasswordInterval: (email: string) =>
    `${NS}:auth:fp:interval:${email}` as const,
} as const;

/**
 * TTLs in seconds. Single source of truth for cache durations.
 * Times that depend on env (refresh JWT lifetime) are passed in at the call site.
 */
export const RedisTtls = {
  emailVerifyOtpSeconds: 10 * 60,
  passwordResetSeconds: 30 * 60,
  forgotPasswordIntervalSeconds: 60,
  forgotPasswordWindowSeconds: 60 * 60,
  forgotPasswordMaxPerWindow: 5,
  // Lockout backoff steps — fails ↦ lock duration in seconds.
  // First few fails are free; each subsequent threshold imposes a longer lock.
  lockoutBackoffSeconds: [
    { atFails: 5, lockSeconds: 60 },
    { atFails: 10, lockSeconds: 5 * 60 },
    { atFails: 15, lockSeconds: 60 * 60 },
    { atFails: 20, lockSeconds: 24 * 60 * 60 },
  ] as const,
  // Window for fail counters (auto-clear after this many seconds of inactivity).
  lockoutCounterWindowSeconds: 24 * 60 * 60,
} as const;
