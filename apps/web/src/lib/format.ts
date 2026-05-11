/**
 * Shared formatting utilities. Pure functions — no React, no side effects.
 *
 * Money is stored as minor units (cents). All display functions accept minor
 * units and format to a localized currency string. We default to USD; extend
 * with a currency param if the platform goes multi-currency.
 */

const CURRENCY = 'USD';
const LOCALE = 'en-US';

/** Format minor units (cents) → "$1,234.56" */
export function formatMoney(minor: number): string {
  return new Intl.NumberFormat(LOCALE, {
    style: 'currency',
    currency: CURRENCY,
    minimumFractionDigits: 2,
  }).format(minor / 100);
}

/** Format minor units compactly → "$1.2k", "$3.4M" */
export function formatMoneyCompact(minor: number): string {
  const amount = minor / 100;
  if (amount >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (amount >= 1_000) {
    return `$${(amount / 1_000).toFixed(1)}k`;
  }
  return formatMoney(minor);
}

/** Format an ISO date string to a short human-readable form: "May 12, 2:30 PM" */
export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat(LOCALE, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(iso));
}

/** Format an ISO date string to date only: "May 12, 2025" */
export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat(LOCALE, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(iso));
}

/**
 * Returns a human-readable duration string from `now` until `endsAt`.
 * Returns empty string if already past.
 *
 * Examples: "2d 4h", "3h 15m", "45m 30s", "12s"
 */
export function formatTimeRemaining(endsAt: string | Date, now = new Date()): string {
  const end = typeof endsAt === 'string' ? new Date(endsAt) : endsAt;
  const diffMs = end.getTime() - now.getTime();
  if (diffMs <= 0) return '';

  const totalSeconds = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days >= 1) return `${days}d ${hours}h`;
  if (hours >= 1) return `${hours}h ${minutes}m`;
  if (minutes >= 1) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

/**
 * Returns true if the auction ends within `thresholdMs` milliseconds from now.
 * Used to show "ending soon" warnings.
 */
export function isEndingSoon(
  endsAt: string | Date,
  thresholdMs = 10 * 60 * 1000, // 10 minutes
  now = new Date(),
): boolean {
  const end = typeof endsAt === 'string' ? new Date(endsAt) : endsAt;
  const diffMs = end.getTime() - now.getTime();
  return diffMs > 0 && diffMs <= thresholdMs;
}

/** Parse minor-unit string input from a form field → integer cents. Returns NaN if invalid. */
export function parseMoneyInput(value: string): number {
  const parsed = parseFloat(value.replace(/[^0-9.]/g, ''));
  if (isNaN(parsed)) return NaN;
  return Math.round(parsed * 100);
}
