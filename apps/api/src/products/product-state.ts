import type { ProductApprovalStatus, ProductLifecycleStatus } from '@auction/shared';
import { AppException } from '../common';

/**
 * Centralized product state machine. Two orthogonal axes:
 *
 *   approvalStatus:  PENDING ──admin approve──> APPROVED
 *                    PENDING ──admin reject──> REJECTED
 *                    REJECTED ──seller resubmit──> PENDING
 *
 *   lifecycleStatus: DRAFT ──seller submit──> LISTED
 *                    LISTED ──auction created──> IN_AUCTION
 *                    IN_AUCTION ──auction won──> SOLD
 *                    IN_AUCTION ──auction unsold/cancelled──> LISTED
 *                    LISTED|DRAFT|SOLD ──seller archive──> ARCHIVED
 *
 * Public visibility = APPROVED ∧ (LISTED ∨ IN_AUCTION).
 *
 * Edits to product fields are only permitted while DRAFT. Submitting a
 * REJECTED product re-runs review.
 */

export const isPubliclyVisible = (
  approval: ProductApprovalStatus,
  lifecycle: ProductLifecycleStatus,
): boolean =>
  approval === 'APPROVED' && (lifecycle === 'LISTED' || lifecycle === 'IN_AUCTION');

export const canSellerEdit = (lifecycle: ProductLifecycleStatus): boolean =>
  lifecycle === 'DRAFT';

export const canSellerArchive = (lifecycle: ProductLifecycleStatus): boolean =>
  lifecycle !== 'IN_AUCTION';

type Transition = {
  approval?: ProductApprovalStatus;
  lifecycle?: ProductLifecycleStatus;
};

/**
 * Returns the *new* (approval, lifecycle) pair for a transition or throws if
 * the transition isn't legal for the current state. Centralizing this keeps
 * the rules out of services and unit-testable.
 */
export const transition = {
  /** Seller submits (or re-submits after rejection) — DRAFT → LISTED + PENDING. */
  submitForReview(current: { approval: ProductApprovalStatus; lifecycle: ProductLifecycleStatus }): Transition {
    if (current.lifecycle !== 'DRAFT') {
      throw AppException.unprocessable(
        'product.invalid_transition',
        `Cannot submit a product in lifecycle ${current.lifecycle}`,
      );
    }
    if (current.approval !== 'PENDING' && current.approval !== 'REJECTED') {
      throw AppException.unprocessable(
        'product.invalid_transition',
        `Cannot submit a product with approval ${current.approval}`,
      );
    }
    return { approval: 'PENDING', lifecycle: 'LISTED' };
  },

  /** Admin approve — must currently be PENDING. */
  approve(current: { approval: ProductApprovalStatus }): Transition {
    if (current.approval !== 'PENDING') {
      throw AppException.unprocessable(
        'product.invalid_transition',
        `Only PENDING products can be approved (got ${current.approval})`,
      );
    }
    return { approval: 'APPROVED' };
  },

  /** Admin reject — must currently be PENDING. Lifecycle returns to DRAFT for fixes. */
  reject(current: { approval: ProductApprovalStatus }): Transition {
    if (current.approval !== 'PENDING') {
      throw AppException.unprocessable(
        'product.invalid_transition',
        `Only PENDING products can be rejected (got ${current.approval})`,
      );
    }
    return { approval: 'REJECTED', lifecycle: 'DRAFT' };
  },

  /** Auction creation — APPROVED + LISTED → IN_AUCTION. */
  enterAuction(current: { approval: ProductApprovalStatus; lifecycle: ProductLifecycleStatus }): Transition {
    if (current.approval !== 'APPROVED' || current.lifecycle !== 'LISTED') {
      throw AppException.unprocessable(
        'product.not_auctionable',
        'Product must be APPROVED and LISTED to start an auction',
      );
    }
    return { lifecycle: 'IN_AUCTION' };
  },

  /** Auction sold — IN_AUCTION → SOLD. */
  markSold(current: { lifecycle: ProductLifecycleStatus }): Transition {
    if (current.lifecycle !== 'IN_AUCTION') {
      throw AppException.unprocessable(
        'product.invalid_transition',
        `Cannot mark sold from lifecycle ${current.lifecycle}`,
      );
    }
    return { lifecycle: 'SOLD' };
  },

  /** Auction cancelled or unsold — IN_AUCTION → LISTED. */
  returnToListing(current: { lifecycle: ProductLifecycleStatus }): Transition {
    if (current.lifecycle !== 'IN_AUCTION') {
      throw AppException.unprocessable(
        'product.invalid_transition',
        `Cannot return to listing from lifecycle ${current.lifecycle}`,
      );
    }
    return { lifecycle: 'LISTED' };
  },
} as const;
