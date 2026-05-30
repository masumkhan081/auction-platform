import {
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Get,
  Req,
  Res,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import {
  ForgotPasswordRequestSchema,
  LoginRequestSchema,
  RegisterRequestSchema,
  RequestEmailVerificationRequestSchema,
  ResetPasswordRequestSchema,
  VerifyEmailRequestSchema,
  type AuthSession,
} from '@auction/shared';
import { AppException, ZodBody } from '../common';
import { type EnvService } from '../config/env.service';
import { type AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { type TokenService } from './services/token.service';
import type { RequestUser } from './auth.types';

/**
 * HTTP surface of the auth module. Controllers do exactly two things:
 *   - call AuthService
 *   - translate the result onto cookies/responses
 *
 * No business logic, no validation logic, no DB calls.
 */
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly tokens: TokenService,
    private readonly env: EnvService,
  ) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @ZodBody(RegisterRequestSchema) body: typeof RegisterRequestSchema._type,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthSession> {
    const result = await this.auth.register(body, this.contextFrom(req));
    this.tokens.setAuthCookies(res, { access: result.accessToken, refresh: result.refreshToken });
    return result.session;
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @ZodBody(LoginRequestSchema) body: typeof LoginRequestSchema._type,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthSession> {
    const result = await this.auth.login(body, this.contextFrom(req));
    this.tokens.setAuthCookies(res, { access: result.accessToken, refresh: result.refreshToken });
    return result.session;
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthSession> {
    const presented = this.readRefreshCookie(req);
    if (!presented) {
      this.tokens.clearAuthCookies(res);
      throw AppException.unauthorized('auth.refresh_required', 'No refresh token');
    }
    const result = await this.auth.refreshSession(presented, this.contextFrom(req));
    this.tokens.setAuthCookies(res, { access: result.accessToken, refresh: result.refreshToken });
    return result.session;
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    const presented = this.readRefreshCookie(req);
    await this.auth.logout(presented);
    this.tokens.clearAuthCookies(res);
  }

  @Public()
  @Post('request-email-verification')
  @HttpCode(HttpStatus.NO_CONTENT)
  async requestEmailVerification(
    @ZodBody(RequestEmailVerificationRequestSchema)
    body: typeof RequestEmailVerificationRequestSchema._type,
  ): Promise<void> {
    await this.auth.requestEmailVerification(body);
  }

  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.NO_CONTENT)
  async verifyEmail(
    @ZodBody(VerifyEmailRequestSchema) body: typeof VerifyEmailRequestSchema._type,
  ): Promise<void> {
    await this.auth.verifyEmail(body);
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  async forgotPassword(
    @ZodBody(ForgotPasswordRequestSchema) body: typeof ForgotPasswordRequestSchema._type,
  ): Promise<void> {
    await this.auth.forgotPassword(body);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  async resetPassword(
    @ZodBody(ResetPasswordRequestSchema) body: typeof ResetPasswordRequestSchema._type,
  ): Promise<void> {
    await this.auth.resetPassword(body);
  }

  @Get('me')
  async me(@CurrentUser() user: RequestUser): Promise<AuthSession> {
    return this.auth.getSession(user.id);
  }

  // ─── helpers ─────────────────────────────────────────────────────────────

  private contextFrom(req: Request): { ipAddress: string | null; userAgent: string | null } {
    const xff = req.headers['x-forwarded-for'];
    const ip =
      typeof xff === 'string'
        ? xff.split(',')[0]?.trim() ?? null
        : Array.isArray(xff)
          ? xff[0] ?? null
          : (req.socket.remoteAddress ?? null);
    const ua = req.headers['user-agent'] ?? null;
    return { ipAddress: ip, userAgent: typeof ua === 'string' ? ua : null };
  }

  private readRefreshCookie(req: Request): string | null {
    const name = this.env.config.COOKIE_REFRESH_NAME;
    const cookies = req.cookies as Record<string, string | undefined> | undefined;
    return cookies?.[name] ?? null;
  }
}
