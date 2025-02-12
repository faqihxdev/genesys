'use server';

import { getCurrentUser } from '@/server/auth';
import { db } from '@/server/db';
import { projectInvites } from '@/server/db/schema/invite';
import { projectUsers } from '@/server/db/schema/project';
import type { ActionResponse } from '@/types/utils';
import { and, eq } from 'drizzle-orm';
import { isProjectOwner } from './projects';
import { getUsersByIds, searchUsersByEmail } from './users';

/**
 * @description Create a new project invite
 * @param input - The input containing projectId and email
 * @returns Promise with the created invite
 */
export async function createProjectInvite(input: {
  projectId: string;
  email: string;
}): Promise<ActionResponse<{ id: string }>> {
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
        error: { message: 'Only project owners can invite members', status: 403 },
      };
    }

    // Search for user by email
    const { data: invitedUser, error: searchError } = await searchUsersByEmail(input.email);
    if (searchError) return { data: null, error: searchError };
    if (!invitedUser) {
      return { data: null, error: { message: 'User not found' } };
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
      return { data: null, error: { message: 'User is already a member of this project' } };
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
      return { data: null, error: { message: 'User already has a pending invite' } };
    }

    // Create invite
    const [invite] = await db
      .insert(projectInvites)
      .values({
        projectId: input.projectId,
        invitedUserId: invitedUser.id,
        inviterUserId: user.id,
      })
      .returning({ id: projectInvites.id });

    return { data: invite, error: null };
  } catch (error) {
    console.error('[createProjectInvite]: ', error);
    return { data: null, error: { message: 'Failed to create project invite' } };
  }
}

/**
 * @description Get all invites for a project
 * @param projectId - The ID of the project
 * @returns Promise with array of project invites
 */
export async function getProjectInvites(projectId: string): Promise<
  ActionResponse<
    {
      id: string;
      email: string;
      status: string;
      createdAt: Date;
      inviterEmail: string;
    }[]
  >
