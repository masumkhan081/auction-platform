'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession } from '@/lib/auth/use-session';
import { useForgotPassword } from '@/lib/auth/mutations';
import { useDeactivateAccount } from '@/lib/profile/mutations';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Settings, Shield, Bell, AlertTriangle } from 'lucide-react';

export default function SettingsPage() {
  const session = useSession();
  const forgotPassword = useForgotPassword();
  const deactivate = useDeactivateAccount();
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  if (session.isLoading) {
    return (
      <main className="container mx-auto px-4 py-8 max-w-2xl space-y-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </main>
    );
  }

  if (!session.data) {
    return (
      <main className="container mx-auto px-4 py-16 max-w-md text-center space-y-4">
        <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
          <Settings className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Sign in to view settings</h1>
        <Button asChild className="w-full">
          <Link href="/auth/login?next=/settings">Sign in</Link>
        </Button>
      </main>
    );
  }

  const handlePasswordReset = () => {
    if (session.data?.user.email) {
      forgotPassword.mutate({ email: session.data.user.email });
    }
  };

  return (
    <main className="container mx-auto px-4 py-8 max-w-2xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage security, notifications, and account settings.</p>
      </div>

      <div className="space-y-6">
        {/* Security / Password */}
        <div className="rounded-xl border bg-card p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold">Security & Password</h2>
              <p className="text-xs text-muted-foreground">Request a secure password reset link to your email.</p>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t">
            <div className="text-xs text-muted-foreground">
              A one-time reset link will be sent to <span className="font-medium text-foreground">{session.data.user.email}</span>.
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePasswordReset}
              disabled={forgotPassword.isPending}
            >
              {forgotPassword.isPending ? 'Sending link...' : 'Send reset link'}
            </Button>
          </div>
        </div>

        {/* Notifications */}
        <div className="rounded-xl border bg-card p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold">Notifications</h2>
              <p className="text-xs text-muted-foreground">Control outbid alerts and auction notifications.</p>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between border-t">
            <div>
              <p className="text-sm font-medium">In-app & email notifications</p>
              <p className="text-xs text-muted-foreground">Receive real-time alerts when you are outbid.</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setNotificationsEnabled(!notificationsEnabled)}
            >
              {notificationsEnabled ? 'Enabled' : 'Disabled'}
            </Button>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-destructive">Danger Zone</h2>
              <p className="text-xs text-muted-foreground">Deactivate your account and cancel active sessions.</p>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-destructive/10">
            <div className="text-xs text-muted-foreground">
              Deactivating will log you out immediately and disable your account.
            </div>
            {!confirmDeactivate ? (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setConfirmDeactivate(true)}
              >
                Deactivate Account
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setConfirmDeactivate(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => deactivate.mutate()}
                  disabled={deactivate.isPending}
                >
                  {deactivate.isPending ? 'Deactivating...' : 'Confirm Deactivation'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
