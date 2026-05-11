'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { AuthSession } from '@auction/shared';
import { apiFetch } from '../api/client';
import { ApiError } from '../api/errors';
import { qk } from '../query/keys';

/**
 * Reads the seeded `auth.me` cache. The QueryProvider seeds this from the
 * SSR-fetched session, so this hook returns the correct value on first paint
 * (no flicker).
 *
 * Refetches happen lazily on staleTime expiry; logout clears the cache.
 */
export function useSession() {
  return useQuery<AuthSession | null>({
    queryKey: qk.auth.me(),
    queryFn: async () => {
      try {
        return await apiFetch<AuthSession>('/auth/me');
      } catch (err) {
        if (err instanceof ApiError) return null;
        throw err;
      }
    },
    staleTime: Infinity, // SSR seed remains canonical until a mutation invalidates
  });
}

/**
 * Imperative cache helpers for login/logout flows. Mutations call these
 * directly so consumers re-render with the new auth state.
 */
export function useSessionWriter() {
  const queryClient = useQueryClient();
  return {
    set: (session: AuthSession | null) => {
      queryClient.setQueryData(qk.auth.me(), session);
    },
    invalidate: () => queryClient.invalidateQueries({ queryKey: qk.auth.me() }),
  };
}
