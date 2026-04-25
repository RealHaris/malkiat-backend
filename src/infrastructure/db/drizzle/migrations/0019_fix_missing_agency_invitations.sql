-- 0019: Backfill agency_invitations for environments that missed earlier migrations

DO $$ BEGIN
  CREATE TYPE "public"."agency_membership_role" AS ENUM('owner', 'co-owner', 'admin', 'manager', 'agent');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint

DO $$ BEGIN
  CREATE TYPE "public"."agency_invite_status" AS ENUM('pending', 'accepted', 'declined');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint

DO $$ BEGIN
  CREATE TYPE "public"."agency_invite_token_cleared_reason" AS ENUM('expired', 'revoked', 'accepted', 'declined');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "agency_invitations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "agency_id" uuid NOT NULL,
  "user_id" text,
  "invitee_email" text,
  "role" "agency_membership_role" DEFAULT 'agent' NOT NULL,
  "status" "agency_invite_status" DEFAULT 'pending' NOT NULL,
  "token_hash" text,
  "expires_at" timestamp with time zone,
  "token_cleared_at" timestamp with time zone,
  "token_cleared_reason" "public"."agency_invite_token_cleared_reason",
  "accepted_by_user_id" text,
  "accepted_at" timestamp with time zone,
  "resend_count" integer DEFAULT 0 NOT NULL,
  "last_sent_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

DO $$ BEGIN
  ALTER TABLE "agency_invitations"
    ADD CONSTRAINT "agency_invitations_agency_id_agencies_id_fk"
    FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint

DO $$ BEGIN
  ALTER TABLE "agency_invitations"
    ADD CONSTRAINT "agency_invitations_user_id_user_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint

DO $$ BEGIN
  ALTER TABLE "agency_invitations"
    ADD CONSTRAINT "agency_invitations_accepted_by_user_id_user_id_fk"
    FOREIGN KEY ("accepted_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint

ALTER TABLE "agency_invitations" ALTER COLUMN "user_id" DROP NOT NULL;
--> statement-breakpoint

ALTER TABLE "agency_invitations" ADD COLUMN IF NOT EXISTS "invitee_email" text;
--> statement-breakpoint

ALTER TABLE "agency_invitations" ADD COLUMN IF NOT EXISTS "token_hash" text;
--> statement-breakpoint

ALTER TABLE "agency_invitations" ADD COLUMN IF NOT EXISTS "expires_at" timestamp with time zone;
--> statement-breakpoint

ALTER TABLE "agency_invitations" ADD COLUMN IF NOT EXISTS "token_cleared_at" timestamp with time zone;
--> statement-breakpoint

ALTER TABLE "agency_invitations" ADD COLUMN IF NOT EXISTS "token_cleared_reason" "public"."agency_invite_token_cleared_reason";
--> statement-breakpoint

ALTER TABLE "agency_invitations" ADD COLUMN IF NOT EXISTS "accepted_by_user_id" text;
--> statement-breakpoint

ALTER TABLE "agency_invitations" ADD COLUMN IF NOT EXISTS "accepted_at" timestamp with time zone;
--> statement-breakpoint

ALTER TABLE "agency_invitations" ADD COLUMN IF NOT EXISTS "resend_count" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint

ALTER TABLE "agency_invitations" ADD COLUMN IF NOT EXISTS "last_sent_at" timestamp with time zone;
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "agency_invitations_agency_idx" ON "agency_invitations" USING btree ("agency_id");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "agency_invitations_user_idx" ON "agency_invitations" USING btree ("user_id");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "agency_invitations_invitee_email_idx" ON "agency_invitations" USING btree ("invitee_email");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "agency_invitations_token_hash_idx" ON "agency_invitations" USING btree ("token_hash");
