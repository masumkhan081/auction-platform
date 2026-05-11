'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type {
  AuthSession,
  ForgotPasswordRequest,
  LoginRequest,
  RegisterRequest,
  RequestEmailVerificationRequest,
  ResetPasswordRequest,
  VerifyEmailRequest,
} from '@auction/shared';
import { apiFetch } from '../api/client';
import { handleError } from '../errors/handle-error';
import { qk } from '../query/keys';
import { useSessionWriter } from './use-session';

/**
 * Every auth mutation in one file. Identical conventions:
 *   - `mutationFn` calls `apiFetch` directly (no service layer)
 *   - on success: explicit cache update + redirect (when applicable)
 *   - on error: `handleError(err)` — uniform toasting
 *
 * No hook accepts callbacks; if a screen needs custom behavior, it composes
 * around the returned `mutate`.
 */

export function useLogin(redirectTo: string | null = '/') {
  const router = useRouter();
  const session = useSessionWriter();

  return useMutation({
    mutationFn: (input: LoginRequest) =>
      apiFetch<AuthSession>('/auth/login', { method: 'POST', json: input }),
    onSuccess: (data) => {
      session.set(data);
      router.replace(redirectTo ?? '/');
      router.refresh(); // re-runs RSC trees with the new cookie
    },
    onError: (err) => handleError(err),
  });
}

export function useRegister(redirectTo = '/auth/verify-email') {
  const router = useRouter();
  const session = useSessionWriter();

  return useMutation({
    mutationFn: (input: RegisterRequest) =>
      apiFetch<AuthSession>('/auth/register', { method: 'POST', json: input }),
    onSuccess: (data) => {
      session.set(data);
      // Build the verify-email URL. `redirectTo` may already contain `?next=…`,
      // so we must append `email` without clobbering existing params.
      const base = redirectTo.startsWith('/auth/verify-email') ? redirectTo : '/auth/verify-email';
      const url = new URL(base, 'http://x');
      url.searchParams.set('email', data.user.email);
      // Preserve a `next` already embedded in redirectTo
      if (!url.searchParams.has('next') && redirectTo.includes('next=')) {
        const passedUrl = new URL(redirectTo, 'http://x');
        const next = passedUrl.searchParams.get('next');
        if (next) url.searchParams.set('next', next);
      }
      router.replace(url.pathname + url.search);
      router.refresh(); // re-runs RSC trees with the new cookie
    },
    onError: (err) => handleError(err),
  });
}

export function useLogout(redirectTo = '/') {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiFetch<void>('/auth/logout', { method: 'POST' }),
    onSuccess: () => {
      queryClient.setQueryData(qk.auth.me(), null);
      // Clear server-state caches that depended on the previous user.
      queryClient.removeQueries({ queryKey: qk.notifications.all() });
      queryClient.removeQueries({ queryKey: qk.bids.mine({ page: 1, pageSize: 20 }) });
      router.replace(redirectTo);
      router.refresh();
    },
    onError: (err) => handleError(err),
  });
}

export function useRequestEmailVerification() {
  return useMutation({
    mutationFn: (input: RequestEmailVerificationRequest) =>
      apiFetch<void>('/auth/request-email-verification', {
        method: 'POST',
        json: input,
      }),
    onSuccess: () => {
      toast.success('Verification code sent. Check your inbox.');
    },
    onError: (err) => handleError(err),
  });
}

export function useVerifyEmail(redirectTo = '/') {
  const router = useRouter();
  const session = useSessionWriter();

  return useMutation({
    mutationFn: (input: VerifyEmailRequest) =>
      apiFetch<void>('/auth/verify-email', { method: 'POST', json: input }),
    onSuccess: () => {
      session.invalidate(); // pull fresh session with emailVerified: true
      toast.success('Email verified.');
      router.replace(redirectTo);
      router.refresh();
    },
    onError: (err) => handleError(err),
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (input: ForgotPasswordRequest) =>
      apiFetch<void>('/auth/forgot-password', { method: 'POST', json: input }),
    onSuccess: () => {
      // Generic message regardless of whether the email exists. Matches the
      // api's silent-throttle behaviour — never leak account existence.
      toast.success('If your email is registered, a reset link is on its way.');
    },
    onError: (err) => handleError(err),
  });
}

export function useResetPassword(redirectTo = '/auth/login') {
  const router = useRouter();

  return useMutation({
    mutationFn: (input: ResetPasswordRequest) =>
      apiFetch<void>('/auth/reset-password', { method: 'POST', json: input }),
    onSuccess: () => {
      toast.success('Password updated. You can sign in now.');
      router.replace(redirectTo);
    },
    onError: (err) => handleError(err),
  });
}
