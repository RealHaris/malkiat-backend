DO $$ BEGIN
  CREATE TYPE "public"."agency_status" AS ENUM('active', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."agency_membership_role" AS ENUM('owner', 'agent');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."agency_membership_status" AS ENUM('active', 'removed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "agencies" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "slug" text NOT NULL,
  "description" text,
  "logo_url" text,
  "owner_user_id" text NOT NULL,
  "status" "agency_status" DEFAULT 'active' NOT NULL,
  "created_by_user_id" text NOT NULL,
  "archived_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "agencies_slug_uk" ON "agencies" USING btree ("slug");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "agencies_owner_status_idx" ON "agencies" USING btree ("owner_user_id", "status");
--> statement-breakpoint

DO $$ BEGIN
  ALTER TABLE "agencies" ADD CONSTRAINT "agencies_owner_user_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."user"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "agencies" ADD CONSTRAINT "agencies_created_by_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "agency_memberships" (
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

CREATE UNIQUE INDEX IF NOT EXISTS "agency_memberships_agency_user_uk" ON "agency_memberships" USING btree ("agency_id", "user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "agency_memberships_user_status_idx" ON "agency_memberships" USING btree ("user_id", "status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "agency_memberships_agency_status_idx" ON "agency_memberships" USING btree ("agency_id", "status");
--> statement-breakpoint

DO $$ BEGIN
  ALTER TABLE "agency_memberships" ADD CONSTRAINT "agency_memberships_agency_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "agency_memberships" ADD CONSTRAINT "agency_memberships_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint

ALTER TABLE "listings"
  ADD COLUMN IF NOT EXISTS "created_by_user_id" text,
  ADD COLUMN IF NOT EXISTS "agency_id" uuid;
--> statement-breakpoint

UPDATE "listings" SET "created_by_user_id" = "owner_id" WHERE "created_by_user_id" IS NULL;
--> statement-breakpoint
ALTER TABLE "listings" ALTER COLUMN "created_by_user_id" SET NOT NULL;
--> statement-breakpoint

DO $$ BEGIN
  ALTER TABLE "listings" ADD CONSTRAINT "listings_created_by_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "listings" ADD CONSTRAINT "listings_agency_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
