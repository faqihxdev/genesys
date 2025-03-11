'use server';

import { db } from '@/db';
import { projectInvites, projectUsers } from '@/db/schema';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { createAction, fail } from './_utils';
import { isProjectOwner } from './projects';
import { getUsersByIds, searchUsersByEmail } from './users';

// ==================================================
// CREATE
// ==================================================

/**
 * @description Create a new project invite
 * @param input - The input containing projectId and email
 * @returns Promise with the created invite ID
 */
export const createProjectInvite = createAction({
  name: 'createProjectInvite',
  validator: z.object({
    projectId: z.string().min(1, 'Project ID is required'),
    email: z.string().email('Invalid email address'),
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
      return fail({ message: 'Only project owners can invite members', status: 403 });
    }

    // Search for user by email
    const { data: invitedUser, error: searchError } = await searchUsersByEmail({
      email: input.email,
    });

    if (searchError) return fail(searchError);
    if (!invitedUser) {
      return fail({ message: 'User not found', status: 404 });
    }

    // Check if user is already a member
    const existingMember = await db
      .select()
      .from(projectUsers)
      .where(
        and(eq(projectUsers.projectId, input.projectId), eq(projectUsers.userId, invitedUser.id))
      )
      .limit(1);

    if (existingMember.length > 0) {
      return fail({ message: 'User is already a member of this project', status: 409 });
    }

    // Check if there's already a pending invite
    const existingInvite = await db
      .select()
      .from(projectInvites)
      .where(
        and(
          eq(projectInvites.projectId, input.projectId),
          eq(projectInvites.invitedUserId, invitedUser.id),
          eq(projectInvites.status, 'pending')
        )
      )
      .limit(1);

    if (existingInvite.length > 0) {
      return fail({ message: 'User already has a pending invite', status: 409 });
    }

    // Create invite
    const [invite] = await db
      .insert(projectInvites)
      .values({
        projectId: input.projectId,
        invitedUserId: invitedUser.id,
        inviterUserId: currentUser.id,
      })
      .returning({ id: projectInvites.id });

    return invite;
  },
});

// ==================================================
// READ
// ==================================================

/**
 * @description Get all invites for a project
 * @param projectId - The ID of the project
 * @returns Promise with array of project invites with user emails
 */
export const getProjectInvites = createAction({
  name: 'getProjectInvites',
  validator: z.object({
    projectId: z.string().min(1, 'Project ID is required'),
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
      return fail({ message: 'Only project owners can view invites', status: 403 });
    }

    const invites = await db
      .select({
        id: projectInvites.id,
        invitedUserId: projectInvites.invitedUserId,
        inviterUserId: projectInvites.inviterUserId,
        status: projectInvites.status,
        createdAt: projectInvites.createdAt,
      })
      .from(projectInvites)
      .where(eq(projectInvites.projectId, input.projectId));

    // Get user emails for the invites
    const userIds = [...new Set(invites.map((i) => [i.invitedUserId, i.inviterUserId]).flat())];

    const { data: users } = await getUsersByIds({ userIds });
    const userMap = new Map(users?.map((u) => [u.id, u.email]) || []);

    return invites.map((invite) => ({
      id: invite.id,
      email: userMap.get(invite.invitedUserId) || '',
      status: invite.status,
      createdAt: invite.createdAt,
      inviterEmail: userMap.get(invite.inviterUserId) || '',
    }));
  },
});

/**
 * @description Get all invites for the current user
 * @returns Promise with array of project invites with project details
 */
