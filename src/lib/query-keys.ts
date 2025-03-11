/**
 * @description Type-safe query key generator
 * Access via queryKey.<domain>.<functionName>
 */
export const queryKey = {
  auth: {
    getCurrentUser: () => ['user'] as const,
    refreshSession: () => ['session'] as const,
  },
  projects: {
    getProjectById: ({ projectId }: { projectId: string }) =>
      ['projects', 'detail', projectId] as const,
    getCurrentUserProjects: () => ['projects', 'user'] as const,
    isProjectOwner: ({ projectId, userId }: { projectId: string; userId: string }) =>
      ['project-owner', projectId, userId] as const,
    getDefaultProjectCandidates: ({ excludeProjectId }: { excludeProjectId?: string }) =>
      ['projects', 'candidates', excludeProjectId] as const,
  },
  projectMembers: {
    getProjectMembers: ({ projectId }: { projectId: string }) =>
      ['project-members', projectId] as const,
  },
  users: {
    getUserById: ({ userId }: { userId: string }) => ['users', userId] as const,
    getUsersByIds: ({ userIds }: { userIds: string[] }) => ['users', 'batch', userIds] as const,
  },
  invites: {
    getProjectInvites: ({ projectId }: { projectId: string }) =>
      ['project-invites', projectId] as const,
    getUserInvites: () => ['user-invites'] as const,
  },
  feedback: {
    getUserFeedback: () => ['feedback', 'list'] as const,
    getFeedbackById: ({ feedbackId }: { feedbackId: string }) =>
      ['feedback', 'detail', feedbackId] as const,
  },
  support: {
    getUserTickets: () => ['support', 'tickets'] as const,
    getTicketById: ({ ticketId }: { ticketId: string }) => ['support', 'ticket', ticketId] as const,
  },
  mailingList: {
    isEmailSubscribed: ({ email }: { email: string }) =>
      ['mailing-list', 'subscribe', email] as const,
    getSubscriptionByEmail: ({ email }: { email: string }) =>
      ['mailing-list', 'status', email] as const,
  },
  notifications: {
    getUnreadCount: () => ['notifications', 'unread-count'] as const,
    getUserNotifications: () => ['notifications', 'list'] as const,
  },
  persona: {
    getPersonaConfigsByProject: ({ projectId }: { projectId: string }) =>
      ['persona', 'configs', projectId] as const,
    getPersonaConfigById: ({ id }: { id: string }) => ['persona', 'config', id] as const,
  },
  funnel: {
    all: (projectId: string) => ['funnels', projectId] as const,
    detail: (funnelId: string) => ['funnel', funnelId] as const,
  },
  simulation: {
    getFunnelSimulations: ({ funnelId }: { funnelId: string }) =>
      ['simulations', 'funnel', funnelId] as const,
    getProjectFunnelsWithSimulations: ({ projectId }: { projectId: string }) =>
      ['simulations', 'project', projectId] as const,
  },
} as const;
