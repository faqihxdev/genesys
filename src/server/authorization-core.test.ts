import { describe, expect, it, vi } from 'vitest';
import {
  AuthorizationError,
  createProjectAuthorizer,
  type ProjectMembershipResolver,
} from './authorization-core';

describe('createProjectAuthorizer', () => {
  it('returns membership for an allowed project member', async () => {
    const resolveMembership: ProjectMembershipResolver = vi.fn().mockResolvedValue({
      projectId: 'prj-test-id',
      role: 'member',
    });
    const authorize = createProjectAuthorizer(resolveMembership);

    await expect(
      authorize({
        userId: 'user-1',
        resource: { kind: 'funnel', id: 'fnl-test-id' },
      })
    ).resolves.toEqual({
      projectId: 'prj-test-id',
      role: 'member',
    });

    expect(resolveMembership).toHaveBeenCalledWith({
      userId: 'user-1',
      resource: { kind: 'funnel', id: 'fnl-test-id' },
    });
  });

  it('denies users without project membership', async () => {
    const authorize = createProjectAuthorizer(vi.fn().mockResolvedValue(null));

    await expect(
      authorize({
        userId: 'user-2',
        resource: { kind: 'simulation', id: 'sim-test-id' },
      })
    ).rejects.toMatchObject({
      name: 'AuthorizationError',
      status: 403,
    });
  });

  it('enforces owner-only operations', async () => {
    const authorize = createProjectAuthorizer(
      vi.fn().mockResolvedValue({
        projectId: 'prj-test-id',
        role: 'member',
      })
    );

    await expect(
      authorize({
        userId: 'user-3',
        resource: { kind: 'project', id: 'prj-test-id' },
        allowedRoles: ['owner'],
      })
    ).rejects.toBeInstanceOf(AuthorizationError);
  });
});
