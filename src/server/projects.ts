'use server';

import { getCurrentUser } from '@/server/auth';
import { db } from '@/server/db';
import { projectUsers, projects } from '@/server/db/schema/project';
import type { Project, ProjectExtended } from '@/types';
import type { ActionError, ActionResponse } from '@/types/utils';
import type { User } from '@supabase/supabase-js';
import { and, eq, ne } from 'drizzle-orm';

/**
 * @description Get all projects for a user
 * @param input - The input object containing userId
 * @returns Promise with the user's projects and their roles
 */
export async function getProjectByUserId(input: {
  userId: string;
}): Promise<ActionResponse<ProjectExtended[]>> {
  try {
    const { user, error } = await checkUserAuth(input.userId);
    if (error) return { data: null, error };
    if (!user) return { data: null, error: { message: 'User not found', status: 404 } };

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
      .where(eq(projectUsers.userId, input.userId));

    return {
      data: userProjects as ProjectExtended[],
      error: null,
    };
  } catch (error) {
    console.error('[getProjectByUserId]: ', error);
    return { data: null, error: { message: 'Failed to get user projects' } };
  }
}

/**
 * @description Get a project by ID
 * @param input - The input object containing projectId
 * @returns Promise with the project data
 */
export async function getProjectById(input: {
  projectId: string;
}): Promise<ActionResponse<Project>> {
  try {
    const { user, error } = await checkUserAuth();
    if (error) return { data: null, error };
    if (!user) return { data: null, error: { message: 'User not found', status: 404 } };

    // Check if user has access to this project
    const { data: hasAccess, error: accessError } = await checkProjectAccess({
      projectId: input.projectId,
      userId: user.id,
    });
    if (accessError) return { data: null, error: accessError };
    if (!hasAccess) return { data: null, error: { message: 'Access denied', status: 403 } };

    const project = await db.query.projects.findFirst({
      where: eq(projects.id, input.projectId),
    });

    if (!project) {
      return { data: null, error: { message: 'Project not found' } };
    }

    return { data: project, error: null };
  } catch (error) {
    console.error('[getProjectById]: ', error);
    return { data: null, error: { message: 'Failed to get project' } };
  }
}

/**
 * @description Set a project as default for a user and unset all other projects
 * @param input - The input object containing userId and projectId
 * @returns Promise with success status
 */
async function setUserProjectAsDefault(input: {
  userId: string;
  projectId: string;
}): Promise<ActionResponse<boolean>> {
  try {
    const { user, error } = await checkUserAuth(input.userId);
    if (error) return { data: null, error };
    if (!user) return { data: null, error: { message: 'User not found', status: 404 } };

    try {
      return await db.transaction(async (tx) => {
        // First check if project exists and user has access
        const [access] = await tx
          .select()
          .from(projectUsers)
          .where(
            and(eq(projectUsers.projectId, input.projectId), eq(projectUsers.userId, input.userId))
          );

        if (!access) {
          return { data: null, error: { message: 'Project not found or user has no access' } };
        }

        // First set the new default to avoid potential deadlocks
        const setResult = await tx
          .update(projectUsers)
          .set({ isDefault: true })
          .where(
            and(eq(projectUsers.projectId, input.projectId), eq(projectUsers.userId, input.userId))
          )
          .returning();

        if (!setResult.length) {
          throw new Error('Failed to set project as default');
        }

        // Then unset any other defaults
        await tx
          .update(projectUsers)
          .set({ isDefault: false })
          .where(
            and(
              eq(projectUsers.userId, input.userId),
              ne(projectUsers.projectId, input.projectId),
              eq(projectUsers.isDefault, true)
            )
          )
          .returning();

        return { data: true, error: null };
      });
    } catch (txError) {
      return {
        data: null,
        error: {
          message:
            'Transaction failed: ' + (txError instanceof Error ? txError.message : 'Unknown error'),
        },
      };
    }
  } catch (error) {
    console.error('[setUserProjectAsDefault]: ', error);
    return { data: null, error: { message: 'Failed to set project as default' } };
  }
}

