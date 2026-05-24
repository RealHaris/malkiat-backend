ALTER TABLE "listings"
ADD COLUMN IF NOT EXISTS "phone_numbers" jsonb NOT NULL DEFAULT '[]'::jsonb;
