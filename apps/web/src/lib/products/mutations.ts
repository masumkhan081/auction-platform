'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type {
  CreateProductRequest,
  UpdateProductRequest,
  RejectProductRequest,
  SellerProductDto,
  AdminProductDto,
} from '@auction/shared';
import { apiFetch } from '../api/client';
import { handleError } from '../errors/handle-error';
import { qk } from '../query/keys';

// ─── Seller ──────────────────────────────────────────────────────────────────

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateProductRequest) =>
      apiFetch<SellerProductDto>('/products', { method: 'POST', json: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.products.all() });
      toast.success('Product created successfully');
    },
    onError: (err) => handleError(err),
  });
}

export function useUpdateProduct(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateProductRequest) =>
      apiFetch<SellerProductDto>(`/products/${id}`, { method: 'PATCH', json: input }),
    onSuccess: (data) => {
      queryClient.setQueryData(qk.products.mineDetail(id), data);
      queryClient.invalidateQueries({ queryKey: qk.products.all() });
      toast.success('Product updated');
    },
    onError: (err) => handleError(err),
  });
}

export function useSubmitProduct(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiFetch<SellerProductDto>(`/products/${id}/submit`, { method: 'POST' }),
    onSuccess: (data) => {
      queryClient.setQueryData(qk.products.mineDetail(id), data);
      queryClient.invalidateQueries({ queryKey: qk.products.all() });
      toast.success('Product submitted for review');
    },
    onError: (err) => handleError(err),
  });
}

// ─── Admin ───────────────────────────────────────────────────────────────────

export function useApproveProduct(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiFetch<AdminProductDto>(`/products/admin/${id}/approve`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.products.all() });
      toast.success('Product approved');
    },
    onError: (err) => handleError(err),
  });
}

export function useRejectProduct(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: RejectProductRequest) =>
      apiFetch<AdminProductDto>(`/products/admin/${id}/reject`, { method: 'POST', json: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.products.all() });
      toast.success('Product rejected');
    },
    onError: (err) => handleError(err),
  });
}
