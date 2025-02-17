import { generateId } from '@/db/schema/_utils';
import { relations } from 'drizzle-orm';
import { boolean, index, pgEnum, pgTable, primaryKey, text } from 'drizzle-orm/pg-core';
import { ID_LENGTH, timestamps } from './_utils';
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
    id: text()
      .$defaultFn(() => generateId({ length: ID_LENGTH, prefix: 'prj-' }))
      .primaryKey(),
    name: text().notNull(), // user reference: name of the project
    description: text(), // user reference: description of the project
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
    projectId: text() // FK: which project is this user a member of?
      .references(() => projects.id, { onDelete: 'cascade' })
      .notNull(),
    userId: text().notNull(), // FK: which user is this? (Supabase auth.users)
    role: projectUserRoleEnum().notNull().default('member'), // role of the user in the project
    isDefault: boolean().notNull().default(false), // whether the project is the default project for the user
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
 * One project to many users
 */
export const projectsRelations = relations(projects, ({ many }) => ({
  users: many(projectUsers),
}));

/**
 * One project user to one project
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
