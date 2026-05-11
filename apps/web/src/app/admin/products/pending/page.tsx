'use client';

import { useState } from 'react';
import { useAdminPendingProducts, useAdminProductDetail } from '@/lib/products/queries';
import { useApproveProduct, useRejectProduct } from '@/lib/products/mutations';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDateTime } from '@/lib/format';

export default function AdminPendingProductsClient() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useAdminPendingProducts(page, 10);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Pending Products</h1>
        <p className="text-muted-foreground mt-1">Review products waiting for approval.</p>
      </div>

      <div className="grid gap-6">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)
        ) : isError ? (
          <div className="text-destructive py-8 text-center border rounded-xl">Failed to load pending products.</div>
        ) : !data || data.items.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground border rounded-xl bg-card">
            No pending products to review.
          </div>
        ) : (
          data.items.map((product) => (
            <ProductReviewCard key={product.id} id={product.id} />
          ))
        )}
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

function ProductReviewCard({ id }: { id: string }) {
  const { data: product, isLoading } = useAdminProductDetail(id);
  const approve = useApproveProduct(id);
  const reject = useRejectProduct(id);

  if (isLoading) return <Skeleton className="h-32 w-full rounded-xl" />;
  if (!product) return null;

  const handleApprove = () => approve.mutate();
  const handleReject = () => {
    const reason = window.prompt('Enter rejection reason (optional):');
    if (reason !== null && reason.length >= 5) {
      reject.mutate({ reviewNote: reason });
    } else if (reason !== null) {
      reject.mutate({ reviewNote: 'Rejected by admin' });
    }
  };

  return (
    <div className="bg-card border rounded-xl p-4 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
      <div className="space-y-1">
        <h3 className="font-semibold text-lg">{product.name}</h3>
        <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>
        <div className="text-xs text-muted-foreground flex gap-3 pt-2">
          <span>Seller ID: {product.sellerId}</span>
          <span>Created: {formatDateTime(product.createdAt)}</span>
          <span>Images: {product.images.length}</span>
        </div>
      </div>
      <div className="flex flex-row md:flex-col gap-2 shrink-0 w-full md:w-auto mt-4 md:mt-0">
        <Button 
          variant="default" 
          className="w-full bg-green-600 hover:bg-green-700"
          onClick={handleApprove}
          disabled={approve.isPending || reject.isPending}
        >
          {approve.isPending ? 'Approving...' : 'Approve'}
        </Button>
        <Button 
          variant="destructive" 
          className="w-full"
          onClick={handleReject}
          disabled={approve.isPending || reject.isPending}
        >
          {reject.isPending ? 'Rejecting...' : 'Reject'}
        </Button>
      </div>
    </div>
  );
}
