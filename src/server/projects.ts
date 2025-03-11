'use server';

import { db } from '@/db';
import { projectUsers, projects } from '@/db/schema';
import { and, desc, eq, ne } from 'drizzle-orm';
import { z } from 'zod';
import { createAction, fail } from './_utils';

// ==================================================
// CREATE
// ==================================================

/**
 * @description Create a new project
 * @param input - The project creation input
 * @returns Promise with the created project
 */
export const createProject = createAction({
  name: 'createProject',
  validator: z.object({
    name: z.string().min(3, 'Project name must be at least 3 characters'),
    description: z.string().optional(),
    isDefault: z.boolean().optional(),
  }),
  requireAuth: true,
  actionFn: async ({ input, currentUser }) => {
    // Check if this is the first project
    const existingProjects = await db
      .select()
      .from(projectUsers)
      .where(eq(projectUsers.userId, currentUser.id));

    const isFirstProject = existingProjects.length === 0;
    const shouldBeDefault = isFirstProject || input.isDefault;

    // Create the project with transaction for atomicity
    return await db.transaction(async (tx) => {
      // Create the project
      const [project] = await tx
        .insert(projects)
        .values({
          name: input.name,
          description: input.description,
        })
        .returning();

      // Add the creator as owner with default status
      await tx.insert(projectUsers).values({
        projectId: project.id,
        userId: currentUser.id,
        role: 'owner',
        isDefault: shouldBeDefault,
      });

      // If this should be default, unset any other defaults
      if (shouldBeDefault) {
        await tx
          .update(projectUsers)
          .set({ isDefault: false })
          .where(
            and(
              eq(projectUsers.userId, currentUser.id),
              ne(projectUsers.projectId, project.id),
              eq(projectUsers.isDefault, true)
            )
          );
      }

      return project;
    });
  },
});

// ==================================================
// READ
// ==================================================

/**
 * @description Get all projects for a user
 * @returns Promise with the user's projects and their roles
 */
export const getCurrentUserProjects = createAction({
  name: 'getCurrentUserProjects',
  validator: null,
  requireAuth: true,
  actionFn: async ({ currentUser }) => {
    const userProjects = await db
      .select({
        id: projects.id,
        name: projects.name,
        description: projects.description,
        createdAt: projects.createdAt,
        updatedAt: projects.updatedAt,
        deletedAt: projects.deletedAt,
        role: projectUsers.role,
        isDefault: projectUsers.isDefault,
      })
      .from(projects)
      .innerJoin(projectUsers, eq(projects.id, projectUsers.projectId))
      .where(eq(projectUsers.userId, currentUser.id))
      .orderBy(desc(projectUsers.isDefault), desc(projects.updatedAt));

    return userProjects;
  },
});

// ==================================================
// UPDATE
// ==================================================

/**
 * @description Update a project
 * @param input - The project update input
 * @returns Promise with the updated project
 */
export const updateProject = createAction({
  name: 'updateProject',
  validator: z.object({
    projectId: z.string().min(1, 'Project ID is required'),
    name: z.string().min(3, 'Project name must be at least 3 characters').optional(),
    description: z.string().optional(),
    isDefault: z.boolean().optional(),
  }),
  requireAuth: true,
  actionFn: async ({ input, currentUser }) => {
    // Check if user has access using internal helper
    const hasAccess = await _checkProjectAccess(input.projectId, currentUser.id);
    if (!hasAccess) {
      return fail({ message: 'Access denied', status: 403 });
    }

    return await db.transaction(async (tx) => {
      let project;

      // Only update project details if name or description is provided
      if (input.name || input.description) {
        const updateData: Partial<typeof projects.$inferInsert> = {
          updatedAt: new Date(),
        };
        if (input.name) updateData.name = input.name;
        if (input.description) updateData.description = input.description;

        [project] = await tx
          .update(projects)
          .set(updateData)
          .where(eq(projects.id, input.projectId))
          .returning();

        if (!project) {
          return fail({ message: 'Project not found', status: 404 });
        }
      } else {
        // If no project details to update, just get the project
        [project] = await tx.select().from(projects).where(eq(projects.id, input.projectId));

        if (!project) {
          return fail({ message: 'Project not found', status: 404 });
        }
      }

      // If isDefault is being updated
      if (typeof input.isDefault !== 'undefined') {
        if (input.isDefault) {
          // Set as default and unset others
          await tx
            .update(projectUsers)
            .set({ isDefault: false })
            .where(
              and(
                eq(projectUsers.userId, currentUser.id),
                ne(projectUsers.projectId, input.projectId)
              )
            );

          await tx
            .update(projectUsers)
            .set({ isDefault: true })
            .where(
              and(
                eq(projectUsers.projectId, input.projectId),
                eq(projectUsers.userId, currentUser.id)
              )
            );
        } else {
          // Just unset default for this project
          await tx
            .update(projectUsers)
            .set({ isDefault: false })
            .where(
              and(
                eq(projectUsers.projectId, input.projectId),
                eq(projectUsers.userId, currentUser.id)
              )
            );
        }
      }

      return project;
    });
  },
});

