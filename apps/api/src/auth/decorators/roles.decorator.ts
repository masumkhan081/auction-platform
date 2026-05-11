import { SetMetadata } from '@nestjs/common';
import type { Role } from '@auction/shared';

export const ROLES_KEY = 'auth:roles';
export const Roles = (...roles: Role[]): MethodDecorator & ClassDecorator =>
  SetMetadata(ROLES_KEY, roles);
