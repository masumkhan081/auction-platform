'use client';

import { useQuery } from '@tanstack/react-query';
import type { PublicProductDto, SellerProductDto, AdminProductDto, Paginated } from '@auction/shared';
import { apiFetch } from '../api/client';
import { qk } from '../query/keys';

// ─── Public ──────────────────────────────────────────────────────────────────

export function usePublicProduct(id: string | undefined) {
  return useQuery<PublicProductDto>({
    queryKey: qk.products.publicDetail(id ?? ''),
    queryFn: () => apiFetch<PublicProductDto>(`/products/${id}`),
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 minutes (products change infrequently)
  });
}

// ─── Seller ──────────────────────────────────────────────────────────────────

export function useMineProducts(page = 1, pageSize = 12) {
  return useQuery<Paginated<SellerProductDto>>({
    queryKey: qk.products.mine({ page, pageSize }),
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      return apiFetch<Paginated<SellerProductDto>>(`/products/me/list?${params}`);
    },
  });
}

export function useMineProductDetail(id: string) {
  return useQuery<SellerProductDto>({
    queryKey: qk.products.mineDetail(id),
    queryFn: () => apiFetch<SellerProductDto>(`/products/me/${id}`),
  });
}

// ─── Admin ───────────────────────────────────────────────────────────────────

export function useAdminPendingProducts(page = 1, pageSize = 12) {
  return useQuery<Paginated<AdminProductDto>>({
    queryKey: qk.products.adminPending({ page, pageSize }),
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      return apiFetch<Paginated<AdminProductDto>>(`/products/admin/pending?${params}`);
    },
  });
}

export function useAdminProductDetail(id: string) {
  return useQuery<AdminProductDto>({
    queryKey: qk.products.adminDetail(id),
    queryFn: () => apiFetch<AdminProductDto>(`/products/admin/${id}`),
  });
}
