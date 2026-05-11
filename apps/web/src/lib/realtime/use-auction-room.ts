'use client';

import { useEffect } from 'react';
import { SOCKET_EVENTS } from '@auction/shared';
import { useSocket } from './use-socket';

/**
 * Subscribes the active socket to the auction's room while the component is
 * mounted. The reconciler in `event-reconcilers.ts` handles cache updates;
 * this hook only manages room membership.
 */
export function useAuctionRoom(auctionId: string | undefined): void {
  const socket = useSocket();
  useEffect(() => {
    if (!socket || !auctionId) return;
    socket.emit(SOCKET_EVENTS.subscribeAuction, { auctionId });
    return () => {
      socket.emit(SOCKET_EVENTS.unsubscribeAuction, { auctionId });
    };
  }, [socket, auctionId]);
}
