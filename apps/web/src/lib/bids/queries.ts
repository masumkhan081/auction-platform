'use client';

import { useQuery } from '@tanstack/react-query';
import type { BidDto, Paginated } from '@auction/shared';
import { apiFetch } from '../api/client';
import { qk } from '../query/keys';

export function useAuctionBids(auctionId: string, page = 1, pageSize = 20) {
  return useQuery<Paginated<BidDto>>({
    queryKey: qk.auctions.bids(auctionId, { page, pageSize }),
    queryFn: () => {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });
      return apiFetch<Paginated<BidDto>>(`/auctions/${auctionId}/bids?${params}`);
    },
    staleTime: 5_000, // Short stale time to ensure freshness if sockets miss
  });
}
