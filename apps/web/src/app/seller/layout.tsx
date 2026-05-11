import type { ReactNode } from 'react';
import Link from 'next/link';
import { requireAuth } from '@/lib/auth/require-auth';
import { Package, Gavel, LayoutDashboard } from 'lucide-react';

export default async function SellerLayout({ children }: { children: ReactNode }) {
  await requireAuth({ roles: ['SELLER'], callbackPath: '/seller' });

  return (
    <div className="container py-8 md:py-12 flex flex-col md:flex-row gap-8">
      <aside className="w-full md:w-64 shrink-0 space-y-2">
        <div className="font-semibold px-3 py-2 text-lg">Seller Dashboard</div>
        <nav className="flex md:flex-col gap-2 overflow-x-auto pb-2 md:pb-0">
          <Link
            href="/seller"
            className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-muted text-sm font-medium whitespace-nowrap"
          >
            <LayoutDashboard className="w-4 h-4" />
            Overview
          </Link>
          <Link
            href="/seller/products"
            className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-muted text-sm font-medium whitespace-nowrap"
          >
            <Package className="w-4 h-4" />
            Products
          </Link>
          <Link
            href="/seller/auctions"
            className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-muted text-sm font-medium whitespace-nowrap"
          >
            <Gavel className="w-4 h-4" />
            Auctions
          </Link>
        </nav>
      </aside>
      <main className="flex-1 min-w-0">
        {children}
      </main>
    </div>
  );
}
