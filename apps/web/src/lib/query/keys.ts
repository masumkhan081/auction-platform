import type { AuctionStatus } from '@auction/shared';

/**
 * Centralized query-key factory. Every `useQuery`/`useMutation` consumer pulls
 * its key from here so invalidation has one source of truth.
 *
 * Conventions:
 *   - keys are nested arrays: `[domain, sub, ...args]`
 *   - shaped from coarsest → finest so `invalidateQueries({ queryKey: qk.auctions._all })`
 *     wipes the whole domain
 *   - filter objects are inlined as the last segment so equality is structural
 */

export const qk = {
  auth: {
    me: () => ['auth', 'me'] as const,
  },

  categories: {
    all: () => ['categories'] as const,
    list: (page: number, pageSize: number) => ['categories', 'list', { page, pageSize }] as const,
    detail: (id: string) => ['categories', 'detail', id] as const,
  },

  products: {
    all: () => ['products'] as const,
    publicList: (filters: { categoryId?: string; page: number; pageSize: number }) =>
      ['products', 'public-list', filters] as const,
    publicDetail: (id: string) => ['products', 'public-detail', id] as const,
    mine: (filters: { page: number; pageSize: number }) =>
      ['products', 'mine', filters] as const,
    mineDetail: (id: string) => ['products', 'mine-detail', id] as const,
    adminPending: (filters: { page: number; pageSize: number }) =>
      ['products', 'admin-pending', filters] as const,
    adminDetail: (id: string) => ['products', 'admin-detail', id] as const,
  },

  auctions: {
    all: () => ['auctions'] as const,
    publicList: (filters: { productId?: string; status?: AuctionStatus; page: number; pageSize: number }) =>
      ['auctions', 'public-list', filters] as const,
    publicDetail: (id: string) => ['auctions', 'public-detail', id] as const,
    mine: (filters: { page: number; pageSize: number }) =>
      ['auctions', 'mine', filters] as const,
    mineDetail: (id: string) => ['auctions', 'mine-detail', id] as const,
    bids: (auctionId: string, filters: { page: number; pageSize: number }) =>
      ['auctions', 'bids', auctionId, filters] as const,
  },

  bids: {
    mine: (filters: { page: number; pageSize: number }) =>
      ['bids', 'mine', filters] as const,
  },

  notifications: {
    all: () => ['notifications'] as const,
    list: (filters: { unread?: boolean; page: number; pageSize: number }) =>
      ['notifications', 'list', filters] as const,
  },
} as const;
