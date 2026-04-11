import postgres from 'postgres';
import { randomUUID } from 'node:crypto';

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is required');

  const email = process.argv[2] ?? 'curluser@example.com';
  const sql = postgres(url, { prepare: false });

  const users = await sql<{ id: string }[]>`
    select id from "user" where email = ${email} limit 1
  `;
  if (!users[0]?.id) throw new Error(`User not found: ${email}`);

  const userId = users[0].id;

  await sql`
    update "user"
    set email_verified = true, updated_at = now()
    where id = ${userId}
  `;

  const token = `tok_${randomUUID().replaceAll('-', '')}`;

  await sql`
    insert into "session" (id, expires_at, token, created_at, updated_at, user_id)
    values (${randomUUID()}, now() + interval '7 days', ${token}, now(), now(), ${userId})
  `;

  console.log(JSON.stringify({ token, cookie: `better-auth.session_token=${token}` }, null, 2));
  await sql.end();
}

void main();
