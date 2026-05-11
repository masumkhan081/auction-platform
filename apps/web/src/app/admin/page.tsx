import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Console | Auction Platform',
};

export default function AdminOverviewPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Overview</h1>
        <p className="text-muted-foreground mt-1">Platform moderation and management.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Placeholder cards for overview metrics */}
        <div className="border rounded-xl p-6 bg-card">
          <div className="text-sm font-medium text-muted-foreground">Action required</div>
          <div className="text-2xl font-bold mt-2">Review pending products</div>
        </div>
      </div>
    </div>
  );
}
