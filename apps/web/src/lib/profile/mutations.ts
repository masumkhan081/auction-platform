'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { ProfileDto, UpdateProfileRequest } from '@auction/shared';
import { apiFetch } from '../api/client';
import { handleError } from '../errors/handle-error';
import { qk } from '../query/keys';

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateProfileRequest) =>
      apiFetch<ProfileDto>('/profile/me', { method: 'PATCH', json: input }),
    onSuccess: (updated) => {
      queryClient.setQueryData(qk.profile.me(), updated);
      queryClient.invalidateQueries({ queryKey: qk.auth.me() });
      toast.success('Profile updated successfully');
    },
    onError: (err) => handleError(err),
  });
}

export function useDeactivateAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiFetch<void>('/profile/me', { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.clear();
      window.location.href = '/auth/login';
    },
    onError: (err) => handleError(err),
  });
}
