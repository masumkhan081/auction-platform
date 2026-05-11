import type { Metadata } from 'next';
import { Providers } from '@/components/providers/providers';
import { SiteHeader } from '@/components/nav/site-header';
import { getServerSession } from '@/lib/auth/session.server';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'Auction', template: '%s · Auction' },
  description: 'Real-time auction platform.',
  icons: { icon: '/favicon.ico' },
};

export const viewport = {
  themeColor: '#0f172a',
  width: 'device-width',
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const initialSession = await getServerSession();
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="flex min-h-dvh flex-col font-sans">
        <Providers initialSession={initialSession}>
          {/*
           * SiteHeader is an async RSC. It calls getServerSession() which is
           * wrapped in react/cache — the result is shared with the call above,
           * so there is exactly ONE network request for auth per render.
           */}
          <SiteHeader />
          <div className="flex flex-1 flex-col">{children}</div>
        </Providers>
      </body>
    </html>
  );
}
