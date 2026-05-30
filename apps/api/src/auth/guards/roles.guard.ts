import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { type Reflector } from '@nestjs/core';
import type { Role } from '@auction/shared';
import { AppException } from '../../common';
import { ROLES_KEY } from '../decorators/roles.decorator';
import type { AuthedRequest } from '../auth.types';

/**
 * Run after `JwtAuthGuard`. If the handler is decorated with `@Roles(...)`,
 * the request's role must be in the list — otherwise 403.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Role[] | undefined>(ROLES_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const req = ctx.switchToHttp().getRequest<AuthedRequest>();
    if (!req.user) {
      throw AppException.unauthorized('auth.missing_credentials', 'Authentication required');
    }
    if (!required.includes(req.user.role)) {
      throw AppException.forbidden('auth.role_forbidden', 'Insufficient role');
    }
    return true;
  }
}
