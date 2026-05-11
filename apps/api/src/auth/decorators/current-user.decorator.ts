import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { AuthedRequest, RequestUser } from '../auth.types';

/**
 * Extracts the authenticated principal from the request. Always typed as
 * `RequestUser` — guaranteed non-null because the JwtAuthGuard rejects
 * unauthenticated requests before the handler runs.
 *
 * If used on a `@Public()` route, the guard never set `request.user`, so
 * consumers should not use this decorator there.
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): RequestUser => {
    const req = ctx.switchToHttp().getRequest<AuthedRequest>();
    if (!req.user) {
      // Programming error — handler used @CurrentUser() on an unauthenticated route.
      throw new Error('CurrentUser used on a route without JwtAuthGuard');
    }
    return req.user;
  },
);
