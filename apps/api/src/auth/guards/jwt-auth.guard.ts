import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AppException } from '../../common';
import { EnvService } from '../../config/env.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { TokenService } from '../services/token.service';
import type { AuthedRequest, RequestUser } from '../auth.types';

/**
 * Default-deny global guard. Every controller is protected unless tagged
 * `@Public()`. Reads the access JWT from the access cookie OR the
 * `Authorization: Bearer …` header (so test tools and future mobile apps work).
 *
 * Hand-rolled (no Passport) — the entire control flow is in this file.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly tokens: TokenService,
    private readonly env: EnvService,
  ) {}

  canActivate(ctx: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (isPublic) return true;

    const req = ctx.switchToHttp().getRequest<AuthedRequest>();
    const token = this.extractToken(req);
    if (!token) {
      throw AppException.unauthorized('auth.missing_credentials', 'Authentication required');
    }

    const payload = this.tokens.verifyAccessToken(token);
    const user: RequestUser = {
      id: payload.sub,
      role: payload.role,
      mfaPassed: payload.mfa,
    };
    req.user = user;
    return true;
  }

  private extractToken(req: AuthedRequest): string | null {
    const cookieName = this.env.config.COOKIE_ACCESS_NAME;
    const fromCookie =
      typeof req.cookies === 'object' && req.cookies !== null
        ? (req.cookies as Record<string, string | undefined>)[cookieName]
        : undefined;
    if (fromCookie) return fromCookie;

    const authHeader = req.headers.authorization;
    if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      return authHeader.slice('Bearer '.length).trim() || null;
    }
    return null;
  }
}
