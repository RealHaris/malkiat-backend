import postgres from 'postgres';

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is required');
  const sql = postgres(url, { prepare: false });

  const rows = await sql<
    {
      column_name: string;
      data_type: string;
      udt_name: string;
      is_nullable: string;
      column_default: string | null;
    }[]
  >`
    select column_name, data_type, udt_name, is_nullable, column_default
    from information_schema.columns
    where table_schema = 'public' and table_name = 'listings'
    order by ordinal_position
  `;

  console.log(JSON.stringify(rows, null, 2));
  await sql.end();
}

void main();
