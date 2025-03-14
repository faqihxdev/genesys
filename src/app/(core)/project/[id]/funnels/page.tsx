'use client';
import { PageTitle } from '@/components/custom/page-title';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { queryKey } from '@/lib/query-keys';
import { cn, withQuery } from '@/lib/utils';
import { deleteFunnel, getFunnelsWithFullData } from '@/server/funnel';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronRightIcon, ExternalLinkIcon, GitFork, Trash2Icon } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { FunnelDialog } from './_funnel-dialog';
import SimulationControl from './components/simulation-control';

export const dynamic = 'force-dynamic';

/**
 * Funnels page component
 * @returns Funnels page with a modern UI showing funnel data
 */
export default function FunnelsPage() {
  const params = useParams();
  const projectId = params.id as string;
  const [expandedFunnelId, setExpandedFunnelId] = useState<string | null>(null);
  const [funnelToDelete, setFunnelToDelete] = useState<{ id: string; name: string } | null>(null);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isDemoUser } = useAuth();
  const { toast } = useToast();

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
    if (isDemoUser) {
      toast({
        title: 'Feature restricted',
        description: 'Simulations are not available in the demo version',
        variant: 'destructive',
      });
      return;
    }
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
          queryKey: queryKey.funnel.all(projectId),
        });

        // Close the dialog
        setFunnelToDelete(null);
      } else {
        console.error('Failed to delete funnel:', result.error);
      }
    } catch (error) {
      console.error('[FunnelsPage/handleDeleteFunnel]:', error);
    }
  };

  if (isLoading) {
    return (
      <div className='space-y-4 p-4'>
        <Skeleton className='h-10 w-1/4' />
        <div className='space-y-3'>
          <Skeleton className='h-20 w-full' />
          <Skeleton className='h-20 w-full' />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className='p-3 rounded-lg bg-destructive/10 border border-destructive/20'>
        <h2 className='text-lg font-bold text-destructive'>Error loading funnels</h2>
        <p className='mt-1 text-sm'>{(error as Error)?.message || 'An unknown error occurred'}</p>
      </div>
    );
  }

  if (!funnels || funnels.length === 0) {
    return (
      <div className='space-y-4'>
        <div className='flex items-center justify-between'>
          <PageTitle
            title='Marketing Funnels'
            description='Design and optimize your marketing funnels by analyzing how different personas interact with each stage of your customer journey.'
          />
          <FunnelDialog projectId={projectId} />
        </div>

        <div className='flex min-h-[400px] flex-col items-center justify-center gap-4 rounded-lg border border-dashed p-8 text-center animate-in fade-in-50'>
          <div className='rounded-full bg-primary/10 p-4'>
            <GitFork className='h-8 w-8 text-primary' />
          </div>
          <div className='space-y-2'>
            <h3 className='text-xl font-semibold tracking-tight'>No funnels found</h3>
            <p className='text-sm text-muted-foreground max-w-[400px]'>
              Create your first funnel to start analyzing customer behavior through your marketing
              journey.
            </p>
          </div>
          <FunnelDialog
            projectId={projectId}
            trigger={
              <Button size='lg' className='mt-2'>
                <GitFork className='mr-2 h-4 w-4' />
                Create your first funnel
              </Button>
            }
          />
        </div>
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

      <div className='space-y-3'>
        {funnels.map((funnel) => (
          <div
            key={funnel.id}
            className='bg-background border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all'
          >
            <div className='border-b bg-muted/20 px-4 py-3 flex items-center justify-between'>
              <div className='flex items-center gap-2.5'>
                <div
                  className={cn(
                    'rounded-full bg-primary/10 p-1.5 transition-colors',
                    expandedFunnelId === funnel.id ? 'bg-primary/20' : ''
                  )}
                >
                  <GitFork
                    className={cn(
                      'h-4 w-4 text-primary transition-transform',
                      expandedFunnelId === funnel.id ? 'scale-110' : ''
                    )}
                  />
                </div>
                <h3 className='text-base font-medium'>{funnel.name || 'Unnamed Funnel'}</h3>
              </div>
              <div className='flex items-center space-x-1'>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => toggleFunnelExpansion(funnel.id)}
                  className='h-7 px-2 text-muted-foreground hover:text-foreground flex items-center gap-1'
                >
                  <span className='text-xs'>Setup Simulation</span>
                  <ChevronRightIcon
                    className={cn(
                      'h-4 w-4 transition-transform',
                      expandedFunnelId === funnel.id ? 'rotate-90' : ''
                    )}
                  />
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  className='h-7 flex items-center gap-1'
                  onClick={() => router.push(`/project/${projectId}/funnels/${funnel.id}`)}
                >
                  <ExternalLinkIcon className='h-3 w-3' />
                  <span className='text-xs'>Open</span>
                </Button>
                <Button
                  variant='ghost'
                  size='sm'
                  className='h-7 w-7 p-0 text-destructive hover:text-destructive/80 hover:bg-destructive/10'
                  onClick={() => setFunnelToDelete({ id: funnel.id, name: funnel.name })}
                >
                  <Trash2Icon className='h-3.5 w-3.5' />
                </Button>
              </div>
            </div>

            <div className='px-4 py-3'>
              <div className='flex flex-wrap md:flex-nowrap gap-2 justify-between'>
                <p className='text-xs text-muted-foreground flex-grow'>
                  {funnel.description || 'No description'}
                </p>

                <div className='flex flex-wrap gap-2 shrink-0'>
                  <div className='bg-primary/5 text-primary rounded-md px-2 py-0.5 text-xs flex items-center'>
                    <span className='font-medium'>{funnel.stages?.length || 0}</span>&nbsp;Stages
                  </div>
                  <div className='bg-primary/5 text-primary rounded-md px-2 py-0.5 text-xs flex items-center'>
                    <span className='font-medium'>{funnel.stageLinks?.length || 0}</span>&nbsp;Links
                  </div>
                </div>
              </div>
            </div>

            {expandedFunnelId === funnel.id && !isDemoUser && (
              <div className='px-4 py-3 bg-muted/5 border-t'>
                <SimulationControl funnelId={funnel.id} projectId={projectId} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!funnelToDelete} onOpenChange={(open) => !open && setFunnelToDelete(null)}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>Delete Funnel</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the funnel &quot;{funnelToDelete?.name}&quot;? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className='sm:justify-end'>
            <DialogClose asChild>
              <Button type='button' variant='secondary'>
                Cancel
              </Button>
            </DialogClose>
            <Button type='button' variant='destructive' onClick={handleDeleteFunnel}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
