import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

const databaseUrl = process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? '';

if (!databaseUrl || databaseUrl.includes('[YOUR-DB-PASSWORD]')) {
  throw new Error(
    'Set DATABASE_URL (or DIRECT_URL) in .env with your real Supabase DB password before running Drizzle Kit.',
  );
}

export default defineConfig({
  schema: './src/infrastructure/db/drizzle/schema/index.ts',
  out: './src/infrastructure/db/drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: databaseUrl,
  },
});
