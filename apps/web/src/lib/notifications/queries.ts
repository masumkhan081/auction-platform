'use client';

import { useQuery } from '@tanstack/react-query';
import type { NotificationDto, Paginated } from '@auction/shared';
import { apiFetch } from '../api/client';
import { qk } from '../query/keys';

export function useNotifications(page = 1, pageSize = 20, unread?: boolean) {
  return useQuery<Paginated<NotificationDto>>({
    queryKey: qk.notifications.list({ page, pageSize, ...(unread !== undefined ? { unread } : {}) }),
    queryFn: () => {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        ...(unread !== undefined ? { unread: String(unread) } : {}),
      });
      return apiFetch<Paginated<NotificationDto>>(`/notifications?${params}`);
    },
    staleTime: 10_000,
  });
}
