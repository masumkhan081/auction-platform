'use client';

import { ForgotPasswordRequestSchema } from '@auction/shared';
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
import { useForgotPassword } from '@/lib/auth/mutations';
import { useZodForm } from '@/lib/forms/use-zod-form';

export function ForgotPasswordForm() {
  const forgot = useForgotPassword();
  const form = useZodForm(ForgotPasswordRequestSchema, { defaultValues: { email: '' } });

  const onSubmit = form.handleSubmit((values) => forgot.mutate(values));

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
        <Button type="submit" className="w-full" disabled={forgot.isPending}>
          {forgot.isPending ? 'Sending…' : 'Send reset link'}
        </Button>
      </form>
    </Form>
  );
}
