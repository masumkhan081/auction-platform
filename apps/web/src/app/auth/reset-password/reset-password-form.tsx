'use client';

import { ResetPasswordRequestSchema } from '@auction/shared';
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
import { useResetPassword } from '@/lib/auth/mutations';
import { useZodForm } from '@/lib/forms/use-zod-form';

export function ResetPasswordForm({ token }: { token: string }) {
  const reset = useResetPassword();
  const form = useZodForm(ResetPasswordRequestSchema, {
    defaultValues: { token, newPassword: '' },
  });

  const onSubmit = form.handleSubmit((values) => reset.mutate(values));

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <FormField
          control={form.control}
          name="newPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>New password</FormLabel>
              <FormControl>
                <Input type="password" autoComplete="new-password" autoFocus {...field} />
              </FormControl>
              <FormDescription>
                At least 8 characters with an uppercase, lowercase, and a digit.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={reset.isPending}>
          {reset.isPending ? 'Updating…' : 'Update password'}
        </Button>
      </form>
    </Form>
  );
}
