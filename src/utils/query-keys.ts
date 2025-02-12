export const queryKeys = {
  auth: {
    user: () => ['user'] as const,
  },
  projects: {
    all: () => ['projects'] as const,
    list: (userId: string) => ['projects', 'list', userId] as const,
    detail: (projectId: string) => ['projects', 'detail', projectId] as const,
    candidates: (userId: string, excludeProjectId?: string) =>
      ['projects', 'candidates', userId, excludeProjectId] as const,
    owner: (projectId: string, userId?: string) => ['project-owner', projectId, userId] as const,
  },
  projectMembers: {
    all: (projectId: string) => ['project-members', projectId] as const,
    search: (query: string, projectId: string) =>
      ['project-members', 'search', query, projectId] as const,
  },
  projectInvites: {
    all: (projectId: string) => ['project-invites', projectId] as const,
    user: () => ['user-invites'] as const,
  },
  users: {
    byId: (userId: string) => ['users', userId] as const,
    byIds: (userIds: string[]) => ['users', 'batch', userIds] as const,
    search: (query: string) => ['users', 'search', query] as const,
  },
} as const;
