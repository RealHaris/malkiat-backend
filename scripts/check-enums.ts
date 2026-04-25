
import postgres from 'postgres';

const sql = postgres('postgresql://postgres.zhqynrapowftokemdniw:PZsVAfCTWQo5wTTA@aws-1-ap-south-1.pooler.supabase.com:6543/postgres');

async function checkEnums() {
  try {
    console.log('Checking listing_status ENUM...');
    const listingStatus = await sql`
      SELECT enumlabel
      FROM pg_enum
      JOIN pg_type ON pg_enum.enumtypid = pg_type.oid
      WHERE pg_type.typname = 'listing_status';
    `;
    console.log('listing_status:', listingStatus.map(r => r.enumlabel));

    console.log('\nChecking agency_status ENUM...');
    const agencyStatus = await sql`
      SELECT enumlabel
      FROM pg_enum
      JOIN pg_type ON pg_enum.enumtypid = pg_type.oid
      WHERE pg_type.typname = 'agency_status';
    `;
    console.log('agency_status:', agencyStatus.map(r => r.enumlabel));

    console.log('\nChecking agency_membership_status ENUM...');
    const membershipStatus = await sql`
      SELECT enumlabel
      FROM pg_enum
      JOIN pg_type ON pg_enum.enumtypid = pg_type.oid
      WHERE pg_type.typname = 'agency_membership_status';
    `;
    console.log('agency_membership_status:', membershipStatus.map(r => r.enumlabel));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sql.end();
  }
}

checkEnums();
