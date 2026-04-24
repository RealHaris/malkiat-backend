CREATE TYPE "public"."amenity_value_type" AS ENUM('boolean', 'text', 'number', 'select');--> statement-breakpoint
CREATE TYPE "public"."area_unit" AS ENUM('MARLA', 'SQFT', 'SQYD', 'KANAL');--> statement-breakpoint
CREATE TYPE "public"."listing_currency" AS ENUM('PKR');--> statement-breakpoint
CREATE TYPE "public"."listing_condition" AS ENUM('BRAND_NEW', 'EXCELLENT', 'GOOD', 'NEED_MINOR_WORK', 'NEED_MAJOR_WORK');--> statement-breakpoint
CREATE TYPE "public"."listing_purpose" AS ENUM('SELL', 'RENT');--> statement-breakpoint
CREATE TYPE "public"."listing_status" AS ENUM('DRAFT', 'UNDER_REVIEW', 'PUBLISHED', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "public"."listing_platform" AS ENUM('ZAMEEN');--> statement-breakpoint
CREATE TYPE "public"."property_category" AS ENUM('HOME', 'PLOT', 'COMMERCIAL');--> statement-breakpoint
CREATE TYPE "public"."platform_role" AS ENUM('admin', 'user');--> statement-breakpoint
CREATE TYPE "public"."agency_invite_status" AS ENUM('pending', 'accepted', 'declined');--> statement-breakpoint
CREATE TYPE "public"."agency_membership_role" AS ENUM('owner', 'co-owner', 'admin', 'manager', 'agent');--> statement-breakpoint
CREATE TYPE "public"."agency_membership_status" AS ENUM('active', 'removed');--> statement-breakpoint
CREATE TYPE "public"."agency_status" AS ENUM('active', 'archived');--> statement-breakpoint
CREATE TABLE "amenities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(64) NOT NULL,
	"name" varchar(120) NOT NULL,
	"category" varchar(120) DEFAULT 'Other Facilities' NOT NULL,
	"subcategory" varchar(120),
	"value_type" "amenity_value_type" DEFAULT 'boolean' NOT NULL,
	"value_options" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "amenities_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "areas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"city" varchar(120) DEFAULT 'Karachi' NOT NULL,
	"name" varchar(160) NOT NULL,
	"country_code" varchar(2) DEFAULT 'PK' NOT NULL,
	"latitude" numeric(10, 7),
	"longitude" numeric(10, 7),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "listing_amenities" (
	"listing_id" uuid NOT NULL,
	"amenity_id" uuid NOT NULL,
	"value_json" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "listing_amenities_pk" PRIMARY KEY("listing_id","amenity_id")
);
--> statement-breakpoint
CREATE TABLE "property_subtypes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category" "property_category" NOT NULL,
	"slug" varchar(64) NOT NULL,
	"name" varchar(120) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agencies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"logo_url" text,
	"cover_image_url" text,
	"owner_user_id" text NOT NULL,
	"status" "agency_status" DEFAULT 'active' NOT NULL,
	"created_by_user_id" text NOT NULL,
	"hide_follower_count" boolean DEFAULT false NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agency_followers" (
	"user_id" text NOT NULL,
	"agency_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agency_invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agency_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"role" "agency_membership_role" DEFAULT 'agent' NOT NULL,
	"status" "agency_invite_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agency_memberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agency_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"membership_role" "agency_membership_role" DEFAULT 'agent' NOT NULL,
	"status" "agency_membership_status" DEFAULT 'active' NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "listings" ALTER COLUMN "owner_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "listings" ALTER COLUMN "owner_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "listings" ALTER COLUMN "price_amount" SET DATA TYPE numeric(14, 2);--> statement-breakpoint
ALTER TABLE "listings" ALTER COLUMN "currency" SET DEFAULT 'PKR'::"public"."listing_currency";--> statement-breakpoint
ALTER TABLE "listings" ALTER COLUMN "currency" SET DATA TYPE "public"."listing_currency" USING "currency"::"public"."listing_currency";--> statement-breakpoint
ALTER TABLE "listings" ALTER COLUMN "currency" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "listings" ALTER COLUMN "status" SET DEFAULT 'DRAFT'::"public"."listing_status";--> statement-breakpoint
ALTER TABLE "listings" ALTER COLUMN "status" SET DATA TYPE "public"."listing_status" USING "status"::"public"."listing_status";--> statement-breakpoint
ALTER TABLE "listings" ALTER COLUMN "status" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "listings" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "listings" ALTER COLUMN "updated_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "created_by_user_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "agency_id" uuid;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "purpose" "listing_purpose" NOT NULL;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "property_category" "property_category" NOT NULL;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "property_subtype_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "city" varchar(120) DEFAULT 'Karachi' NOT NULL;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "country_code" varchar(2) DEFAULT 'PK' NOT NULL;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "area_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "location_text" text NOT NULL;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "latitude" numeric(10, 7);--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "longitude" numeric(10, 7);--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "area_value" numeric(14, 2) NOT NULL;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "area_unit" "area_unit" NOT NULL;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "area_sqft" numeric(14, 2) NOT NULL;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "condition" "listing_condition";--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "availability" jsonb;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "installment_available" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "ready_for_possession" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "bedrooms_count" smallint;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "bathrooms_count" smallint;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "images_json" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "video_url" text;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "platforms" "listing_platform"[] DEFAULT ARRAY['ZAMEEN']::listing_platform[] NOT NULL;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "published_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "platform_role" "platform_role" DEFAULT 'user' NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "listing_amenities" ADD CONSTRAINT "listing_amenities_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listing_amenities" ADD CONSTRAINT "listing_amenities_amenity_id_amenities_id_fk" FOREIGN KEY ("amenity_id") REFERENCES "public"."amenities"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agencies" ADD CONSTRAINT "agencies_owner_user_id_user_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agencies" ADD CONSTRAINT "agencies_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agency_followers" ADD CONSTRAINT "agency_followers_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agency_followers" ADD CONSTRAINT "agency_followers_agency_id_agencies_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agency_invitations" ADD CONSTRAINT "agency_invitations_agency_id_agencies_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agency_invitations" ADD CONSTRAINT "agency_invitations_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agency_memberships" ADD CONSTRAINT "agency_memberships_agency_id_agencies_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agency_memberships" ADD CONSTRAINT "agency_memberships_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "areas_city_name_uk" ON "areas" USING btree ("city","name");--> statement-breakpoint
CREATE UNIQUE INDEX "property_subtypes_category_slug_uk" ON "property_subtypes" USING btree ("category","slug");--> statement-breakpoint
CREATE UNIQUE INDEX "agencies_slug_uk" ON "agencies" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "agencies_owner_status_idx" ON "agencies" USING btree ("owner_user_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "agency_followers_user_agency_uk" ON "agency_followers" USING btree ("user_id","agency_id");--> statement-breakpoint
CREATE INDEX "agency_followers_agency_idx" ON "agency_followers" USING btree ("agency_id");--> statement-breakpoint
CREATE INDEX "agency_invitations_agency_idx" ON "agency_invitations" USING btree ("agency_id");--> statement-breakpoint
CREATE INDEX "agency_invitations_user_idx" ON "agency_invitations" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "agency_memberships_agency_user_uk" ON "agency_memberships" USING btree ("agency_id","user_id");--> statement-breakpoint
CREATE INDEX "agency_memberships_user_status_idx" ON "agency_memberships" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "agency_memberships_agency_status_idx" ON "agency_memberships" USING btree ("agency_id","status");--> statement-breakpoint
ALTER TABLE "listings" ADD CONSTRAINT "listings_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listings" ADD CONSTRAINT "listings_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listings" ADD CONSTRAINT "listings_agency_id_agencies_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listings" ADD CONSTRAINT "listings_property_subtype_id_property_subtypes_id_fk" FOREIGN KEY ("property_subtype_id") REFERENCES "public"."property_subtypes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listings" ADD CONSTRAINT "listings_area_id_areas_id_fk" FOREIGN KEY ("area_id") REFERENCES "public"."areas"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listings" DROP COLUMN "property_type";--> statement-breakpoint
ALTER TABLE "listings" DROP COLUMN "address_json";--> statement-breakpoint
ALTER TABLE "listings" DROP COLUMN "attributes";