/**
 * @description Create a new project
 * @param input - The project creation input
 * @returns Promise with the created project
 */
export async function createProject(input: {
  name: string;
  description?: string;
  isDefault?: boolean;
  userId: string;
}): Promise<ActionResponse<Project>> {
  try {
    const { user, error } = await checkUserAuth(input.userId);
    if (error) return { data: null, error };
    if (!user) return { data: null, error: { message: 'User not found', status: 404 } };

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
        userId: input.userId,
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
              eq(projectUsers.userId, input.userId),
              ne(projectUsers.projectId, project.id),
              eq(projectUsers.isDefault, true)
            )
          );
      }

      return { data: project, error: null };
    });
  } catch (error) {
    console.error('[createProject]: ', error);
    return { data: null, error: { message: 'Failed to create project' } };
  }
}

/**
 * @description Update a project
 * @param input - The project update input
 * @returns Promise with the updated project
 */
export async function updateProject(input: {
  id: string;
  name?: string;
  description?: string;
  isDefault?: boolean;
  userId: string;
}): Promise<ActionResponse<Project>> {
  try {
    const { user, error } = await checkUserAuth(input.userId);
    if (error) return { data: null, error };
    if (!user) return { data: null, error: { message: 'User not found', status: 404 } };

    // Check if user has access to this project
    const { data: hasAccess, error: accessError } = await checkProjectAccess({
      projectId: input.id,
      userId: user.id,
    });
    if (accessError) return { data: null, error: accessError };
    if (!hasAccess) return { data: null, error: { message: 'Access denied', status: 403 } };

    return await db.transaction(async (tx) => {
      let project;

      // Only update project details if name or description is provided
      if (input.name || input.description) {
        const updateData: Partial<typeof projects.$inferInsert> = {};
        if (input.name) updateData.name = input.name;
        if (input.description) updateData.description = input.description;

        [project] = await tx
          .update(projects)
          .set(updateData)
          .where(eq(projects.id, input.id))
          .returning();

        if (!project) {
          return { data: null, error: { message: 'Project not found' } };
        }
      } else {
        // If no project details to update, just get the project
        [project] = await tx.select().from(projects).where(eq(projects.id, input.id));

        if (!project) {
          return { data: null, error: { message: 'Project not found' } };
        }
      }

      // If isDefault is being updated
      if (typeof input.isDefault !== 'undefined') {
        if (input.isDefault) {
          // Set as default
          const result = await setUserProjectAsDefault({
            userId: input.userId,
            projectId: input.id,
          });
          if (result.error) {
            throw new Error(result.error.message);
          }
        } else {
          // Just unset default for this project
          await tx
            .update(projectUsers)
            .set({ isDefault: false })
            .where(
              and(eq(projectUsers.projectId, input.id), eq(projectUsers.userId, input.userId))
            );
        }
      }

      return { data: project, error: null };
    });
  } catch (error) {
    console.error('[updateProject]: ', error);
    return { data: null, error: { message: 'Failed to update project' } };
  }
}

/**
 * @description Delete a project
 * @param input - The input object containing projectId
 * @returns Promise with success status
 */
export async function deleteProject(input: {
  projectId: string;
}): Promise<ActionResponse<boolean>> {
  try {
    const { user, error } = await checkUserAuth();
    if (error) return { data: null, error };
    if (!user) return { data: null, error: { message: 'User not found', status: 404 } };

    // Check if user has access to this project
    const { data: hasAccess, error: accessError } = await checkProjectAccess({
      projectId: input.projectId,
      userId: user.id,
    });
    if (accessError) return { data: null, error: accessError };
    if (!hasAccess) return { data: null, error: { message: 'Access denied', status: 403 } };

    // Check if user is the owner
    const [projectUser] = await db
      .select()
      .from(projectUsers)
      .where(
        and(
          eq(projectUsers.projectId, input.projectId),
          eq(projectUsers.userId, user.id),
          eq(projectUsers.role, 'owner')
        )
      );

    if (!projectUser) {
      return {
        data: null,
        error: { message: 'Only project owners can delete projects', status: 403 },
      };
    }

    const [project] = await db.delete(projects).where(eq(projects.id, input.projectId)).returning();

    return { data: !!project, error: null };
  } catch (error) {
    console.error('[deleteProject]: ', error);
    return { data: null, error: { message: 'Failed to delete project' } };
  }
}

