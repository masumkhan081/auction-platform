/**
 * Four error classes — one per failure category. Every catch site can
 * pattern-match on `instanceof` instead of inspecting `err.message`.
 *
 *   TransportError    network is broken / proxy failed / response unparseable
 *   ApiError          backend returned a typed `ApiFailure` envelope (any code)
 *   AuthError         ApiError that's auth-related (401 + refresh failed, or
 *                     code starts with `auth.`)
 *   ValidationError   ApiError where code === 'validation_failed'
 */

export class TransportError extends Error {
  readonly status: number;
  constructor(message: string, status = 0) {
    super(message);
    this.name = 'TransportError';
    this.status = status;
  }
}

export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details?: unknown;

  constructor(args: { code: string; message: string; status: number; details?: unknown }) {
    super(args.message);
    this.name = 'ApiError';
    this.code = args.code;
    this.status = args.status;
    if (args.details !== undefined) this.details = args.details;
  }
}

export class AuthError extends ApiError {
  constructor(args: { code: string; message: string; status: number; details?: unknown }) {
    super(args);
    this.name = 'AuthError';
  }
}

export class ValidationError extends ApiError {
  constructor(args: { code: string; message: string; status: number; details?: unknown }) {
    super(args);
    this.name = 'ValidationError';
  }
}

/**
 * Promotes a generic `ApiError` to the most specific subclass, based on the
 * status code and the error code.
 */
export const promoteApiError = (err: ApiError): ApiError => {
  if (err.code === 'validation_failed') {
    return new ValidationError({
      code: err.code,
      message: err.message,
      status: err.status,
      ...(err.details !== undefined ? { details: err.details } : {}),
    });
  }
  if (err.status === 401 || err.code.startsWith('auth.')) {
    return new AuthError({
      code: err.code,
      message: err.message,
      status: err.status,
      ...(err.details !== undefined ? { details: err.details } : {}),
    });
  }
  return err;
};
