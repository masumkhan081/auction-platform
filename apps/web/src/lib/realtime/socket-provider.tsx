'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { clientEnv } from '../env';
import { qk } from '../query/keys';
import { registerEventReconcilers } from './event-reconcilers';
import { SocketContext } from './socket-context';

/**
 * Single Socket.IO connection per browser session. Cookies are sent via the
 * default transport upgrade — no token is passed in handshake auth.
 *
 * Reconnection policy:
 *   - socket.io's built-in exponential backoff handles transport drops
 *   - on `connect` after a previous `disconnect`, we invalidate the
 *     `['auctions']` query domain so any open page refetches and recovers
 *     from missed events. This is the deterministic recovery path.
 */
export function SocketProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const sock = io(clientEnv.NEXT_PUBLIC_API_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnectionDelay: 500,
      reconnectionDelayMax: 5_000,
    });

    let hadDisconnect = false;
    sock.on('disconnect', () => {
      hadDisconnect = true;
    });
    sock.on('connect', () => {
      if (hadDisconnect) {
        // Backfill missed events.
        queryClient.invalidateQueries({ queryKey: qk.auctions.all() });
        queryClient.invalidateQueries({ queryKey: qk.notifications.all() });
        hadDisconnect = false;
      }
    });

    registerEventReconcilers(sock, queryClient);
    setSocket(sock);

    return () => {
      sock.disconnect();
      setSocket(null);
    };
  }, [queryClient]);

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
}
