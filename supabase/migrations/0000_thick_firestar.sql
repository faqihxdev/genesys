CREATE TYPE "public"."feedback_satisfaction" AS ENUM('very-satisfied', 'satisfied', 'neutral', 'dissatisfied', 'very-dissatisfied');--> statement-breakpoint
CREATE TYPE "public"."feedback_status" AS ENUM('pending', 'in-review', 'planned', 'in-progress', 'completed', 'declined');--> statement-breakpoint
CREATE TYPE "public"."feedback_type" AS ENUM('bug', 'feature', 'improvement', 'other');--> statement-breakpoint
CREATE TYPE "public"."stage_item_type" AS ENUM('text', 'image', 'video');--> statement-breakpoint
CREATE TYPE "public"."invite_status" AS ENUM('pending', 'accepted', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."notification_category" AS ENUM('project', 'invite', 'support', 'feedback', 'simulation', 'system');--> statement-breakpoint
CREATE TYPE "public"."notification_priority" AS ENUM('low', 'medium', 'high', 'urgent');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('project_role_updated', 'project_deleted', 'project_updated', 'invite_received', 'invite_accepted', 'invite_rejected', 'support_status_updated', 'support_response_received', 'support_priority_updated', 'feedback_status_updated', 'feedback_response_received', 'simulation_completed', 'funnel_analysis_ready', 'performance_alert', 'system_maintenance', 'system_update');--> statement-breakpoint
CREATE TYPE "public"."persona_config_type" AS ENUM('preset', 'custom');--> statement-breakpoint
CREATE TYPE "public"."project_user_role" AS ENUM('owner', 'member');--> statement-breakpoint
CREATE TYPE "public"."queue_task_status" AS ENUM('pending', 'processing', 'completed', 'failed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."simulation_stage_status" AS ENUM('idle', 'processing', 'complete', 'error', 'skipped');--> statement-breakpoint
CREATE TYPE "public"."simulation_status" AS ENUM('idle', 'processing', 'complete', 'error', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."ticket_category" AS ENUM('technical', 'billing', 'feature', 'other');--> statement-breakpoint
CREATE TYPE "public"."ticket_priority" AS ENUM('low', 'medium', 'high');--> statement-breakpoint
CREATE TYPE "public"."ticket_status" AS ENUM('open', 'in-progress', 'waiting-for-customer', 'waiting-for-support', 'resolved', 'closed');--> statement-breakpoint
CREATE TABLE "feedback" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"feedback_type" "feedback_type" NOT NULL,
	"description" text NOT NULL,
	"feedback_satisfaction" "feedback_satisfaction" NOT NULL,
	"feedback_status" "feedback_status" DEFAULT 'pending' NOT NULL,
	"admin_response" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "funnels" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "stage_items" (
	"id" text PRIMARY KEY NOT NULL,
	"stage_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"stage_item_type" "stage_item_type" NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "stage_links" (
	"id" text PRIMARY KEY NOT NULL,
	"funnel_id" text NOT NULL,
	"from_stage_id" text NOT NULL,
	"to_stage_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "stages" (
	"id" text PRIMARY KEY NOT NULL,
	"funnel_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "project_invites" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"invited_user_id" text NOT NULL,
	"inviter_user_id" text NOT NULL,
	"invite_status" "invite_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "mailing_list" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "mailing_list_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"notification_category" "notification_category" NOT NULL,
	"notification_type" "notification_type" NOT NULL,
	"notification_priority" "notification_priority" DEFAULT 'low' NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"is_archived" boolean DEFAULT false NOT NULL,
	"action_url" text,
	"metadata" jsonb,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "persona_configs" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"persona_config_type" "persona_config_type" DEFAULT 'custom' NOT NULL,
	"size" integer NOT NULL,
	"constraints" text NOT NULL,
	"traits_config" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "personas" (
	"id" text PRIMARY KEY NOT NULL,
	"persona_config_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"traits" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "project_users" (
	"project_id" text NOT NULL,
	"user_id" text NOT NULL,
	"project_user_role" "project_user_role" DEFAULT 'member' NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "project_users_project_id_user_id_pk" PRIMARY KEY("project_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "queue_tasks" (
	"id" text PRIMARY KEY NOT NULL,
	"queue_name" text NOT NULL,
	"queue_task_status" "queue_task_status" DEFAULT 'pending' NOT NULL,
	"payload" jsonb NOT NULL,
	"processing_started_at" timestamp,
	"processing_completed_at" timestamp,
	"error_message" text,
	"error_details" jsonb,
	"retry_count" text DEFAULT '0',
	"visible_after" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "response_stages" (
	"id" text PRIMARY KEY NOT NULL,
	"simulation_id" text NOT NULL,
	"persona_id" text NOT NULL,
	"stage_id" text NOT NULL,
	"proceed" boolean DEFAULT false NOT NULL,
	"proceed_reason" text NOT NULL,
	"next_stage_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "responses" (
	"id" text PRIMARY KEY NOT NULL,
	"simulation_id" text NOT NULL,
	"persona_id" text NOT NULL,
	"stage_id" text NOT NULL,
	"stage_item_id" text NOT NULL,
	"response" text NOT NULL,
	"sentiment" numeric(3, 2) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "simulation_stages" (
	"simulation_id" text NOT NULL,
	"stage_id" text NOT NULL,
	"simulation_stage_status" "simulation_stage_status" DEFAULT 'idle' NOT NULL,
	"complete_count" integer DEFAULT 0 NOT NULL,
	"error" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "simulation_stages_simulation_id_stage_id_pk" PRIMARY KEY("simulation_id","stage_id")
);
--> statement-breakpoint
CREATE TABLE "simulations" (
	"id" text PRIMARY KEY NOT NULL,
	"funnel_id" text NOT NULL,
	"persona_config_id" text NOT NULL,
	"simulation_status" "simulation_status" DEFAULT 'idle' NOT NULL,
	"complete_count" integer DEFAULT 0 NOT NULL,
	"total_count" integer DEFAULT 0 NOT NULL,
	"parameters_json" text,
	"error" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "summary" (
	"id" text PRIMARY KEY NOT NULL,
	"simulation_id" text NOT NULL,
	"conversion_rate" numeric(3, 2) NOT NULL,
	"sentiment" numeric(3, 2) NOT NULL,
	"summary" text NOT NULL,
	"recommendation" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "summary_stage_items" (
	"id" text PRIMARY KEY NOT NULL,
	"simulation_id" text NOT NULL,
	"stage_item_id" text NOT NULL,
	"sentiment" numeric(3, 2) NOT NULL,
	"summary" text NOT NULL,
	"recommendation" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "summary_stages" (
	"id" text PRIMARY KEY NOT NULL,
	"simulation_id" text NOT NULL,
	"stage_id" text NOT NULL,
	"conversion_rate" numeric(3, 2) NOT NULL,
	"sentiment" numeric(3, 2) NOT NULL,
	"summary" text NOT NULL,
	"recommendation" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "support_tickets" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"subject" text NOT NULL,
	"ticket_category" "ticket_category" NOT NULL,
	"ticket_priority" "ticket_priority" NOT NULL,
	"description" text NOT NULL,
	"ticket_status" "ticket_status" DEFAULT 'open' NOT NULL,
	"last_response_at" timestamp,
	"resolved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "ticket_responses" (
	"id" text PRIMARY KEY NOT NULL,
	"ticket_id" text NOT NULL,
	"user_id" text NOT NULL,
	"message" text NOT NULL,
	"is_from_support" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "funnels" ADD CONSTRAINT "funnels_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stage_items" ADD CONSTRAINT "stage_items_stage_id_stages_id_fk" FOREIGN KEY ("stage_id") REFERENCES "public"."stages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stage_links" ADD CONSTRAINT "stage_links_funnel_id_funnels_id_fk" FOREIGN KEY ("funnel_id") REFERENCES "public"."funnels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stage_links" ADD CONSTRAINT "stage_links_from_stage_id_stages_id_fk" FOREIGN KEY ("from_stage_id") REFERENCES "public"."stages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stage_links" ADD CONSTRAINT "stage_links_to_stage_id_stages_id_fk" FOREIGN KEY ("to_stage_id") REFERENCES "public"."stages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stages" ADD CONSTRAINT "stages_funnel_id_funnels_id_fk" FOREIGN KEY ("funnel_id") REFERENCES "public"."funnels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_invites" ADD CONSTRAINT "project_invites_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "persona_configs" ADD CONSTRAINT "persona_configs_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personas" ADD CONSTRAINT "personas_persona_config_id_persona_configs_id_fk" FOREIGN KEY ("persona_config_id") REFERENCES "public"."persona_configs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_users" ADD CONSTRAINT "project_users_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "response_stages" ADD CONSTRAINT "response_stages_simulation_id_simulations_id_fk" FOREIGN KEY ("simulation_id") REFERENCES "public"."simulations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "response_stages" ADD CONSTRAINT "response_stages_persona_id_personas_id_fk" FOREIGN KEY ("persona_id") REFERENCES "public"."personas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "response_stages" ADD CONSTRAINT "response_stages_stage_id_stages_id_fk" FOREIGN KEY ("stage_id") REFERENCES "public"."stages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "response_stages" ADD CONSTRAINT "response_stages_next_stage_id_stages_id_fk" FOREIGN KEY ("next_stage_id") REFERENCES "public"."stages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "responses" ADD CONSTRAINT "responses_simulation_id_simulations_id_fk" FOREIGN KEY ("simulation_id") REFERENCES "public"."simulations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "responses" ADD CONSTRAINT "responses_persona_id_personas_id_fk" FOREIGN KEY ("persona_id") REFERENCES "public"."personas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "responses" ADD CONSTRAINT "responses_stage_id_stages_id_fk" FOREIGN KEY ("stage_id") REFERENCES "public"."stages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "responses" ADD CONSTRAINT "responses_stage_item_id_stage_items_id_fk" FOREIGN KEY ("stage_item_id") REFERENCES "public"."stage_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "simulation_stages" ADD CONSTRAINT "simulation_stages_simulation_id_simulations_id_fk" FOREIGN KEY ("simulation_id") REFERENCES "public"."simulations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "simulation_stages" ADD CONSTRAINT "simulation_stages_stage_id_stages_id_fk" FOREIGN KEY ("stage_id") REFERENCES "public"."stages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "simulations" ADD CONSTRAINT "simulations_funnel_id_funnels_id_fk" FOREIGN KEY ("funnel_id") REFERENCES "public"."funnels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "simulations" ADD CONSTRAINT "simulations_persona_config_id_persona_configs_id_fk" FOREIGN KEY ("persona_config_id") REFERENCES "public"."persona_configs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "summary" ADD CONSTRAINT "summary_simulation_id_simulations_id_fk" FOREIGN KEY ("simulation_id") REFERENCES "public"."simulations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "summary_stage_items" ADD CONSTRAINT "summary_stage_items_simulation_id_simulations_id_fk" FOREIGN KEY ("simulation_id") REFERENCES "public"."simulations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "summary_stage_items" ADD CONSTRAINT "summary_stage_items_stage_item_id_stage_items_id_fk" FOREIGN KEY ("stage_item_id") REFERENCES "public"."stage_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "summary_stages" ADD CONSTRAINT "summary_stages_simulation_id_simulations_id_fk" FOREIGN KEY ("simulation_id") REFERENCES "public"."simulations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "summary_stages" ADD CONSTRAINT "summary_stages_stage_id_stages_id_fk" FOREIGN KEY ("stage_id") REFERENCES "public"."stages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_responses" ADD CONSTRAINT "ticket_responses_ticket_id_support_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."support_tickets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "funnel_project_id_idx" ON "funnels" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "funnel_name_idx" ON "funnels" USING btree ("name");--> statement-breakpoint
CREATE INDEX "stage_item_stage_id_idx" ON "stage_items" USING btree ("stage_id");--> statement-breakpoint
CREATE INDEX "stage_item_name_idx" ON "stage_items" USING btree ("name");--> statement-breakpoint
CREATE INDEX "stage_item_type_idx" ON "stage_items" USING btree ("stage_item_type");--> statement-breakpoint
CREATE INDEX "stage_links_funnel_id_idx" ON "stage_links" USING btree ("funnel_id");--> statement-breakpoint
CREATE INDEX "stage_links_from_stage_id_idx" ON "stage_links" USING btree ("from_stage_id");--> statement-breakpoint
CREATE INDEX "stage_links_to_stage_id_idx" ON "stage_links" USING btree ("to_stage_id");--> statement-breakpoint
CREATE INDEX "stage_funnel_id_idx" ON "stages" USING btree ("funnel_id");--> statement-breakpoint
CREATE INDEX "stage_name_idx" ON "stages" USING btree ("name");--> statement-breakpoint
CREATE INDEX "project_invite_project_id_idx" ON "project_invites" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "project_invite_invited_user_id_idx" ON "project_invites" USING btree ("invited_user_id");--> statement-breakpoint
CREATE INDEX "project_invite_inviter_user_id_idx" ON "project_invites" USING btree ("inviter_user_id");--> statement-breakpoint
CREATE INDEX "project_invite_status_idx" ON "project_invites" USING btree ("invite_status");--> statement-breakpoint
CREATE INDEX "project_invite_project_invited_idx" ON "project_invites" USING btree ("project_id","invited_user_id");--> statement-breakpoint
CREATE INDEX "notification_user_id_idx" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notification_category_idx" ON "notifications" USING btree ("notification_category");--> statement-breakpoint
CREATE INDEX "notification_type_idx" ON "notifications" USING btree ("notification_type");--> statement-breakpoint
CREATE INDEX "notification_priority_idx" ON "notifications" USING btree ("notification_priority");--> statement-breakpoint
CREATE INDEX "notification_is_read_idx" ON "notifications" USING btree ("is_read");--> statement-breakpoint
CREATE INDEX "notification_is_archived_idx" ON "notifications" USING btree ("is_archived");--> statement-breakpoint
CREATE INDEX "notification_created_at_idx" ON "notifications" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "notification_user_status_idx" ON "notifications" USING btree ("user_id","is_read","is_archived");--> statement-breakpoint
CREATE INDEX "notification_user_priority_idx" ON "notifications" USING btree ("user_id","notification_priority");--> statement-breakpoint
CREATE INDEX "persona_config_project_id_idx" ON "persona_configs" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "persona_config_name_idx" ON "persona_configs" USING btree ("name");--> statement-breakpoint
CREATE INDEX "persona_config_type_idx" ON "persona_configs" USING btree ("persona_config_type");--> statement-breakpoint
CREATE INDEX "persona_persona_config_id_idx" ON "personas" USING btree ("persona_config_id");--> statement-breakpoint
CREATE INDEX "persona_name_idx" ON "personas" USING btree ("name");--> statement-breakpoint
CREATE INDEX "project_project_id_idx" ON "project_users" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "project_user_id_idx" ON "project_users" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "project_user_default_idx" ON "project_users" USING btree ("user_id","is_default");--> statement-breakpoint
CREATE INDEX "project_name_idx" ON "projects" USING btree ("name");--> statement-breakpoint
CREATE INDEX "queue_tasks_queue_name_idx" ON "queue_tasks" USING btree ("queue_name");--> statement-breakpoint
CREATE INDEX "queue_tasks_status_idx" ON "queue_tasks" USING btree ("queue_task_status");--> statement-breakpoint
CREATE INDEX "queue_tasks_visible_after_idx" ON "queue_tasks" USING btree ("visible_after");--> statement-breakpoint
CREATE INDEX "queue_tasks_created_at_idx" ON "queue_tasks" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "response_stage_simulation_id_idx" ON "response_stages" USING btree ("simulation_id");--> statement-breakpoint
CREATE INDEX "response_stage_persona_id_idx" ON "response_stages" USING btree ("persona_id");--> statement-breakpoint
CREATE INDEX "response_stage_stage_id_idx" ON "response_stages" USING btree ("stage_id");--> statement-breakpoint
CREATE INDEX "response_stage_proceed_idx" ON "response_stages" USING btree ("proceed");--> statement-breakpoint
CREATE INDEX "response_stage_next_stage_id_idx" ON "response_stages" USING btree ("next_stage_id");--> statement-breakpoint
CREATE INDEX "response_simulation_id_idx" ON "responses" USING btree ("simulation_id");--> statement-breakpoint
CREATE INDEX "response_persona_id_idx" ON "responses" USING btree ("persona_id");--> statement-breakpoint
CREATE INDEX "response_stage_id_idx" ON "responses" USING btree ("stage_id");--> statement-breakpoint
CREATE INDEX "response_stage_item_id_idx" ON "responses" USING btree ("stage_item_id");--> statement-breakpoint
CREATE INDEX "response_sentiment_idx" ON "responses" USING btree ("sentiment");--> statement-breakpoint
CREATE INDEX "simulation_stage_simulation_id_idx" ON "simulation_stages" USING btree ("simulation_id");--> statement-breakpoint
CREATE INDEX "simulation_stage_stage_id_idx" ON "simulation_stages" USING btree ("stage_id");--> statement-breakpoint
CREATE INDEX "simulation_stage_status_idx" ON "simulation_stages" USING btree ("simulation_stage_status");--> statement-breakpoint
CREATE INDEX "simulation_funnel_id_idx" ON "simulations" USING btree ("funnel_id");--> statement-breakpoint
CREATE INDEX "simulation_persona_config_id_idx" ON "simulations" USING btree ("persona_config_id");--> statement-breakpoint
CREATE INDEX "simulation_status_idx" ON "simulations" USING btree ("simulation_status");--> statement-breakpoint
CREATE INDEX "summary_simulation_id_idx" ON "summary" USING btree ("simulation_id");--> statement-breakpoint
CREATE INDEX "summary_conversion_rate_idx" ON "summary" USING btree ("conversion_rate");--> statement-breakpoint
CREATE INDEX "summary_sentiment_idx" ON "summary" USING btree ("sentiment");--> statement-breakpoint
CREATE INDEX "summary_stage_item_simulation_id_idx" ON "summary_stage_items" USING btree ("simulation_id");--> statement-breakpoint
CREATE INDEX "summary_stage_item_stage_item_id_idx" ON "summary_stage_items" USING btree ("stage_item_id");--> statement-breakpoint
CREATE INDEX "summary_stage_item_sentiment_idx" ON "summary_stage_items" USING btree ("sentiment");--> statement-breakpoint
CREATE INDEX "summary_stage_simulation_id_idx" ON "summary_stages" USING btree ("simulation_id");--> statement-breakpoint
CREATE INDEX "summary_stage_stage_id_idx" ON "summary_stages" USING btree ("stage_id");--> statement-breakpoint
CREATE INDEX "summary_stage_conversion_rate_idx" ON "summary_stages" USING btree ("conversion_rate");--> statement-breakpoint
CREATE INDEX "summary_stage_sentiment_idx" ON "summary_stages" USING btree ("sentiment");