'use client';

import { Card, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function FunnelCardSkeleton() {
  return (
    <Card className='group relative h-full min-h-[200px] overflow-hidden transition-all hover:border-primary/50 hover:shadow-md'>
      <div className='absolute right-4 top-4'>
        <Skeleton className='h-8 w-8 rounded-md' />
      </div>
      <CardHeader className='flex h-full flex-col justify-between space-y-4 p-6'>
        <div className='flex min-w-0 flex-col gap-3'>
          <Skeleton className='h-10 w-10 rounded-md' />
          <div className='min-w-0 space-y-1.5'>
            <Skeleton className='h-6 w-3/4' />
            <Skeleton className='h-4 w-full' />
            <Skeleton className='h-4 w-2/3' />
          </div>
        </div>

        <div className='flex flex-wrap items-center gap-x-2 gap-y-1'>
          <Skeleton className='h-6 w-20 rounded-md' />
        </div>
      </CardHeader>
    </Card>
  );
}
