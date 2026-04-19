CREATE TABLE "favorite_donors" (
	"id" serial PRIMARY KEY NOT NULL,
	"ngo_id" integer NOT NULL,
	"donor_id" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "ngo" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "ngo" ADD COLUMN "contact_number" text;--> statement-breakpoint
ALTER TABLE "ngo" ADD COLUMN "families_served" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "ngo" ADD COLUMN "donations_received" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_verified" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "donation_count" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "favorite_donors" ADD CONSTRAINT "favorite_donors_ngo_id_ngo_ngo_id_fk" FOREIGN KEY ("ngo_id") REFERENCES "public"."ngo"("ngo_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorite_donors" ADD CONSTRAINT "favorite_donors_donor_id_users_id_fk" FOREIGN KEY ("donor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "favorite_donors_ngo_id_donor_id_unique" ON "favorite_donors" USING btree ("ngo_id","donor_id");