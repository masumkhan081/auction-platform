import 'server-only';
import { cookies } from 'next/headers';
import { getServerEnv } from '../env';
import { TransportError } from './errors';
import {
  buildRequestInit,
  unwrapEnvelope,
  type RequestInitJson,
} from './fetcher.shared';

/**
 * Server fetcher (RSC, route handlers, server actions). Forwards the user's
 * cookies via `next/headers`. Does NOT auto-refresh on 401 — server contexts
 * can't reliably mutate response cookies from arbitrary RSCs. Callers handle
 * `AuthError` by redirecting to `/auth/login`.
 *
 * The `cache: 'no-store'` default keeps every server request fresh; pass
 * `{ next: { revalidate: N } }` per-call when caching is appropriate.
 */
export async function apiFetchServer<T>(
  path: string,
  init?: RequestInitJson,
): Promise<T> {
  const env = getServerEnv();
  if (!path.startsWith('/')) path = `/${path}`;
  const url = `${env.API_INTERNAL_URL}${path.startsWith('/api') ? path : `/api${path}`}`;

  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${encodeURIComponent(c.value)}`)
    .join('; ');

  const headers = new Headers((init ?? {}).headers);
  if (cookieHeader) headers.set('Cookie', cookieHeader);

  let res: Response;
  try {
    res = await fetch(url, {
      ...buildRequestInit({ ...init, headers }),
      cache: 'no-store',
    });
  } catch (err) {
    throw new TransportError((err as Error).message);
  }

  return unwrapEnvelope<T>(res);
}
