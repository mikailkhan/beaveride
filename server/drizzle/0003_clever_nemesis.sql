ALTER TYPE "public"."activity_reason" ADD VALUE 'single_scope_limit' BEFORE 'idle_timeout';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_agent" boolean DEFAULT false NOT NULL;