import { Skeleton } from '@/components/ui/skeleton';

/**
 * Placeholder shown in the navbar while the client-side session resolves.
 * Matches the approximate visual weight of the authenticated nav items so
 * layout shift is imperceptible.
 *
 * This is a server component (no 'use client' directive). It renders static
 * HTML so it can be passed as a Suspense fallback without creating a client
 * boundary just for a loading state.
 */
export function NavAuthSkeleton() {
  return (
    <div className="flex items-center gap-2" aria-hidden="true">
      <Skeleton className="h-8 w-16 rounded-md" />
      <Skeleton className="h-8 w-8 rounded-full" />
    </div>
  );
}
