'use client';

import { Loader2 } from 'lucide-react';
import { HTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

interface SpinnerProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * The size of the spinner
   * @default 'default'
   */
  size?: 'xs' | 'sm' | 'default' | 'lg';

  /**
   * Whether to show the loading text
   * @default false
   */
  showText?: boolean;

  /**
   * Custom loading text
   * @default 'Loading'
   */
  text?: string;

  /**
   * Whether to center the spinner
   * @default false
   */
  center?: boolean;
}

/**
 * A customizable loading spinner component
 */
export function Spinner({
  className,
  size = 'default',
  showText = false,
  text = 'Loading',
  center = false,
  ...props
}: SpinnerProps) {
  const sizeClasses = {
    xs: 'h-2 w-2',
    sm: 'h-3 w-3',
    default: 'h-4 w-4',
    lg: 'h-6 w-6',
  };

  return (
    <div
      role='status'
      aria-label={text}
      className={cn('inline-flex items-center gap-2', center && 'justify-center', className)}
      {...props}
    >
      <div className='animate-spin'>
        <Loader2 className={sizeClasses[size]} />
      </div>
      {showText && <span className='text-muted-foreground text-sm'>{text}</span>}
      {/* sr-only is used for screen readers even when text is not shown visually */}
      <span className='sr-only'>{text}</span>
    </div>
  );
}
