'use client';

import { useEffect, useState } from 'react';
import { formatTimeRemaining, isEndingSoon } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { AuctionStatus } from '@auction/shared';

interface CountdownProps {
  endsAt: string;
  status: AuctionStatus;
}

export function Countdown({ endsAt, status }: CountdownProps) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    if (status !== 'LIVE' && status !== 'SCHEDULED') return;

    // Update every second
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, [status]);

  if (status === 'SOLD' || status === 'UNSOLD' || status === 'CANCELLED') {
    return <span className="text-muted-foreground font-medium text-sm">Ended</span>;
  }

  const remaining = formatTimeRemaining(endsAt, now);
  const endingSoon = isEndingSoon(endsAt, 10 * 60 * 1000, now); // 10 minutes

  if (!remaining) {
    return <span className="text-muted-foreground font-medium text-sm">Ended</span>;
  }

  return (
    <span
      className={cn(
        'font-medium text-sm tabular-nums',
        endingSoon ? 'text-destructive font-bold' : 'text-foreground'
      )}
    >
      {remaining} left
    </span>
  );
}
