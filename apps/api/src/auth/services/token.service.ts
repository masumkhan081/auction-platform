import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'node:crypto';
import type { CookieOptions, Response } from 'express';
import type { Role } from '@auction/shared';
import { EnvService } from '../../config/env.service';
import { AppException } from '../../common';
import type { AccessTokenPayload, RefreshTokenPayload } from '../auth.types';

const REFRESH_COOKIE_PATH = '/api/auth';
const ACCESS_COOKIE_PATH = '/';

/**
 * Mints/verifies JWTs and translates them onto HTTP cookies. Cookie attributes
 * are environment-aware:
 *   - `secure`    follows COOKIE_SECURE env (false in dev, true in prod)
 *   - `sameSite`  Lax in dev (cross-port localhost ergonomics), Strict in prod
 *   - `domain`    parent domain in prod, `localhost` in dev
 *   - paths       access cookie at `/`, refresh cookie scoped to `/api/auth`
 *
 * No business logic lives here — only crypto/cookie plumbing.
 */
@Injectable()
export class TokenService {
  constructor(
    private readonly env: EnvService,
    private readonly jwt: JwtService,
  ) {}

  // ─── Access token ────────────────────────────────────────────────────────

  signAccessToken(args: { userId: string; role: Role; mfa: boolean }): string {
    const payload: AccessTokenPayload = {
      sub: args.userId,
      role: args.role,
      mfa: args.mfa,
      jti: randomUUID(),
    };
    return this.jwt.sign(payload, {
      secret: this.env.config.JWT_ACCESS_SECRET,
      expiresIn: this.env.config.JWT_ACCESS_TTL_SECONDS,
    });
  }

  verifyAccessToken(token: string): AccessTokenPayload {
    try {
      return this.jwt.verify<AccessTokenPayload>(token, {
        secret: this.env.config.JWT_ACCESS_SECRET,
      });
    } catch {
      throw AppException.unauthorized('auth.token_invalid', 'Invalid or expired token');
    }
  }

  // ─── Refresh token ───────────────────────────────────────────────────────

  signRefreshToken(args: { userId: string; familyId: string; jti: string }): string {
    const payload: RefreshTokenPayload = {
      sub: args.userId,
      fid: args.familyId,
      jti: args.jti,
    };
    return this.jwt.sign(payload, {
      secret: this.env.config.JWT_REFRESH_SECRET,
      expiresIn: this.env.config.JWT_REFRESH_TTL_SECONDS,
    });
  }

  verifyRefreshToken(token: string): RefreshTokenPayload {
    try {
      return this.jwt.verify<RefreshTokenPayload>(token, {
        secret: this.env.config.JWT_REFRESH_SECRET,
      });
    } catch {
      throw AppException.unauthorized('auth.token_invalid', 'Invalid or expired refresh token');
    }
  }

  // ─── Cookies ─────────────────────────────────────────────────────────────

  setAuthCookies(res: Response, tokens: { access: string; refresh: string }): void {
    res.cookie(this.env.config.COOKIE_ACCESS_NAME, tokens.access, this.cookieOptions(ACCESS_COOKIE_PATH, this.env.config.JWT_ACCESS_TTL_SECONDS));
    res.cookie(this.env.config.COOKIE_REFRESH_NAME, tokens.refresh, this.cookieOptions(REFRESH_COOKIE_PATH, this.env.config.JWT_REFRESH_TTL_SECONDS));
  }

  clearAuthCookies(res: Response): void {
    res.clearCookie(this.env.config.COOKIE_ACCESS_NAME, this.cookieOptions(ACCESS_COOKIE_PATH, 0));
    res.clearCookie(this.env.config.COOKIE_REFRESH_NAME, this.cookieOptions(REFRESH_COOKIE_PATH, 0));
  }

  private cookieOptions(path: string, maxAgeSeconds: number): CookieOptions {
    return {
      httpOnly: true,
      secure: this.env.config.COOKIE_SECURE,
      sameSite: this.env.isProd ? 'strict' : 'lax',
      domain: this.env.config.COOKIE_DOMAIN,
      path,
      maxAge: maxAgeSeconds * 1000,
    };
  }
}
