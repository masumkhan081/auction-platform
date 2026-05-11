import type { Request } from 'express';
import type { Role } from '@auction/shared';

/** JWT payload for the short-lived access token. */
export type AccessTokenPayload = {
  sub: string; // userId
  role: Role;
  mfa: boolean; // reserved — always false until MFA lands
  jti: string;
};

/** JWT payload for the long-lived refresh token. */
export type RefreshTokenPayload = {
  sub: string; // userId
  fid: string; // family id
  jti: string;
};

/** Request principal attached by JwtAuthGuard. */
export type RequestUser = {
  id: string;
  role: Role;
  mfaPassed: boolean;
};

export type AuthedRequest = Request & {
  user?: RequestUser;
};

export const REASON = {
  noUser: 'no_user',
  badPassword: 'bad_password',
  locked: 'locked',
  emailNotVerified: 'email_not_verified',
  deactivated: 'deactivated',
} as const;
export type FailureReason = (typeof REASON)[keyof typeof REASON];
