import postgres from 'postgres';

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is required');
  const sql = postgres(url, { prepare: false });

  const rows = await sql`
    select id, hash, created_at
    from drizzle.__drizzle_migrations
    order by id asc
  `;

  console.log(JSON.stringify(rows, null, 2));
  await sql.end();
}

void main();
