'use client';

import { usePublicAuctionDetail } from '@/lib/auctions/queries';
import { usePublicProduct } from '@/lib/products/queries';
import { useAuctionRoom } from '@/lib/realtime/use-auction-room';
import { ImageGallery } from '@/components/auction/image-gallery';
import { BidPanel } from '@/components/auction/bid-panel';
import { BidHistory } from '@/components/auction/bid-history';
import { AuctionStatusBadge } from '@/components/auction/auction-status-badge';
import { Countdown } from '@/components/auction/countdown';
import { formatDateTime } from '@/lib/format';
import { Skeleton } from '@/components/ui/skeleton';

export function AuctionDetailClient({ id }: { id: string }) {
  // Subscribe to live socket events for this auction
  useAuctionRoom(id);

  const { data: auction, isLoading: auctionLoading } = usePublicAuctionDetail(id);
  const { data: product, isLoading: productLoading } = usePublicProduct(auction?.productId);

  if (auctionLoading || !auction) {
    return <AuctionDetailSkeleton />;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      {/* Left column: Images and Product Details */}
      <div className="lg:col-span-2 space-y-8">
        {productLoading ? (
          <Skeleton className="w-full aspect-square rounded-lg" />
        ) : (
          <ImageGallery images={product?.images ?? []} />
        )}

        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <AuctionStatusBadge status={auction.status} />
            <div className="text-muted-foreground text-sm flex items-center gap-2">
              <span>Time left:</span>
              <Countdown endsAt={auction.endsAt} status={auction.status} />
            </div>
          </div>

          <h1 className="text-3xl font-bold tracking-tight">
            {productLoading ? <Skeleton className="h-10 w-2/3" /> : product?.name}
          </h1>

          <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none">
            {productLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ) : (
              <p className="whitespace-pre-line">{product?.description}</p>
            )}
          </div>

          <div className="text-sm text-muted-foreground border-t pt-4 space-y-1">
            <p><span className="font-medium text-foreground">Started:</span> {formatDateTime(auction.startsAt)}</p>
            <p><span className="font-medium text-foreground">Ends:</span> {formatDateTime(auction.endsAt)}</p>
            {auction.closedAt && <p><span className="font-medium text-foreground">Closed:</span> {formatDateTime(auction.closedAt)}</p>}
            
            <div className="pt-2 mt-2 border-t">
              <p><span className="font-medium text-foreground">Seller ID:</span> <span className="font-mono text-xs">{auction.sellerId}</span></p>
              <p><span className="font-medium text-foreground">Category ID:</span> <span className="font-mono text-xs">{product?.categoryId}</span></p>
            </div>
            
            {auction.reservePriceMinor !== null && auction.reservePriceMinor > 0 && (
              <div className="pt-2 mt-2 border-t">
                {auction.currentHighestMinor && auction.currentHighestMinor >= auction.reservePriceMinor ? (
                  <span className="text-green-600 font-medium flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                    Reserve price met
                  </span>
                ) : (
                  <span className="text-muted-foreground italic">Reserve price not met</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right column: Bidding and History */}
      <div className="space-y-6 lg:sticky lg:top-24">
        <BidPanel auction={auction} />

        <div className="bg-card border rounded-xl overflow-hidden">
          <div className="p-4 border-b bg-muted/40 font-semibold">
            Bid History
            <span className="ml-2 text-xs font-normal text-muted-foreground bg-background px-2 py-0.5 rounded-full border">
              {auction.bidCount} {auction.bidCount === 1 ? 'bid' : 'bids'}
            </span>
          </div>
          <div className="p-4">
            <BidHistory auctionId={auction.id} />
          </div>
        </div>
      </div>
    </div>
  );
}

function AuctionDetailSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      <div className="lg:col-span-2 space-y-8">
        <Skeleton className="w-full aspect-square rounded-lg" />
        <div className="space-y-4">
          <div className="flex gap-3">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-32" />
          </div>
          <Skeleton className="h-10 w-2/3" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      </div>
      <div className="space-y-6">
        <Skeleton className="h-[250px] w-full rounded-xl" />
        <Skeleton className="h-[400px] w-full rounded-xl" />
      </div>
    </div>
  );
}
