'use client';

import { RegisterRequestSchema } from '@auction/shared';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useRegister } from '@/lib/auth/mutations';
import { useZodForm } from '@/lib/forms/use-zod-form';
import { cn } from '@/lib/utils';

const ROLE_OPTIONS = [
  { value: 'BIDDER', label: 'Bidder', description: 'I want to bid on auctions.' },
  { value: 'SELLER', label: 'Seller', description: 'I want to list and sell.' },
] as const;

export function RegisterForm({ next }: { next: string | null }) {
  const register = useRegister(next ? `/auth/verify-email?next=${encodeURIComponent(next)}` : undefined);
  const form = useZodForm(RegisterRequestSchema, {
    defaultValues: { email: '', password: '', fullName: '', phone: '', role: 'BIDDER' },
  });


  const onSubmit = form.handleSubmit((values) => register.mutate(values));

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>I am a</FormLabel>
              <FormControl>
                <div className="grid grid-cols-2 gap-2">
                  {ROLE_OPTIONS.map((opt) => {
                    const selected = field.value === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => field.onChange(opt.value)}
                        aria-pressed={selected}
                        className={cn(
                          'flex flex-col items-start rounded-md border p-3 text-left text-sm transition-colors',
                          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                          selected
                            ? 'border-primary bg-primary/5'
                            : 'border-input hover:bg-accent',
                        )}
                      >
                        <span className="font-medium">{opt.label}</span>
                        <span className="text-xs text-muted-foreground">{opt.description}</span>
                      </button>
                    );
                  })}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full name</FormLabel>
              <FormControl>
                <Input autoComplete="name" placeholder="Jane Doe" autoFocus {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone (optional)</FormLabel>
              <FormControl>
                <Input
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="+1 555 0123"
                  {...field}
                  value={field.value ?? ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" autoComplete="new-password" {...field} />
              </FormControl>
              <FormDescription>
                At least 8 characters with an uppercase, lowercase, and a digit.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={register.isPending}>
          {register.isPending ? 'Creating account…' : 'Create account'}
        </Button>
      </form>
    </Form>
  );
}
