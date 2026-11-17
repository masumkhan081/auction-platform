'use client';

import Link from 'next/link';
import { LoginRequestSchema } from '@auction/shared';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useLogin } from '@/lib/auth/mutations';
import { useZodForm } from '@/lib/forms/use-zod-form';

export function LoginForm({ next }: { next: string | null }) {
  const login = useLogin(next);
  const form = useZodForm(LoginRequestSchema, {
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = form.handleSubmit((values) => login.mutate(values));

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} noValidate className="space-y-4">
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
                  autoFocus
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
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {login.isError && (
          <div className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm font-medium text-destructive space-y-1">
            <p>{login.error instanceof Error ? login.error.message : 'Sign in failed'}</p>
            {((login.error as { code?: string })?.code === 'auth.email_not_verified' ||
              (login.error instanceof Error && login.error.message.toLowerCase().includes('verify your email'))) && (
              <p className="pt-1">
                <Link
                  href={`/auth/verify-email?email=${encodeURIComponent(form.getValues('email'))}`}
                  className="font-semibold underline hover:opacity-80"
                >
                  Verify your email now &rarr;
                </Link>
              </p>
            )}
          </div>
        )}

        <Button type="submit" className="w-full" disabled={login.isPending}>
          {login.isPending ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
    </Form>
  );
}