/**
 * @description Check if a user has access to a project
 * @param input - The input object containing projectId and userId
 * @returns Promise with access status
 */
export async function checkProjectAccess(input: {
  projectId: string;
  userId: string;
}): Promise<ActionResponse<boolean>> {
  try {
    const access = await db
      .select()
      .from(projectUsers)
      .where(
        and(eq(projectUsers.projectId, input.projectId), eq(projectUsers.userId, input.userId))
      )
      .limit(1);

    return { data: access.length > 0, error: null };
  } catch (error) {
    console.error('[checkProjectAccess]: ', error);
    return { data: false, error: { message: 'Failed to check project access' } };
  }
}

/* ######################### Helper functions ######################### */

/**
 * @description Helper function to check user authentication and optionally verify user ID
 * @param userId - Optional user ID to verify against the current authenticated user
 * @returns Promise with the authenticated user or error
 */
export async function checkUserAuth(
  userId?: string
): Promise<{ user: User | null; error: ActionError | null }> {
  try {
    // Check authentication
    const { data: user, error: authError } = await getCurrentUser();
    if (authError) return { user: null, error: authError };
    if (!user) return { user: null, error: { message: 'Unauthorized', status: 401 } };

    // If userId is provided, verify it matches authenticated user
    if (userId && user.id !== userId) {
      return { user: null, error: { message: 'Unauthorized access', status: 403 } };
    }

    return { user, error: null };
  } catch (error) {
    console.error('[checkUserAuth]: ', error);
    return { user: null, error: { message: 'Authentication check failed', status: 500 } };
  }
}

/**
 * @description Helper function to check if a user has a default project
 * @param userId - The user ID to check
 * @returns Promise with boolean indicating if user has a default project
 */
export async function hasDefaultProject(userId: string): Promise<ActionResponse<boolean>> {
  try {
    const [defaultProject] = await db
      .select()
      .from(projectUsers)
      .where(and(eq(projectUsers.userId, userId), eq(projectUsers.isDefault, true)))
      .limit(1);

    return { data: !!defaultProject, error: null };
  } catch (error) {
    console.error('[hasDefaultProject]: ', error);
    return { data: false, error: { message: 'Failed to check default project status' } };
  }
}

/**
 * @description Helper function to check if a user is project owner
 * @param projectId - The project ID to check
 * @param userId - The user ID to check
 * @returns Promise with boolean indicating if user is owner
 */
export async function isProjectOwner(
  projectId: string,
  userId: string
): Promise<ActionResponse<boolean>> {
  try {
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

    return { data: !!projectUser, error: null };
  } catch (error) {
    console.error('[isProjectOwner]: ', error);
    return { data: false, error: { message: 'Failed to check project ownership' } };
  }
}

/**
 * @description Helper function to get all projects for a user that can be set as default
 * @param input - The input object containing userId and optional excludeProjectId
 * @returns Promise with array of projects
 */
export async function getDefaultProjectCandidates(input: {
  userId: string;
  excludeProjectId?: string;
}): Promise<ActionResponse<ProjectExtended[]>> {
  try {
    const whereConditions = [eq(projectUsers.userId, input.userId)];
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

    return { data: candidates as ProjectExtended[], error: null };
  } catch (error) {
    console.error('[getDefaultProjectCandidates]: ', error);
    return { data: null, error: { message: 'Failed to get project candidates' } };
  }
}
