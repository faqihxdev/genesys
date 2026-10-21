CREATE TABLE `auth_accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`user_id` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` integer,
	`refresh_token_expires_at` integer,
	`scope` text,
	`password` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `auth_users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `auth_accounts_user_idx` ON `auth_accounts` (`user_id`);--> statement-breakpoint
CREATE TABLE `auth_rate_limits` (
	`id` text PRIMARY KEY NOT NULL,
	`key` text NOT NULL,
	`count` integer NOT NULL,
	`last_request` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `auth_rate_limits_key_unique` ON `auth_rate_limits` (`key`);--> statement-breakpoint
CREATE TABLE `auth_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`token` text NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `auth_users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `auth_sessions_token_unique` ON `auth_sessions` (`token`);--> statement-breakpoint
CREATE INDEX `auth_sessions_user_idx` ON `auth_sessions` (`user_id`);--> statement-breakpoint
CREATE TABLE `auth_users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`image` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `auth_users_email_unique` ON `auth_users` (`email`);--> statement-breakpoint
CREATE TABLE `auth_verifications` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `auth_verifications_identifier_idx` ON `auth_verifications` (`identifier`);--> statement-breakpoint
CREATE TABLE `feedback` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`feedback_type` text NOT NULL,
	`description` text NOT NULL,
	`feedback_satisfaction` text NOT NULL,
	`feedback_status` text DEFAULT 'pending' NOT NULL,
	`admin_response` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer
);
--> statement-breakpoint
CREATE TABLE `funnels` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `funnel_project_id_idx` ON `funnels` (`project_id`);--> statement-breakpoint
CREATE INDEX `funnel_name_idx` ON `funnels` (`name`);--> statement-breakpoint
CREATE TABLE `stage_items` (
	`id` text PRIMARY KEY NOT NULL,
	`stage_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`stage_item_type` text NOT NULL,
	`content` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`stage_id`) REFERENCES `stages`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `stage_item_stage_id_idx` ON `stage_items` (`stage_id`);--> statement-breakpoint
CREATE INDEX `stage_item_name_idx` ON `stage_items` (`name`);--> statement-breakpoint
CREATE INDEX `stage_item_type_idx` ON `stage_items` (`stage_item_type`);--> statement-breakpoint
CREATE TABLE `stage_links` (
	`id` text PRIMARY KEY NOT NULL,
	`funnel_id` text NOT NULL,
	`from_stage_id` text NOT NULL,
	`to_stage_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`funnel_id`) REFERENCES `funnels`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`from_stage_id`) REFERENCES `stages`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`to_stage_id`) REFERENCES `stages`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `stage_links_funnel_id_idx` ON `stage_links` (`funnel_id`);--> statement-breakpoint
CREATE INDEX `stage_links_from_stage_id_idx` ON `stage_links` (`from_stage_id`);--> statement-breakpoint
CREATE INDEX `stage_links_to_stage_id_idx` ON `stage_links` (`to_stage_id`);--> statement-breakpoint
CREATE TABLE `stages` (
	`id` text PRIMARY KEY NOT NULL,
	`funnel_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`funnel_id`) REFERENCES `funnels`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `stage_funnel_id_idx` ON `stages` (`funnel_id`);--> statement-breakpoint
CREATE INDEX `stage_name_idx` ON `stages` (`name`);--> statement-breakpoint
CREATE TABLE `project_invites` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`invited_user_id` text NOT NULL,
	`inviter_user_id` text NOT NULL,
	`invite_status` text DEFAULT 'pending' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `project_invite_project_id_idx` ON `project_invites` (`project_id`);--> statement-breakpoint
CREATE INDEX `project_invite_invited_user_id_idx` ON `project_invites` (`invited_user_id`);--> statement-breakpoint
CREATE INDEX `project_invite_inviter_user_id_idx` ON `project_invites` (`inviter_user_id`);--> statement-breakpoint
CREATE INDEX `project_invite_status_idx` ON `project_invites` (`invite_status`);--> statement-breakpoint
CREATE INDEX `project_invite_project_invited_idx` ON `project_invites` (`project_id`,`invited_user_id`);--> statement-breakpoint
CREATE TABLE `mailing_list` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`description` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `mailing_list_email_unique` ON `mailing_list` (`email`);--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`notification_category` text NOT NULL,
	`notification_type` text NOT NULL,
	`notification_priority` text DEFAULT 'low' NOT NULL,
	`title` text NOT NULL,
	`message` text NOT NULL,
	`is_read` integer DEFAULT false NOT NULL,
	`is_archived` integer DEFAULT false NOT NULL,
	`action_url` text,
	`metadata` text,
	`expires_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer
);
--> statement-breakpoint
CREATE INDEX `notification_user_id_idx` ON `notifications` (`user_id`);--> statement-breakpoint
CREATE INDEX `notification_category_idx` ON `notifications` (`notification_category`);--> statement-breakpoint
CREATE INDEX `notification_type_idx` ON `notifications` (`notification_type`);--> statement-breakpoint
CREATE INDEX `notification_priority_idx` ON `notifications` (`notification_priority`);--> statement-breakpoint
CREATE INDEX `notification_is_read_idx` ON `notifications` (`is_read`);--> statement-breakpoint
CREATE INDEX `notification_is_archived_idx` ON `notifications` (`is_archived`);--> statement-breakpoint
CREATE INDEX `notification_created_at_idx` ON `notifications` (`created_at`);--> statement-breakpoint
CREATE INDEX `notification_user_status_idx` ON `notifications` (`user_id`,`is_read`,`is_archived`);--> statement-breakpoint
CREATE INDEX `notification_user_priority_idx` ON `notifications` (`user_id`,`notification_priority`);--> statement-breakpoint
CREATE TABLE `persona_configs` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`persona_config_type` text DEFAULT 'custom' NOT NULL,
	`size` integer NOT NULL,
	`constraints` text NOT NULL,
	`traits_config` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `persona_config_project_id_idx` ON `persona_configs` (`project_id`);--> statement-breakpoint
