CREATE TYPE "public"."file_node_type" AS ENUM('file', 'directory');--> statement-breakpoint
CREATE TABLE "project_files" (
	"id" serial PRIMARY KEY NOT NULL,
	"room_id" integer NOT NULL,
	"parent_id" integer,
	"name" varchar(255) NOT NULL,
	"type" "file_node_type" NOT NULL,
	"content" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "project_files" ADD CONSTRAINT "project_files_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "project_files_room_parent_idx" ON "project_files" USING btree ("room_id","parent_id");--> statement-breakpoint
CREATE UNIQUE INDEX "project_files_unique_name_idx" ON "project_files" USING btree ("room_id","parent_id","name");