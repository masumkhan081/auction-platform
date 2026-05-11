import 'server-only';
import { redirect } from 'next/navigation';
import type { AuthSession, Role } from '@auction/shared';
import { getServerSession } from './session.server';

/**
 * Server-side gate for protected pages. Throws via `redirect()` if:
 *   - no session → redirect to /auth/login?next=<currentPath>
 *   - session but role mismatch → redirect to /
 *
 * Returns the session for use in the page. The redirect path is the only
 * branch — callers can rely on a non-null return.
 */
export async function requireAuth(opts?: {
  roles?: ReadonlyArray<Role>;
  /** Path the user came from, used to round-trip after login. */
  callbackPath?: string;
}): Promise<AuthSession> {
  const session = await getServerSession();
  if (!session) {
    const next = opts?.callbackPath ? `?next=${encodeURIComponent(opts.callbackPath)}` : '';
    redirect(`/auth/login${next}`);
  }
  if (opts?.roles && opts.roles.length > 0 && !opts.roles.includes(session.user.role)) {
    redirect('/');
  }
  return session;
}

/**
 * For `/auth/*` pages — bounces an already-authenticated user away.
 */
export async function redirectIfAuthenticated(to = '/'): Promise<void> {
  const session = await getServerSession();
  if (session) redirect(to);
}
