import type { Metadata } from 'next';
import { apiFetchServer } from '@/lib/api/server';
import { qk } from '@/lib/query/keys';
import type { Paginated, PublicAuctionDto, AuctionStatus } from '@auction/shared';
import { AuctionListClient } from './auction-list-client';
import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query';

export const metadata: Metadata = {
  title: 'Auctions | Auction Platform',
  description: 'Browse live and upcoming auctions.',
};

export default async function AuctionsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? '1', 10) || 1);
  const status = params.status as AuctionStatus | undefined;

  const queryClient = new QueryClient();

  const queryFilters = { page, pageSize: 12, ...(status ? { status } : {}) };

  // Pre-fetch the first page
  await queryClient.prefetchQuery({
    queryKey: qk.auctions.publicList(queryFilters),
    queryFn: () => {
      const sp = new URLSearchParams({ page: String(page), pageSize: '12' });
      if (status) sp.set('status', status);
      return apiFetchServer<Paginated<PublicAuctionDto>>(`/auctions?${sp.toString()}`);
    },
  });

  return (
    <main className="container py-8 md:py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Auctions</h1>
        <p className="text-muted-foreground mt-2">Browse and bid on live items.</p>
      </div>

      <HydrationBoundary state={dehydrate(queryClient)}>
        <AuctionListClient initialPage={page} initialStatus={status} />
      </HydrationBoundary>
    </main>
  );
}
