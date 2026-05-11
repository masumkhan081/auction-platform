'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { AuthSession } from '@auction/shared';
import { canAccess } from '@/lib/auth/can-access';
import { Button } from '@/components/ui/button';
import { ADMIN_NAV, AUTH_NAV, PUBLIC_NAV, SELLER_NAV, type NavLink } from './nav-config';
import { UserMenu } from './user-menu';

interface DesktopNavProps {
  session: AuthSession | null;
}

/**
 * Desktop nav row — hidden below `md`. Client component only because it reads
 * `usePathname` for active-link styling. Session is passed as a prop from the
 * RSC parent (`SiteHeader`) so no client query is needed here.
 */
export function DesktopNav({ session }: DesktopNavProps) {
  const pathname = usePathname();
  const role = session?.user.role;

  const links: NavLink[] = [
    ...PUBLIC_NAV,
    ...(session ? AUTH_NAV : []),
    ...(canAccess(role, ['SELLER']) ? SELLER_NAV : []),
    ...(canAccess(role, ['ADMIN']) ? ADMIN_NAV : []),
  ];

  return (
    <div className="hidden md:flex md:flex-1 md:items-center md:gap-6">
      {/* Brand */}
      <Link href="/" className="mr-4 shrink-0 text-sm font-semibold tracking-tight">
        Auction
      </Link>

      {/* Primary links */}
      <nav aria-label="Primary navigation" className="flex items-center gap-1">
        {links.map((link) => {
          const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active ? 'page' : undefined}
              id={`desktop-nav-${link.href.replace(/\//g, '-').slice(1)}`}
              className={[
                'flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                active
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              ].join(' ')}
            >
              {link.label}
              {link.placeholder && (
                <span className="text-[10px] text-muted-foreground">(soon)</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Auth controls */}
      <div className="flex items-center gap-2">
        {session ? (
          <UserMenu session={session} />
        ) : (
          <>
            <Button asChild variant="ghost" size="sm" id="desktop-nav-login">
              <Link href="/auth/login">Sign in</Link>
            </Button>
            <Button asChild size="sm" id="desktop-nav-register">
              <Link href="/auth/register">Get started</Link>
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
