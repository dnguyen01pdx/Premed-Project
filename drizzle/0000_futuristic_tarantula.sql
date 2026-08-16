CREATE TYPE "public"."limit_unit" AS ENUM('words', 'characters', 'none');--> statement-breakpoint
CREATE TABLE "prompt_types" (
	"id" text PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"label" text NOT NULL,
	"description" text,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prompts" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"cycle_year" text NOT NULL,
	"text" text NOT NULL,
	"prompt_type_id" text,
	"limit_value" integer,
	"limit_unit" "limit_unit" DEFAULT 'none' NOT NULL,
	"confirmed" boolean DEFAULT false NOT NULL,
	"confirmed_at" timestamp with time zone,
	"optional" boolean DEFAULT false NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"source" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "schools" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"short_name" text,
	"city" text,
	"state" text,
	"degree" text DEFAULT 'MD' NOT NULL,
	"website_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "prompts" ADD CONSTRAINT "prompts_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prompts" ADD CONSTRAINT "prompts_prompt_type_id_prompt_types_id_fk" FOREIGN KEY ("prompt_type_id") REFERENCES "public"."prompt_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "prompt_types_key_idx" ON "prompt_types" USING btree ("key");--> statement-breakpoint
CREATE INDEX "prompts_school_cycle_idx" ON "prompts" USING btree ("school_id","cycle_year");--> statement-breakpoint
CREATE INDEX "prompts_cycle_idx" ON "prompts" USING btree ("cycle_year");--> statement-breakpoint
CREATE INDEX "prompts_type_idx" ON "prompts" USING btree ("prompt_type_id");--> statement-breakpoint
CREATE INDEX "prompts_confirmed_idx" ON "prompts" USING btree ("confirmed");--> statement-breakpoint
CREATE UNIQUE INDEX "schools_slug_idx" ON "schools" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "schools_state_idx" ON "schools" USING btree ("state");--> statement-breakpoint
CREATE INDEX "schools_name_idx" ON "schools" USING btree ("name");