import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { apiFetchServer } from '@/lib/api/server';
import { qk } from '@/lib/query/keys';
import type { PublicAuctionDto, PublicProductDto } from '@auction/shared';
import { AuctionDetailClient } from './auction-detail-client';
import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  try {
    const auction = await apiFetchServer<PublicAuctionDto>(`/auctions/${id}`);
    const product = await apiFetchServer<PublicProductDto>(`/products/${auction.productId}`);
    return {
      title: `${product.name} | Auction Platform`,
      description: product.description.substring(0, 160),
    };
  } catch {
    return { title: 'Auction not found' };
  }
}

export default async function AuctionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const queryClient = new QueryClient();

  try {
    // Parallel fetch of auction and product to seed the cache
    const auction = await queryClient.fetchQuery({
      queryKey: qk.auctions.publicDetail(id),
      queryFn: () => apiFetchServer<PublicAuctionDto>(`/auctions/${id}`),
    });

    await queryClient.fetchQuery({
      queryKey: qk.products.publicDetail(auction.productId),
      queryFn: () => apiFetchServer<PublicProductDto>(`/products/${auction.productId}`),
    });
  } catch {
    notFound();
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <main className="container py-8 md:py-12">
        <AuctionDetailClient id={id} />
      </main>
    </HydrationBoundary>
  );
}
