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
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import SimulationControl from './components/simulation-control';
import { FunnelDialog } from './_funnel-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from '@/components/ui/dialog';
import { deleteFunnel } from '@/server/funnel';
import { useQueryClient } from '@tanstack/react-query';

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
  const [funnelToDelete, setFunnelToDelete] = useState<{ id: string, name: string } | null>(null);
  const router = useRouter();
  const queryClient = useQueryClient();

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
    setExpandedFunnelId(expandedFunnelId === funnelId ? null : funnelId);
  };

  const handleDeleteFunnel = async () => {
    if (!funnelToDelete) return;

    try {
      const result = await deleteFunnel({
        funnelId: funnelToDelete.id,
      });

      if (!result.error) {
        // Invalidate the query cache to refresh the data
        queryClient.invalidateQueries({
          queryKey: queryKey.funnel.all(projectId)
        });
        
        // Close the dialog
        setFunnelToDelete(null);
      } else {
        console.error('Failed to delete funnel:', result.error);
      }
    } catch (error) {
      console.error('Error deleting funnel:', error);
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
        <div className='flex items-center justify-between mb-4'>
          <h2 className='text-xl font-bold'>No funnels found</h2>
          <FunnelDialog projectId={projectId} />
        </div>
        <p className='text-muted-foreground'>No funnels have been created for this project yet.</p>
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <PageTitle
          title='Marketing Funnels'
          description='Design and optimize your marketing funnels by analyzing how different personas interact with each stage of your customer journey.'
        />
        <FunnelDialog projectId={projectId} />
      </div>

      <div className='space-y-4'>
        {funnels.map((funnel) => (
          <Card
            key={funnel.id}
            className='overflow-hidden hover:border-primary/50 hover:shadow-md transition-all cursor-pointer'
            onClick={() => router.push(`/project/${projectId}/funnels/${funnel.id}`)}
          >
            <CardHeader className='bg-muted/50 py-4'>
              <CardTitle className='flex items-center justify-between'>
                <span>{funnel.name || 'Unnamed Funnel'}</span>
                <div className='flex space-x-2'>
                  <SimulationControl funnelId={funnel.id} projectId={projectId} />
                  <div className="flex flex-col space-y-1">
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent card click from triggering
                        toggleFunnelExpansion(funnel.id);
                      }}
                    >
                      {expandedFunnelId === funnel.id ? 'Collapse' : 'Expand'}
                    </Button>
                    <Button
                      variant='ghost'
                      size='sm'
                      className="text-red-500 hover:text-red-700 hover:bg-red-100"
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent card click from triggering
                        setFunnelToDelete({ id: funnel.id, name: funnel.name });
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </CardTitle>            </CardHeader>
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!funnelToDelete} onOpenChange={(open) => !open && setFunnelToDelete(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Funnel</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the funnel "{funnelToDelete?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-end">
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteFunnel}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}