'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import { useState } from 'react';
import type { AuthSession } from '@auction/shared';
import { canAccess } from '@/lib/auth/can-access';
import { useLogout } from '@/lib/auth/mutations';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from '@/components/ui/sheet';
import {
  ADMIN_NAV,
  AUTH_NAV,
  PUBLIC_NAV,
  SELLER_NAV,
  type NavLink,
} from './nav-config';

interface MobileDrawerProps {
  session: AuthSession | null;
}

/**
 * Mobile-only slide-in navigation drawer (Sheet component). Shown below the
 * `md` breakpoint via CSS; the trigger button is hidden on desktop.
 *
 * Link list is assembled from the same nav-config as the desktop header so
 * they can never drift apart.
 */
export function MobileDrawer({ session }: MobileDrawerProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const logout = useLogout('/');

  const role = session?.user.role;

  const links: NavLink[] = [
    ...PUBLIC_NAV,
    ...(session ? AUTH_NAV : []),
    ...(canAccess(role, ['SELLER']) ? SELLER_NAV : []),
    ...(canAccess(role, ['ADMIN']) ? ADMIN_NAV : []),
  ];

  return (
    <>
      {/* Trigger — hidden on md+ */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        aria-label="Open navigation menu"
        aria-expanded={open}
        aria-controls="mobile-nav-drawer"
        onClick={() => setOpen(true)}
        id="mobile-nav-trigger"
      >
        <Menu className="h-5 w-5" aria-hidden="true" />
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" id="mobile-nav-drawer" className="flex flex-col gap-0 p-0">
          <SheetHeader className="border-b px-6 py-4">
            <SheetTitle asChild>
              <SheetClose asChild>
                <Link href="/" className="text-sm font-semibold tracking-tight">
                  Auction
                </Link>
              </SheetClose>
            </SheetTitle>
          </SheetHeader>

          <nav aria-label="Mobile navigation" className="flex-1 overflow-y-auto py-4">
            <ul role="list" className="space-y-0.5 px-3">
              {links.map((link) => {
                const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
                return (
                  <li key={link.href}>
                    <SheetClose asChild>
                      <Link
                        href={link.href}
                        aria-current={active ? 'page' : undefined}
                        aria-disabled={link.placeholder ? 'true' : undefined}
                        id={`mobile-nav-${link.href.replace(/\//g, '-').slice(1)}`}
                        className={[
                          'flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors',
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
                    </SheetClose>
                  </li>
                );
              })}
            </ul>

            {/* Auth section at the bottom of drawer */}
            <div className="mt-4 border-t px-3 pt-4">
              {session ? (
                <>
                  <div className="mb-2 px-3">
                    <p className="truncate text-sm font-medium">{session.user.fullName}</p>
                    <p className="truncate text-xs text-muted-foreground">{session.user.email}</p>
                    {!session.user.emailVerified && (
                      <span className="mt-1 inline-flex items-center rounded-sm bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                        Email unverified
                      </span>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-destructive hover:text-destructive"
                    disabled={logout.isPending}
                    onClick={() => {
                      logout.mutate();
                      setOpen(false);
                    }}
                    id="mobile-nav-logout"
                  >
                    {logout.isPending ? 'Signing out…' : 'Sign out'}
                  </Button>
                </>
              ) : (
                <div className="flex flex-col gap-2">
                  <SheetClose asChild>
                    <Button asChild variant="outline" size="sm" className="w-full">
                      <Link href="/auth/login" id="mobile-nav-login">
                        Sign in
                      </Link>
                    </Button>
                  </SheetClose>
                  <SheetClose asChild>
                    <Button asChild size="sm" className="w-full">
                      <Link href="/auth/register" id="mobile-nav-register">
                        Create account
                      </Link>
                    </Button>
                  </SheetClose>
                </div>
              )}
            </div>
          </nav>
        </SheetContent>
      </Sheet>
    </>
  );
}
