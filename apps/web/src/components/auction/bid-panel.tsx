'use client';

import { useState } from 'react';
import { usePlaceBid } from '@/lib/bids/mutations';
import { useSession } from '@/lib/auth/use-session';
import { formatMoney, parseMoneyInput } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { PublicAuctionDto } from '@auction/shared';
import Link from 'next/link';

export function BidPanel({ auction }: { auction: PublicAuctionDto }) {
  const session = useSession();
  const placeBid = usePlaceBid();
  const [bidAmount, setBidAmount] = useState('');

  const currentPrice = auction.currentHighestMinor ?? auction.startPriceMinor;
  const minNextBid = auction.currentHighestMinor
    ? currentPrice + auction.minBidIncrementMinor
    : currentPrice;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!session.data) return;
    
    const amountMinor = parseMoneyInput(bidAmount);
    if (isNaN(amountMinor)) return;

    placeBid.mutate(
      { auctionId: auction.id, amountMinor },
      {
        onSuccess: () => {
          setBidAmount(''); // Clear on success
        },
      }
    );
  };

  // Determine user states
  const isAuthenticated = !!session.data;
  const isSeller = session.data?.user.id === auction.sellerId;
  const isActive = auction.status === 'LIVE';
  const isScheduled = auction.status === 'SCHEDULED';
  
  // Validation
  const parsedAmount = parseMoneyInput(bidAmount);
  const isValidAmount = !isNaN(parsedAmount) && parsedAmount >= minNextBid;

  if (isSeller) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-sm text-muted-foreground">
            You cannot bid on your own auction.
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isScheduled) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-sm text-muted-foreground">
            Bidding will open when the auction starts.
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isActive) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <h3 className="font-semibold text-lg mb-1">Auction Ended</h3>
          <p className="text-muted-foreground text-sm">
            {auction.status === 'SOLD' ? 'This item has been sold.' : 'This item did not sell.'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Place a bid</CardTitle>
      </CardHeader>
      <CardContent>
        {!isAuthenticated ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              You must be logged in to place a bid.
            </p>
            <Button asChild className="w-full">
              <Link href={`/auth/login?next=/auctions/${auction.id}`}>
                Log in to bid
              </Link>
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Minimum next bid</span>
                <span className="font-medium">{formatMoney(minNextBid)}</span>
              </div>
              
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <Input
                  type="text"
                  inputMode="decimal"
                  placeholder={(minNextBid / 100).toFixed(2)}
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  className="pl-7"
                  disabled={placeBid.isPending}
                />
              </div>
              
              {bidAmount && !isValidAmount && (
                <p className="text-xs text-destructive">
                  Bid must be at least {formatMoney(minNextBid)}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={!bidAmount || !isValidAmount || placeBid.isPending}
            >
              {placeBid.isPending ? 'Placing bid...' : 'Place bid'}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
