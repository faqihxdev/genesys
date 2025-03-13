'use client';

import { Button } from '@/components/ui/button';
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
  BarChart4Icon,
  CircleAlertIcon,
  LifeBuoy,
  LightbulbIcon,
  Loader2,
  PlayIcon,
  StopCircleIcon,
  TimerIcon,
  UsersIcon,
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
          icon: <TimerIcon className='h-3.5 w-3.5 text-muted-foreground' />,
          label: 'Preparing',
          color: 'text-muted-foreground',
          bg: 'bg-muted/30',
        };
      case 'processing':
        return {
          icon: <Loader2 className='h-3.5 w-3.5 text-primary animate-spin' />,
          label: 'Processing',
          color: 'text-primary',
          bg: 'bg-primary/10',
        };
      case 'complete':
        return {
          icon: <PlayIcon className='h-3.5 w-3.5 text-green-500' />,
          label: 'Completed',
          color: 'text-green-500',
          bg: 'bg-green-500/10',
        };
      case 'error':
        return {
          icon: <CircleAlertIcon className='h-3.5 w-3.5 text-destructive' />,
          label: 'Error',
          color: 'text-destructive',
          bg: 'bg-destructive/10',
        };
      case 'cancelled':
        return {
          icon: <StopCircleIcon className='h-3.5 w-3.5 text-orange-500' />,
          label: 'Cancelled',
          color: 'text-orange-500',
          bg: 'bg-orange-500/10',
        };
      default:
        return {
          icon: <LifeBuoy className='h-3.5 w-3.5' />,
          label: 'Unknown',
          color: 'text-muted-foreground',
          bg: 'bg-muted/20',
        };
    }
  };

  // Show loading state during initial check
  if (isInitialLoading || isLoadingActiveFunnelSimulation) {
    return (
      <div className='flex items-center justify-center py-2 text-muted-foreground'>
        <Loader2 className='h-4 w-4 animate-spin text-primary mr-1.5' />
        <span className='text-xs'>Checking simulations...</span>
      </div>
    );
  }

  // If there's an active simulation
  if (activeSimulationId) {
    const status = simulationStatus?.status || 'unknown';
    const statusInfo = getStatusInfo(status);

    return (
      <div className='space-y-2'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center'>
            <LightbulbIcon className='h-4 w-4 text-primary mr-1.5' />
            <span className='text-sm font-medium'>Simulation Status</span>
          </div>

          <Button
            variant='outline'
            size='sm'
            onClick={handleCancelSimulation}
            disabled={
              isLoadingStatus || !simulationStatus || simulationStatus.status === 'cancelled'
            }
            className='h-6 text-xs px-2'
          >
            <StopCircleIcon className='h-3 w-3 mr-1' /> Cancel
          </Button>
        </div>

        {isLoadingStatus && !simulationStatus ? (
          <div className='flex items-center justify-center py-1 text-muted-foreground'>
            <Loader2 className='h-3.5 w-3.5 animate-spin text-primary mr-1.5' />
            <span className='text-xs'>Loading status...</span>
          </div>
        ) : simulationStatus ? (
          <div>
            <div className='flex flex-wrap items-center gap-2 mb-2'>
              <div className={`rounded-md px-2 py-1 ${statusInfo.bg} flex items-center gap-1.5`}>
                {statusInfo.icon}
                <span className={`text-xs font-medium ${statusInfo.color}`}>
                  {statusInfo.label}
                </span>
              </div>

              <div className='flex items-center gap-1.5 text-primary px-2 py-1 bg-primary/5 rounded-md'>
                <UsersIcon className='h-3.5 w-3.5' />
                <span className='text-xs'>
                  <span className='font-medium'>{simulationStatus.completeCount}</span>
                  <span className='text-muted-foreground'>/{simulationStatus.totalCount}</span>
                  <span className='text-muted-foreground'> personas</span>
                </span>
              </div>

              <div className='flex items-center gap-1.5 text-primary px-2 py-1 bg-primary/5 rounded-md'>
                <BarChart4Icon className='h-3.5 w-3.5' />
                <span className='text-xs'>
                  <span className='font-medium'>{simulationStatus.activeStages}</span>
                  <span className='text-muted-foreground'>/{simulationStatus.totalStages}</span>
                  <span className='text-muted-foreground'> stages</span>
                </span>
              </div>

              <span className='text-xs font-medium ml-auto'>{simulationStatus.progress}%</span>
            </div>

            <Progress value={simulationStatus.progress || 0} className='h-1.5' />

            {simulationStatus.error && (
              <div className='text-xs text-destructive p-2 mt-2 bg-destructive/10 rounded-md border border-destructive/20 flex items-start'>
                <CircleAlertIcon className='h-3.5 w-3.5 mr-1.5 mt-0.5 shrink-0' />
                <span>{simulationStatus.error}</span>
              </div>
            )}
          </div>
        ) : null}
      </div>
    );
  }

  // Default state - no active simulation
  return (
    <div className='bg-muted/5 border rounded-md p-2.5'>
      <div className='flex items-center gap-1.5 mb-2'>
        <PlayIcon className='h-3.5 w-3.5 text-primary' />
        <span className='text-sm font-medium'>Run Simulation</span>
      </div>

      <div className='flex flex-col sm:flex-row sm:items-center gap-2'>
        <div className='flex-1'>
          <Select
            value={selectedConfigId}
            onValueChange={setSelectedConfigId}
            disabled={isLoadingConfigs || isCreatingSimulation}
          >
            <SelectTrigger className='w-full h-8 text-xs'>
              <SelectValue placeholder='Select persona configuration' />
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
          className='h-8 text-xs px-3'
          disabled={!selectedConfigId || isCreatingSimulation}
          onClick={handleStartSimulation}
        >
          {isCreatingSimulation ? (
            <>
              <Loader2 className='mr-1.5 h-3.5 w-3.5 animate-spin' />
              Creating...
            </>
          ) : (
            <>
              <PlayIcon className='mr-1.5 h-3.5 w-3.5' />
              Run Simulation
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
