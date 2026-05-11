import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Seller Dashboard | Auction Platform',
};

export default function SellerOverviewPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
        <p className="text-muted-foreground mt-1">Manage your products and auctions.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Placeholder cards for overview metrics */}
        <div className="border rounded-xl p-6 bg-card">
          <div className="text-sm font-medium text-muted-foreground">Welcome back</div>
          <div className="text-2xl font-bold mt-2">Manage your inventory</div>
        </div>
      </div>
    </div>
  );
}