CREATE INDEX `persona_config_name_idx` ON `persona_configs` (`name`);--> statement-breakpoint
CREATE INDEX `persona_config_type_idx` ON `persona_configs` (`persona_config_type`);--> statement-breakpoint
CREATE TABLE `personas` (
	`id` text PRIMARY KEY NOT NULL,
	`persona_config_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`traits` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`persona_config_id`) REFERENCES `persona_configs`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `persona_persona_config_id_idx` ON `personas` (`persona_config_id`);--> statement-breakpoint
CREATE INDEX `persona_name_idx` ON `personas` (`name`);--> statement-breakpoint
CREATE TABLE `project_users` (
	`project_id` text NOT NULL,
	`user_id` text NOT NULL,
	`project_user_role` text DEFAULT 'member' NOT NULL,
	`is_default` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	PRIMARY KEY(`project_id`, `user_id`),
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `project_project_id_idx` ON `project_users` (`project_id`);--> statement-breakpoint
CREATE INDEX `project_user_id_idx` ON `project_users` (`user_id`);--> statement-breakpoint
CREATE INDEX `project_user_default_idx` ON `project_users` (`user_id`,`is_default`);--> statement-breakpoint
CREATE TABLE `projects` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer
);
--> statement-breakpoint
CREATE INDEX `project_name_idx` ON `projects` (`name`);--> statement-breakpoint
CREATE TABLE `response_stages` (
	`id` text PRIMARY KEY NOT NULL,
	`simulation_id` text NOT NULL,
	`persona_id` text NOT NULL,
	`stage_id` text NOT NULL,
	`proceed` integer DEFAULT false NOT NULL,
	`proceed_reason` text NOT NULL,
	`next_stage_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`simulation_id`) REFERENCES `simulations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`persona_id`) REFERENCES `personas`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`stage_id`) REFERENCES `stages`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`next_stage_id`) REFERENCES `stages`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `response_stage_simulation_id_idx` ON `response_stages` (`simulation_id`);--> statement-breakpoint
CREATE INDEX `response_stage_persona_id_idx` ON `response_stages` (`persona_id`);--> statement-breakpoint
CREATE INDEX `response_stage_stage_id_idx` ON `response_stages` (`stage_id`);--> statement-breakpoint
CREATE INDEX `response_stage_proceed_idx` ON `response_stages` (`proceed`);--> statement-breakpoint
CREATE INDEX `response_stage_next_stage_id_idx` ON `response_stages` (`next_stage_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `response_stage_once_idx` ON `response_stages` (`simulation_id`,`persona_id`,`stage_id`);--> statement-breakpoint
CREATE TABLE `responses` (
	`id` text PRIMARY KEY NOT NULL,
	`simulation_id` text NOT NULL,
	`persona_id` text NOT NULL,
	`stage_id` text NOT NULL,
	`stage_item_id` text NOT NULL,
	`response` text NOT NULL,
	`sentiment` numeric NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`simulation_id`) REFERENCES `simulations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`persona_id`) REFERENCES `personas`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`stage_id`) REFERENCES `stages`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`stage_item_id`) REFERENCES `stage_items`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `response_simulation_id_idx` ON `responses` (`simulation_id`);--> statement-breakpoint
CREATE INDEX `response_persona_id_idx` ON `responses` (`persona_id`);--> statement-breakpoint
CREATE INDEX `response_stage_id_idx` ON `responses` (`stage_id`);--> statement-breakpoint
CREATE INDEX `response_stage_item_id_idx` ON `responses` (`stage_item_id`);--> statement-breakpoint
CREATE INDEX `response_sentiment_idx` ON `responses` (`sentiment`);--> statement-breakpoint
CREATE TABLE `simulation_personas` (
	`simulation_id` text NOT NULL,
	`persona_id` text NOT NULL,
	`status` text DEFAULT 'processing' NOT NULL,
	`error` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	PRIMARY KEY(`simulation_id`, `persona_id`),
	FOREIGN KEY (`simulation_id`) REFERENCES `simulations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`persona_id`) REFERENCES `personas`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `simulation_stages` (
	`simulation_id` text NOT NULL,
	`stage_id` text NOT NULL,
	`simulation_stage_status` text DEFAULT 'idle' NOT NULL,
	`complete_count` integer DEFAULT 0 NOT NULL,
	`error` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	PRIMARY KEY(`simulation_id`, `stage_id`),
	FOREIGN KEY (`simulation_id`) REFERENCES `simulations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`stage_id`) REFERENCES `stages`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `simulation_stage_simulation_id_idx` ON `simulation_stages` (`simulation_id`);--> statement-breakpoint
CREATE INDEX `simulation_stage_stage_id_idx` ON `simulation_stages` (`stage_id`);--> statement-breakpoint
CREATE INDEX `simulation_stage_status_idx` ON `simulation_stages` (`simulation_stage_status`);--> statement-breakpoint
CREATE TABLE `simulations` (
	`id` text PRIMARY KEY NOT NULL,
	`funnel_id` text NOT NULL,
	`persona_config_id` text NOT NULL,
	`simulation_status` text DEFAULT 'idle' NOT NULL,
	`complete_count` integer DEFAULT 0 NOT NULL,
	`total_count` integer DEFAULT 0 NOT NULL,
	`parameters_json` text,
	`error` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`funnel_id`) REFERENCES `funnels`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`persona_config_id`) REFERENCES `persona_configs`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `simulation_funnel_id_idx` ON `simulations` (`funnel_id`);--> statement-breakpoint
CREATE INDEX `simulation_persona_config_id_idx` ON `simulations` (`persona_config_id`);--> statement-breakpoint
CREATE INDEX `simulation_status_idx` ON `simulations` (`simulation_status`);--> statement-breakpoint
CREATE TABLE `summary` (
	`id` text PRIMARY KEY NOT NULL,
	`simulation_id` text NOT NULL,
	`conversion_rate` numeric NOT NULL,
	`sentiment` numeric NOT NULL,
	`summary` text NOT NULL,
	`recommendation` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`simulation_id`) REFERENCES `simulations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `summary_simulation_id_idx` ON `summary` (`simulation_id`);--> statement-breakpoint
CREATE INDEX `summary_conversion_rate_idx` ON `summary` (`conversion_rate`);--> statement-breakpoint
CREATE INDEX `summary_sentiment_idx` ON `summary` (`sentiment`);--> statement-breakpoint
CREATE TABLE `summary_stage_items` (
	`id` text PRIMARY KEY NOT NULL,
	`simulation_id` text NOT NULL,
	`stage_item_id` text NOT NULL,
	`sentiment` numeric NOT NULL,
	`summary` text NOT NULL,
	`recommendation` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`simulation_id`) REFERENCES `simulations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`stage_item_id`) REFERENCES `stage_items`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `summary_stage_item_simulation_id_idx` ON `summary_stage_items` (`simulation_id`);--> statement-breakpoint
CREATE INDEX `summary_stage_item_stage_item_id_idx` ON `summary_stage_items` (`stage_item_id`);--> statement-breakpoint
CREATE INDEX `summary_stage_item_sentiment_idx` ON `summary_stage_items` (`sentiment`);--> statement-breakpoint
CREATE TABLE `summary_stages` (
	`id` text PRIMARY KEY NOT NULL,
	`simulation_id` text NOT NULL,
	`stage_id` text NOT NULL,
	`conversion_rate` numeric NOT NULL,
	`sentiment` numeric NOT NULL,
	`summary` text NOT NULL,
	`recommendation` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`simulation_id`) REFERENCES `simulations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`stage_id`) REFERENCES `stages`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `summary_stage_simulation_id_idx` ON `summary_stages` (`simulation_id`);--> statement-breakpoint
CREATE INDEX `summary_stage_stage_id_idx` ON `summary_stages` (`stage_id`);--> statement-breakpoint
CREATE INDEX `summary_stage_conversion_rate_idx` ON `summary_stages` (`conversion_rate`);--> statement-breakpoint
CREATE INDEX `summary_stage_sentiment_idx` ON `summary_stages` (`sentiment`);--> statement-breakpoint
CREATE TABLE `support_tickets` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`subject` text NOT NULL,
	`ticket_category` text NOT NULL,
	`ticket_priority` text NOT NULL,
	`description` text NOT NULL,
	`ticket_status` text DEFAULT 'open' NOT NULL,
	`last_response_at` integer,
	`resolved_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer
);
--> statement-breakpoint
CREATE TABLE `ticket_responses` (
	`id` text PRIMARY KEY NOT NULL,
	`ticket_id` text NOT NULL,
	`user_id` text NOT NULL,
	`message` text NOT NULL,
	`is_from_support` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`ticket_id`) REFERENCES `support_tickets`(`id`) ON UPDATE no action ON DELETE cascade
);
