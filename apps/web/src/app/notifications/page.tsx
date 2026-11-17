'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useNotifications } from '@/lib/notifications/queries';
import { useMarkNotificationRead } from '@/lib/notifications/mutations';
import { useSession } from '@/lib/auth/use-session';
import { formatDateTime } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Bell, Check, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function NotificationsPage() {
  const [page, setPage] = useState(1);
  const [unreadOnly, setUnreadOnly] = useState<boolean | undefined>(undefined);
  const session = useSession();
  const { data, isLoading, isError } = useNotifications(page, 15, unreadOnly);
  const markRead = useMarkNotificationRead();

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
          <Bell className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Sign in to view notifications</h1>
        <p className="text-sm text-muted-foreground">Get alerted when you are outbid or an auction concludes.</p>
        <Button asChild className="w-full">
          <Link href="/auth/login?next=/notifications">Sign in</Link>
        </Button>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground mt-1">Updates on your bids, auctions, and account activity.</p>
        </div>

        <div className="flex gap-2">
          <Button
            variant={unreadOnly === undefined ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setUnreadOnly(undefined);
              setPage(1);
            }}
          >
            All
          </Button>
          <Button
            variant={unreadOnly === true ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setUnreadOnly(true);
              setPage(1);
            }}
          >
            Unread
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-6 text-center text-sm text-destructive">
          Failed to load notifications. Please try again.
        </div>
      ) : !data || data.items.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center space-y-4">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
            <Bell className="h-6 w-6" />
          </div>
          <div>
            <h2 className="font-semibold text-lg">No notifications</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {unreadOnly ? 'You have no unread notifications.' : 'You will be notified about outbids and auction results here.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-xl border bg-card overflow-hidden divide-y">
            {data.items.map((item) => {
              const isUnread = item.readAt === null;
              const payload = item.payload as Record<string, unknown>;
              const message = typeof payload.message === 'string' ? payload.message : formatType(item.type);
              const auctionId = typeof payload.auctionId === 'string' ? payload.auctionId : null;

              return (
                <div
                  key={item.id}
                  className={cn(
                    'p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors',
                    isUnread ? 'bg-primary/5' : 'hover:bg-muted/40'
                  )}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {isUnread && <span className="h-2 w-2 rounded-full bg-primary shrink-0" />}
                      <span className={cn('text-sm font-medium', isUnread && 'font-semibold text-foreground')}>
                        {message}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground pl-4">
                      {formatDateTime(item.createdAt)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 pl-4 sm:pl-0">
                    {auctionId && (
                      <Button variant="outline" size="sm" asChild className="gap-1.5 text-xs">
                        <Link href={`/auctions/${auctionId}`}>
                          View Auction
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      </Button>
                    )}
                    {isUnread && (
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={markRead.isPending}
                        onClick={() => markRead.mutate(item.id)}
                        className="gap-1 text-xs"
                      >
                        <Check className="h-3.5 w-3.5" />
                        Mark read
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
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

function formatType(type: string): string {
  switch (type) {
    case 'OUTBID':
      return 'You have been outbid on an auction';
    case 'AUCTION_WON':
      return 'Congratulations! You won the auction';
    case 'AUCTION_SOLD':
      return 'Your item has been successfully sold';
    case 'AUCTION_ENDED_NO_BIDS':
      return 'Auction ended with no bids placed';
    case 'AUCTION_STARTED':
      return 'An auction on your watchlist has started';
    default:
      return type.replace(/_/g, ' ').toLowerCase();
  }
}
