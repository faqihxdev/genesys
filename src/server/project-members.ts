'use server';

import { getCurrentUser } from '@/server/auth';
import { db } from '@/server/db';
import type { ProjectUser } from '@/server/db/schema/project';
import { projectUsers } from '@/server/db/schema/project';
import type { ActionResponse } from '@/types/utils';
import { and, eq } from 'drizzle-orm';
import { isProjectOwner } from './projects';

/**
 * @description Get all members of a project
 * @param projectId - The ID of the project
 * @returns Promise with array of project members
 */
export async function getProjectMembers(projectId: string): Promise<ActionResponse<ProjectUser[]>> {
  try {
    const { data: user, error: authError } = await getCurrentUser();
    if (authError) return { data: null, error: authError };
    if (!user) return { data: null, error: { message: 'Unauthorized', status: 401 } };

    const members = await db
      .select()
      .from(projectUsers)
      .where(eq(projectUsers.projectId, projectId));

    return { data: members, error: null };
  } catch (error) {
    console.error('[getProjectMembers]: ', error);
    return { data: null, error: { message: 'Failed to get project members' } };
  }
}

/**
 * @description Add a new member to a project
 * @param input - The input containing projectId, userId, and role
 * @returns Promise with the added project member
 */
export async function addProjectMember(input: {
  projectId: string;
  userId: string;
  role: 'member' | 'owner';
}): Promise<ActionResponse<ProjectUser>> {
  try {
    const { data: user, error: authError } = await getCurrentUser();
    if (authError) return { data: null, error: authError };
    if (!user) return { data: null, error: { message: 'Unauthorized', status: 401 } };

    // Check if user is project owner
    const { data: isOwner, error: ownerError } = await isProjectOwner(input.projectId, user.id);
    if (ownerError) return { data: null, error: ownerError };
    if (!isOwner) {
      return { data: null, error: { message: 'Only project owners can add members', status: 403 } };
    }

    // Check if user is already a member
    const existingMember = await db
      .select()
      .from(projectUsers)
      .where(
        and(eq(projectUsers.projectId, input.projectId), eq(projectUsers.userId, input.userId))
      )
      .limit(1);

    if (existingMember.length > 0) {
      return { data: null, error: { message: 'User is already a member of this project' } };
    }

    // Add new member
    const [newMember] = await db
      .insert(projectUsers)
      .values({
        projectId: input.projectId,
        userId: input.userId,
        role: input.role,
      })
      .returning();

    return { data: newMember, error: null };
  } catch (error) {
    console.error('[addProjectMember]: ', error);
    return { data: null, error: { message: 'Failed to add project member' } };
  }
}

/**
 * @description Remove a member from a project
 * @param input - The input containing projectId and userId
 * @returns Promise with success status
 */
export async function removeProjectMember(input: {
  projectId: string;
  userId: string;
}): Promise<ActionResponse<boolean>> {
  try {
    const { data: user, error: authError } = await getCurrentUser();
    if (authError) return { data: null, error: authError };
    if (!user) return { data: null, error: { message: 'Unauthorized', status: 401 } };

    // Check if user is project owner
    const { data: isOwner, error: ownerError } = await isProjectOwner(input.projectId, user.id);
    if (ownerError) return { data: null, error: ownerError };
    if (!isOwner) {
      return {
        data: null,
        error: { message: 'Only project owners can remove members', status: 403 },
      };
    }

    // Prevent removing the last owner
    if (input.userId === user.id) {
      const owners = await db
        .select()
        .from(projectUsers)
        .where(and(eq(projectUsers.projectId, input.projectId), eq(projectUsers.role, 'owner')));

      if (owners.length <= 1) {
        return {
          data: null,
          error: { message: 'Cannot remove the last owner of the project' },
        };
      }
    }

    // Remove member
    const result = await db
      .delete(projectUsers)
      .where(
        and(eq(projectUsers.projectId, input.projectId), eq(projectUsers.userId, input.userId))
      )
      .returning();

    return { data: result.length > 0, error: null };
  } catch (error) {
    console.error('[removeProjectMember]: ', error);
    return { data: null, error: { message: 'Failed to remove project member' } };
  }
}

/**
 * @description Update a member's role in a project
 * @param input - The input containing projectId, userId, and new role
 * @returns Promise with the updated project member
 */
export async function updateProjectMemberRole(input: {
  projectId: string;
  userId: string;
  role: 'member' | 'owner';
}): Promise<ActionResponse<ProjectUser>> {
  try {
    const { data: user, error: authError } = await getCurrentUser();
    if (authError) return { data: null, error: authError };
    if (!user) return { data: null, error: { message: 'Unauthorized', status: 401 } };

    // Check if user is project owner
    const { data: isOwner, error: ownerError } = await isProjectOwner(input.projectId, user.id);
    if (ownerError) return { data: null, error: ownerError };
    if (!isOwner) {
      return {
        data: null,
        error: { message: 'Only project owners can update member roles', status: 403 },
      };
    }

    // If demoting from owner, check if there will still be at least one owner
    if (input.role === 'member') {
      const owners = await db
        .select()
        .from(projectUsers)
        .where(and(eq(projectUsers.projectId, input.projectId), eq(projectUsers.role, 'owner')));

      if (owners.length <= 1 && owners[0].userId === input.userId) {
        return {
          data: null,
          error: { message: 'Cannot demote the last owner of the project' },
        };
      }
    }

    // Update member role
    const [updatedMember] = await db
      .update(projectUsers)
      .set({ role: input.role })
      .where(
        and(eq(projectUsers.projectId, input.projectId), eq(projectUsers.userId, input.userId))
      )
      .returning();

    return { data: updatedMember, error: null };
  } catch (error) {
    console.error('[updateProjectMemberRole]: ', error);
    return { data: null, error: { message: 'Failed to update member role' } };
  }
}
