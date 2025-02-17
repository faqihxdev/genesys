'use server';

import { db } from '@/db';
import { projectUsers } from '@/db/schema/project';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { createAction, fail } from './_utils';
import { isProjectOwner } from './projects';

// ==================================================
// CREATE
// ==================================================

/**
 * @description Add a new member to a project
 * @param input - The input containing projectId, userId, and role
 * @returns Promise with the added project member
 */
export const addProjectMember = createAction({
  validator: z.object({
    projectId: z.string().min(1, 'Project ID is required'),
    userId: z.string().min(1, 'User ID is required'),
    role: z.enum(['member', 'owner'], {
      required_error: 'Role is required',
      invalid_type_error: 'Role must be either member or owner',
    }),
  }),
  requireAuth: true,
  actionFn: async ({ input, currentUser }) => {
    // Check if user is project owner
    const { data: isOwner, error: ownerError } = await isProjectOwner({
      projectId: input.projectId,
      userId: currentUser.id,
    });
    if (ownerError) return fail(ownerError);
    if (!isOwner) {
      return fail({ message: 'Only project owners can add members', status: 403 });
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
      return fail({ message: 'User is already a member of this project', status: 409 });
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

    return newMember;
  },
});

// ==================================================
// READ
// ==================================================

/**
 * @description Get all members of a project
 * @param projectId - The ID of the project
 * @returns Promise with array of project members
 */
export const getProjectMembers = createAction({
  validator: z.object({
    projectId: z.string().min(1, 'Project ID is required'),
  }),
  requireAuth: true,
  actionFn: async ({ input }) => {
    const members = await db
      .select()
      .from(projectUsers)
      .where(eq(projectUsers.projectId, input.projectId));
    return members;
  },
});

// ==================================================
// UPDATE
// ==================================================

/**
 * @description Update a member's role in a project
 * @param input - The input containing projectId, userId, and new role
 * @returns Promise with the updated project member
 */
export const updateProjectMemberRole = createAction({
  validator: z.object({
    projectId: z.string().min(1, 'Project ID is required'),
    userId: z.string().min(1, 'User ID is required'),
    role: z.enum(['member', 'owner'], {
      required_error: 'Role is required',
      invalid_type_error: 'Role must be either member or owner',
    }),
  }),
  requireAuth: true,
  actionFn: async ({ input, currentUser }) => {
    // Check if user is project owner
    const { data: isOwner, error: ownerError } = await isProjectOwner({
      projectId: input.projectId,
      userId: currentUser.id,
    });

    if (ownerError) return fail(ownerError);

    if (!isOwner) {
      return fail({ message: 'Only project owners can update member roles', status: 403 });
    }

    // If demoting from owner, check if there will still be at least one owner
    if (input.role === 'member') {
      const owners = await db
        .select()
        .from(projectUsers)
        .where(and(eq(projectUsers.projectId, input.projectId), eq(projectUsers.role, 'owner')));

      if (owners.length <= 1 && owners[0].userId === input.userId) {
        return fail({ message: 'Cannot demote the last owner of the project', status: 400 });
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

    return updatedMember;
  },
});

// ==================================================
// DELETE
// ==================================================

/**
 * @description Remove a member from a project
 * @param input - The input containing projectId and userId
 * @returns Promise with success status
 */
export const removeProjectMember = createAction({
  validator: z.object({
    projectId: z.string().min(1, 'Project ID is required'),
    userId: z.string().min(1, 'User ID is required'),
  }),
  requireAuth: true,
  actionFn: async ({ input, currentUser }) => {
    // Check if user is project owner
    const { data: isOwner, error: ownerError } = await isProjectOwner({
      projectId: input.projectId,
      userId: currentUser.id,
    });

    if (ownerError) return fail(ownerError);

    if (!isOwner) {
      return fail({ message: 'Only project owners can remove members', status: 403 });
    }

    // Prevent removing the last owner
    if (input.userId === currentUser.id) {
      const owners = await db
        .select()
        .from(projectUsers)
        .where(and(eq(projectUsers.projectId, input.projectId), eq(projectUsers.role, 'owner')));

      if (owners.length <= 1) {
        return fail({ message: 'Cannot remove the last owner of the project', status: 400 });
      }
    }

    // Remove member
    const result = await db
      .delete(projectUsers)
      .where(
        and(eq(projectUsers.projectId, input.projectId), eq(projectUsers.userId, input.userId))
      )
      .returning();

    return result.length > 0;
  },
});
