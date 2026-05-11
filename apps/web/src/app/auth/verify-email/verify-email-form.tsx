'use client';

import { VerifyEmailRequestSchema } from '@auction/shared';
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
import {
  useRequestEmailVerification,
  useVerifyEmail,
} from '@/lib/auth/mutations';
import { useZodForm } from '@/lib/forms/use-zod-form';

export function VerifyEmailForm({
  initialEmail,
  redirectTo = '/',
}: {
  initialEmail: string;
  redirectTo?: string;
}) {
  const verify = useVerifyEmail(redirectTo);
  const resend = useRequestEmailVerification();

  const form = useZodForm(VerifyEmailRequestSchema, {
    defaultValues: { email: initialEmail, otp: '' },
  });


  const onSubmit = form.handleSubmit((values) => verify.mutate(values));

  const onResend = () => {
    const email = form.getValues('email');
    if (email) resend.mutate({ email });
  };

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
                <Input type="email" inputMode="email" autoComplete="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="otp"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Verification code</FormLabel>
              <FormControl>
                <Input
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="123456"
                  autoFocus={initialEmail !== ''}
                  className="text-center tracking-widest"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={verify.isPending}>
          {verify.isPending ? 'Verifying…' : 'Verify email'}
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="w-full"
          onClick={onResend}
          disabled={resend.isPending}
        >
          {resend.isPending ? 'Sending…' : 'Resend code'}
        </Button>
      </form>
    </Form>
  );
}
