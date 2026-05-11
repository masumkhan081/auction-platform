'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type {
  CreateAuctionRequest,
  UpdateAuctionRequest,
  CancelAuctionRequest,
  SellerAuctionDto,
  AdminAuctionDto,
} from '@auction/shared';
import { apiFetch } from '../api/client';
import { handleError } from '../errors/handle-error';
import { qk } from '../query/keys';

// ─── Seller ──────────────────────────────────────────────────────────────────

export function useCreateAuction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateAuctionRequest) =>
      apiFetch<SellerAuctionDto>('/auctions', { method: 'POST', json: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.auctions.all() });
      toast.success('Auction scheduled');
    },
    onError: (err) => handleError(err),
  });
}

export function useUpdateAuction(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateAuctionRequest) =>
      apiFetch<SellerAuctionDto>(`/auctions/${id}`, { method: 'PATCH', json: input }),
    onSuccess: (data) => {
      queryClient.setQueryData(qk.auctions.mineDetail(id), data);
      queryClient.invalidateQueries({ queryKey: qk.auctions.all() });
      toast.success('Auction updated');
    },
    onError: (err) => handleError(err),
  });
}

export function useSellerCancelAuction(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CancelAuctionRequest) =>
      apiFetch<SellerAuctionDto>(`/auctions/${id}/cancel`, { method: 'POST', json: input }),
    onSuccess: (data) => {
      queryClient.setQueryData(qk.auctions.mineDetail(id), data);
      queryClient.invalidateQueries({ queryKey: qk.auctions.all() });
      toast.success('Auction cancelled');
    },
    onError: (err) => handleError(err),
  });
}

// ─── Admin ───────────────────────────────────────────────────────────────────

export function useAdminCancelAuction(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CancelAuctionRequest) =>
      apiFetch<AdminAuctionDto>(`/auctions/admin/${id}/cancel`, { method: 'POST', json: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.auctions.all() });
      toast.success('Auction cancelled by admin');
    },
    onError: (err) => handleError(err),
  });
}

export function useAdminForceStartAuction(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiFetch<{ outcome: string }>(`/auctions/admin/${id}/force-start`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.auctions.all() });
      toast.success('Auction forcefully started');
    },
    onError: (err) => handleError(err),
  });
}
