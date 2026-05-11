import type { Metadata } from 'next';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { redirectIfAuthenticated } from '@/lib/auth/require-auth';
import { LoginForm } from './login-form';

export const metadata: Metadata = { title: 'Sign in' };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  await redirectIfAuthenticated(next ?? '/');

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>Enter your email and password.</CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm next={next ?? null} />
        <div className="mt-6 flex flex-col gap-2 text-center text-sm text-muted-foreground sm:flex-row sm:justify-between">
          <Link href="/auth/forgot-password" className="hover:text-foreground">
            Forgot password?
          </Link>
          <span>
            New here?{' '}
            <Link href="/auth/register" className="font-medium text-foreground hover:underline">
              Create an account
            </Link>
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
