import type { ProductImageRef } from '@auction/shared';
import { AppException } from '../common';

/**
 * Asset-ownership rules. The publicId pattern is dictated server-side at
 * signing time — `auction/seller-{userId}/{uuid}` — so any reference whose
 * publicId doesn't start with the requesting user's prefix is forged or
 * stolen and must be rejected.
 *
 * Rules are pure functions; ProductsService composes them.
 */

export const sellerImageFolder = (folderRoot: string, userId: string): string =>
  `${folderRoot}/seller-${userId}`;

export const sellerImagePrefix = (folderRoot: string, userId: string): string =>
  `${sellerImageFolder(folderRoot, userId)}/`;

/** Throws `product.image_ownership_violation` if any image isn't seller-scoped. */
export function assertSellerOwnsImages(args: {
  folderRoot: string;
  sellerId: string;
  images: ProductImageRef[];
}): void {
  const expectedPrefix = sellerImagePrefix(args.folderRoot, args.sellerId);
  for (const image of args.images) {
    if (!image.publicId.startsWith(expectedPrefix)) {
      throw AppException.forbidden(
        'product.image_ownership_violation',
        'One or more images do not belong to this seller',
        { offendingPublicId: image.publicId },
      );
    }
  }
}
