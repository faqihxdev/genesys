import { generateId } from '@/lib/utils';
import { relations } from 'drizzle-orm';
import { boolean, index, pgEnum, pgTable, primaryKey, text, varchar } from 'drizzle-orm/pg-core';
import { timestamps } from './_utils';

/**
 * Project user role enum
 */
export const projectUserRoleEnum = pgEnum('project_user_role', ['owner', 'member']);

/**
 * Projects table schema
 */
export const projects = pgTable(
  'projects',
  {
    id: varchar({ length: 10 })
      .$defaultFn(() => generateId({ length: 10 }))
      .primaryKey(),
    name: varchar({ length: 256 }).notNull(),
    description: text(),
    ...timestamps,
  },
  (table) => [
    index('project_name_idx').on(table.name), // name index
  ]
);

/**
 * Project-User junction table schema
 * To store the users who are members of the project
 */
export const projectUsers = pgTable(
  'project_users',
  {
    projectId: varchar({ length: 10 })
      .references(() => projects.id, { onDelete: 'cascade' })
      .notNull(),
    userId: varchar({ length: 36 }).notNull(), // References Supabase auth.users
    role: projectUserRoleEnum().notNull().default('member'),
    isDefault: boolean().notNull().default(false),
    ...timestamps,
  },
  (table) => [
    primaryKey({ columns: [table.projectId, table.userId] }), // primary key
    index('project_project_id_idx').on(table.projectId), // project index
    index('project_user_id_idx').on(table.userId), // user index
    index('project_user_default_idx').on(table.userId, table.isDefault), // default project index
  ]
);

/**
 * Project relations
 */
export const projectsRelations = relations(projects, ({ many }) => ({
  users: many(projectUsers),
}));

/**
 * Project-User relations
 */
export const projectUsersRelations = relations(projectUsers, ({ one }) => ({
  project: one(projects, {
    fields: [projectUsers.projectId],
    references: [projects.id],
  }),
}));

// Inferred types
export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type ProjectUser = typeof projectUsers.$inferSelect;
export type NewProjectUser = typeof projectUsers.$inferInsert;
export type ProjectUserRole = (typeof projectUserRoleEnum.enumValues)[number];

// Types
export interface ProjectExtended extends Project {
  role: ProjectUserRole;
  isDefault: boolean;
}
