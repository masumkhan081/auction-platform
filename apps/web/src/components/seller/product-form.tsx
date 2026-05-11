'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateProductRequestSchema, type CreateProductRequest } from '@auction/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useCategories } from '@/lib/categories/queries';
import { useSignUpload, uploadToCloudinary } from '@/lib/uploads/mutations';
import { X, UploadCloud, Loader2 } from 'lucide-react';
import Image from 'next/image';

interface ProductFormProps {
  initialData?: Partial<CreateProductRequest>;
  onSubmit: (data: CreateProductRequest) => void;
  isPending: boolean;
}

export function ProductForm({ initialData, onSubmit, isPending }: ProductFormProps) {
  const { data: categoriesData } = useCategories();
  const signUpload = useSignUpload();
  const [uploading, setUploading] = useState(false);

  const form = useForm<CreateProductRequest>({
    resolver: zodResolver(CreateProductRequestSchema),
    defaultValues: {
      name: initialData?.name ?? '',
      description: initialData?.description ?? '',
      categoryId: initialData?.categoryId ?? '',
      images: initialData?.images ?? [],
    },
  });

  const images = form.watch('images');

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (images.length >= 8) {
      alert('Maximum 8 images allowed');
      return;
    }

    try {
      setUploading(true);
      const signature = await signUpload.mutateAsync('product_image');
      const uploadedImage = await uploadToCloudinary(file, signature);
      form.setValue('images', [...images, uploadedImage], { shouldValidate: true });
    } catch (err) {
      console.error(err);
      alert('Failed to upload image');
    } finally {
      setUploading(false);
      // Reset input
      e.target.value = '';
    }
  };

  const removeImage = (index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    form.setValue('images', newImages, { shouldValidate: true });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="space-y-4 bg-card border rounded-xl p-6">
          <h2 className="text-xl font-semibold">Basic Information</h2>
          
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Product Name</FormLabel>
                <FormControl>
                  <Input placeholder="E.g., Vintage Rolex Submariner" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <textarea
                    className="flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Describe the condition, history, and specifications..."
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <FormControl>
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    {...field}
                  >
                    <option value="" disabled>Select a category</option>
                    {categoriesData?.items.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                    {/* Fallback if category API is empty/missing */}
                    {!categoriesData?.items.length && (
                      <option value="00000000-0000-0000-0000-000000000001">Default Category</option>
                    )}
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4 bg-card border rounded-xl p-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Images</h2>
            <span className="text-sm text-muted-foreground">{images.length}/8 uploaded</span>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {images.map((img, index) => (
              <div key={img.publicId} className="relative aspect-square rounded-lg border overflow-hidden group">
                <Image src={img.url} alt="Product image" fill className="object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-2 right-2 bg-destructive text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            
            {images.length < 8 && (
              <Label className="aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors">
                <Input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
                {uploading ? (
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                ) : (
                  <>
                    <UploadCloud className="w-6 h-6 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground">Upload Image</span>
                  </>
                )}
              </Label>
            )}
          </div>
          <FormField
            control={form.control}
            name="images"
            render={() => <FormMessage />}
          />
        </div>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => window.history.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending || uploading}>
            {isPending ? 'Saving...' : 'Save Product'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
