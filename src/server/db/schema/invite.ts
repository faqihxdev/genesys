import { generateId } from '@/utils';
import { relations } from 'drizzle-orm';
import { index, pgEnum, pgTable, varchar } from 'drizzle-orm/pg-core';
import { timestamps } from './_utils';
import { projects } from './project';

/**
 * Invite status enum
 */
export const inviteStatusEnum = pgEnum('invite_status', ['pending', 'accepted', 'rejected']);

/**
 * Project invites table schema
 * Stores invites for users to join projects
 */
export const projectInvites = pgTable(
  'project_invites',
  {
    id: varchar({ length: 10 })
      .$defaultFn(() => generateId({ length: 10 }))
      .primaryKey(),
    projectId: varchar({ length: 10 })
      .references(() => projects.id, { onDelete: 'cascade' })
      .notNull(),
    invitedUserId: varchar({ length: 36 }).notNull(), // References Supabase auth.users
    inviterUserId: varchar({ length: 36 }).notNull(), // References Supabase auth.users
    status: inviteStatusEnum('invite_status').notNull().default('pending'),
    ...timestamps,
  },
  (table) => [
    // Indexes for common queries
    index('project_invite_project_id_idx').on(table.projectId),
    index('project_invite_invited_user_id_idx').on(table.invitedUserId),
    index('project_invite_inviter_user_id_idx').on(table.inviterUserId),
    index('project_invite_status_idx').on(table.status),
    // Compound index for checking existing invites
    index('project_invite_project_invited_idx').on(table.projectId, table.invitedUserId),
  ]
);

/**
 * Project invites relations
 */
export const projectInvitesRelations = relations(projectInvites, ({ one }) => ({
  project: one(projects, {
    fields: [projectInvites.projectId],
    references: [projects.id],
  }),
}));

// Inferred types
export type ProjectInvite = typeof projectInvites.$inferSelect;
export type NewProjectInvite = typeof projectInvites.$inferInsert;
export type InviteStatus = (typeof inviteStatusEnum.enumValues)[number];