export const getUserInvites = createAction({
  name: 'getUserInvites',
  validator: null,
  requireAuth: true,
  actionFn: async ({ currentUser }) => {
    const invites = await db
      .select({
        id: projectInvites.id,
        projectId: projectInvites.projectId,
        inviterUserId: projectInvites.inviterUserId,
        createdAt: projectInvites.createdAt,
      })
      .from(projectInvites)
      .where(
        and(eq(projectInvites.invitedUserId, currentUser.id), eq(projectInvites.status, 'pending'))
      );

    // Get project names and inviter emails
    const projectIds = invites.map((i) => i.projectId);
    const inviterIds = invites.map((i) => i.inviterUserId);

    const [projects, { data: users }] = await Promise.all([
      db.query.projects.findMany({
        where: (projects, { inArray }) => inArray(projects.id, projectIds),
        columns: { id: true, name: true },
      }),
      getUsersByIds({ userIds: inviterIds }),
    ]);

    const projectMap = new Map(projects.map((p) => [p.id, p.name]));
    const userMap = new Map(users?.map((u) => [u.id, u.email]) || []);

    return invites.map((invite) => ({
      id: invite.id,
      projectId: invite.projectId,
      projectName: projectMap.get(invite.projectId) || '',
      inviterEmail: userMap.get(invite.inviterUserId) || '',
      createdAt: invite.createdAt,
    }));
  },
});

// ==================================================
// UPDATE
// ==================================================

/**
 * @description Accept a project invite
 * @param inviteId - The ID of the invite to accept
 * @returns Promise with success status
 */
export const acceptProjectInvite = createAction({
  name: 'acceptProjectInvite',
  validator: z.object({
    inviteId: z.string().min(1, 'Invite ID is required'),
  }),
  requireAuth: true,
  actionFn: async ({ input, currentUser }) => {
    return await db.transaction(async (tx) => {
      // Get and validate invite
      const [invite] = await tx
        .select()
        .from(projectInvites)
        .where(
          and(
            eq(projectInvites.id, input.inviteId),
            eq(projectInvites.invitedUserId, currentUser.id),
            eq(projectInvites.status, 'pending')
          )
        );

      if (!invite) {
        return fail({ message: 'Invalid or expired invite', status: 404 });
      }

      // Add user to project
      await tx.insert(projectUsers).values({
        projectId: invite.projectId,
        userId: currentUser.id,
        role: 'member',
      });

      // Delete the invite
      await tx.delete(projectInvites).where(eq(projectInvites.id, input.inviteId));

      return true;
    });
  },
});

/**
 * @description Reject a project invite
 * @param inviteId - The ID of the invite to reject
 * @returns Promise with success status
 */
export const rejectProjectInvite = createAction({
  name: 'rejectProjectInvite',
  validator: z.object({
    inviteId: z.string().min(1, 'Invite ID is required'),
  }),
  requireAuth: true,
  actionFn: async ({ input, currentUser }) => {
    return await db.transaction(async (tx) => {
      const result = await tx
        .update(projectInvites)
        .set({ status: 'rejected' })
        .where(
          and(
            eq(projectInvites.id, input.inviteId),
            eq(projectInvites.invitedUserId, currentUser.id),
            eq(projectInvites.status, 'pending')
          )
        )
        .returning();

      return result.length > 0;
    });
  },
});

// ==================================================
// DELETE
// ==================================================

/**
 * @description Remove a project invite
 * @param inviteId - The ID of the invite to remove
 * @returns Promise with success status
 */
export const removeProjectInvite = createAction({
  name: 'removeProjectInvite',
  validator: z.object({
    inviteId: z.string().min(1, 'Invite ID is required'),
  }),
  requireAuth: true,
  actionFn: async ({ input, currentUser }) => {
    return await db.transaction(async (tx) => {
      // Get invite details first to check ownership
      const [invite] = await tx
        .select()
        .from(projectInvites)
        .where(eq(projectInvites.id, input.inviteId));
      if (!invite) {
        return fail({ message: 'Invite not found', status: 404 });
      }

      // Check if user is project owner
      const { data: isOwner, error: ownerError } = await isProjectOwner({
        projectId: invite.projectId,
        userId: currentUser.id,
      });
      if (ownerError) return fail(ownerError);
      if (!isOwner) {
        return fail({ message: 'Only project owners can remove invites', status: 403 });
      }

      const result = await db
        .delete(projectInvites)
        .where(eq(projectInvites.id, input.inviteId))
        .returning();

      return result.length > 0;
    });
  },
});
