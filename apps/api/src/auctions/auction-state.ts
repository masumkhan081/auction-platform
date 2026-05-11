import type { AuctionStatus } from '@auction/shared';
import { AppException } from '../common';

/**
 * Auction state machine. Transitions:
 *
 *   SCHEDULED ──worker on starts_at──> LIVE
 *   SCHEDULED ──seller/admin cancel──> CANCELLED
 *   LIVE ──worker on ends_at, has winner──> SOLD
 *   LIVE ──worker on ends_at, no qualifying bid──> UNSOLD
 *   LIVE ──admin cancel──> CANCELLED
 *
 * Edits are only permitted while SCHEDULED. The LIVE/SOLD/UNSOLD transitions
 * are owned by the auction-close worker (P1E); P1D exposes only create + cancel.
 */

export const canSellerEdit = (status: AuctionStatus): boolean => status === 'SCHEDULED';

export const canCancel = (status: AuctionStatus, role: 'SELLER' | 'ADMIN'): boolean => {
  if (status === 'CANCELLED' || status === 'SOLD' || status === 'UNSOLD') return false;
  if (role === 'SELLER') return status === 'SCHEDULED'; // sellers can't cancel an in-flight auction
  return true; // admin can cancel SCHEDULED or LIVE
};

export const transition = {
  cancel(current: AuctionStatus): AuctionStatus {
    if (current === 'CANCELLED' || current === 'SOLD' || current === 'UNSOLD') {
      throw AppException.unprocessable(
        'auction.invalid_transition',
        `Cannot cancel auction in status ${current}`,
      );
    }
    return 'CANCELLED';
  },
} as const;
