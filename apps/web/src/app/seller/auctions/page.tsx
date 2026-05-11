'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMineAuctions } from '@/lib/auctions/queries';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AuctionStatusBadge } from '@/components/auction/auction-status-badge';
import { formatDateTime, formatMoney } from '@/lib/format';

export default function SellerAuctionsClient() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useMineAuctions(page, 10);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Auctions</h1>
          <p className="text-muted-foreground mt-1">Manage your active and upcoming auctions.</p>
        </div>
        <Button asChild>
          <Link href="/seller/auctions/new">Schedule Auction</Link>
        </Button>
      </div>

      <div className="bg-card border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Dates</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Price/Current</th>
                <th className="px-4 py-3 font-medium text-muted-foreground text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3"><Skeleton className="h-5 w-20 rounded-full" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-5 w-32" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-5 w-24" /></td>
                    <td className="px-4 py-3 text-right"><Skeleton className="h-8 w-16 inline-block" /></td>
                  </tr>
                ))
              ) : isError ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-destructive">Failed to load auctions.</td>
                </tr>
              ) : !data || data.items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-muted-foreground">
                    You have no scheduled auctions yet.
                  </td>
                </tr>
              ) : (
                data.items.map((auction) => (
                  <tr key={auction.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3"><AuctionStatusBadge status={auction.status} /></td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      <div><span className="font-medium text-foreground">Starts:</span> {formatDateTime(auction.startsAt)}</div>
                      <div><span className="font-medium text-foreground">Ends:</span> {formatDateTime(auction.endsAt)}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div>Start: {formatMoney(auction.startPriceMinor)}</div>
                      {auction.currentHighestMinor && <div className="font-medium text-green-600">Current: {formatMoney(auction.currentHighestMinor)}</div>}
                    </td>
                    <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/auctions/${auction.id}`}>View</Link>
                      </Button>
                      {(auction.status === 'SCHEDULED' || auction.status === 'LIVE') && (
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/seller/auctions/${auction.id}/edit`}>Edit</Link>
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {data && data.totalPages > 1 && (
        <div className="flex justify-center gap-2 pt-4">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</Button>
          <span className="flex items-center text-sm">Page {page} of {data.totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= data.totalPages} onClick={() => setPage(page + 1)}>Next</Button>
        </div>
      )}
    </div>
  );
}
