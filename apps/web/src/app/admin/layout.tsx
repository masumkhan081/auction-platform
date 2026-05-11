import type { ReactNode } from 'react';
import Link from 'next/link';
import { requireAuth } from '@/lib/auth/require-auth';
import { ShieldCheck, LayoutDashboard } from 'lucide-react';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireAuth({ roles: ['ADMIN'], callbackPath: '/admin' });

  return (
    <div className="container py-8 md:py-12 flex flex-col md:flex-row gap-8">
      <aside className="w-full md:w-64 shrink-0 space-y-2">
        <div className="font-semibold px-3 py-2 text-lg">Admin Console</div>
        <nav className="flex md:flex-col gap-2 overflow-x-auto pb-2 md:pb-0">
          <Link
            href="/admin"
            className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-muted text-sm font-medium whitespace-nowrap"
          >
            <LayoutDashboard className="w-4 h-4" />
            Overview
          </Link>
          <Link
            href="/admin/products/pending"
            className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-muted text-sm font-medium whitespace-nowrap"
          >
            <ShieldCheck className="w-4 h-4" />
            Pending Products
          </Link>
        </nav>
      </aside>
      <main className="flex-1 min-w-0">
        {children}
      </main>
    </div>
  );
}
