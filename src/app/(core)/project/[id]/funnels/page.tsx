'use client';

import useHydration from '@/hooks/use-hydration';
import { GitFork } from 'lucide-react';
import { FunnelGrid } from './_components/funnel-grid';

import { PageTitle } from '@/components/custom/page-title';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { queryKey } from '@/lib/query-keys';
import { withQuery } from '@/lib/utils';
import { getFunnelsWithFullData } from '@/server/funnel';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import SimulationControl from './components/simulation-control';

/**
 * Funnels page component
 * @returns Funnels page with minimal UI showing raw funnel data
 */
export default function FunnelsPage() {
  // const isHydrated = useHydration();

  // return (
  //   <div className='flex h-full flex-col'>
  //     <div className='flex-none space-y-4 mb-4'>
  //       <div className='flex items-center justify-between'>
  //         <h1 className='text-2xl font-semibold'>Marketing Funnels</h1>
  //         <Button>
  //           <GitFork className="mr-2 h-4 w-4" />
  //           Create Funnel
  //         </Button>
  //       </div>
  //       <p className='text-muted-foreground text-sm'>
  //         Design and optimize your marketing funnels by analyzing how different personas interact with
  //         each stage of your customer journey.
  //       </p>
  //     </div>
  //     <div className='flex-grow'>
  //       {isHydrated && <FunnelGrid />}
  const params = useParams();
  const projectId = params.id as string;
  const [expandedFunnelId, setExpandedFunnelId] = useState<string | null>(null);

  // Fetch funnels data directly in the component
  const {
    data: funnels,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: queryKey.funnel.all(projectId),
    queryFn: () => withQuery(getFunnelsWithFullData)({ projectId }),
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!projectId,
  });

  const toggleFunnelExpansion = (funnelId: string) => {
    if (expandedFunnelId === funnelId) {
      setExpandedFunnelId(null);
    } else {
      setExpandedFunnelId(funnelId);
    }
  };

  if (isLoading) {
    return (
      <div className='space-y-4 p-4'>
        <Skeleton className='h-10 w-1/4' />
        <Skeleton className='h-32 w-full' />
        <Skeleton className='h-32 w-full' />
      </div>
    );
  }

  if (isError) {
    return (
      <div className='p-4 text-destructive'>
        <h2 className='text-xl font-bold'>Error loading funnels</h2>
        <p>{(error as Error)?.message || 'An unknown error occurred'}</p>
      </div>
    );
  }

  if (!funnels || funnels.length === 0) {
    return (
      <div className='p-4'>
        <h2 className='text-xl font-bold mb-4'>No funnels found</h2>
        <p className='text-muted-foreground'>No funnels have been created for this project yet.</p>
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      <PageTitle
        title='Marketing Funnels'
        description='Design and optimize your marketing funnels by analyzing how different personas interact with each stage of your customer journey.'
      />

      <div className='space-y-4'>
        {funnels.map((funnel) => (
          <Card key={funnel.id} className='overflow-hidden'>
            <CardHeader className='bg-muted/50 py-4'>
              <CardTitle className='flex items-center justify-between'>
                <span>{funnel.name || 'Unnamed Funnel'}</span>
                <div className='flex space-x-2'>
                  <SimulationControl funnelId={funnel.id} projectId={projectId} />
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => toggleFunnelExpansion(funnel.id)}
                  >
                    {expandedFunnelId === funnel.id ? 'Collapse' : 'Expand'}
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className='p-0'>
              {expandedFunnelId === funnel.id ? (
                <pre className='p-4 overflow-auto max-h-[500px] text-xs'>
                  {JSON.stringify(funnel, null, 2)}
                </pre>
              ) : (
                <div className='p-4'>
                  <p className='text-sm text-muted-foreground'>
                    {funnel.description || 'No description'}
                  </p>
                  <p className='text-sm mt-2'>
                    <span className='font-medium'>Stages:</span> {funnel.stages?.length || 0}
                  </p>
                  <p className='text-sm mt-1'>
                    <span className='font-medium'>Stage Links:</span>{' '}
                    {funnel.stageLinks?.length || 0}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}