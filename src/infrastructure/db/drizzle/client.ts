import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

export function createDrizzleDb(connectionString: string) {
  try {
    const client = postgres(connectionString, { prepare: false });
    const db = drizzle(client);
    console.log("✅ Supabase connected successfully");
    return db;
  } catch (error) {
    console.error("❌ Failed to connect to Supabase:");
    console.error(error);
    throw error;
  }
}
