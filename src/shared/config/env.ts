import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  NODE_ENV: z.string().default("development"),

  LOG_LEVEL: z.enum(["error", "warn", "info", "http", "verbose", "debug", "silly"]).default("info"),
  LOG_DIR: z.string().default("logs"),
  LOG_MAX_FILES: z.string().default("3d"),
  LOG_MAX_SIZE: z.string().default("20m"),

  // Kept optional for bootstrapping; infrastructure modules should validate when enabled.
  DATABASE_URL: z.string().optional(),
  REDIS_URL: z.string().optional(),
  BULLMQ_REDIS_URL: z.string().optional(),

  TYPESENSE_HOST: z.string().optional(),
  TYPESENSE_PORT: z.coerce.number().int().positive().optional(),
  TYPESENSE_PROTOCOL: z.enum(["http", "https"]).optional(),
  TYPESENSE_ADMIN_API_KEY: z.string().optional(),
  TYPESENSE_COLLECTION_LISTINGS: z.string().default("listings"),

  LISTING_EVENTS_QUEUE_NAME: z.string().default("listing-events"),

  BETTER_AUTH_SECRET: z.string().default("dev-secret-change-in-production"),
  BETTER_AUTH_BASE_URL: z.string().default("http://localhost:3000"),
  APP_PUBLIC_URL: z.string().optional(),

  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM_EMAIL: z.string().default("hello@realharis.works"),

  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  APPLE_CLIENT_ID: z.string().optional(),
  APPLE_CLIENT_SECRET: z.string().optional(),
});

export type AppEnv = z.infer<typeof envSchema>;

export function loadEnv(raw: Record<string, unknown>): AppEnv {
  return envSchema.parse(raw);
}
