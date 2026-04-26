-- 0017: Agency invitations – email-token invite flow
-- 1. Create the new enum for token cleared reasons (skip if already exists from schema)
DO $$ BEGIN
  CREATE TYPE "public"."agency_invite_token_cleared_reason" AS ENUM('expired', 'revoked', 'accepted', 'declined');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint

-- 2. Make user_id nullable (was NOT NULL in 0015)
ALTER TABLE "agency_invitations" ALTER COLUMN "user_id" DROP NOT NULL;
--> statement-breakpoint

-- 3. Drop the old NOT NULL FK constraint and re-add as nullable FK
-- (the FK itself stays, just nullability change above is sufficient in PG)

-- 4. Add invitee_email column
ALTER TABLE "agency_invitations" ADD COLUMN IF NOT EXISTS "invitee_email" text;
--> statement-breakpoint

-- 5. Add token_hash column
ALTER TABLE "agency_invitations" ADD COLUMN IF NOT EXISTS "token_hash" text;
--> statement-breakpoint

-- 6. Add expires_at column
ALTER TABLE "agency_invitations" ADD COLUMN IF NOT EXISTS "expires_at" timestamp with time zone;
--> statement-breakpoint

-- 7. Add token_cleared_at column
ALTER TABLE "agency_invitations" ADD COLUMN IF NOT EXISTS "token_cleared_at" timestamp with time zone;
--> statement-breakpoint

-- 8. Add token_cleared_reason column
ALTER TABLE "agency_invitations" ADD COLUMN IF NOT EXISTS "token_cleared_reason" "public"."agency_invite_token_cleared_reason";
--> statement-breakpoint

-- 9. Add accepted_by_user_id column
ALTER TABLE "agency_invitations" ADD COLUMN IF NOT EXISTS "accepted_by_user_id" text REFERENCES "public"."user"("id") ON DELETE SET NULL;
--> statement-breakpoint

-- 10. Add accepted_at column
ALTER TABLE "agency_invitations" ADD COLUMN IF NOT EXISTS "accepted_at" timestamp with time zone;
--> statement-breakpoint

-- 11. Add resend_count column
ALTER TABLE "agency_invitations" ADD COLUMN IF NOT EXISTS "resend_count" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint

-- 12. Add last_sent_at column
ALTER TABLE "agency_invitations" ADD COLUMN IF NOT EXISTS "last_sent_at" timestamp with time zone;
--> statement-breakpoint

-- 13. Add indexes for new columns
CREATE INDEX IF NOT EXISTS "agency_invitations_invitee_email_idx" ON "agency_invitations" USING btree ("invitee_email");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "agency_invitations_token_hash_idx" ON "agency_invitations" USING btree ("token_hash");
