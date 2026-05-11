import type { Role } from '@auction/shared';

/**
 * Single source of truth for navigation links. Each entry carries optional
 * role constraints (evaluated client-side for UI; server `requireAuth` is the
 * authoritative gate). `href` must be an app-router path.
 *
 * `placeholder` = true signals that the route is not yet implemented (renders
 * the link visually but adds a "(soon)" label and disables click on mobile).
 */

export interface NavLink {
  label: string;
  href: string;
  /** Roles that may see this link; undefined/empty → any authenticated user. */
  roles?: ReadonlyArray<Role>;
  /** Route exists but page content is a stub. */
  placeholder?: boolean;
}

/** Shown to every visitor regardless of auth state. */
export const PUBLIC_NAV: readonly NavLink[] = [
  { label: 'Auctions', href: '/auctions' },
];

/** Shown only when authenticated (any role). */
export const AUTH_NAV: readonly NavLink[] = [
  { label: 'My bids', href: '/bids', placeholder: true },
  { label: 'Notifications', href: '/notifications', placeholder: true },
];

/** Seller-only links. */
export const SELLER_NAV: readonly NavLink[] = [
  { label: 'Products', href: '/seller/products', roles: ['SELLER'] },
  { label: 'Auctions', href: '/seller/auctions', roles: ['SELLER'] },
];

/** Admin-only links. */
export const ADMIN_NAV: readonly NavLink[] = [
  { label: 'Pending Products', href: '/admin/products/pending', roles: ['ADMIN'] },
];

/** User dropdown items (authenticated). */
export const USER_MENU_ITEMS: readonly NavLink[] = [
  { label: 'Profile', href: '/profile', placeholder: true },
  { label: 'Settings', href: '/settings', placeholder: true },
];
