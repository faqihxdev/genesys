'use client';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { queryKey } from '@/lib/query-keys';
import { useQuery } from '@tanstack/react-query';
import { GitFork } from 'lucide-react';
import { useParams } from 'next/navigation';
import { getProjectFunnels } from '../_services/funnel-service';
import { FunnelCard } from './funnel-card';
import { FunnelCardSkeleton } from './funnel-skeleton';

export function FunnelGrid() {
  const { user } = useAuth();
  const params = useParams();
  const projectId = params.id as string;

  const {
    data: funnels,
    isLoading,
    error,
  } = useQuery({
    queryKey: queryKey.funnels.getProjectFunnels({ projectId }),
    queryFn: () => getProjectFunnels(projectId),
    enabled: !!user?.id && !!projectId,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  if (isLoading) {
    return (
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <FunnelCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className='flex flex-col items-center justify-center gap-2 py-8 text-center'>
        <p className='text-destructive'>Failed to load funnels</p>
        <p className='text-sm text-muted-foreground'>Please try again later</p>
      </div>
    );
  }

  if (!funnels?.length) {
    return (
      <div className='flex h-full flex-col items-center justify-center gap-4 rounded-lg border border-dashed p-8 text-center animate-in fade-in-50'>
        <div className='rounded-full bg-primary/10 p-4'>
          <GitFork className='h-8 w-8 text-primary' />
        </div>
        <div className='space-y-2'>
          <h3 className='text-xl font-semibold tracking-tight'>No funnels found</h3>
          <p className='text-sm text-muted-foreground max-w-[400px]'>
            You haven&apos;t created any funnels yet. Create your first funnel to start analyzing
            your customer journey.
          </p>
        </div>
        <Button size='lg' className='mt-2'>
          <GitFork className='mr-2 h-4 w-4' />
          Create your first funnel
        </Button>
      </div>
    );
  }

  return (
    <div className='h-full'>
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
        {funnels.map((funnel) => (
          <FunnelCard key={funnel.id} funnel={funnel} />
        ))}
      </div>
    </div>
  );
}
