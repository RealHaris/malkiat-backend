import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  NODE_ENV: z.string().default('development'),

  DATABASE_URL: z.string().optional(),
  REDIS_URL: z.string().default('redis://localhost:6379'),

  TYPESENSE_HOST: z.string().optional(),
  TYPESENSE_PORT: z.coerce.number().int().positive().optional(),
  TYPESENSE_PROTOCOL: z.enum(['http', 'https']).optional(),
  TYPESENSE_ADMIN_API_KEY: z.string().optional(),
  TYPESENSE_COLLECTION_LISTINGS: z.string().default('listings'),

  LISTING_EVENTS_WORKER_URL: z.string().default('http://localhost:8787'),

  BETTER_AUTH_SECRET: z.string().default('dev-secret-change-in-production'),
  BETTER_AUTH_BASE_URL: z.string().default('http://localhost:3000'),
  BETTER_AUTH_COOKIE_DOMAIN: z.string().optional(),
  APP_PUBLIC_URL: z.string().default('http://localhost:3001'),
  CORS_ALLOWED_ORIGINS: z.string().optional(),
  BLOB_READ_WRITE_TOKEN: z.string().optional(),

  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM_EMAIL: z.string().default('hello@realharis.works'),

  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  APPLE_CLIENT_ID: z.string().optional(),
  APPLE_CLIENT_SECRET: z.string().optional(),

  SENTRY_DSN: z.string().optional(),
});

export type AppEnv = z.infer<typeof envSchema>;

export function loadEnv(raw: Record<string, unknown>): AppEnv {
  return envSchema.parse(raw);
}
