DO $$ BEGIN
  CREATE TYPE "public"."listing_status" AS ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."listing_purpose" AS ENUM('SELL', 'RENT');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."property_category" AS ENUM('HOME', 'PLOT', 'COMMERCIAL');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."area_unit" AS ENUM('MARLA', 'SQFT', 'SQYD', 'KANAL');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."listing_currency" AS ENUM('PKR');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."listing_platform" AS ENUM('ZAMEEN');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "property_subtypes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "category" "property_category" NOT NULL,
  "slug" varchar(64) NOT NULL,
  "name" varchar(120) NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "property_subtypes_category_slug_uk" ON "property_subtypes" USING btree ("category","slug");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "areas" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "city" varchar(120) DEFAULT 'Karachi' NOT NULL,
  "name" varchar(160) NOT NULL,
  "country_code" varchar(2) DEFAULT 'PK' NOT NULL,
  "latitude" numeric(10,7),
  "longitude" numeric(10,7),
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "areas_city_name_uk" ON "areas" USING btree ("city","name");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "amenities" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "slug" varchar(64) NOT NULL,
  "name" varchar(120) NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "amenities_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
INSERT INTO "property_subtypes" ("category", "slug", "name") VALUES
  ('HOME','house','House'),
  ('HOME','flat','Flat'),
  ('HOME','upper-portion','Upper Portion'),
  ('HOME','lower-portion','Lower Portion'),
  ('HOME','farm-house','Farm House'),
  ('HOME','room','Room'),
  ('HOME','penthouse','Penthouse'),
  ('PLOT','residential-plot','Residential Plot'),
  ('PLOT','commercial-plot','Commercial Plot'),
  ('PLOT','agricultural-land','Agricultural Land'),
  ('PLOT','industrial-land','Industrial Land'),
  ('PLOT','plot-file','Plot File'),
  ('PLOT','plot-form','Plot Form'),
  ('COMMERCIAL','office','Office'),
  ('COMMERCIAL','shop','Shop'),
  ('COMMERCIAL','warehouse','Warehouse'),
  ('COMMERCIAL','factory','Factory'),
  ('COMMERCIAL','building','Building'),
  ('COMMERCIAL','other','Other')
ON CONFLICT ("category", "slug") DO NOTHING;
--> statement-breakpoint
INSERT INTO "areas" ("id", "city", "name", "country_code") VALUES
  ('11111111-1111-1111-1111-111111111111', 'Karachi', 'Default Area', 'PK')
ON CONFLICT DO NOTHING;
--> statement-breakpoint
ALTER TABLE "listings" ALTER COLUMN "owner_id" TYPE text USING "owner_id"::text;
--> statement-breakpoint
ALTER TABLE "listings"
  ADD COLUMN IF NOT EXISTS "purpose" "listing_purpose" DEFAULT 'SELL',
  ADD COLUMN IF NOT EXISTS "property_category" "property_category" DEFAULT 'HOME',
  ADD COLUMN IF NOT EXISTS "property_subtype_id" uuid,
  ADD COLUMN IF NOT EXISTS "city" varchar(120) DEFAULT 'Karachi',
  ADD COLUMN IF NOT EXISTS "country_code" varchar(2) DEFAULT 'PK',
  ADD COLUMN IF NOT EXISTS "area_id" uuid,
  ADD COLUMN IF NOT EXISTS "location_text" text DEFAULT '',
  ADD COLUMN IF NOT EXISTS "latitude" numeric(10,7),
  ADD COLUMN IF NOT EXISTS "longitude" numeric(10,7),
  ADD COLUMN IF NOT EXISTS "area_value" numeric(14,2) DEFAULT 1,
  ADD COLUMN IF NOT EXISTS "area_unit" "area_unit" DEFAULT 'MARLA',
  ADD COLUMN IF NOT EXISTS "area_sqft" numeric(14,2) DEFAULT 272.25,
  ADD COLUMN IF NOT EXISTS "installment_available" boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS "ready_for_possession" boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS "bedrooms_count" smallint,
  ADD COLUMN IF NOT EXISTS "bathrooms_count" smallint,
  ADD COLUMN IF NOT EXISTS "images_json" jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS "video_url" text,
  ADD COLUMN IF NOT EXISTS "platforms" "listing_platform"[] DEFAULT ARRAY['ZAMEEN']::listing_platform[],
  ADD COLUMN IF NOT EXISTS "published_at" timestamp with time zone;
--> statement-breakpoint
UPDATE "listings"
SET "property_subtype_id" = (SELECT "id" FROM "property_subtypes" WHERE "category"='HOME' AND "slug"='house' LIMIT 1)
WHERE "property_subtype_id" IS NULL;
--> statement-breakpoint
UPDATE "listings"
SET "area_id" = '11111111-1111-1111-1111-111111111111'
WHERE "area_id" IS NULL;
--> statement-breakpoint
ALTER TABLE "listings" ALTER COLUMN "purpose" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "listings" ALTER COLUMN "property_category" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "listings" ALTER COLUMN "property_subtype_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "listings" ALTER COLUMN "city" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "listings" ALTER COLUMN "country_code" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "listings" ALTER COLUMN "area_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "listings" ALTER COLUMN "location_text" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "listings" ALTER COLUMN "area_value" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "listings" ALTER COLUMN "area_unit" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "listings" ALTER COLUMN "area_sqft" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "listings" ALTER COLUMN "installment_available" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "listings" ALTER COLUMN "ready_for_possession" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "listings" ALTER COLUMN "images_json" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "listings" ALTER COLUMN "platforms" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "listings" ALTER COLUMN "owner_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "listings" ALTER COLUMN "currency" DROP DEFAULT;
--> statement-breakpoint
ALTER TABLE "listings" ALTER COLUMN "currency" TYPE "listing_currency" USING 'PKR'::listing_currency;
--> statement-breakpoint
ALTER TABLE "listings" ALTER COLUMN "currency" SET DEFAULT 'PKR';
--> statement-breakpoint
ALTER TABLE "listings" ALTER COLUMN "currency" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "listings" ALTER COLUMN "status" DROP DEFAULT;
--> statement-breakpoint
ALTER TABLE "listings" ALTER COLUMN "status" TYPE "listing_status" USING "status"::listing_status;
--> statement-breakpoint
ALTER TABLE "listings" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
--> statement-breakpoint
ALTER TABLE "listings" ALTER COLUMN "status" SET NOT NULL;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "listings" ADD CONSTRAINT "listings_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "listings" ADD CONSTRAINT "listings_property_subtype_id_fk" FOREIGN KEY ("property_subtype_id") REFERENCES "public"."property_subtypes"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "listings" ADD CONSTRAINT "listings_area_id_fk" FOREIGN KEY ("area_id") REFERENCES "public"."areas"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "listing_amenities" (
  "listing_id" uuid NOT NULL,
  "amenity_id" uuid NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "listing_amenities_pk" PRIMARY KEY("listing_id", "amenity_id")
);
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "listing_amenities" ADD CONSTRAINT "listing_amenities_listing_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "listing_amenities" ADD CONSTRAINT "listing_amenities_amenity_id_fk" FOREIGN KEY ("amenity_id") REFERENCES "public"."amenities"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
ALTER TABLE "listings" DROP COLUMN IF EXISTS "property_type";
--> statement-breakpoint
ALTER TABLE "listings" DROP COLUMN IF EXISTS "address_json";
--> statement-breakpoint
ALTER TABLE "listings" DROP COLUMN IF EXISTS "attributes";
