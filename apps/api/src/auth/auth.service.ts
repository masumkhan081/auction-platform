import { Injectable, Logger } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import type {
  AuthSession,
  AuthUser,
  ForgotPasswordRequest,
  LoginRequest,
  RegisterRequest,
  RequestEmailVerificationRequest,
  ResetPasswordRequest,
  VerifyEmailRequest,
} from '@auction/shared';
import { AppException } from '../common';
import { type EnvService } from '../config/env.service';
import { InjectDb } from '../database/database.module';
import type { DrizzleClient } from '../database/database.tokens';
import { profiles, users, type UserRow } from '../database/schema';
import { type MailService } from '../mail/mail.service';
import { renderEmailVerificationOtp, renderPasswordReset } from '../mail/mail.templates';
import { type UsersRepository, type UserWithProfile } from '../users/users.repository';
import { type LockoutService } from './services/lockout.service';
import { type PasswordService } from './services/password.service';
import { type RefreshTokenService } from './services/refresh-token.service';
import { type TokenService } from './services/token.service';
import { type VerificationService } from './services/verification.service';

type AuthIssueResult = {
  session: AuthSession;
  accessToken: string;
  refreshToken: string;
};

type RequestContext = {
  ipAddress: string | null;
  userAgent: string | null;
};

/**
 * High-level orchestration for the auth flows. Each public method maps to a
 * single controller endpoint. Lower-level concerns (hashing, token rotation,
 * lockouts, OTPs, email send) live in dedicated services. NO Drizzle queries
 * appear in the controller — only here.
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectDb() private readonly db: DrizzleClient,
    private readonly env: EnvService,
    private readonly usersRepo: UsersRepository,
    private readonly password: PasswordService,
    private readonly tokens: TokenService,
    private readonly refresh: RefreshTokenService,
    private readonly lockout: LockoutService,
    private readonly verification: VerificationService,
    private readonly mail: MailService,
  ) {}

  // ─── Register ────────────────────────────────────────────────────────────

  async register(input: RegisterRequest, ctx: RequestContext): Promise<AuthIssueResult> {
    const existing = await this.usersRepo.findByEmail(input.email);
    if (existing) {
      throw AppException.conflict('auth.user_already_exists', 'An account with this email already exists');
    }

    const passwordHash = await this.password.hash(input.password);

    const created = await this.db.transaction(async (tx) => {
      const [userRow] = await tx
        .insert(users)
        .values({
          email: input.email,
          passwordHash,
          role: input.role,
        })
        .returning();
      if (!userRow) throw new Error('User insert failed');

      await tx.insert(profiles).values({
        userId: userRow.id,
        fullName: input.fullName,
        ...(input.phone !== undefined ? { phone: input.phone } : {}),
      });

      return userRow;
    });

    // Send verification OTP — the user can register but stays `email_verified_at = null`
    // until they verify. Endpoints that require verification check this.
    await this.sendEmailVerificationOtp(created.id, created.email);

    return this.issueSession(created, input.fullName, ctx);
  }

  // ─── Login ───────────────────────────────────────────────────────────────

  async login(input: LoginRequest, ctx: RequestContext): Promise<AuthIssueResult> {
    await this.lockout.assertNotLocked(input.email, ctx.ipAddress);

    const user = await this.usersRepo.findByEmail(input.email);
    if (!user) {
      // Externally generic; internally structured.
      this.logger.warn(
        `auth.failure email=${input.email} ip=${ctx.ipAddress ?? '-'} reason=no_user`,
      );
      await this.lockout.recordFailure(input.email, ctx.ipAddress);
      throw AppException.unauthorized('auth.invalid_credentials', 'Invalid email or password');
    }

    const ok = await this.password.verify(user.passwordHash, input.password);
    if (!ok) {
      this.logger.warn(
        `auth.failure userId=${user.id} email=${input.email} ip=${ctx.ipAddress ?? '-'} reason=bad_password`,
      );
      await this.lockout.recordFailure(input.email, ctx.ipAddress);
      throw AppException.unauthorized('auth.invalid_credentials', 'Invalid email or password');
    }

    if (user.deactivatedAt) {
      throw AppException.unauthorized('auth.invalid_credentials', 'Invalid email or password');
    }

    if (user.isLocked) {
      throw AppException.unauthorized('auth.locked', 'Account is locked');
    }

    await this.lockout.clearOnSuccess(input.email, ctx.ipAddress);
    await this.db
      .update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, user.id));

    const fullName = user.profile?.fullName ?? user.email;
    return this.issueSession(user, fullName, ctx);
  }

  // ─── Refresh / Logout ────────────────────────────────────────────────────

  async refreshSession(presentedRefreshJwt: string, ctx: RequestContext): Promise<AuthIssueResult> {
    const rotated = await this.refresh.rotate({
      presentedRefreshJwt,
      userAgent: ctx.userAgent,
      ipAddress: ctx.ipAddress,
    });

    const user = await this.usersRepo.findById(rotated.userId);
    if (!user || user.deactivatedAt) {
      throw AppException.unauthorized('auth.token_invalid', 'Session invalid');
    }

    const accessToken = this.tokens.signAccessToken({
      userId: user.id,
      role: user.role,
      mfa: false,
    });

    return {
      session: { user: this.toAuthUser(user) },
      accessToken,
      refreshToken: rotated.refreshJwt,
    };
  }

  async logout(presentedRefreshJwt: string | null): Promise<void> {
    if (!presentedRefreshJwt) return;
    try {
      const payload = this.tokens.verifyRefreshToken(presentedRefreshJwt);
      await this.refresh.revokeFamily(payload.fid, 'USER_LOGOUT');
    } catch {
      // Token unverifiable — nothing to revoke. Don't leak.
    }
  }

  // ─── Email verification ──────────────────────────────────────────────────

  async requestEmailVerification(input: RequestEmailVerificationRequest): Promise<void> {
    const user = await this.usersRepo.findByEmail(input.email);
    // Don't leak: always succeed externally.
    if (!user || user.emailVerifiedAt) return;
    await this.sendEmailVerificationOtp(user.id, user.email);
  }

  async verifyEmail(input: VerifyEmailRequest): Promise<void> {
    const user = await this.usersRepo.findByEmail(input.email);
    if (!user) {
      throw AppException.unprocessable('auth.otp_invalid', 'Verification code is incorrect');
    }
    if (user.emailVerifiedAt) return;
    await this.verification.consumeEmailVerificationOtp(user.id, input.otp);
    await this.db
      .update(users)
      .set({ emailVerifiedAt: new Date() })
      .where(eq(users.id, user.id));
  }

  // ─── Password reset ──────────────────────────────────────────────────────

  async forgotPassword(input: ForgotPasswordRequest): Promise<void> {
    // Generic external response regardless of whether the email exists, and
    // regardless of whether the request is being throttled. Never leaks.
    const user = await this.usersRepo.findByEmail(input.email);
    if (!user) return;
    const allowed = await this.verification.tryClaimForgotPasswordSlot(input.email);
    if (!allowed) return;
    const token = await this.verification.issuePasswordResetToken(user.id);
    const resetUrl = `${this.env.config.WEB_BASE_URL}/auth/reset-password?token=${token}`;
    await this.mail.send(user.email, renderPasswordReset({ resetUrl }));
  }

  async resetPassword(input: ResetPasswordRequest): Promise<void> {
    const userId = await this.verification.consumePasswordResetToken(input.token);
    const passwordHash = await this.password.hash(input.newPassword);
    await this.db
      .update(users)
      .set({ passwordHash })
      .where(eq(users.id, userId));
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────

  async getSession(userId: string): Promise<AuthSession> {
    const user = await this.usersRepo.findById(userId);
    if (!user) {
      throw AppException.unauthorized('auth.token_invalid', 'Session invalid');
    }
    return { user: this.toAuthUser(user) };
  }

  private async sendEmailVerificationOtp(userId: string, email: string): Promise<void> {
    const otp = await this.verification.issueEmailVerificationOtp(userId);
    await this.mail.send(email, renderEmailVerificationOtp({ otp }));
  }

  private async issueSession(
    user: UserRow | UserWithProfile,
    fullName: string,
    ctx: RequestContext,
  ): Promise<AuthIssueResult> {
    const accessToken = this.tokens.signAccessToken({
      userId: user.id,
      role: user.role,
      mfa: false,
    });
    const family = await this.refresh.issueNewFamily({
      userId: user.id,
      userAgent: ctx.userAgent,
      ipAddress: ctx.ipAddress,
    });
    return {
      session: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          fullName,
          emailVerified: user.emailVerifiedAt !== null,
          mfaEnabled: false,
        },
      },
      accessToken,
      refreshToken: family.refreshJwt,
    };
  }

  private toAuthUser(u: UserWithProfile): AuthUser {
    return {
      id: u.id,
      email: u.email,
      role: u.role,
      fullName: u.profile?.fullName ?? u.email,
      emailVerified: u.emailVerifiedAt !== null,
      mfaEnabled: false,
    };
  }
}
