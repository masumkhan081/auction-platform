import { SetMetadata } from '@nestjs/common';

/**
 * Marks a route as not requiring authentication. The global JwtAuthGuard
 * checks for this metadata and skips token verification when present.
 */
export const IS_PUBLIC_KEY = 'auth:isPublic';
export const Public = (): MethodDecorator & ClassDecorator =>
  SetMetadata(IS_PUBLIC_KEY, true);
