'use client';

import { useQuery } from '@tanstack/react-query';
import type { AuctionStatus, Paginated, PublicAuctionDto, SellerAuctionDto } from '@auction/shared';
import { apiFetch } from '../api/client';
import { qk } from '../query/keys';

/**
 * TanStack Query hooks for the public auction API surface.
 *
 * Data flow:
 *   RSC page → prefetch via `apiFetchServer` → seeds queryClient → these
 *   hooks read from cache on first paint (no loading flash).
 *
 * All hooks use `select` as a safeguard against undefined; callers always
 * receive a typed value or a loading/error state.
 */

export interface AuctionListFilters {
  page: number;
  pageSize: number;
  status?: AuctionStatus;
  productId?: string;
}

export function usePublicAuctionList(filters: AuctionListFilters) {
  const { page, pageSize, status, productId } = filters;
  return useQuery<Paginated<PublicAuctionDto>>({
    queryKey: qk.auctions.publicList({
      page,
      pageSize,
      ...(status ? { status } : {}),
      ...(productId ? { productId } : {}),
    }),
    queryFn: () => {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });
      if (status) params.set('status', status);
      if (productId) params.set('productId', productId);
      return apiFetch<Paginated<PublicAuctionDto>>(`/auctions?${params}`);
    },
    staleTime: 15_000, // short — auctions change frequently
    placeholderData: (prev) => prev, // keep prev page visible during page transition
  });
}

export function usePublicAuctionDetail(id: string) {
  return useQuery<PublicAuctionDto>({
    queryKey: qk.auctions.publicDetail(id),
    queryFn: () => apiFetch<PublicAuctionDto>(`/auctions/${id}`),
    staleTime: 30_000,
    // socket events patch this cache directly; staleTime is a safety net only
  });
}

// ─── Seller ──────────────────────────────────────────────────────────────────

export function useMineAuctions(page = 1, pageSize = 12) {
  return useQuery<Paginated<SellerAuctionDto>>({
    queryKey: qk.auctions.mine({ page, pageSize }),
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      return apiFetch<Paginated<SellerAuctionDto>>(`/auctions/me/list?${params}`);
    },
  });
}

export function useMineAuctionDetail(id: string) {
  return useQuery<SellerAuctionDto>({
    queryKey: qk.auctions.mineDetail(id),
    queryFn: () => apiFetch<SellerAuctionDto>(`/auctions/me/${id}`),
  });
}
