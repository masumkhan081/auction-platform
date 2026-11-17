'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { UpdateProfileRequestSchema, type UpdateProfileRequest } from '@auction/shared';
import { useMyProfile } from '@/lib/profile/queries';
import { useUpdateProfile } from '@/lib/profile/mutations';
import { useSession } from '@/lib/auth/use-session';
import { formatDateTime } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { User, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ProfilePage() {
  const session = useSession();
  const { data: profile, isLoading, isError } = useMyProfile();
  const updateProfile = useUpdateProfile();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<UpdateProfileRequest>({
    resolver: zodResolver(UpdateProfileRequestSchema),
    defaultValues: {
      fullName: '',
      phone: '',
      address: '',
    },
  });

  useEffect(() => {
    if (profile) {
      reset({
        fullName: profile.fullName || '',
        phone: profile.phone || '',
        address: profile.address || '',
      });
    }
  }, [profile, reset]);

  if (session.isLoading || isLoading) {
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
          <User className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Sign in to view your profile</h1>
        <Button asChild className="w-full">
          <Link href="/auth/login?next=/profile">Sign in</Link>
        </Button>
      </main>
    );
  }

  if (isError || !profile) {
    return (
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-6 text-center text-sm text-destructive">
          Failed to load profile. Please refresh or try again.
        </div>
      </main>
    );
  }

  const onSubmit = (values: UpdateProfileRequest) => {
    updateProfile.mutate(values);
  };

  return (
    <main className="container mx-auto px-4 py-8 max-w-2xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground mt-1">Manage your public personal details and contact information.</p>
      </div>

      <div className="rounded-xl border bg-card p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xl uppercase">
              {profile.fullName.slice(0, 2)}
            </div>
            <div>
              <h2 className="text-xl font-bold">{profile.fullName}</h2>
              <p className="text-sm text-muted-foreground">{profile.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline">{profile.role}</Badge>
            {profile.emailVerified ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Verified
              </span>
            ) : (
              <Link
                href={`/auth/verify-email?email=${encodeURIComponent(profile.email)}`}
                className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-600 hover:underline"
              >
                <AlertCircle className="h-3.5 w-3.5" />
                Unverified (Verify now)
              </Link>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input id="fullName" {...register('fullName')} placeholder="Your name" />
            {errors.fullName && (
              <p className="text-xs text-destructive">{errors.fullName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={profile.email} disabled className="bg-muted cursor-not-allowed" />
            <p className="text-xs text-muted-foreground">Email address cannot be changed.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input id="phone" {...register('phone')} placeholder="+1 555 0123" />
            {errors.phone && (
              <p className="text-xs text-destructive">{errors.phone.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address / Location</Label>
            <Input id="address" {...register('address')} placeholder="City, Country" />
            {errors.address && (
              <p className="text-xs text-destructive">{errors.address.message}</p>
            )}
          </div>

          <div className="pt-2 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              Member since {formatDateTime(profile.createdAt)}
            </span>
            <Button type="submit" disabled={!isDirty || updateProfile.isPending}>
              {updateProfile.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
}
