import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { phoneNumber, emailOTP } from 'better-auth/plugins';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { Resend } from 'resend';
import type { AppEnv } from '@shared/config/env';
import { createRedisSecondaryStorage } from '@infra/auth/redis-secondary-storage';
import type { RedisClient } from '@infra/redis/client';
import * as schema from '@infra/db/drizzle/schema';

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

  const trustedOrigins = [env.BETTER_AUTH_BASE_URL, env.APP_PUBLIC_URL].filter(
    (origin): origin is string => !!origin && origin !== 'undefined',
  );

  return betterAuth({
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_BASE_URL,
    trustedOrigins,
    database: drizzleAdapter(db, {
      provider: 'pg',
      usePlural: false,
      schema,
    }),
    secondaryStorage: redis ? createRedisSecondaryStorage(redis) : undefined,
    session: {
      expiresIn: 60 * 60 * 6,
      updateAge: 60 * 30,
      cookieCache: {
        enabled: true,
        maxAge: 60 * 5,
        strategy: 'compact',
      },
    },
    user: {
      additionalFields: {
        phoneNumber: {
          type: 'string',
          required: false,
          fieldName: 'phoneNumber',
        },
      },
    },
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
    },
    plugins: [
      phoneNumber({
        sendOTP: ({ phoneNumber: phone, code }) => {
          // SMS sending is deferred — log OTP for development only
          console.log(`[DEV] Phone OTP for ${phone}: ${code}`);
        },
        signUpOnVerification: {
          getTempEmail: (phone) => `${phone.replace(/\+/g, '')}@phone.malkiat.site`,
          getTempName: (phone) => phone,
        },
      }),
      emailOTP({
        async sendVerificationOTP({ email, otp, type }) {
          if (!resend) return;
          const subjects: Record<string, string> = {
            'sign-in': 'Your sign-in code — Malkiat',
            'email-verification': 'Verify your email — Malkiat',
            'forget-password': 'Reset your password — Malkiat',
          };
          resend.emails.send({
            from: env.RESEND_FROM_EMAIL,
            to: email,
            subject: subjects[type] ?? 'Your verification code — Malkiat',
            html: `<!doctype html><html><body style="font-family:sans-serif;padding:32px"><h2>Your verification code</h2><p style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#111">${otp}</p><p style="color:#666">This code expires in 5 minutes. Do not share it with anyone.</p></body></html>`,
          });
        },
        otpLength: 6,
        expiresIn: 300,
      }),
    ],
  });
}
