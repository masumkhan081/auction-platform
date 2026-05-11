'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut, User } from 'lucide-react';
import type { AuthSession } from '@auction/shared';
import { useLogout } from '@/lib/auth/mutations';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { USER_MENU_ITEMS } from './nav-config';

interface UserMenuProps {
  session: AuthSession;
}

/**
 * Authenticated user avatar + dropdown. Receives a pre-fetched session so it
 * can be rendered without a client query — no loading flash.
 *
 * Logout mutation is wired here (single call site) to keep mutations.ts as the
 * only place that owns logout side-effects.
 */
export function UserMenu({ session }: UserMenuProps) {
  const pathname = usePathname();
  const logout = useLogout(`/auth/login?next=${encodeURIComponent(pathname)}`);

  const initials = session.user.fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-8 w-8 rounded-full"
          aria-label={`User menu for ${session.user.fullName}`}
          id="user-menu-trigger"
        >
          <span
            aria-hidden="true"
            className="flex h-full w-full items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground"
          >
            {initials}
          </span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="truncate font-medium">{session.user.fullName}</span>
          <span className="truncate text-xs font-normal text-muted-foreground">
            {session.user.email}
          </span>
          {!session.user.emailVerified && (
            <span className="mt-1 inline-flex items-center rounded-sm bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
              Email unverified
            </span>
          )}
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          {USER_MENU_ITEMS.map((item) => (
            <DropdownMenuItem key={item.href} asChild>
              <Link
                href={item.href}
                id={`user-menu-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                className="flex cursor-pointer items-center gap-2"
              >
                <User className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                {item.label}
                {item.placeholder && (
                  <span className="ml-auto text-[10px] text-muted-foreground">(soon)</span>
                )}
              </Link>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          id="user-menu-logout"
          onSelect={() => logout.mutate()}
          disabled={logout.isPending}
          className="cursor-pointer gap-2 text-destructive focus:text-destructive"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          {logout.isPending ? 'Signing out…' : 'Sign out'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
