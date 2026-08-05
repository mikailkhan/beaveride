CREATE TYPE "public"."agent_task_status" AS ENUM('assigned', 'planning', 'waiting', 'writing', 'verifying', 'completed', 'failed', 'cancelled');--> statement-breakpoint
CREATE TABLE "agent_tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"task_id" uuid NOT NULL,
	"room_id" integer NOT NULL,
	"assigned_by" integer NOT NULL,
	"agent_user_id" integer NOT NULL,
	"target_file_id" integer,
	"instruction" text NOT NULL,
	"status" "agent_task_status" DEFAULT 'assigned' NOT NULL,
	"current_stage" varchar(40) DEFAULT 'assigned' NOT NULL,
	"plan_summary" text,
	"generated_code" text,
	"failure_reason" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "agent_tasks" ADD CONSTRAINT "agent_tasks_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_tasks" ADD CONSTRAINT "agent_tasks_assigned_by_users_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_tasks" ADD CONSTRAINT "agent_tasks_agent_user_id_users_id_fk" FOREIGN KEY ("agent_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_tasks" ADD CONSTRAINT "agent_tasks_target_file_id_project_files_id_fk" FOREIGN KEY ("target_file_id") REFERENCES "public"."project_files"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "agent_tasks_task_id_idx" ON "agent_tasks" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "agent_tasks_room_status_idx" ON "agent_tasks" USING btree ("room_id","status");--> statement-breakpoint
CREATE INDEX "agent_tasks_room_created_idx" ON "agent_tasks" USING btree ("room_id","created_at");