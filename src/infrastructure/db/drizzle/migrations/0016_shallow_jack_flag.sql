ALTER TABLE "listings" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "listings" ALTER COLUMN "status" SET DEFAULT 'DRAFT'::text;--> statement-breakpoint
DROP TYPE "public"."listing_status";--> statement-breakpoint
CREATE TYPE "public"."listing_status" AS ENUM('DRAFT', 'UNDER_REVIEW', 'PUBLISHED', 'UNPUBLISHED', 'DELETED');--> statement-breakpoint
ALTER TABLE "listings" ALTER COLUMN "status" SET DEFAULT 'DRAFT'::"public"."listing_status";--> statement-breakpoint
ALTER TABLE "listings" ALTER COLUMN "status" SET DATA TYPE "public"."listing_status" USING "status"::"public"."listing_status";--> statement-breakpoint
ALTER TABLE "agencies" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "agencies" ALTER COLUMN "status" SET DEFAULT 'active'::text;--> statement-breakpoint
DROP TYPE "public"."agency_status";--> statement-breakpoint
CREATE TYPE "public"."agency_status" AS ENUM('active', 'inactive');--> statement-breakpoint
ALTER TABLE "agencies" ALTER COLUMN "status" SET DEFAULT 'active'::"public"."agency_status";--> statement-breakpoint
UPDATE "agencies" SET "status" = 'inactive' WHERE "status" = 'archived';--> statement-breakpoint
ALTER TABLE "agencies" ALTER COLUMN "status" SET DATA TYPE "public"."agency_status" USING "status"::"public"."agency_status";