'use client';

import { Toaster as SonnerToaster } from 'sonner';

/**
 * Single Toaster mounted once in `Providers`. All toasts route through
 * `lib/errors/handle-error.ts` so error UX is consistent across screens.
 */
export const Toaster = () => (
  <SonnerToaster
    position="top-right"
    closeButton
    richColors
    toastOptions={{
      classNames: {
        toast: 'group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border',
      },
    }}
  />
);
