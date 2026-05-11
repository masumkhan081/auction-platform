/**
 * Cross-cutting helper types. Feature-specific types live alongside their schemas.
 */

/** Make selected properties of `T` required (non-optional, non-undefined). */
export type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };

/** Discriminated branding to prevent ID type confusion at compile time. */
declare const __brand: unique symbol;
export type Brand<TBase, TName extends string> = TBase & { readonly [__brand]: TName };

export type UserId = Brand<string, 'UserId'>;
export type AuctionId = Brand<string, 'AuctionId'>;
export type BidId = Brand<string, 'BidId'>;
export type ProductId = Brand<string, 'ProductId'>;
export type CategoryId = Brand<string, 'CategoryId'>;
