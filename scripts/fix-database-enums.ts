
import postgres from 'postgres';

const sql = postgres('postgresql://postgres.zhqynrapowftokemdniw:PZsVAfCTWQo5wTTA@aws-1-ap-south-1.pooler.supabase.com:6543/postgres');

async function fixEnums() {
  try {
    console.log('Fixing listing_status ENUM...');

    // Add missing values to listing_status
    await sql`ALTER TYPE listing_status ADD VALUE IF NOT EXISTS 'UNPUBLISHED'`;
    await sql`ALTER TYPE listing_status ADD VALUE IF NOT EXISTS 'DELETED'`;

    console.log('Fixing agency_status ENUM...');
    // Add inactive and rename archived if needed
    await sql`ALTER TYPE agency_status ADD VALUE IF NOT EXISTS 'inactive'`;

    // Check if there are any 'archived' agencies and update them to 'inactive'
    await sql`UPDATE agencies SET status = 'inactive' WHERE status::text = 'archived'`;

    // Note: Removing 'archived' from ENUM is hard in Postgres without recreating it,
    // but adding 'inactive' is enough to stop the 500 errors if the code expects 'inactive'.

    console.log('✅ ENUMs updated successfully');
  } catch (error) {
    console.error('❌ Error fixing ENUMs:', error);
  } finally {
    await sql.end();
  }
}

fixEnums();
