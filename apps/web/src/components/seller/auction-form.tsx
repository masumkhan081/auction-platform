'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateAuctionRequestSchema, type CreateAuctionRequest } from '@auction/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { useMineProducts } from '@/lib/products/queries';

import type { z } from 'zod';

type AuctionFormValues = z.input<typeof CreateAuctionRequestSchema>;

interface AuctionFormProps {
  initialData?: Partial<AuctionFormValues>;
  onSubmit: (data: CreateAuctionRequest) => void;
  isPending: boolean;
  isEdit?: boolean;
}

export function AuctionForm({ initialData, onSubmit, isPending, isEdit = false }: AuctionFormProps) {
  // Fetch only APPROVED products for the dropdown. 
  // A robust implementation would use a specific 'approved-only' query or filter here.
  // For V1, we fetch user's products and filter client-side.
  const { data: productsData } = useMineProducts(1, 100);
  const approvedProducts = productsData?.items.filter(p => p.approvalStatus === 'APPROVED') || [];

  const form = useForm<AuctionFormValues>({
    resolver: zodResolver(CreateAuctionRequestSchema),
    defaultValues: {
      productId: initialData?.productId ?? '',
      startsAt: initialData?.startsAt ? new Date(initialData.startsAt).toISOString().slice(0, 16) : new Date(Date.now() + 3600000).toISOString().slice(0, 16),
      endsAt: initialData?.endsAt ? new Date(initialData.endsAt).toISOString().slice(0, 16) : new Date(Date.now() + 86400000 * 7).toISOString().slice(0, 16),
      startPriceMinor: initialData?.startPriceMinor ?? 1000,
      minBidIncrementMinor: initialData?.minBidIncrementMinor ?? 500,
      reservePriceMinor: initialData?.reservePriceMinor ?? undefined,
      softCloseSeconds: initialData?.softCloseSeconds ?? 60,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((data) => onSubmit(data as unknown as CreateAuctionRequest))} className="space-y-6">
        <div className="space-y-4 bg-card border rounded-xl p-6">
          <h2 className="text-xl font-semibold">Auction Details</h2>
          
          <FormField
            control={form.control}
            name="productId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Product</FormLabel>
                <FormControl>
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    {...field}
                    disabled={isEdit} // Cannot change product after auction is created
                  >
                    <option value="" disabled>Select an approved product</option>
                    {approvedProducts.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </FormControl>
                <FormDescription>Only APPROVED products can be auctioned.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="startsAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Starts At (UTC)</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} value={field.value instanceof Date ? field.value.toISOString().slice(0, 16) : field.value} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="endsAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ends At (UTC)</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} value={field.value instanceof Date ? field.value.toISOString().slice(0, 16) : field.value} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="startPriceMinor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Price (Cents)</FormLabel>
                  <FormControl>
                    <Input type="number" min="100" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10))} />
                  </FormControl>
                  <FormDescription>e.g. 1000 = $10.00</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="minBidIncrementMinor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bid Increment (Cents)</FormLabel>
                  <FormControl>
                    <Input type="number" min="100" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10))} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="reservePriceMinor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reserve Price (Cents)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="Optional" 
                      value={field.value ?? ''}
                      onChange={e => field.onChange(e.target.value ? parseInt(e.target.value, 10) : undefined)} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="softCloseSeconds"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Soft Close (Seconds)</FormLabel>
                <FormControl>
                  <Input type="number" min="0" max="600" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10))} />
                </FormControl>
                <FormDescription>Time added to clock if bid placed near end.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => window.history.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Saving...' : (isEdit ? 'Save Changes' : 'Schedule Auction')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
