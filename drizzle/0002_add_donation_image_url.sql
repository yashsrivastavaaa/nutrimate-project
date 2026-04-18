ALTER TABLE "donations" ADD COLUMN "image_url" text;--> statement-breakpoint
UPDATE "donations" SET "image_url" = '' WHERE "image_url" IS NULL;--> statement-breakpoint
ALTER TABLE "donations" ALTER COLUMN "image_url" SET NOT NULL;
