import { z } from 'zod';

/**
 * Web env schema. Two parts:
 *   - `clientEnv`: NEXT_PUBLIC_* values exposed to the browser. Validated at
 *     module import on the client.
 *   - `serverEnv`: server-only values, validated lazily on first server use
 *     so client bundles don't trip the schema.
 *
 * Mirrors the api's pattern: validate once, never read `process.env` directly
 * in feature code.
 */

const ClientEnvSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().url(),
  NEXT_PUBLIC_WEB_URL: z.string().url(),
});

const ServerEnvSchema = z.object({
  API_INTERNAL_URL: z.string().url(),
});

const parseOrThrow = <T>(schema: z.ZodSchema<T>, source: Record<string, unknown>, label: string): T => {
  const result = schema.safeParse(source);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  - ${i.path.join('.') || '<root>'}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid ${label} environment:\n${issues}`);
  }
  return result.data;
};

export const clientEnv = parseOrThrow(
  ClientEnvSchema,
  {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_WEB_URL: process.env.NEXT_PUBLIC_WEB_URL,
  },
  'client',
);

let _serverEnv: z.infer<typeof ServerEnvSchema> | null = null;

/** Server-only — calling this from a client component throws at runtime. */
export const getServerEnv = (): z.infer<typeof ServerEnvSchema> => {
  if (typeof window !== 'undefined') {
    throw new Error('getServerEnv() called in the browser');
  }
  if (!_serverEnv) {
    _serverEnv = parseOrThrow(
      ServerEnvSchema,
      { API_INTERNAL_URL: process.env.API_INTERNAL_URL },
      'server',
    );
  }
  return _serverEnv;
};
