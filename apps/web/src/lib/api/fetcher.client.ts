'use client';

import { clientEnv } from '../env';
import { AuthError, TransportError } from './errors';
import {
  buildRequestInit,
  unwrapEnvelope,
  type RequestInitJson,
} from './fetcher.shared';

/**
 * Browser fetcher. Sends cookies (`credentials: 'include'`).
 *
 * THE ONE HIDDEN RETRY: on a 401 from any path EXCEPT `/api/auth/refresh`
 * itself, we POST to `/api/auth/refresh` once and replay the original. If
 * refresh fails, we throw `AuthError` and let the caller redirect to login.
 *
 * In-flight refresh deduplication: concurrent 401s share a single refresh
 * promise so we don't burn N rotations for N parallel requests.
 */

let inFlightRefresh: Promise<void> | null = null;

const triggerRefresh = async (): Promise<void> => {
  if (!inFlightRefresh) {
    inFlightRefresh = (async () => {
      const res = await fetch(`${clientEnv.NEXT_PUBLIC_API_URL}/api/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) {
        throw new AuthError({
          code: 'auth.refresh_failed',
          message: 'Session expired',
          status: res.status,
        });
      }
    })().finally(() => {
      inFlightRefresh = null;
    });
  }
  return inFlightRefresh;
};

export async function apiFetch<T>(path: string, init?: RequestInitJson): Promise<T> {
  if (!path.startsWith('/')) path = `/${path}`;
  const url = `${clientEnv.NEXT_PUBLIC_API_URL}${path.startsWith('/api') ? path : `/api${path}`}`;

  const send = async (): Promise<Response> => {
    try {
      return await fetch(url, {
        ...buildRequestInit(init),
        credentials: 'include',
      });
    } catch (err) {
      throw new TransportError((err as Error).message);
    }
  };

  let res = await send();

  if (res.status === 401 && !path.includes('/auth/refresh') && !path.includes('/auth/login')) {
    await triggerRefresh();
    res = await send();
  }

  return unwrapEnvelope<T>(res);
}
