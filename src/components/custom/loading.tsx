'use client';

import { Loader2 } from 'lucide-react';
import * as React from 'react';

import { cn } from '@/utils';

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Spinner({ className, ...props }: SpinnerProps) {
  return (
    <div
      role='status'
      aria-label='Loading'
      className={cn('animate-spin text-muted-foreground', className)}
      {...props}
    >
      <Loader2 className='h-4 w-4' />
      <span className='sr-only'>Loading...</span>
    </div>
  );
}
