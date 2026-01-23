import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  NODE_ENV: z.string().default('development'),

  // Kept optional for bootstrapping; infrastructure modules should validate when enabled.
  DATABASE_URL: z.string().optional(),
  REDIS_URL: z.string().optional(),
  BULLMQ_REDIS_URL: z.string().optional(),

  OUTBOX_POLL_INTERVAL_MS: z.coerce.number().int().positive().default(500),
  OUTBOX_BATCH_SIZE: z.coerce.number().int().positive().default(100),
});

export type AppEnv = z.infer<typeof envSchema>;

export function loadEnv(raw: Record<string, unknown>): AppEnv {
  return envSchema.parse(raw);
}
