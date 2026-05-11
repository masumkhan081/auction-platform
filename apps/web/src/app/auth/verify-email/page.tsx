import type { Metadata } from 'next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { VerifyEmailForm } from './verify-email-form';

export const metadata: Metadata = { title: 'Verify email' };

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; next?: string }>;
}) {
  const { email, next } = await searchParams;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Verify your email</CardTitle>
        <CardDescription>
          We sent a 6-digit code to your inbox. Enter it below to confirm.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <VerifyEmailForm initialEmail={email ?? ''} redirectTo={next ?? '/'} />
      </CardContent>
    </Card>
  );
}

