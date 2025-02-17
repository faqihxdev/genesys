import type { Notification } from '@/db/schema/notification';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Bell, CheckCircle2, Clock, Info, MessageCircle, Zap } from 'lucide-react';
import Link from 'next/link';

interface NotificationItemProps {
  notification: Notification;
  onRead?: (id: string) => void;
  onUnread?: (id: string) => void;
  onArchive?: (id: string) => void;
  className?: string;
}

/**
 * @description Renders a single notification item
 */
export function NotificationItem({
  notification,
  onRead,
  onUnread,
  onArchive,
  className,
}: NotificationItemProps) {
  // Get icon based on notification category
  const Icon = {
    project: Zap,
    invite: Bell,
    support: MessageCircle,
    feedback: Info,
    simulation: Clock,
    system: CheckCircle2,
  }[notification.category];

  // Get priority styles
  const priorityStyles = {
    low: '',
    medium: 'border-l-yellow-500',
    high: 'border-l-orange-500',
    urgent: 'border-l-red-500',
  }[notification.priority];

  // Format relative time
  const formattedTime = format(new Date(notification.createdAt), 'MMM d, h:mm a');

  return (
    <div
      className={cn(
        'group relative flex gap-4 rounded-lg border p-4 transition-colors hover:bg-muted/50',
        !notification.isRead && 'bg-muted/30',
        notification.isArchived && 'opacity-75',
        priorityStyles && 'border-l-4',
        className
      )}
    >
      {/* Icon */}
      <div className='flex-shrink-0'>
        <Icon className='h-5 w-5 text-primary' />
      </div>

      {/* Content */}
      <div className='flex-1 space-y-1'>
        {/* Title and Date */}
        <div className='flex items-start justify-between gap-2'>
          <div className='space-y-0.5'>
            <h4
              className={cn(
                'text-sm font-medium',
                !notification.isRead && 'font-semibold text-primary'
              )}
            >
              {notification.title}
            </h4>
            <p className='text-sm text-muted-foreground line-clamp-2'>{notification.message}</p>
          </div>
          <time className='flex-shrink-0 text-xs text-muted-foreground'>{formattedTime}</time>
        </div>

        {/* Action Link */}
        {notification.actionUrl && (
          <Link
            href={notification.actionUrl}
            target='_blank'
            className='text-xs font-medium text-primary hover:underline'
          >
            View Details
          </Link>
        )}
      </div>

      {/* Actions */}
      {(onRead || onUnread || onArchive) && (
        <div className='absolute right-2 top-9 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100'>
          {!notification.isRead && onRead && (
            <button
              onClick={() => onRead(notification.id)}
              className='rounded bg-background/80 px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground'
            >
              Mark as Read
            </button>
          )}
          {notification.isRead && onUnread && (
            <button
              onClick={() => onUnread(notification.id)}
              className='rounded bg-background/80 px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground'
            >
              Mark as Unread
            </button>
          )}
          {!notification.isArchived && onArchive && (
            <button
              onClick={() => onArchive(notification.id)}
              className='rounded bg-background/80 px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground'
            >
              Archive
            </button>
          )}
        </div>
      )}
    </div>
  );
}
