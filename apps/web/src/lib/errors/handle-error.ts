'use client';

import { toast } from 'sonner';
import { ApiError, AuthError, TransportError, ValidationError } from '../api/errors';

/**
 * Single funnel for caught errors → user feedback. Every catch site that
 * surfaces a UI message uses this; `console.error(err)` per-component is a
 * code smell.
 *
 * Auth errors deliberately don't toast — the consumer typically redirects
 * to /auth/login, and a transient toast on top of a redirect is noise.
 */

export type HandleOptions = {
  /** Optional override message; defaults to `err.message`. */
  fallback?: string;
  /** Suppress toasting (caller will render its own UI). */
  silent?: boolean;
};

export function handleError(err: unknown, opts: HandleOptions = {}): void {
  if (opts.silent) return;

  if (err instanceof AuthError) {
    // No toast — the caller redirects.
    return;
  }
  if (err instanceof ValidationError) {
    toast.error(err.message || opts.fallback || 'Invalid input');
    return;
  }
  if (err instanceof ApiError) {
    toast.error(err.message || opts.fallback || 'Request failed');
    return;
  }
  if (err instanceof TransportError) {
    toast.error(opts.fallback ?? 'Network error — please try again');
    return;
  }
  toast.error(opts.fallback ?? (err instanceof Error ? err.message : 'Something went wrong'));
}
