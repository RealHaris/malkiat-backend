ALTER TYPE "public"."listing_status" RENAME TO "listing_status_old";

CREATE TYPE "public"."listing_status" AS ENUM('DRAFT', 'UNDER_REVIEW', 'PUBLISHED', 'UNPUBLISHED', 'DELETED');

ALTER TABLE "listings" ALTER COLUMN "status" DROP DEFAULT;

ALTER TABLE "listings"
ALTER COLUMN "status" TYPE "public"."listing_status"
USING (
  CASE
    WHEN "status"::text = 'ARCHIVED' THEN 'UNPUBLISHED'
    ELSE "status"::text
  END
)::"public"."listing_status";

ALTER TABLE "listings" ALTER COLUMN "status" SET DEFAULT 'DRAFT'::"public"."listing_status";

DROP TYPE "public"."listing_status_old";
