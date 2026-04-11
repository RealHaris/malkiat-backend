import postgres from 'postgres';
import { randomUUID } from 'node:crypto';

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is required');

  const email = process.argv[2];
  if (!email) throw new Error('Usage: bun scripts/dev/create-session-token.ts <email>');

  const sql = postgres(url, { prepare: false });
  const users = await sql<{ id: string }[]>`select id from "user" where email = ${email} limit 1`;
  if (!users[0]?.id) throw new Error(`User not found for email: ${email}`);

  const token = `tok_${randomUUID().replaceAll('-', '')}`;
  await sql`
    insert into "session" (id, expires_at, token, created_at, updated_at, user_id)
    values (${randomUUID()}, now() + interval '7 days', ${token}, now(), now(), ${users[0].id})
  `;

  console.log(token);
  await sql.end();
}

void main();
