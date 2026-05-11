'use client';

import { QueryClientProvider, type QueryClient } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';
import type { AuthSession } from '@auction/shared';
import { makeQueryClient } from '@/lib/query/client';
import { SocketProvider } from '@/lib/realtime/socket-provider';
import { Toaster } from '@/components/ui/sonner';

/**
 * One provider tree. Order matters:
 *   QueryClient → SocketProvider (uses queryClient for reconciliation)
 *
 * `initialSession` is the SSR-fetched auth state. We seed it into the
 * `auth.me` query in `makeQueryClient` so first paint matches server output.
 */
export function Providers({
  initialSession,
  children,
}: {
  initialSession: AuthSession | null;
  children: React.ReactNode;
}) {
  const [client] = useState<QueryClient>(() => makeQueryClient(initialSession));

  return (
    <QueryClientProvider client={client}>
      <SocketProvider>
        {children}
        <Toaster />
        {process.env.NODE_ENV !== 'production' && (
          <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
        )}
      </SocketProvider>
    </QueryClientProvider>
  );
}
