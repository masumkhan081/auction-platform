'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePublicProduct } from '@/lib/products/queries';
import { formatMoney } from '@/lib/format';
import type { PublicAuctionDto } from '@auction/shared';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AuctionStatusBadge } from './auction-status-badge';
import { Countdown } from './countdown';

export function AuctionCard({ auction }: { auction: PublicAuctionDto }) {
  const { data: product, isLoading: productLoading } = usePublicProduct(auction.productId);

  const currentPrice = auction.currentHighestMinor ?? auction.startPriceMinor;
  const image = product?.images[0];

  return (
    <Link href={`/auctions/${auction.id}`} className="group block h-full">
      <Card className="h-full overflow-hidden transition-all hover:shadow-md flex flex-col">
        <div className="relative aspect-square w-full bg-muted overflow-hidden">
          {productLoading ? (
            <Skeleton className="h-full w-full" />
          ) : image ? (
            <Image
              src={image.url}
              alt={product?.name ?? 'Product image'}
              fill
              className="object-cover transition-transform group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
              No image
            </div>
          )}
          <div className="absolute top-3 right-3 z-10 shadow-sm">
            <AuctionStatusBadge status={auction.status} />
          </div>
        </div>

        <CardContent className="flex flex-1 flex-col justify-between p-4 gap-4">
          <div>
            <h3 className="font-semibold text-lg line-clamp-2 mb-1 group-hover:text-primary transition-colors">
              {productLoading ? <Skeleton className="h-6 w-3/4" /> : product?.name ?? 'Unknown Product'}
            </h3>
            <div className="text-sm text-muted-foreground flex items-center justify-between mt-2">
              <span>{auction.bidCount} {auction.bidCount === 1 ? 'bid' : 'bids'}</span>
              <Countdown endsAt={auction.endsAt} status={auction.status} />
            </div>
          </div>

          <div className="flex items-end justify-between pt-2 border-t">
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">
                {auction.currentHighestMinor ? 'Current bid' : 'Starting price'}
              </span>
              <span className="font-bold text-xl">{formatMoney(currentPrice)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
