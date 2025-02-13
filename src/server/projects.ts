'use server';

import { db } from '@/server/db';
import { projectUsers, projects } from '@/server/db/schema/project';
import { and, desc, eq, ne } from 'drizzle-orm';
import { z } from 'zod';
import { createAction } from './_utils';

// ==================================================
// CREATE
// ==================================================

/**
 * @description Create a new project
 * @param input - The project creation input
 * @returns Promise with the created project
 */
export const createProject = createAction({
  validator: z.object({
    name: z.string().min(3, 'Project name must be at least 3 characters'),
    description: z.string().optional(),
    isDefault: z.boolean().optional(),
  }),
  requireAuth: true,
  actionFn: async ({ input, currentUser }) => {
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
        isDefault: input.isDefault || false,
      });

      // If this should be default, unset any other defaults
      if (input.isDefault) {
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

/**
 * @description Get a project by ID
 * @param input - The input object containing projectId
 * @returns Promise with the project data
 */
export const getProjectById = createAction({
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

    if (accessError) throw accessError;
    if (!hasAccess) {
      throw new Error('Access denied');
    }

    const project = await db.query.projects.findFirst({
      where: eq(projects.id, input.projectId),
    });

    if (!project) {
      throw new Error('Project not found');
    }

    return project;
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
  validator: z.object({
    projectId: z.string().min(1, 'Project ID is required'),
    name: z.string().min(3, 'Project name must be at least 3 characters').optional(),
    description: z.string().optional(),
    isDefault: z.boolean().optional(),
  }),
  requireAuth: true,
  actionFn: async ({ input, currentUser }) => {
    // Check if user has access to this project
    const { data: hasAccess, error: accessError } = await checkProjectAccess({
      projectId: input.projectId,
      userId: currentUser.id,
    });
    if (accessError) throw accessError;
    if (!hasAccess) {
      throw new Error('Access denied');
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
          throw new Error('Project not found');
        }
      } else {
        // If no project details to update, just get the project
        [project] = await tx.select().from(projects).where(eq(projects.id, input.projectId));

        if (!project) {
          throw new Error('Project not found');
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
    if (accessError) throw accessError;
    if (!hasAccess) {
      throw new Error('Access denied');
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
      throw new Error('Only project owners can delete projects');
    }

    const [project] = await db.delete(projects).where(eq(projects.id, input.projectId)).returning();

    return !!project;
  },
});

// ==================================================
// HELPER FUNCTIONS
// ==================================================

/**
 * @description Check if a user has access to a project
 * @param input - The input object containing projectId and userId
 * @returns Promise with access status
 */
export const checkProjectAccess = createAction({
  validator: z.object({
    projectId: z.string().min(1, 'Project ID is required'),
    userId: z.string().min(1, 'User ID is required'),
  }),
  requireAuth: true,
  actionFn: async ({ input }) => {
    const access = await db
      .select()
      .from(projectUsers)
      .where(
        and(eq(projectUsers.projectId, input.projectId), eq(projectUsers.userId, input.userId))
      )
      .limit(1);

    return access.length > 0;
  },
});

/**
 * @description Helper function to check if a user is project owner
 * @param projectId - The project ID to check
 * @param userId - The user ID to check
 * @returns Promise with boolean indicating if user is owner
 */
export const isProjectOwner = createAction({
  validator: z.object({
    projectId: z.string().min(1, 'Project ID is required'),
    userId: z.string().min(1, 'User ID is required'),
  }),
  requireAuth: true,
  actionFn: async ({ input }) => {
    const [projectUser] = await db
      .select()
      .from(projectUsers)
      .where(
        and(
          eq(projectUsers.projectId, input.projectId),
          eq(projectUsers.userId, input.userId),
          eq(projectUsers.role, 'owner')
        )
      )
      .limit(1);

    return !!projectUser;
  },
});

/**
 * @description Helper function to get all projects for a user that can be set as default
 * @param input - The input object containing optional excludeProjectId
 * @returns Promise with array of projects
 */
export const getDefaultProjectCandidates = createAction({
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
