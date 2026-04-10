import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { phoneNumber, emailOTP } from 'better-auth/plugins';
import { createDrizzleDb } from '@infra/db/drizzle/client';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is required');
}

const db = createDrizzleDb(connectionString);

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET ?? 'dev',
  baseURL: process.env.BETTER_AUTH_BASE_URL ?? 'http://localhost:3002',
  database: drizzleAdapter(db, {
    provider: 'pg',
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
  },
  plugins: [
    phoneNumber({
      sendOTP: ({ phoneNumber: phone, code }) => {
        console.log(`[DEV] Phone OTP for ${phone}: ${code}`);
      },
      signUpOnVerification: {
        getTempEmail: (phone) => `${phone.replace(/\+/g, '')}@phone.malkiat.site`,
        getTempName: (phone) => phone,
      },
    }),
    emailOTP({
      async sendVerificationOTP({ email, otp, type }) {
        console.log(`[DEV] Email OTP for ${email} (${type}): ${otp}`);
      },
      otpLength: 6,
      expiresIn: 300,
    }),
  ],
});
