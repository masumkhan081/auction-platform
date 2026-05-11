import type { ApiResponse } from '@auction/shared';
import { ApiError, TransportError, promoteApiError } from './errors';

export type RequestInitJson = Omit<RequestInit, 'body'> & {
  /** Object body — JSON-encoded automatically. Pass `undefined` for no body. */
  json?: unknown;
};

/**
 * Builds a Fetch request. Sets `Accept: application/json`; if `json` is given,
 * sets `Content-Type` and serializes.
 */
export const buildRequestInit = (init: RequestInitJson | undefined): RequestInit => {
  const headers = new Headers(init?.headers);
  headers.set('Accept', 'application/json');
  let body: BodyInit | undefined;
  if (init?.json !== undefined) {
    headers.set('Content-Type', 'application/json');
    body = JSON.stringify(init.json);
  }
  const { json: _ignored, ...rest } = init ?? {};
  return body !== undefined ? { ...rest, headers, body } : { ...rest, headers };
};

/**
 * Parse the response into `T`. Throws:
 *   - `TransportError` for unparseable / non-envelope responses
 *   - `ApiError` (or subclass) for `{success:false}` envelopes
 */
export async function unwrapEnvelope<T>(res: Response): Promise<T> {
  let payload: unknown;
  try {
    payload = await res.json();
  } catch {
    throw new TransportError(`Non-JSON response (status ${res.status})`, res.status);
  }
  if (!isEnvelope(payload)) {
    throw new TransportError(`Unexpected response shape (status ${res.status})`, res.status);
  }
  if (payload.success) {
    return payload.data as T;
  }
  throw promoteApiError(
    new ApiError({
      code: payload.error.code,
      message: payload.error.message,
      status: res.status,
      ...(payload.error.details !== undefined ? { details: payload.error.details } : {}),
    }),
  );
}

const isEnvelope = (value: unknown): value is ApiResponse<unknown> => {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  if (v.success === true && 'data' in v) return true;
  if (v.success === false && typeof v.error === 'object' && v.error !== null) return true;
  return false;
};
