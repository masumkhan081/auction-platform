/**
 * Queue + job-name constants. Centralized so worker, scheduler, and tests
 * agree on names.
 */

export const QUEUES = {
  auctionLifecycle: 'auction-lifecycle',
} as const;

export const JOBS = {
  auctionStart: 'auction.start',
  auctionClose: 'auction.close',
  auctionSweep: 'auction.sweep',
} as const;

/** Stuck-LIVE sweep cadence and grace period. */
export const SWEEP_INTERVAL_MS = 60_000;
export const SWEEP_GRACE_MS = 30_000;

export type AuctionLifecycleJobData = {
  auctionId: string;
};