> {
  try {
    const { data: user, error: authError } = await getCurrentUser();
    if (authError) return { data: null, error: authError };
    if (!user) return { data: null, error: { message: 'Unauthorized', status: 401 } };

    // Check if user is project owner
    const { data: isOwner, error: ownerError } = await isProjectOwner(projectId, user.id);
    if (ownerError) return { data: null, error: ownerError };
    if (!isOwner) {
      return {
        data: null,
        error: { message: 'Only project owners can view invites', status: 403 },
      };
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
      .where(eq(projectInvites.projectId, projectId));

    // Get user emails for the invites
    const userIds = [...new Set(invites.map((i) => [i.invitedUserId, i.inviterUserId]).flat())];
    const { data: users } = await getUsersByIds(userIds);
    const userMap = new Map(users?.map((u) => [u.id, u.email]) || []);

    return {
      data: invites.map((invite) => ({
        id: invite.id,
        email: userMap.get(invite.invitedUserId) || '',
        status: invite.status,
        createdAt: invite.createdAt,
        inviterEmail: userMap.get(invite.inviterUserId) || '',
      })),
      error: null,
    };
  } catch (error) {
    console.error('[getProjectInvites]: ', error);
    return { data: null, error: { message: 'Failed to get project invites' } };
  }
}

/**
 * @description Get all invites for the current user
 * @returns Promise with array of project invites
 */
export async function getUserInvites(): Promise<
  ActionResponse<
    {
      id: string;
      projectId: string;
      projectName: string;
      inviterEmail: string;
      createdAt: Date;
    }[]
  >
> {
  try {
    const { data: user, error: authError } = await getCurrentUser();
    if (authError) return { data: null, error: authError };
    if (!user) return { data: null, error: { message: 'Unauthorized', status: 401 } };

    const invites = await db
      .select({
        id: projectInvites.id,
        projectId: projectInvites.projectId,
        inviterUserId: projectInvites.inviterUserId,
        createdAt: projectInvites.createdAt,
      })
      .from(projectInvites)
      .where(and(eq(projectInvites.invitedUserId, user.id), eq(projectInvites.status, 'pending')));

    // Get project names and inviter emails
    const projectIds = invites.map((i) => i.projectId);
    const inviterIds = invites.map((i) => i.inviterUserId);

    const [projects, { data: users }] = await Promise.all([
      db.query.projects.findMany({
        where: (projects, { inArray }) => inArray(projects.id, projectIds),
        columns: { id: true, name: true },
      }),
      getUsersByIds(inviterIds),
    ]);

    const projectMap = new Map(projects.map((p) => [p.id, p.name]));
    const userMap = new Map(users?.map((u) => [u.id, u.email]) || []);

    return {
      data: invites.map((invite) => ({
        id: invite.id,
        projectId: invite.projectId,
        projectName: projectMap.get(invite.projectId) || '',
        inviterEmail: userMap.get(invite.inviterUserId) || '',
        createdAt: invite.createdAt,
      })),
      error: null,
    };
  } catch (error) {
    console.error('[getUserInvites]: ', error);
    return { data: null, error: { message: 'Failed to get user invites' } };
  }
}

/**
 * @description Accept a project invite
 * @param inviteId - The ID of the invite to accept
 * @returns Promise with success status
 */
export async function acceptProjectInvite(inviteId: string): Promise<ActionResponse<boolean>> {
  try {
    const { data: user, error: authError } = await getCurrentUser();
    if (authError) return { data: null, error: authError };
    if (!user) return { data: null, error: { message: 'Unauthorized', status: 401 } };

    return await db.transaction(async (tx) => {
      // Get and validate invite
      const [invite] = await tx
        .select()
        .from(projectInvites)
        .where(
          and(
            eq(projectInvites.id, inviteId),
            eq(projectInvites.invitedUserId, user.id),
            eq(projectInvites.status, 'pending')
          )
        );

      if (!invite) {
        return { data: null, error: { message: 'Invalid or expired invite' } };
      }

      // Update invite status
      await tx
        .update(projectInvites)
        .set({ status: 'accepted' })
        .where(eq(projectInvites.id, inviteId));

      // Add user to project
      await tx.insert(projectUsers).values({
        projectId: invite.projectId,
        userId: user.id,
        role: 'member',
      });

      return { data: true, error: null };
    });
  } catch (error) {
    console.error('[acceptProjectInvite]: ', error);
    return { data: null, error: { message: 'Failed to accept project invite' } };
  }
}

/**
 * @description Reject a project invite
 * @param inviteId - The ID of the invite to reject
 * @returns Promise with success status
 */
export async function rejectProjectInvite(inviteId: string): Promise<ActionResponse<boolean>> {
  try {
    const { data: user, error: authError } = await getCurrentUser();
    if (authError) return { data: null, error: authError };
    if (!user) return { data: null, error: { message: 'Unauthorized', status: 401 } };

    const result = await db
      .update(projectInvites)
      .set({ status: 'rejected' })
      .where(
        and(
          eq(projectInvites.id, inviteId),
          eq(projectInvites.invitedUserId, user.id),
          eq(projectInvites.status, 'pending')
        )
      )
      .returning();

    return { data: result.length > 0, error: null };
  } catch (error) {
    console.error('[rejectProjectInvite]: ', error);
    return { data: null, error: { message: 'Failed to reject project invite' } };
  }
}

/**
 * @description Remove a project invite
 * @param inviteId - The ID of the invite to remove
 * @returns Promise with success status
 */
export async function removeProjectInvite(inviteId: string): Promise<ActionResponse<boolean>> {
  try {
    const { data: user, error: authError } = await getCurrentUser();
    if (authError) return { data: null, error: authError };
    if (!user) return { data: null, error: { message: 'Unauthorized', status: 401 } };

    // Get invite details first to check ownership
    const [invite] = await db.select().from(projectInvites).where(eq(projectInvites.id, inviteId));
    if (!invite) {
      return { data: null, error: { message: 'Invite not found' } };
    }

    // Check if user is project owner
    const { data: isOwner, error: ownerError } = await isProjectOwner(invite.projectId, user.id);
    if (ownerError) return { data: null, error: ownerError };
    if (!isOwner) {
      return {
        data: null,
        error: { message: 'Only project owners can remove invites', status: 403 },
      };
    }

    const result = await db
      .delete(projectInvites)
      .where(eq(projectInvites.id, inviteId))
      .returning();

    return { data: result.length > 0, error: null };
  } catch (error) {
    console.error('[removeProjectInvite]: ', error);
    return { data: null, error: { message: 'Failed to remove project invite' } };
  }
}
