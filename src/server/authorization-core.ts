import type { ProjectUserRole } from '@/db/schema/project';

export type ProjectResource =
  | { kind: 'project'; id: string }
  | { kind: 'funnel'; id: string }
  | { kind: 'persona-config'; id: string }
  | { kind: 'persona'; id: string }
  | { kind: 'simulation'; id: string };

export interface ProjectMembership {
  projectId: string;
  role: ProjectUserRole;
}

export interface ProjectAccessRequest {
  userId: string;
  resource: ProjectResource;
  allowedRoles?: readonly ProjectUserRole[];
}

export type ProjectMembershipResolver = (
  request: Pick<ProjectAccessRequest, 'userId' | 'resource'>
) => Promise<ProjectMembership | null>;

/**
 * @description Error thrown when a user cannot access a project resource.
 */
export class AuthorizationError extends Error {
  readonly status = 403;

  constructor(message = 'Access denied') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

/**
 * @description Creates a project authorizer around a membership resolver adapter.
 * @param resolveMembership - Adapter that resolves membership for a project-backed resource
 * @returns Function that validates project membership and role
 */
export function createProjectAuthorizer(resolveMembership: ProjectMembershipResolver) {
  return async ({
    userId,
    resource,
    allowedRoles = ['owner', 'member'],
  }: ProjectAccessRequest): Promise<ProjectMembership> => {
    const membership = await resolveMembership({ userId, resource });

    if (!membership || !allowedRoles.includes(membership.role)) {
      throw new AuthorizationError();
    }

    return membership;
  };
}
