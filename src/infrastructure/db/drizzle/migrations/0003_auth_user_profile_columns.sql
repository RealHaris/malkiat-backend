DO $$ BEGIN
  CREATE TYPE "public"."platform_role" AS ENUM('admin', 'user');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
ALTER TABLE "user"
  ADD COLUMN IF NOT EXISTS "platform_role" "platform_role" DEFAULT 'user',
  ADD COLUMN IF NOT EXISTS "is_active" boolean DEFAULT true;
--> statement-breakpoint
UPDATE "user" SET "platform_role" = 'user' WHERE "platform_role" IS NULL;
--> statement-breakpoint
UPDATE "user" SET "is_active" = true WHERE "is_active" IS NULL;
--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "platform_role" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "is_active" SET NOT NULL;
