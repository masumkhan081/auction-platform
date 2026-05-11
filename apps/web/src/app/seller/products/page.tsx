'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMineProducts } from '@/lib/products/queries';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import type { SellerProductDto } from '@auction/shared';
import { formatDateTime } from '@/lib/format';

function StatusBadge({ product }: { product: SellerProductDto }) {
  if (product.lifecycleStatus === 'DRAFT') {
    return <Badge variant="secondary">Draft</Badge>;
  }
  switch (product.approvalStatus) {
    case 'PENDING': return <Badge variant="outline" className="border-yellow-600 text-yellow-600">Pending</Badge>;
    case 'APPROVED': return <Badge variant="default" className="bg-green-600">Approved</Badge>;
    case 'REJECTED': return <Badge variant="destructive">Rejected</Badge>;
    default: return <Badge variant="outline">{product.approvalStatus}</Badge>;
  }
}

export default function SellerProductsClient() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useMineProducts(page, 10);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground mt-1">Manage items you want to auction.</p>
        </div>
        <Button asChild>
          <Link href="/seller/products/new">New Product</Link>
        </Button>
      </div>

      <div className="bg-card border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="px-4 py-3 font-medium text-muted-foreground">Name</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Created</th>
                <th className="px-4 py-3 font-medium text-muted-foreground text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3"><Skeleton className="h-5 w-48" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-5 w-20 rounded-full" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-5 w-24" /></td>
                    <td className="px-4 py-3 text-right"><Skeleton className="h-8 w-16 inline-block" /></td>
                  </tr>
                ))
              ) : isError ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-destructive">Failed to load products.</td>
                </tr>
              ) : !data || data.items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-muted-foreground">
                    You have no products yet. Create one to get started.
                  </td>
                </tr>
              ) : (
                data.items.map((product) => (
                  <tr key={product.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium">{product.name}</td>
                    <td className="px-4 py-3"><StatusBadge product={product} /></td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDateTime(product.createdAt)}</td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/seller/products/${product.id}/edit`}>Edit</Link>
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {data && data.totalPages > 1 && (
        <div className="flex justify-center gap-2 pt-4">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</Button>
          <span className="flex items-center text-sm">Page {page} of {data.totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= data.totalPages} onClick={() => setPage(page + 1)}>Next</Button>
        </div>
      )}
    </div>
  );
}
