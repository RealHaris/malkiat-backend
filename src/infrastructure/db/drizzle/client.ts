import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';

export function createDrizzleDb(connectionString: string) {
  // Supabase pooler in transaction mode does not support prepared statements.
  const client = postgres(connectionString, { prepare: false });
  return drizzle(client);
}
