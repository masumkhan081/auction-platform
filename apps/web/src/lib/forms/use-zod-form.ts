'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type UseFormProps, type UseFormReturn } from 'react-hook-form';
import type { z, ZodTypeAny } from 'zod';

/**
 * Thin wrapper over `useForm` that wires `zodResolver` for a given schema.
 * The input type comes from `z.input<S>` (pre-coercion) so default values
 * don't have to mirror coerced shapes.
 *
 * Usage:
 *   const form = useZodForm(LoginRequestSchema, { defaultValues: { email: '', password: '' } });
 */
export function useZodForm<TSchema extends ZodTypeAny>(
  schema: TSchema,
  options?: Omit<UseFormProps<z.input<TSchema>>, 'resolver'>,
): UseFormReturn<z.input<TSchema>, unknown, z.output<TSchema>> {
  return useForm<z.input<TSchema>, unknown, z.output<TSchema>>({
    ...options,
    resolver: zodResolver(schema),
  });
}
