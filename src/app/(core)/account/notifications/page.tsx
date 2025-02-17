'use client';

import { NotificationItem } from '@/components/custom/notification-item';
import { PageTitle } from '@/components/custom/page-title';
import { Spinner } from '@/components/custom/spinner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import type { NotificationCategory, NotificationPriority } from '@/db/schema/notification';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/query-client';
import { queryKey } from '@/lib/query-keys';
import { withQuery } from '@/lib/utils';
import { acceptProjectInvite, getUserInvites, rejectProjectInvite } from '@/server/invites';
import {
  archiveNotifications,
  getUserNotifications,
  markAllNotificationsAsRead,
  markNotificationsAsRead,
  markNotificationsAsUnread,
} from '@/server/notifications';
import { currentProjectIdAtom, lastValidProjectIdAtom } from '@/stores/project';
import { useMutation, useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useAtom } from 'jotai';
import { Bell, Check, Clock, Mail, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';

/**
 * @description Notifications page with filtering and management
 */
export default function NotificationsPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [, setCurrentProjectId] = useAtom(currentProjectIdAtom);
  const [, setLastValidProjectId] = useAtom(lastValidProjectIdAtom);

  // Local state for filters
  const [includeRead, setIncludeRead] = useState(false);
  const [includeArchived, setIncludeArchived] = useState(false);
  const [category, setCategory] = useState<NotificationCategory>();
  const [priority, setPriority] = useState<NotificationPriority>();

  // Query for notifications
  const { data: notificationsData, isLoading: isLoadingNotifications } = useQuery({
    queryKey: [
      ...queryKey.notifications.getUserNotifications(),
      { includeRead, includeArchived, category, priority },
    ],
    queryFn: withQuery(() =>
      getUserNotifications({
        limit: 50,
        offset: 0,
        includeRead,
        includeArchived,
        category,
        priority,
      })
    ),
  });

  // Query for invites
  const { data: invites, isLoading: isLoadingInvites } = useQuery({
    queryKey: queryKey.invites.getUserInvites(),
    queryFn: withQuery(getUserInvites),
  });

  // Mutation to mark notifications as read
  const { mutate: markAsRead } = useMutation({
    mutationFn: withQuery(markNotificationsAsRead),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKey.notifications.getUnreadCount(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKey.notifications.getUserNotifications(),
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to mark notification as read',
        variant: 'destructive',
      });
    },
  });

  // Mutation to mark all as read
  const { mutate: markAllAsRead } = useMutation({
    mutationFn: withQuery(markAllNotificationsAsRead),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKey.notifications.getUnreadCount(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKey.notifications.getUserNotifications(),
      });
      toast({
        title: 'Success',
        description: 'All notifications marked as read',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to mark all notifications as read',
        variant: 'destructive',
      });
    },
  });

  // Mutation to archive notifications
  const { mutate: archive } = useMutation({
    mutationFn: withQuery(archiveNotifications),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKey.notifications.getUserNotifications(),
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to archive notification',
        variant: 'destructive',
      });
    },
  });

  // Mutation to accept invite
  const { mutate: acceptInvite, isPending: isAccepting } = useMutation<
    boolean,
    Error,
    { inviteId: string }
  >({
    mutationFn: withQuery(acceptProjectInvite),
    onSuccess: async (_, { inviteId }) => {
      // Update project selection
      const invite = invites?.find((inv) => inv.id === inviteId);
      if (invite) {
        setCurrentProjectId(invite.projectId);
        setLastValidProjectId(invite.projectId);

        // Refetch all related queries and wait for them to complete
        await Promise.all([
          queryClient.refetchQueries({
            queryKey: queryKey.invites.getUserInvites(),
            exact: false,
          }),
          queryClient.refetchQueries({
            queryKey: queryKey.projects.getCurrentUserProjects(),
            exact: false,
          }),
        ]);

        toast({
          title: 'Invite accepted',
          description: 'You have been added to the project.',
          variant: 'success',
        });

        // Navigate after queries are refetched
        router.push(`/project/${invite.projectId}`);
      }
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to accept invite',
        variant: 'destructive',
      });
    },
  });

  // Mutation to reject invite
  const { mutate: rejectInvite, isPending: isRejecting } = useMutation<
    boolean,
    Error,
    { inviteId: string }
  >({
    mutationFn: withQuery(rejectProjectInvite),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKey.invites.getUserInvites() });
      toast({
        title: 'Invite rejected',
        description: 'The invite has been rejected.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to reject invite',
        variant: 'destructive',
      });
    },
  });

  // Mutation to mark notifications as unread
  const { mutate: markAsUnread } = useMutation({
    mutationFn: withQuery(markNotificationsAsUnread),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKey.notifications.getUnreadCount(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKey.notifications.getUserNotifications(),
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to mark notification as unread',
        variant: 'destructive',
      });
    },
  });

  // Handlers
  const handleMarkAsRead = useCallback(
    (id: string) => {
      markAsRead({ notificationIds: [id] });
    },
    [markAsRead]
  );

  const handleMarkAsUnread = useCallback(
    (id: string) => {
      markAsUnread({ notificationIds: [id] });
    },
    [markAsUnread]
  );

  const handleArchive = useCallback(
    (id: string) => {
      archive({ notificationIds: [id] });
    },
    [archive]
  );

  return (
    <div className='w-full max-w-3xl mx-auto space-y-6'>
      <div className='space-y-4'>
        <PageTitle
          title='Notifications'
          description='View and manage your notifications across all your projects and activities.'
        />
      </div>

      {/* Project Invites */}
      <Card>
        <CardHeader>
          <CardTitle>Project Invites</CardTitle>
          <CardDescription>Manage your pending project invitations.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingInvites ? (
            <div className='space-y-4'>
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className='h-24 w-full rounded-lg' />
              ))}
            </div>
          ) : !invites?.length ? (
            <div className='flex flex-col items-center justify-center py-12 text-center'>
              <Mail className='h-12 w-12 text-primary' />
              <h3 className='mt-4 text-lg font-semibold'>No pending invites</h3>
              <p className='text-sm text-muted-foreground'>
                You don&apos;t have any pending project invitations at the moment.
              </p>
            </div>
          ) : (
            <div className='space-y-4'>
              {invites.map((invite) => (
                <div
                  key={invite.id}
                  className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg border'
                >
                  <div className='space-y-1'>
                    <div className='font-medium'>{invite.projectName}</div>
                    <div className='text-sm text-muted-foreground'>
                      Invited by {invite.inviterEmail}
                    </div>
                    <div className='flex items-center gap-1 text-xs text-muted-foreground'>
                      <Clock className='h-3 w-3' />
                      <span>{format(new Date(invite.createdAt), 'MMM d, yyyy')}</span>
                    </div>
                  </div>
                  <div className='flex items-center gap-2 self-end sm:self-center'>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => rejectInvite({ inviteId: invite.id })}
                      disabled={isRejecting}
                    >
                      {isRejecting ? (
                        <>
                          <Spinner size='sm' className='mr-2' />
                          <span>Rejecting...</span>
                        </>
                      ) : (
                        <>
                          <X className='h-4 w-4 mr-1' />
                          <span>Reject</span>
                        </>
                      )}
                    </Button>
                    <Button
                      size='sm'
                      onClick={() => acceptInvite({ inviteId: invite.id })}
                      disabled={isAccepting}
                    >
                      {isAccepting ? (
                        <>
                          <Spinner size='sm' className='mr-2' />
                          <span>Accepting...</span>
                        </>
                      ) : (
                        <>
                          <Check className='h-4 w-4 mr-1' />
                          <span>Accept</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div>
              <CardTitle>All Notifications</CardTitle>
              <CardDescription>Filter and manage your notifications.</CardDescription>
            </div>
            <Button onClick={() => markAllAsRead({})}>Mark all as read</Button>
          </div>
        </CardHeader>

        <CardContent>
          {/* Filters */}
          <div className='mb-6 flex flex-wrap gap-4'>
            <Select
              value={category ?? 'all'}
              onValueChange={(value) =>
                setCategory(value === 'all' ? undefined : (value as NotificationCategory))
              }
            >
              <SelectTrigger className='w-[180px] h-9'>
                <SelectValue placeholder='All categories' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All categories</SelectItem>
                <SelectItem value='project'>Project</SelectItem>
                <SelectItem value='invite'>Invite</SelectItem>
                <SelectItem value='support'>Support</SelectItem>
                <SelectItem value='feedback'>Feedback</SelectItem>
                <SelectItem value='simulation'>Simulation</SelectItem>
                <SelectItem value='system'>System</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={priority ?? 'all'}
              onValueChange={(value) =>
                setPriority(value === 'all' ? undefined : (value as NotificationPriority))
              }
            >
              <SelectTrigger className='w-[180px] h-9'>
                <SelectValue placeholder='All priorities' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All priorities</SelectItem>
                <SelectItem value='low'>Low</SelectItem>
                <SelectItem value='medium'>Medium</SelectItem>
                <SelectItem value='high'>High</SelectItem>
                <SelectItem value='urgent'>Urgent</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant={includeRead ? 'default' : 'outline'}
              onClick={() => setIncludeRead(!includeRead)}
            >
              Show read
            </Button>

            <Button
              variant={includeArchived ? 'default' : 'outline'}
              onClick={() => setIncludeArchived(!includeArchived)}
            >
              Show archived
            </Button>
          </div>

          {/* Notifications list */}
          {isLoadingNotifications ? (
            <div className='space-y-4'>
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className='h-24 w-full rounded-lg' />
              ))}
            </div>
          ) : !notificationsData?.notifications.length ? (
            <div className='flex flex-col items-center justify-center py-12 text-center'>
              <Bell className='h-12 w-12 text-primary' />
              <h3 className='mt-4 text-lg font-semibold'>No notifications found</h3>
              <p className='text-sm text-muted-foreground'>
                Try adjusting your filters to see more notifications.
              </p>
            </div>
          ) : (
            <div className='space-y-4'>
              {notificationsData.notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onRead={handleMarkAsRead}
                  onUnread={handleMarkAsUnread}
                  onArchive={handleArchive}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
