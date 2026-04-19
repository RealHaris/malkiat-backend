import postgres from 'postgres';

const ADMIN_EMAILS = ['harisxpersonal@gmail.com', 'harisxstudy@gmail.com'] as const;

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required');
  }

  const sql = postgres(databaseUrl, { prepare: false });

  try {
    const updated = await sql<{ email: string }[]>`
      update "user"
      set platform_role = 'admin', updated_at = now()
      where email in ${sql([...ADMIN_EMAILS])}
      returning email
    `;

    const updatedEmails = new Set(updated.map((item) => item.email));
    const missingEmails = ADMIN_EMAILS.filter((email) => !updatedEmails.has(email));

    console.log(
      JSON.stringify(
        {
          requested: ADMIN_EMAILS,
          updated: [...updatedEmails],
          missing: missingEmails,
        },
        null,
        2,
      ),
    );
  } finally {
    await sql.end();
  }
}

void main();
