ALTER TABLE "amenities"
ADD COLUMN IF NOT EXISTS "category" varchar(120) DEFAULT 'Other Facilities' NOT NULL;

ALTER TABLE "amenities"
ADD COLUMN IF NOT EXISTS "subcategory" varchar(120);

DO $$
BEGIN
  CREATE TYPE "amenity_value_type" AS ENUM('boolean', 'text', 'number', 'select');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

ALTER TABLE "amenities"
ADD COLUMN IF NOT EXISTS "value_type" "amenity_value_type" DEFAULT 'boolean' NOT NULL;

ALTER TABLE "amenities"
ADD COLUMN IF NOT EXISTS "value_options" jsonb DEFAULT '[]'::jsonb NOT NULL;

ALTER TABLE "listing_amenities"
ADD COLUMN IF NOT EXISTS "value_json" jsonb;
