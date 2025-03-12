'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PersonaConfig } from '@/db/schema/persona';
import { toast } from '@/hooks/use-toast';
import { queryKey } from '@/lib/query-keys';
import { withQuery } from '@/lib/utils';
import { getPersonaConfigsByProject } from '@/server/persona';
import {
  cancelSimulation,
  createSimulation,
  getActiveFunnelSimulation,
  getSimulationStatus,
} from '@/server/simulation';
import { useQuery } from '@tanstack/react-query';
import {
  CircleAlertIcon,
  LifeBuoy,
  Loader2,
  PlayIcon,
  StopCircleIcon,
  TimerIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';

/**
 * Component for initiating and monitoring simulations
 */
export default function SimulationControl({
  funnelId,
  projectId,
}: {
  funnelId: string;
  projectId: string;
}) {
  const [selectedConfigId, setSelectedConfigId] = useState('');
  const [isCreatingSimulation, setIsCreatingSimulation] = useState(false);
  const [activeSimulationId, setActiveSimulationId] = useState<string | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Fetch persona configs for the project
  const {
    data: personaConfigs,
    isLoading: isLoadingConfigs,
    error: configError,
  } = useQuery({
    queryKey: queryKey.persona.getPersonaConfigsByProject({ projectId }),
    queryFn: () => withQuery(getPersonaConfigsByProject)({ projectId }),
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!projectId,
  });

  // Check for active simulations on mount
  const { isLoading: isLoadingActiveFunnelSimulation } = useQuery({
    queryKey: ['active-funnel-simulation', funnelId],
    queryFn: async () => {
      const result = await withQuery(getActiveFunnelSimulation)({ funnelId });
      if (result && result.id) {
        setActiveSimulationId(result.id);
      }
      setIsInitialLoading(false);
      return result;
    },
    staleTime: 0, // Always refetch
    enabled: !!funnelId,
  });

  // Poll simulation status if there's an active simulation
  const {
    data: simulationStatus,
    isLoading: isLoadingStatus,
    refetch: refetchStatus,
  } = useQuery({
    queryKey: ['simulation-status', activeSimulationId],
    queryFn: () =>
      activeSimulationId
        ? withQuery(getSimulationStatus)({ simulationId: activeSimulationId })
        : null,
    staleTime: 1000 * 10, // 10 seconds
    enabled: !!activeSimulationId,
    refetchInterval: activeSimulationId ? 5000 : false, // Poll every 5 seconds if there's an active simulation
  });

  // Check if the simulation is still active
  useEffect(() => {
    if (simulationStatus && ['complete', 'error', 'cancelled'].includes(simulationStatus.status)) {
      // Stop polling if the simulation is no longer active
      setTimeout(() => {
        setActiveSimulationId(null);
      }, 5000); // Keep displaying the status for 5 more seconds
    }
  }, [simulationStatus]);

  // Handle starting a new simulation
  const handleStartSimulation = async () => {
    if (!selectedConfigId) {
      toast({
        title: 'Error',
        description: 'Please select a persona configuration first.',
        variant: 'destructive',
      });
      return;
    }

    setIsCreatingSimulation(true);
    try {
      const result = await withQuery(createSimulation)({
        funnelId,
        personaConfigId: selectedConfigId,
      });
      setActiveSimulationId(result.id);
      toast({
        title: 'Simulation Started',
        description: `Created with ${result.totalCount} personas.`,
      });
    } catch (error) {
      console.error('[SimulationControl/handleStartSimulation]:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create simulation',
        variant: 'destructive',
      });
    } finally {
      setIsCreatingSimulation(false);
    }
  };

  // Handle cancelling an active simulation
  const handleCancelSimulation = async () => {
    if (!activeSimulationId) return;
    try {
      await withQuery(cancelSimulation)({ simulationId: activeSimulationId });
      refetchStatus();
      toast({ title: 'Simulation Cancelled', description: 'The simulation has been cancelled.' });
    } catch (error) {
      console.error('[SimulationControl/handleCancelSimulation]:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to cancel simulation',
        variant: 'destructive',
      });
    }
  };

  // Get status icon and color based on simulation status
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'idle':
        return {
          icon: <TimerIcon className='h-4 w-4 text-muted-foreground' />,
          label: 'Preparing',
          color: 'text-muted-foreground',
        };
      case 'processing':
        return {
          icon: <Loader2 className='h-4 w-4 text-primary animate-spin' />,
          label: 'Processing',
          color: 'text-primary',
        };
      case 'complete':
        return {
          icon: <PlayIcon className='h-4 w-4 text-green-500' />,
          label: 'Completed',
          color: 'text-green-500',
        };
      case 'error':
        return {
          icon: <CircleAlertIcon className='h-4 w-4 text-destructive' />,
          label: 'Error',
          color: 'text-destructive',
        };
      case 'cancelled':
        return {
          icon: <StopCircleIcon className='h-4 w-4 text-orange-500' />,
          label: 'Cancelled',
          color: 'text-orange-500',
        };
      default:
        return {
          icon: <LifeBuoy className='h-4 w-4' />,
          label: 'Unknown',
          color: 'text-muted-foreground',
        };
    }
  };

  // Show loading state during initial check
  if (isInitialLoading || isLoadingActiveFunnelSimulation) {
    return (
      <Card className='border border-muted/30 bg-card/50'>
        <CardContent className='flex items-center justify-center py-6'>
          <Loader2 className='h-5 w-5 animate-spin text-primary mr-2' />
          <span className='text-sm'>Checking for active simulations...</span>
        </CardContent>
      </Card>
    );
  }

  // If there's an active simulation
  if (activeSimulationId) {
    const status = simulationStatus?.status || 'unknown';
    const statusInfo = getStatusInfo(status);

    return (
      <Card className='border border-muted/30'>
        <CardHeader className='pb-2'>
          <div className='flex justify-between items-center'>
            <CardTitle className='text-base font-medium'>Simulation in Progress</CardTitle>
            <Button
              variant='outline'
              size='sm'
              onClick={handleCancelSimulation}
              disabled={
                isLoadingStatus || !simulationStatus || simulationStatus.status === 'cancelled'
              }
              className='h-8'
            >
              <StopCircleIcon className='h-4 w-4 mr-1' /> Cancel
            </Button>
          </div>
        </CardHeader>

        <CardContent className='pb-3 pt-1'>
          {isLoadingStatus && !simulationStatus ? (
            <div className='flex items-center justify-center py-3'>
              <Loader2 className='h-5 w-5 animate-spin text-primary mr-2' />
              <span className='text-sm'>Loading status...</span>
            </div>
          ) : simulationStatus ? (
            <div className='space-y-3'>
              <div className='flex justify-between items-center text-sm'>
                <div className='flex items-center'>
                  {statusInfo.icon}
                  <span className={`ml-1.5 ${statusInfo.color}`}>{statusInfo.label}</span>
                </div>
                <span className='font-medium'>
                  {simulationStatus.completeCount} / {simulationStatus.totalCount}{' '}
                  <span className='text-xs text-muted-foreground'>personas</span>
                </span>
              </div>

              <Progress value={simulationStatus.progress || 0} className='h-2' />

              <div className='flex justify-between text-xs text-muted-foreground'>
                <div>
                  Active stages: {simulationStatus.activeStages} of {simulationStatus.totalStages}
                </div>
                <div>{simulationStatus.progress}%</div>
              </div>

              {simulationStatus.error && (
                <div className='text-xs text-destructive mt-1 p-2 bg-destructive/10 rounded border border-destructive/20'>
                  Error: {simulationStatus.error}
                </div>
              )}
            </div>
          ) : null}
        </CardContent>
      </Card>
    );
  }

  // Default state - no active simulation
  return (
    <Card className='border border-muted/30 bg-card/50'>
      <CardContent className='p-2'>
        <div className='flex flex-col sm:flex-row sm:items-center gap-3'>
          <div className='flex-1'>
            <Select
              value={selectedConfigId}
              onValueChange={setSelectedConfigId}
              disabled={isLoadingConfigs || isCreatingSimulation}
            >
              <SelectTrigger className='w-full'>
                <SelectValue placeholder='Select a persona configuration' />
              </SelectTrigger>
              <SelectContent>
                {isLoadingConfigs ? (
                  <SelectItem value='loading' disabled>
                    Loading...
                  </SelectItem>
                ) : configError ? (
                  <SelectItem value='error' disabled>
                    Error loading configs
                  </SelectItem>
                ) : personaConfigs && personaConfigs.length > 0 ? (
                  personaConfigs.map((config: PersonaConfig) => (
                    <SelectItem key={config.id} value={config.id}>
                      {config.name} ({config.size} personas)
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value='none' disabled>
                    No persona configs found
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <Button
            className='w-full sm:w-auto'
            disabled={!selectedConfigId || isCreatingSimulation}
            onClick={handleStartSimulation}
          >
            {isCreatingSimulation ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Creating...
              </>
            ) : (
              <>
                <PlayIcon className='mr-2 h-4 w-4' />
                Run Simulation
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
