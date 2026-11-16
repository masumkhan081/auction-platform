'use client';

import { toast } from 'sonner';
import { ApiError, TransportError, ValidationError } from '../api/errors';

/**
 * Single funnel for caught errors → user feedback. Every catch site that
 * surfaces a UI message uses this; `console.error(err)` per-component is a
 * code smell.
 *
 * Backend error messages are rendered directly to guarantee accurate,
 * consistent user feedback without message drift.
 */

export type HandleOptions = {
  /** Optional override message; defaults to `err.message`. */
  fallback?: string;
  /** Suppress toasting (caller will render its own UI). */
  silent?: boolean;
};

export function handleError(err: unknown, opts: HandleOptions = {}): void {
  if (opts.silent) return;

  if (err instanceof ValidationError && Array.isArray(err.details) && err.details.length > 0) {
    const detailMessages = (err.details as Array<{ message?: string } | string>)
      .map((d) => (typeof d === 'string' ? d : d?.message))
      .filter(Boolean);
    if (detailMessages.length > 0) {
      toast.error(detailMessages.join(', '));
      return;
    }
  }

  if (err instanceof ApiError) {
    toast.error(err.message || opts.fallback || 'Request failed');
    return;
  }

  if (err instanceof TransportError) {
    toast.error(err.message || opts.fallback || 'Network error — please try again');
    return;
  }

  toast.error(err instanceof Error ? err.message : (opts.fallback ?? 'Something went wrong'));
}
