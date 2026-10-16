ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "pro_until" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "pro_plan" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "stripe_subscription_id" text;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_stripe_subscription_idx" ON "users" USING btree ("stripe_subscription_id");--> statement-breakpoint
UPDATE "users" SET "pro_plan" = CASE WHEN "pro_source" = 'promo' THEN 'promo' ELSE 'cycle' END WHERE "is_pro" = true AND "pro_plan" IS NULL;
