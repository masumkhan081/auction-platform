'use client';

import { useRouter } from 'next/navigation';
import { useMineProductDetail } from '@/lib/products/queries';
import { useUpdateProduct, useSubmitProduct } from '@/lib/products/mutations';
import { ProductForm } from '@/components/seller/product-form';
import { Button } from '@/components/ui/button';

export function EditProductClient({ id }: { id: string }) {
  const router = useRouter();
  const { data: product } = useMineProductDetail(id);
  const updateProduct = useUpdateProduct(id);
  const submitProduct = useSubmitProduct(id);

  if (!product) return null;

  const isDraft = product.lifecycleStatus === 'DRAFT';
  const isRejected = product.approvalStatus === 'REJECTED';

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Product</h1>
          <p className="text-muted-foreground mt-1">Update your item's details.</p>
        </div>
        
        {(isDraft || isRejected) && (
          <Button 
            variant="secondary"
            onClick={() => {
              if (window.confirm('Submit this product for admin review?')) {
                submitProduct.mutate(undefined, {
                  onSuccess: () => router.push('/seller/products'),
                });
              }
            }}
            disabled={submitProduct.isPending || updateProduct.isPending}
          >
            {submitProduct.isPending ? 'Submitting...' : 'Submit for Review'}
          </Button>
        )}
      </div>

      {isRejected && product.reviewNote && (
        <div className="bg-destructive/10 text-destructive border border-destructive/20 p-4 rounded-xl">
          <p className="font-semibold text-sm mb-1">Product Rejected</p>
          <p className="text-sm">{product.reviewNote}</p>
        </div>
      )}

      <ProductForm
        initialData={{
          name: product.name,
          description: product.description,
          categoryId: product.categoryId,
          images: product.images,
        }}
        isPending={updateProduct.isPending}
        onSubmit={(data) => {
          updateProduct.mutate(data, {
            onSuccess: () => {
              router.push('/seller/products');
            },
          });
        }}
      />
    </div>
  );
}
