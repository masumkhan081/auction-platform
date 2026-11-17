'use client';

import { useQuery } from '@tanstack/react-query';
import type { ProfileDto } from '@auction/shared';
import { apiFetch } from '../api/client';
import { qk } from '../query/keys';

export function useMyProfile() {
  return useQuery<ProfileDto>({
    queryKey: qk.profile.me(),
    queryFn: () => apiFetch<ProfileDto>('/profile/me'),
    staleTime: 30_000,
  });
}
