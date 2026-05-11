import { notFound } from 'next/navigation';
import { apiFetchServer } from '@/lib/api/server';
import { qk } from '@/lib/query/keys';
import type { SellerProductDto } from '@auction/shared';
import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query';
import { EditProductClient } from './edit-product-client';

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const queryClient = new QueryClient();

  try {
    await queryClient.fetchQuery({
      queryKey: qk.products.mineDetail(id),
      queryFn: () => apiFetchServer<SellerProductDto>(`/products/me/${id}`),
    });
  } catch {
    notFound();
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <EditProductClient id={id} />
    </HydrationBoundary>
  );
}
