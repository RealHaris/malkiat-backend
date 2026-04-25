-- 0020: Backfill agency_followers for environments that missed earlier migrations

CREATE TABLE IF NOT EXISTS "agency_followers" (
  "user_id" text NOT NULL,
  "agency_id" uuid NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

DO $$ BEGIN
  ALTER TABLE "agency_followers"
    ADD CONSTRAINT "agency_followers_user_id_user_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint

DO $$ BEGIN
  ALTER TABLE "agency_followers"
    ADD CONSTRAINT "agency_followers_agency_id_agencies_id_fk"
    FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "agency_followers_user_agency_uk"
  ON "agency_followers" USING btree ("user_id", "agency_id");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "agency_followers_agency_idx"
  ON "agency_followers" USING btree ("agency_id");
