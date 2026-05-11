'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../api/client';
import { qk } from '../query/keys';
import type { Paginated } from '@auction/shared';

// Temporary mock type for Category since it might not be exported from shared
export interface CategoryDto {
  id: string;
  name: string;
  slug: string;
}

export function useCategories() {
  return useQuery<Paginated<CategoryDto>>({
    queryKey: qk.categories.all(),
    queryFn: () => apiFetch<Paginated<CategoryDto>>('/categories?pageSize=100'),
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}
