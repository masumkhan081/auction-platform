import { z } from 'zod';

export const ROLES = ['ADMIN', 'SELLER', 'BIDDER'] as const;
export const RoleSchema = z.enum(ROLES);
export type Role = z.infer<typeof RoleSchema>;

export const PUBLIC_ROLES = ['SELLER', 'BIDDER'] as const satisfies ReadonlyArray<Role>;
export const PublicRoleSchema = z.enum(PUBLIC_ROLES);
export type PublicRole = z.infer<typeof PublicRoleSchema>;
