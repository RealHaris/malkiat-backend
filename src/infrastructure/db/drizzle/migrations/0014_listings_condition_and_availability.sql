DO $$ BEGIN
  CREATE TYPE "public"."listing_condition" AS ENUM(
    'BRAND_NEW',
    'EXCELLENT',
    'GOOD',
    'NEED_MINOR_WORK',
    'NEED_MAJOR_WORK'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "listings"
ADD COLUMN IF NOT EXISTS "condition" "listing_condition";

ALTER TABLE "listings"
ADD COLUMN IF NOT EXISTS "availability" jsonb;
