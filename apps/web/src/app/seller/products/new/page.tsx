'use client';

import { useRouter } from 'next/navigation';
import { useCreateProduct } from '@/lib/products/mutations';
import { ProductForm } from '@/components/seller/product-form';

export default function NewProductPage() {
  const router = useRouter();
  const createProduct = useCreateProduct();

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create Product</h1>
        <p className="text-muted-foreground mt-1">Add a new item to your inventory.</p>
      </div>

      <ProductForm
        isPending={createProduct.isPending}
        onSubmit={(data) => {
          createProduct.mutate(data, {
            onSuccess: () => {
              router.push('/seller/products');
            },
          });
        }}
      />
    </div>
  );
}
