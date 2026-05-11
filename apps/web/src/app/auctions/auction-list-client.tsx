'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { usePublicAuctionList } from '@/lib/auctions/queries';
import { AuctionCard } from '@/components/auction/auction-card';
import { AuctionCardSkeleton } from '@/components/auction/auction-card-skeleton';
import { Button } from '@/components/ui/button';
import type { AuctionStatus } from '@auction/shared';

export function AuctionListClient({
  initialPage,
  initialStatus,
}: {
  initialPage: number;
  initialStatus?: string | undefined;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [page, setPage] = useState(initialPage);
  const [status, setStatus] = useState<AuctionStatus | undefined>(initialStatus as AuctionStatus);

  const { data, isLoading, isError } = usePublicAuctionList({
    page,
    pageSize: 12,
    ...(status ? { status } : {}),
  });

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`?${params.toString()}`, { scroll: true });
  };

  const handleStatusFilter = (newStatus: AuctionStatus | undefined) => {
    setStatus(newStatus);
    setPage(1);
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', '1');
    if (newStatus) {
      params.set('status', newStatus);
    } else {
      params.delete('status');
    }
    router.push(`?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={!status ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleStatusFilter(undefined)}
        >
          All
        </Button>
        <Button
          variant={status === 'LIVE' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleStatusFilter('LIVE')}
        >
          Live
        </Button>
        <Button
          variant={status === 'SCHEDULED' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleStatusFilter('SCHEDULED')}
        >
          Upcoming
        </Button>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <AuctionCardSkeleton key={i} />
          ))}
        </div>
      ) : isError ? (
        <div className="py-12 text-center text-destructive">
          Failed to load auctions. Please try again.
        </div>
      ) : !data || data.items.length === 0 ? (
        <div className="py-24 text-center">
          <h3 className="text-lg font-semibold">No auctions found</h3>
          <p className="text-muted-foreground mt-2">Try adjusting your filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {data.items.map((auction) => (
            <AuctionCard key={auction.id} auction={auction} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-8">
          <Button
            variant="outline"
            disabled={page <= 1 || isLoading}
            onClick={() => handlePageChange(page - 1)}
          >
            Previous
          </Button>
          <span className="text-sm font-medium mx-4">
            Page {page} of {data.totalPages}
          </span>
          <Button
            variant="outline"
            disabled={page >= data.totalPages || isLoading}
            onClick={() => handlePageChange(page + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
