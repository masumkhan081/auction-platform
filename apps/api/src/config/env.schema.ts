import { z } from 'zod';

const csv = (raw: string) =>
  raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

/**
 * Single source of truth for runtime env. Parsed once at boot — if invalid,
 * the process exits before any controller is wired up. No service ever reads
 * `process.env` directly; they consume `EnvService.config` (typed).
 */
export const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),

  CORS_ORIGINS: z
    .string()
    .default('http://localhost:3000')
    .transform(csv)
    .pipe(z.array(z.string().url()).min(1)),

  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),

  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 chars'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 chars'),
  JWT_ACCESS_TTL_SECONDS: z.coerce.number().int().positive().default(900),
  JWT_REFRESH_TTL_SECONDS: z.coerce.number().int().positive().default(60 * 60 * 24 * 30),

  COOKIE_ACCESS_NAME: z.string().min(1).default('auction_at'),
  COOKIE_REFRESH_NAME: z.string().min(1).default('auction_rt'),
  COOKIE_DOMAIN: z.string().min(1).default('localhost'),
  COOKIE_SECURE: z
    .string()
    .default('false')
    .transform((v) => v === 'true'),

  MAIL_TRANSPORT: z.enum(['smtp', 'brevo']).default('smtp'),
  MAIL_SMTP_HOST: z.string().default('localhost'),
  MAIL_SMTP_PORT: z.coerce.number().int().positive().default(1025),
  MAIL_SMTP_USER: z.string().default(''),
  MAIL_SMTP_PASSWORD: z.string().default(''),
  MAIL_FROM_ADDRESS: z.string().email().default('no-reply@auction.local'),
  MAIL_FROM_NAME: z.string().default('Auction Platform'),
  BREVO_API_KEY: z.string().default(''),

  CLOUDINARY_CLOUD_NAME: z.string().default(''),
  CLOUDINARY_API_KEY: z.string().default(''),
  CLOUDINARY_API_SECRET: z.string().default(''),
  CLOUDINARY_UPLOAD_FOLDER: z.string().default('auction'),

  WEB_BASE_URL: z.string().url().default('http://localhost:3000'),

  THROTTLE_TTL_MS: z.coerce.number().int().positive().default(60_000),
  THROTTLE_LIMIT: z.coerce.number().int().positive().default(120),
});

export type Env = z.infer<typeof EnvSchema>;
