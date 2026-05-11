import { QueryClient } from '@tanstack/react-query';
import type { AuthSession } from '@auction/shared';
import { AuthError } from '../api/errors';
import { qk } from './keys';

/**
 * Builds a `QueryClient` and seeds the auth session from SSR. Per-request on
 * the server (a fresh client per render); singleton on the client (assigned
 * by the provider).
 *
 * Default options:
 *   - `retry: 1` for transient flakes; AuthError aborts further retries
 *     because re-trying after refresh-failure would loop.
 *   - `staleTime: 30s` so background refetches don't hammer the api during
 *     normal navigation.
 *   - `refetchOnWindowFocus: false` because we have socket-driven
 *     reconciliation; window focus refetches would duplicate work.
 */
export function makeQueryClient(initialSession: AuthSession | null): QueryClient {
  const client = new QueryClient({
    defaultOptions: {
      queries: {
        retry: (failureCount, err) => {
          if (err instanceof AuthError) return false;
          return failureCount < 1;
        },
        staleTime: 30_000,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

  // Seed the auth-me query so the first paint matches SSR exactly.
  client.setQueryData(qk.auth.me(), initialSession);
  return client;
}
