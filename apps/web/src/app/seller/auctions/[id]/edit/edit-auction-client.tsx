'use client';

import { useRouter } from 'next/navigation';
import { useMineAuctionDetail } from '@/lib/auctions/queries';
import { useUpdateAuction, useSellerCancelAuction } from '@/lib/auctions/mutations';
import { AuctionForm } from '@/components/seller/auction-form';
import { Button } from '@/components/ui/button';

export function EditAuctionClient({ id }: { id: string }) {
  const router = useRouter();
  const { data: auction } = useMineAuctionDetail(id);
  const updateAuction = useUpdateAuction(id);
  const cancelAuction = useSellerCancelAuction(id);

  if (!auction) return null;

  const isLiveOrScheduled = auction.status === 'LIVE' || auction.status === 'SCHEDULED';

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Auction</h1>
          <p className="text-muted-foreground mt-1">Update auction schedule and pricing.</p>
        </div>
        
        {isLiveOrScheduled && (
          <Button 
            variant="destructive"
            onClick={() => {
              const reason = window.prompt('Enter cancellation reason:');
              if (reason) {
                cancelAuction.mutate({ reason }, {
                  onSuccess: () => router.push('/seller/auctions'),
                });
              }
            }}
            disabled={cancelAuction.isPending || updateAuction.isPending}
          >
            {cancelAuction.isPending ? 'Cancelling...' : 'Cancel Auction'}
          </Button>
        )}
      </div>

      <AuctionForm
        isEdit
        initialData={{
          productId: auction.productId,
          startsAt: auction.startsAt.slice(0, 16),
          endsAt: auction.endsAt.slice(0, 16),
          startPriceMinor: auction.startPriceMinor,
          minBidIncrementMinor: auction.minBidIncrementMinor,
          reservePriceMinor: auction.reservePriceMinor ?? undefined,
          softCloseSeconds: auction.softCloseSeconds,
        }}
        isPending={updateAuction.isPending}
        onSubmit={(data) => {
          updateAuction.mutate(data, {
            onSuccess: () => {
              router.push('/seller/auctions');
            },
          });
        }}
      />
    </div>
  );
}
