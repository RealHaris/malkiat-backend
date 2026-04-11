import postgres from 'postgres';
import { randomUUID } from 'node:crypto';

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is required');

  const sql = postgres(url, { prepare: false });

  const email = 'apitest.listings@example.com';

  const existingUsers = await sql<{ id: string }[]>`
    select id from "user" where email = ${email} limit 1
  `;

  let userId = existingUsers[0]?.id;

  if (!userId) {
    userId = randomUUID();
    await sql`
      insert into "user" (id, name, email, email_verified, created_at, updated_at)
      values (${userId}, ${'API Test User'}, ${email}, ${true}, now(), now())
    `;
  }

  const token = `tok_${randomUUID().replaceAll('-', '')}`;

  await sql`
    insert into "session" (id, expires_at, token, created_at, updated_at, user_id)
    values (${randomUUID()}, now() + interval '7 days', ${token}, now(), now(), ${userId})
  `;

  const subtypeRows = await sql<{ id: string; slug: string; category: string }[]>`
    select id, slug, category from property_subtypes where slug = 'house' limit 1
  `;

  const areaRows = await sql<{ id: string; name: string; city: string }[]>`
    select id, name, city from areas where city = 'Karachi' order by created_at asc limit 1
  `;

  console.log(
    JSON.stringify(
      {
        userId,
        token,
        subtype: subtypeRows[0],
        area: areaRows[0],
      },
      null,
      2,
    ),
  );

  await sql.end();
}

void main();
