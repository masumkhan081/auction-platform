import type { Role } from '@auction/shared';

/**
 * Pure role-gate. Used by client nav-rendering to hide links the user can't
 * use. NEVER the only gate — server-side `requireAuth(roles)` is authoritative.
 *
 * Pass `undefined`/empty to mean "any authenticated role".
 */
export const canAccess = (role: Role | undefined, allowed?: ReadonlyArray<Role>): boolean => {
  if (!role) return false;
  if (!allowed || allowed.length === 0) return true;
  return allowed.includes(role);
};
