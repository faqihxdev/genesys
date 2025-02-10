CREATE TYPE "public"."project_user_role" AS ENUM('owner', 'member');--> statement-breakpoint
CREATE TABLE "project_users" (
	"projectId" varchar(10) NOT NULL,
	"userId" varchar(36) NOT NULL,
	"role" "project_user_role" DEFAULT 'member' NOT NULL,
	"isDefault" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"deletedAt" timestamp,
	CONSTRAINT "project_users_projectId_userId_pk" PRIMARY KEY("projectId","userId")
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" varchar(10) PRIMARY KEY NOT NULL,
	"name" varchar(256) NOT NULL,
	"description" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"deletedAt" timestamp
);
--> statement-breakpoint
ALTER TABLE "project_users" ADD CONSTRAINT "project_users_projectId_projects_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "project_project_id_idx" ON "project_users" USING btree ("projectId");--> statement-breakpoint
CREATE INDEX "project_user_id_idx" ON "project_users" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "project_user_default_idx" ON "project_users" USING btree ("userId","isDefault");--> statement-breakpoint
CREATE INDEX "project_name_idx" ON "projects" USING btree ("name");