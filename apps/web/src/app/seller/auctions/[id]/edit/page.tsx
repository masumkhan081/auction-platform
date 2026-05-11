import { notFound } from 'next/navigation';
import { apiFetchServer } from '@/lib/api/server';
import { qk } from '@/lib/query/keys';
import type { SellerAuctionDto } from '@auction/shared';
import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query';
import { EditAuctionClient } from './edit-auction-client';

export default async function EditAuctionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const queryClient = new QueryClient();

  try {
    await queryClient.fetchQuery({
      queryKey: qk.auctions.mineDetail(id),
      queryFn: () => apiFetchServer<SellerAuctionDto>(`/auctions/me/${id}`),
    });
  } catch {
    notFound();
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <EditAuctionClient id={id} />
    </HydrationBoundary>
  );
}
