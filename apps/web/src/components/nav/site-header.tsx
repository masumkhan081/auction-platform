import { getServerSession } from '@/lib/auth/session.server';
import { DesktopNav } from './desktop-nav';
import { MobileDrawer } from './mobile-drawer';

/**
 * Top-level site header. Server component — reads the session via the cached
 * RSC helper (`getServerSession`) that the root layout already called, so
 * there is NO extra network round-trip here.
 *
 * Architecture notes:
 *  - The session value is passed as a prop into client sub-components so
 *    they don't need their own `useSession()` query, which would create a
 *    hydration-mismatch window between SSR paint and first client render.
 *  - `DesktopNav` and `MobileDrawer` are client components only because they
 *    need `usePathname()` and `useState()` respectively. Everything else here
 *    is static and rendered on the server.
 *  - No `<Suspense>` wrapper here because `getServerSession` uses react/cache
 *    and shares the result from the root layout call — it never suspends.
 */
export async function SiteHeader() {
  const session = await getServerSession();

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center gap-4">
        {/* Mobile-first: drawer trigger on the left, hidden on md+ */}
        <MobileDrawer session={session} />

        {/* Desktop nav fills the rest; hidden below md */}
        <DesktopNav session={session} />

        {/* Mobile brand — only visible when drawer is closed on small screens */}
        <div className="flex flex-1 items-center justify-center md:hidden">
          {/* Centered brand on mobile; DesktopNav shows its own brand on md+ */}
          <a href="/" className="text-sm font-semibold tracking-tight">
            Auction
          </a>
        </div>

        {/* Spacer to push auth buttons to the right on mobile */}
        <div className="flex items-center gap-2 md:hidden">
          {!session && (
            <a
              href="/auth/login"
              className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              id="mobile-header-login"
            >
              Sign in
            </a>
          )}
        </div>
      </div>
    </header>
  );
}
