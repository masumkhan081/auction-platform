'use client';

import { useRouter } from 'next/navigation';
import { useCreateAuction } from '@/lib/auctions/mutations';
import { AuctionForm } from '@/components/seller/auction-form';

export default function NewAuctionPage() {
  const router = useRouter();
  const createAuction = useCreateAuction();

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Schedule Auction</h1>
        <p className="text-muted-foreground mt-1">Set up a new auction for an approved product.</p>
      </div>

      <AuctionForm
        isPending={createAuction.isPending}
        onSubmit={(data) => {
          createAuction.mutate(data, {
            onSuccess: () => {
              router.push('/seller/auctions');
            },
          });
        }}
      />
    </div>
  );
}
