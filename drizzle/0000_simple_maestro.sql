CREATE TYPE "public"."donation_status" AS ENUM('available', 'reserved', 'pickup_assigned', 'picked', 'delivered_to_ngo', 'completed');--> statement-breakpoint
CREATE TYPE "public"."request_status" AS ENUM('pending', 'accepted', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('donor', 'ngo', 'volunteer', 'admin');--> statement-breakpoint
CREATE TABLE "donation_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"donation_id" text NOT NULL,
	"ngo_id" integer NOT NULL,
	"status" "request_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "donations" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"ngo_id" integer,
	"volunteer_id" text,
	"title" text NOT NULL,
	"description" text,
	"quantity" text,
	"food_type" text,
	"pickup_address" text,
	"latitude" double precision,
	"longitude" double precision,
	"contact_number" text,
	"expiry_time" timestamp,
	"pickup_time" timestamp,
	"status" "donation_status" DEFAULT 'available' NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ngo" (
	"ngo_id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"password" text NOT NULL,
	"ngo_name" varchar(255) NOT NULL,
	"state" varchar(100) NOT NULL,
	"city" varchar(100) NOT NULL,
	"address_line1" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "ngo_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"full_name" text NOT NULL,
	"email" text NOT NULL,
	"role" "user_role" DEFAULT 'donor' NOT NULL,
	"phone" text,
	"gender" text,
	"avatar_type" text,
	"password" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "volunteers" (
	"id" text PRIMARY KEY NOT NULL,
	"ngo_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "donation_requests" ADD CONSTRAINT "donation_requests_donation_id_donations_id_fk" FOREIGN KEY ("donation_id") REFERENCES "public"."donations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "donation_requests" ADD CONSTRAINT "donation_requests_ngo_id_ngo_ngo_id_fk" FOREIGN KEY ("ngo_id") REFERENCES "public"."ngo"("ngo_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "donations" ADD CONSTRAINT "donations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "donations" ADD CONSTRAINT "donations_ngo_id_ngo_ngo_id_fk" FOREIGN KEY ("ngo_id") REFERENCES "public"."ngo"("ngo_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "donations" ADD CONSTRAINT "donations_volunteer_id_volunteers_id_fk" FOREIGN KEY ("volunteer_id") REFERENCES "public"."volunteers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "volunteers" ADD CONSTRAINT "volunteers_ngo_id_ngo_ngo_id_fk" FOREIGN KEY ("ngo_id") REFERENCES "public"."ngo"("ngo_id") ON DELETE no action ON UPDATE no action;