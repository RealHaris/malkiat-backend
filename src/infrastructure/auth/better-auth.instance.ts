import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { Resend } from 'resend';
import type { AppEnv } from '@shared/config/env';
import { createRedisSecondaryStorage } from './redis-secondary-storage';
import type { RedisClient } from '@infra/redis/client';
import * as schema from '../db/drizzle/schema';

export function createBetterAuthInstance(
  env: AppEnv,
  db: PostgresJsDatabase<any>,
  redis?: RedisClient,
) {
  if (!env.BETTER_AUTH_SECRET) {
    throw new Error('BETTER_AUTH_SECRET is required');
  }
  if (!env.BETTER_AUTH_BASE_URL) {
    throw new Error('BETTER_AUTH_BASE_URL is required');
  }

  const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

  return betterAuth({
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_BASE_URL,
    database: drizzleAdapter(db, {
      provider: 'pg',
      usePlural: false,
      schema,
    }),
    secondaryStorage: redis ? createRedisSecondaryStorage(redis) : undefined,
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      sendResetPassword: async ({ user, url }) => {
        if (!resend) return;
        await resend.emails.send({
          from: env.RESEND_FROM_EMAIL,
          to: user.email,
          subject: 'Reset your password',
          html: `<!doctype html><html><body><p>Reset your password:</p><p><a href="${url}">${url}</a></p></body></html>`,
        });
      },
    },
    emailVerification: {
      sendVerificationEmail: async ({ user, url }) => {
        if (!resend) return;
        await resend.emails.send({
          from: env.RESEND_FROM_EMAIL,
          to: user.email,
          subject: 'Verify your email',
          html: `<!doctype html><html><body><p>Verify your email:</p><p><a href="${url}">${url}</a></p></body></html>`,
        });
      },
    },
    socialProviders: {
      google:
        env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
          ? {
              clientId: env.GOOGLE_CLIENT_ID,
              clientSecret: env.GOOGLE_CLIENT_SECRET,
            }
          : undefined,
      apple:
        env.APPLE_CLIENT_ID && env.APPLE_CLIENT_SECRET
          ? {
              clientId: env.APPLE_CLIENT_ID,
              clientSecret: env.APPLE_CLIENT_SECRET,
            }
          : undefined,
    },
  });
}
