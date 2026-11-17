'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { NotificationDto } from '@auction/shared';
import { apiFetch } from '../api/client';
import { handleError } from '../errors/handle-error';
import { qk } from '../query/keys';

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<NotificationDto>(`/notifications/${id}/read`, { method: 'PATCH' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.notifications.all() });
    },
    onError: (err) => handleError(err),
  });
}
