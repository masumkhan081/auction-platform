import type { QueryClient } from '@tanstack/react-query';
import type { Socket } from 'socket.io-client';
import {
  AuctionClosedEventSchema,
  AuctionTickEventSchema,
  BidPlacedEventSchema,
  NotificationCreatedEventSchema,
  OutbidEventSchema,
  type PublicAuctionDto,
} from '@auction/shared';
import { qk } from '../query/keys';

/**
 * THE ONLY place socket events touch the React Query cache. Every event:
 *   1. parsed through its Zod schema (server-trust + shape guard)
 *   2. translated into a deterministic cache mutation
 *
 * Ordering rule: never *replace* server-authoritative numbers blindly. We
 * patch known fields (currentHighestMinor, bidCount, endsAt, status) and
 * `invalidateQueries` for anything we don't have on hand. The next refetch
 * reconciles with the api's view of truth.
 */

export function registerEventReconcilers(socket: Socket, queryClient: QueryClient): void {
  socket.on('auction:bid-placed', (raw: unknown) => {
    const result = BidPlacedEventSchema.safeParse(raw);
    if (!result.success) return;
    const event = result.data;

    queryClient.setQueryData<PublicAuctionDto>(
      qk.auctions.publicDetail(event.auctionId),
      (prev) =>
        prev
          ? {
              ...prev,
              currentHighestMinor: event.newCurrentHighestMinor,
              bidCount: prev.bidCount + 1,
            }
          : prev,
    );
    queryClient.invalidateQueries({
      queryKey: ['auctions', 'bids', event.auctionId],
      exact: false,
    });
  });

  socket.on('auction:tick', (raw: unknown) => {
    const result = AuctionTickEventSchema.safeParse(raw);
    if (!result.success) return;
    const event = result.data;

    queryClient.setQueryData<PublicAuctionDto>(
      qk.auctions.publicDetail(event.auctionId),
      (prev) =>
        prev
          ? {
              ...prev,
              endsAt: event.endsAt.toISOString(),
              status: event.status,
            }
          : prev,
    );
  });

  socket.on('auction:closed', (raw: unknown) => {
    const result = AuctionClosedEventSchema.safeParse(raw);
    if (!result.success) return;
    const event = result.data;

    queryClient.setQueryData<PublicAuctionDto>(
      qk.auctions.publicDetail(event.auctionId),
      (prev) =>
        prev
          ? {
              ...prev,
              status: event.status,
              closedAt: event.closedAt.toISOString(),
            }
          : prev,
    );
    queryClient.invalidateQueries({ queryKey: qk.auctions.all() });
  });

  socket.on('auction:outbid', (raw: unknown) => {
    const result = OutbidEventSchema.safeParse(raw);
    if (!result.success) return;
    // Outbid is a notification trigger — the matching `notification:created`
    // handles cache. This event mainly drives in-page toasts (P2D).
  });

  socket.on('notification:created', (raw: unknown) => {
    const result = NotificationCreatedEventSchema.safeParse(raw);
    if (!result.success) return;
    queryClient.invalidateQueries({ queryKey: qk.notifications.all() });
  });
}
