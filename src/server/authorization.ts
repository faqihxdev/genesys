import { db } from '@/db';
import { funnels, personaConfigs, personas, projectUsers, simulations } from '@/db/schema';
import { and, eq } from 'drizzle-orm';
import {
  createProjectAuthorizer,
  type ProjectAccessRequest,
  type ProjectMembership,
} from './authorization-core';

export { AuthorizationError } from './authorization-core';

/**
 * @description Resolves a user's membership for any project-backed domain resource.
 * @param request - User and resource pair to resolve
 * @returns Project membership when the user can access the resource
 */
async function resolveProjectMembership({
  userId,
  resource,
}: Pick<ProjectAccessRequest, 'userId' | 'resource'>): Promise<ProjectMembership | null> {
  const selection = {
    projectId: projectUsers.projectId,
    role: projectUsers.role,
  };

  switch (resource.kind) {
    case 'project': {
      const [membership] = await db
        .select(selection)
        .from(projectUsers)
        .where(and(eq(projectUsers.projectId, resource.id), eq(projectUsers.userId, userId)))
        .limit(1);

      return membership ?? null;
    }
    case 'funnel': {
      const [membership] = await db
        .select(selection)
        .from(funnels)
        .innerJoin(
          projectUsers,
          and(eq(projectUsers.projectId, funnels.projectId), eq(projectUsers.userId, userId))
        )
        .where(eq(funnels.id, resource.id))
        .limit(1);

      return membership ?? null;
    }
    case 'persona-config': {
      const [membership] = await db
        .select(selection)
        .from(personaConfigs)
        .innerJoin(
          projectUsers,
          and(eq(projectUsers.projectId, personaConfigs.projectId), eq(projectUsers.userId, userId))
        )
        .where(eq(personaConfigs.id, resource.id))
        .limit(1);

      return membership ?? null;
    }
    case 'persona': {
      const [membership] = await db
        .select(selection)
        .from(personas)
        .innerJoin(personaConfigs, eq(personaConfigs.id, personas.personaConfigId))
        .innerJoin(
          projectUsers,
          and(eq(projectUsers.projectId, personaConfigs.projectId), eq(projectUsers.userId, userId))
        )
        .where(eq(personas.id, resource.id))
        .limit(1);

      return membership ?? null;
    }
    case 'simulation': {
      const [membership] = await db
        .select(selection)
        .from(simulations)
        .innerJoin(funnels, eq(funnels.id, simulations.funnelId))
        .innerJoin(
          projectUsers,
          and(eq(projectUsers.projectId, funnels.projectId), eq(projectUsers.userId, userId))
        )
        .where(eq(simulations.id, resource.id))
        .limit(1);

      return membership ?? null;
    }
  }
}

export const requireProjectAccess = createProjectAuthorizer(resolveProjectMembership);
