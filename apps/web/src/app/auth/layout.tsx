/**
 * Minimal centered layout for `/auth/*`. The global `SiteHeader` is still
 * rendered by the root layout (providing navigation context), so this layout
 * only needs to center the form content with appropriate breathing room.
 *
 * No separate logo header here — the SiteHeader's branding already serves
 * that purpose. Keeping this minimal avoids a doubled-header appearance.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-10 sm:py-16">
      <div className="w-full max-w-md">{children}</div>
    </main>
  );
}
