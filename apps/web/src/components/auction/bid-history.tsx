'use client';

import { formatMoney, formatDateTime } from '@/lib/format';
import { useAuctionBids } from '@/lib/bids/queries';
import { Skeleton } from '@/components/ui/skeleton';

export function BidHistory({ auctionId }: { auctionId: string }) {
  const { data, isLoading, isError } = useAuctionBids(auctionId, 1, 10); // Show top 10

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (isError || !data) {
    return <div className="text-sm text-destructive">Failed to load bids.</div>;
  }

  if (data.items.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground border rounded-lg bg-muted/20">
        No bids yet. Be the first!
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {data.items.map((bid, i) => (
        <div
          key={bid.id}
          className={`flex items-center justify-between p-3 rounded-lg border ${
            i === 0 ? 'bg-primary/5 border-primary/20' : 'bg-card'
          }`}
        >
          <div className="flex flex-col">
            <span className={`font-medium ${i === 0 ? 'text-primary' : ''}`}>
              {formatMoney(bid.amountMinor)}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatDateTime(bid.placedAt)}
            </span>
          </div>
          {i === 0 && (
            <span className="text-xs font-semibold uppercase text-primary bg-primary/10 px-2 py-1 rounded">
              Highest
            </span>
          )}
        </div>
      ))}
      {data.total > 10 && (
        <div className="text-center pt-2 text-xs text-muted-foreground">
          Showing 10 most recent bids of {data.total} total
        </div>
      )}
    </div>
  );
}
