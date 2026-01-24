import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { createDrizzleDb } from "@infra/db/drizzle/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required");
}

const db = createDrizzleDb(connectionString);

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET ?? "dev",
  baseURL: process.env.BETTER_AUTH_BASE_URL ?? "http://localhost:3000",
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
  },
});
