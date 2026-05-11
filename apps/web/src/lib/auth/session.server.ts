import 'server-only';
import { cache } from 'react';
import type { AuthSession } from '@auction/shared';
import { apiFetchServer } from '../api/server';
import { ApiError } from '../api/errors';

/**
 * Reads the current session from the api using the request's cookies.
 * Returns `null` when unauthenticated. Wrapped in `react/cache` so multiple
 * server components in the same render share one network round-trip.
 *
 * Used by:
 *   - root layout (seeds the QueryClient)
 *   - protected pages (redirect if null)
 */
export const getServerSession = cache(async (): Promise<AuthSession | null> => {
  try {
    return await apiFetchServer<AuthSession>('/auth/me');
  } catch (err) {
    if (err instanceof ApiError) return null; // 401, 403, etc → not authenticated
    throw err; // genuine network/transport errors should bubble
  }
});
