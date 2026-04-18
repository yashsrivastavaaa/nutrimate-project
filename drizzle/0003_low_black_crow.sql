CREATE TYPE "public"."ngo_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."volunteer_approval_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TABLE "favorite_ngos" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"ngo_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "donations" ADD COLUMN "image_url" text NOT NULL;--> statement-breakpoint
ALTER TABLE "ngo" ADD COLUMN "status" "ngo_status" DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "volunteers" ADD COLUMN "approval_status" "volunteer_approval_status" DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "favorite_ngos" ADD CONSTRAINT "favorite_ngos_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorite_ngos" ADD CONSTRAINT "favorite_ngos_ngo_id_ngo_ngo_id_fk" FOREIGN KEY ("ngo_id") REFERENCES "public"."ngo"("ngo_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "favorite_ngos_user_id_ngo_id_unique" ON "favorite_ngos" USING btree ("user_id","ngo_id");