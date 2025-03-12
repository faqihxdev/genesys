'use client';

import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Funnel } from '@/types/funnel';
import { GitFork } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { FunnelActions } from './funnel-actions';

interface FunnelCardProps {
  funnel: Funnel;
}

export function FunnelCard({ funnel }: FunnelCardProps) {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;

  const handleClick = () => {
    router.push(`/project/${projectId}/funnels/${funnel.id}`);
  };

  return (
    <Card
      className='group relative h-full min-h-[200px] overflow-hidden transition-all hover:border-primary/50 hover:shadow-md cursor-pointer'
      onClick={handleClick}
    >
      <div className='absolute right-4 top-4 z-10' onClick={(e) => e.stopPropagation()}>
        <FunnelActions />
      </div>
      <CardHeader className='flex h-full flex-col justify-between space-y-4 p-6'>
        <div className='flex min-w-0 flex-col gap-3'>
          <div className='rounded-md bg-primary/10 p-2.5 text-primary transition-colors group-hover:bg-primary/20 w-fit'>
            <GitFork className='h-5 w-5 shrink-0' />
          </div>
          <div className='min-w-0 space-y-1.5'>
            <CardTitle className='line-clamp-2 text-xl leading-tight'>{funnel.name}</CardTitle>
            <CardDescription className='line-clamp-3 text-sm/relaxed'>
              {funnel.description}
            </CardDescription>
          </div>
        </div>

        <div className='flex flex-wrap items-center gap-x-2 gap-y-1'>
          <div
            className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
              funnel.status === 'active'
                ? 'border-green-600 bg-green-600/10 text-green-600'
                : funnel.status === 'draft'
                  ? 'border-yellow-600 bg-yellow-600/10 text-yellow-600'
                  : 'border-muted bg-muted/10 text-muted-foreground'
            }`}
          >
            {funnel.status.charAt(0).toUpperCase() + funnel.status.slice(1)}
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}
