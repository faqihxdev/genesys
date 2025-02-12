CREATE TYPE "public"."invite_status" AS ENUM('pending', 'accepted', 'rejected');--> statement-breakpoint
CREATE TABLE "project_invites" (
	"id" varchar(10) PRIMARY KEY NOT NULL,
	"projectId" varchar(10) NOT NULL,
	"invitedUserId" varchar(36) NOT NULL,
	"inviterUserId" varchar(36) NOT NULL,
	"invite_status" "invite_status" DEFAULT 'pending' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"deletedAt" timestamp
);
--> statement-breakpoint
ALTER TABLE "project_invites" ADD CONSTRAINT "project_invites_projectId_projects_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "project_invite_project_id_idx" ON "project_invites" USING btree ("projectId");--> statement-breakpoint
CREATE INDEX "project_invite_invited_user_id_idx" ON "project_invites" USING btree ("invitedUserId");--> statement-breakpoint
CREATE INDEX "project_invite_inviter_user_id_idx" ON "project_invites" USING btree ("inviterUserId");--> statement-breakpoint
CREATE INDEX "project_invite_status_idx" ON "project_invites" USING btree ("invite_status");--> statement-breakpoint
CREATE INDEX "project_invite_project_invited_idx" ON "project_invites" USING btree ("projectId","invitedUserId");