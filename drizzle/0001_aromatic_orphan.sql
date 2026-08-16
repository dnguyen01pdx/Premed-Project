CREATE TYPE "public"."submission_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TABLE "prompt_submissions" (
	"id" text PRIMARY KEY NOT NULL,
	"school_slug" text,
	"school_name_raw" text NOT NULL,
	"cycle_year" text NOT NULL,
	"prompt_text" text NOT NULL,
	"limit_value" integer,
	"limit_unit" "limit_unit" DEFAULT 'none' NOT NULL,
	"note" text,
	"contact_email" text,
	"status" "submission_status" DEFAULT 'pending' NOT NULL,
	"submitter_hash" text,
	"review_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reviewed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX "prompt_submissions_status_idx" ON "prompt_submissions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "prompt_submissions_created_idx" ON "prompt_submissions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "prompt_submissions_hash_idx" ON "prompt_submissions" USING btree ("submitter_hash");