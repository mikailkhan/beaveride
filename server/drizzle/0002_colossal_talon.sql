CREATE TYPE "public"."activity_actor_type" AS ENUM('human', 'agent', 'system');--> statement-breakpoint
CREATE TYPE "public"."activity_event_type" AS ENUM('lock_requested', 'lock_granted', 'lock_denied', 'lock_queued', 'lock_queue_position_changed', 'lock_queue_withdrawn', 'lock_queue_promoted', 'lock_waiter_notified', 'lock_released_explicit', 'lock_released_idle_timeout', 'lock_released_heartbeat_loss', 'lock_released_disconnect', 'lock_released_target_deleted', 'write_applied', 'write_rejected_stale', 'write_regenerated', 'write_refused_out_of_scope', 'write_failed', 'agent_task_assigned', 'agent_task_accepted', 'agent_stage_planning', 'agent_stage_waiting', 'agent_stage_writing', 'agent_stage_verifying', 'agent_task_completed', 'agent_task_failed', 'agent_task_cancelled', 'participant_joined', 'participant_left', 'participant_disconnected', 'participant_reconnected', 'participant_heartbeat_lost', 'file_opened_read', 'file_opened_edit', 'file_closed', 'file_created', 'file_renamed', 'file_deleted', 'code_edited', 'global_run_started', 'global_run_ended', 'member_role_changed', 'member_run_toggled', 'member_kicked');--> statement-breakpoint
CREATE TYPE "public"."activity_lock_scope" AS ENUM('file', 'function');--> statement-breakpoint
CREATE TYPE "public"."activity_outcome" AS ENUM('granted', 'denied', 'queued', 'expired', 'revoked', 'applied', 'rejected', 'promoted', 'withdrawn', 'completed', 'failed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."activity_reason" AS ENUM('overlap_conflict', 'idle_timeout', 'heartbeat_loss', 'disconnect', 'target_deleted', 'stale_version', 'out_of_scope', 'execution_error', 'cancelled_by_participant', 'retry_exhausted', 'unknown');--> statement-breakpoint
CREATE TABLE "activity_events" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "activity_events_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"event_id" uuid NOT NULL,
	"room_id" integer NOT NULL,
	"seq" bigint NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"actor_id" integer,
	"actor_name" varchar(80) NOT NULL,
	"actor_type" "activity_actor_type" NOT NULL,
	"event_type" "activity_event_type" NOT NULL,
	"target_file_id" integer,
	"target_scope" "activity_lock_scope",
	"target_unit_name" varchar(255),
	"outcome" "activity_outcome",
	"reason" "activity_reason",
	"correlation_id" uuid,
	"version_ref" text,
	"version_produced" text,
	"metadata" jsonb
);
--> statement-breakpoint
ALTER TABLE "activity_events" ADD CONSTRAINT "activity_events_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_events" ADD CONSTRAINT "activity_events_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_events" ADD CONSTRAINT "activity_events_target_file_id_project_files_id_fk" FOREIGN KEY ("target_file_id") REFERENCES "public"."project_files"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "activity_events_event_id_idx" ON "activity_events" USING btree ("event_id");--> statement-breakpoint
CREATE UNIQUE INDEX "activity_events_room_seq_idx" ON "activity_events" USING btree ("room_id","seq");--> statement-breakpoint
CREATE INDEX "activity_events_room_occurred_idx" ON "activity_events" USING btree ("room_id","occurred_at");--> statement-breakpoint
CREATE INDEX "activity_events_actor_idx" ON "activity_events" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX "activity_events_actor_type_idx" ON "activity_events" USING btree ("actor_type");--> statement-breakpoint
CREATE INDEX "activity_events_file_idx" ON "activity_events" USING btree ("target_file_id");--> statement-breakpoint
CREATE INDEX "activity_events_event_type_idx" ON "activity_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "activity_events_outcome_idx" ON "activity_events" USING btree ("outcome");--> statement-breakpoint
CREATE INDEX "activity_events_correlation_idx" ON "activity_events" USING btree ("correlation_id");