// ==================================================
// DELETE
// ==================================================

/**
 * @description Delete a project
 * @param input - The input object containing projectId
 * @returns Promise with success status
 */
export const deleteProject = createAction({
  name: 'deleteProject',
  validator: z.object({
    projectId: z.string().min(1, 'Project ID is required'),
  }),
  requireAuth: true,
  actionFn: async ({ input, currentUser }) => {
    // Check if user has access to this project
    const { data: hasAccess, error: accessError } = await checkProjectAccess({
      projectId: input.projectId,
      userId: currentUser.id,
    });
    if (accessError) return fail(accessError);
    if (!hasAccess) {
      return fail({ message: 'Access denied', status: 403 });
    }

    // Check if user is the owner
    const [projectUser] = await db
      .select()
      .from(projectUsers)
      .where(
        and(
          eq(projectUsers.projectId, input.projectId),
          eq(projectUsers.userId, currentUser.id),
          eq(projectUsers.role, 'owner')
        )
      );

    if (!projectUser) {
      return fail({ message: 'Only project owners can delete projects', status: 403 });
    }

    const [project] = await db.delete(projects).where(eq(projects.id, input.projectId)).returning();

    return !!project;
  },
});

// ==================================================
// HELPER FUNCTIONS
// ==================================================

/**
 * Internal helper to check if a user has access to a project
 * @internal
 */
export async function _checkProjectAccess(projectId: string, userId: string): Promise<boolean> {
  const access = await db
    .select()
    .from(projectUsers)
    .where(and(eq(projectUsers.projectId, projectId), eq(projectUsers.userId, userId)))
    .limit(1);

  return access.length > 0;
}

/**
 * Internal helper to check if a user is project owner
 * @internal
 */
export async function _isProjectOwner(projectId: string, userId: string): Promise<boolean> {
  const [projectUser] = await db
    .select()
    .from(projectUsers)
    .where(
      and(
        eq(projectUsers.projectId, projectId),
        eq(projectUsers.userId, userId),
        eq(projectUsers.role, 'owner')
      )
    )
    .limit(1);

  return !!projectUser;
}

/**
 * @description Check if a user has access to a project
 * @param input - The input object containing projectId and userId
 * @returns Promise with access status
 */
export const checkProjectAccess = createAction({
  name: 'checkProjectAccess',
  validator: z.object({
    projectId: z.string().min(1, 'Project ID is required'),
    userId: z.string().min(1, 'User ID is required'),
  }),
  requireAuth: true,
  actionFn: async ({ input }) => {
    return _checkProjectAccess(input.projectId, input.userId);
  },
});

/**
 * @description Helper function to check if a user is project owner
 * @param projectId - The project ID to check
 * @param userId - The user ID to check
 * @returns Promise with boolean indicating if user is owner
 */
export const isProjectOwner = createAction({
  name: 'isProjectOwner',
  validator: z.object({
    projectId: z.string().min(1, 'Project ID is required'),
    userId: z.string().min(1, 'User ID is required'),
  }),
  requireAuth: true,
  actionFn: async ({ input }) => {
    return _isProjectOwner(input.projectId, input.userId);
  },
});

/**
 * @description Helper function to get all projects for a user that can be set as default
 * @param input - The input object containing optional excludeProjectId
 * @returns Promise with array of projects
 */
export const getDefaultProjectCandidates = createAction({
  name: 'getDefaultProjectCandidates',
  validator: z.object({
    excludeProjectId: z.string().optional(),
  }),
  requireAuth: true,
  actionFn: async ({ input, currentUser }) => {
    const whereConditions = [eq(projectUsers.userId, currentUser.id)];
    if (input.excludeProjectId) {
      whereConditions.push(ne(projects.id, input.excludeProjectId));
    }

    const candidates = await db
      .select({
        id: projects.id,
        name: projects.name,
        description: projects.description,
        createdAt: projects.createdAt,
        updatedAt: projects.updatedAt,
        deletedAt: projects.deletedAt,
        role: projectUsers.role,
        isDefault: projectUsers.isDefault,
      })
      .from(projects)
      .innerJoin(projectUsers, eq(projects.id, projectUsers.projectId))
      .where(and(...whereConditions));

    return candidates;
  },
});

// Update the getProjectById to use the internal helper
export const getProjectById = createAction({
  name: 'getProjectById',
  validator: z.object({
    projectId: z.string().min(1, 'Project ID is required'),
  }),
  requireAuth: true,
  actionFn: async ({ input, currentUser }) => {
    // Combine access check and project fetch in one query
    const [result] = await db
      .select({
        project: projects,
        hasAccess: projectUsers.userId,
      })
      .from(projects)
      .leftJoin(
        projectUsers,
        and(eq(projectUsers.projectId, projects.id), eq(projectUsers.userId, currentUser.id))
      )
      .where(eq(projects.id, input.projectId))
      .limit(1);

    if (!result) {
      return fail({ message: 'Project not found', status: 404 });
    }

    if (!result.hasAccess) {
      return fail({ message: 'Access denied', status: 403 });
    }

    return result.project;
  },
});
