'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/query-client';
import { queryKey } from '@/lib/query-keys';
import { withQuery } from '@/lib/utils';
import {
  getUnreadCount,
  getUserNotifications,
  markNotificationsAsRead,
} from '@/server/notifications';
import { useMutation, useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Bell } from 'lucide-react';
import Link from 'next/link';
import { Fragment, useEffect, useRef } from 'react';

/**
 * @description Notification bell component with unread count and dropdown
 */
export function NotificationBell() {
  const { toast } = useToast();
  const previousCount = useRef<number>();

  // Query for unread count
  const { data: unreadCount, isLoading: isLoadingCount } = useQuery({
    queryKey: queryKey.notifications.getUnreadCount(),
    queryFn: withQuery(getUnreadCount),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Effect to check if unread count has changed
  useEffect(() => {
    if (typeof unreadCount === 'number' && typeof previousCount.current === 'number') {
      if (unreadCount !== previousCount.current) {
        // Invalidate notifications query to refresh the list
        queryClient.invalidateQueries({
          queryKey: queryKey.notifications.getUserNotifications(),
        });
      }
    }
    previousCount.current = unreadCount;
  }, [unreadCount]);

  // Query for recent notifications
  const { data: notificationsData, isLoading: isLoadingNotifications } = useQuery({
    queryKey: queryKey.notifications.getUserNotifications(),
    queryFn: withQuery(() =>
      getUserNotifications({
        limit: 5,
        offset: 0,
        includeRead: false,
        includeArchived: false,
      })
    ),
    refetchInterval: 30000, // Refetch every 30 seconds
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
        description: error instanceof Error ? error.message : 'Failed to mark notification as read',
        variant: 'destructive',
      });
    },
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className='relative flex items-center justify-center rounded-lg p-2 hover:bg-accent'>
          <Bell className='h-5 w-5 text-muted-foreground hover:text-foreground transition-colors' />
          {/* Unread count badge */}
          {isLoadingCount ? (
            <Skeleton className='absolute -right-1 -top-1 h-4 w-4 rounded-full' />
          ) : (
            unreadCount! > 0 && (
              <span className='absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground'>
                {unreadCount! > 99 ? '99+' : unreadCount}
              </span>
            )
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align='end' className='w-80'>
        {/* Loading state */}
        {isLoadingNotifications ? (
          <div className='space-y-2 p-2'>
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className='h-20 w-full rounded-lg' />
            ))}
          </div>
        ) : !notificationsData?.notifications.length ? (
          // Empty state
          <div className='flex flex-col items-center justify-center p-8 text-center'>
            <h4 className='mt-2 font-semibold'>All caught up!</h4>
            <p className='text-sm text-muted-foreground'>
              You don&apos;t have any unread notifications.
            </p>
          </div>
        ) : (
          // Notification list
          <>
            {notificationsData.notifications.map((notification, index) => (
              <Fragment key={notification.id}>
                <DropdownMenuItem
                  className='flex flex-col items-start gap-1 p-3'
                  onClick={() => {
                    if (!notification.isRead) {
                      markAsRead({ notificationIds: [notification.id] });
                    }
                    if (notification.actionUrl) {
                      window.open(notification.actionUrl, '_blank');
                    }
                  }}
                >
                  <div className='font-medium'>{notification.title}</div>
                  <div className='text-sm text-muted-foreground'>{notification.message}</div>
                  <div className='text-xs text-muted-foreground'>
                    {format(new Date(notification.createdAt), 'MMM d, h:mm a')}
                  </div>
                </DropdownMenuItem>
                {index < notificationsData.notifications.length - 1 && <DropdownMenuSeparator />}
              </Fragment>
            ))}
          </>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href='/account/notifications' className='w-full cursor-pointer justify-center'>
              View all notifications
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
