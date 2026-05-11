/**
 * Barrel for *isomorphic* API surface — errors and types only. Fetchers MUST
 * be imported from their specific entry points so the `server-only` boundary
 * is enforced by Next's bundler:
 *
 *   client component → `import { apiFetch } from '@/lib/api/client'`
 *   server component → `import { apiFetchServer } from '@/lib/api/server'`
 */
export * from './errors';
export type { RequestInitJson } from './fetcher.shared';
