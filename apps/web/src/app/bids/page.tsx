'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMyBids } from '@/lib/bids/queries';
import { useSession } from '@/lib/auth/use-session';
import { formatMoney, formatDateTime } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Gavel, ExternalLink } from 'lucide-react';

export default function MyBidsPage() {
  const [page, setPage] = useState(1);
  const session = useSession();
  const { data, isLoading, isError } = useMyBids(page, 15);

  if (session.isLoading) {
    return (
      <main className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </main>
    );
  }

  if (!session.data) {
    return (
      <main className="container mx-auto px-4 py-16 max-w-md text-center space-y-4">
        <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
          <Gavel className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Sign in to view your bids</h1>
        <p className="text-sm text-muted-foreground">Track all active bids and auction outcomes in one place.</p>
        <Button asChild className="w-full">
          <Link href="/auth/login?next=/bids">Sign in</Link>
        </Button>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Bids</h1>
        <p className="text-muted-foreground mt-1">History of all bids you have placed across auctions.</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-6 text-center text-sm text-destructive">
          Failed to load your bids. Please try again.
        </div>
      ) : !data || data.items.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center space-y-4">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
            <Gavel className="h-6 w-6" />
          </div>
          <div>
            <h2 className="font-semibold text-lg">No bids placed yet</h2>
            <p className="text-sm text-muted-foreground mt-1">Discover live auctions and place your first bid.</p>
          </div>
          <Button asChild>
            <Link href="/auctions">Browse live auctions</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-xl border bg-card overflow-hidden divide-y">
            {data.items.map((bid) => (
              <div
                key={bid.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/40 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg text-primary">{formatMoney(bid.amountMinor)}</span>
                    <span className="text-xs text-muted-foreground">Bid placed</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Placed on {formatDateTime(bid.placedAt)}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" asChild className="gap-1.5">
                    <Link href={`/auctions/${bid.auctionId}`}>
                      View Auction
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {data.totalPages > 1 && (
            <div className="flex justify-center items-center gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {data.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= data.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
