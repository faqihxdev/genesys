import { generateId } from '@/db/schema/_utils';
import { relations } from 'drizzle-orm';
import { index, pgEnum, pgTable, varchar } from 'drizzle-orm/pg-core';
import { ID_LENGTH, SUPABASE_USER_ID_LENGTH, timestamps } from './_utils';
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
    id: varchar({ length: ID_LENGTH })
      .$defaultFn(() => generateId({ length: ID_LENGTH, prefix: 'inv-' }))
      .primaryKey(),
    projectId: varchar({ length: ID_LENGTH }) // FK: which project is this invite for?
      .references(() => projects.id, { onDelete: 'cascade' })
      .notNull(),
    invitedUserId: varchar({ length: SUPABASE_USER_ID_LENGTH }).notNull(), // FK: which user is invited? (Supabase auth.users)
    inviterUserId: varchar({ length: SUPABASE_USER_ID_LENGTH }).notNull(), // FK: which user is inviting? (Supabase auth.users)
    status: inviteStatusEnum('invite_status').notNull().default('pending'), // status of the invite (pending, accepted, rejected)
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
 * One project invite to one project
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
