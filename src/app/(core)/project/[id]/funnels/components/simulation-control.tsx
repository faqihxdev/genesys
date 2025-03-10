'use client';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { cancelSimulation, createSimulation, getSimulationStatus } from '@/server/simulation';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
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
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [simulationParameters, setSimulationParameters] = useState({
    maxPathsPerPersona: 1,
    detailedResponses: true,
    includeReasons: true,
  });

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
        parameters: simulationParameters,
      });

      setActiveSimulationId(result.id);
      setIsDialogOpen(false);
      toast({
        title: 'Simulation Started',
        description: `Simulation created with ${result.totalCount} personas.`,
      });
    } catch (error) {
      console.error('Error creating simulation:', error);
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
      toast({
        title: 'Simulation Cancelled',
        description: 'The simulation has been cancelled.',
      });
    } catch (error) {
      console.error('Error cancelling simulation:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to cancel simulation',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className='space-y-4'>
      {/* Simulation dialog trigger */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button
            variant='default'
            disabled={!!activeSimulationId}
            onClick={() => setIsDialogOpen(true)}
          >
            Run Simulation
          </Button>
        </DialogTrigger>

        <DialogContent className='sm:max-w-[425px]'>
          <DialogHeader>
            <DialogTitle>Create New Simulation</DialogTitle>
            <DialogDescription>
              Select a persona configuration to simulate interactions with this funnel.
            </DialogDescription>
          </DialogHeader>

          <div className='grid gap-4 py-4'>
            <div className='space-y-2'>
              <Label htmlFor='persona-config'>Persona Configuration</Label>
              <Select
                value={selectedConfigId}
                onValueChange={setSelectedConfigId}
                disabled={isLoadingConfigs || isCreatingSimulation}
              >
                <SelectTrigger id='persona-config'>
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

            <div className='space-y-2'>
              <Label htmlFor='max-paths'>Maximum Paths Per Persona</Label>
              <Input
                id='max-paths'
                type='number'
                min={1}
                max={5}
                value={simulationParameters.maxPathsPerPersona}
                onChange={(e) =>
                  setSimulationParameters({
                    ...simulationParameters,
                    maxPathsPerPersona: parseInt(e.target.value, 10) || 1,
                  })
                }
                disabled={isCreatingSimulation}
              />
            </div>

            <div className='flex items-center space-x-2'>
              <Checkbox
                id='detailed-responses'
                checked={simulationParameters.detailedResponses}
                onCheckedChange={(checked) =>
                  setSimulationParameters({
                    ...simulationParameters,
                    detailedResponses: !!checked,
                  })
                }
                disabled={isCreatingSimulation}
              />
              <Label htmlFor='detailed-responses'>Generate detailed responses</Label>
            </div>

            <div className='flex items-center space-x-2'>
              <Checkbox
                id='include-reasons'
                checked={simulationParameters.includeReasons}
                onCheckedChange={(checked) =>
                  setSimulationParameters({
                    ...simulationParameters,
                    includeReasons: !!checked,
                  })
                }
                disabled={isCreatingSimulation}
              />
              <Label htmlFor='include-reasons'>Include reasoning in responses</Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setIsDialogOpen(false)}
              disabled={isCreatingSimulation}
            >
              Cancel
            </Button>
            <Button
              onClick={handleStartSimulation}
              disabled={!selectedConfigId || isCreatingSimulation}
            >
              {isCreatingSimulation ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Creating...
                </>
              ) : (
                'Start Simulation'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Active simulation status */}
      {activeSimulationId && (
        <div className='border rounded-md p-4 space-y-4'>
          <div className='flex justify-between items-center'>
            <h3 className='text-lg font-medium'>Simulation in Progress</h3>
            <Button
              variant='outline'
              size='sm'
              onClick={handleCancelSimulation}
              disabled={
                isLoadingStatus || !simulationStatus || simulationStatus.status === 'cancelled'
              }
            >
              Cancel Simulation
            </Button>
          </div>

          {isLoadingStatus && !simulationStatus ? (
            <div className='flex items-center justify-center py-4'>
              <Loader2 className='h-6 w-6 animate-spin text-primary' />
              <span className='ml-2'>Loading simulation status...</span>
            </div>
          ) : simulationStatus ? (
            <div className='space-y-2'>
              <div className='flex justify-between text-sm mb-2'>
                <span>
                  Status:{' '}
                  {simulationStatus.status === 'idle'
                    ? 'Preparing'
                    : simulationStatus.status === 'processing'
                      ? 'Processing'
                      : simulationStatus.status === 'complete'
                        ? 'Completed'
                        : simulationStatus.status === 'error'
                          ? 'Error'
                          : simulationStatus.status === 'cancelled'
                            ? 'Cancelled'
                            : 'Unknown'}
                </span>
                <span>
                  {simulationStatus.completeCount || 0} / {simulationStatus.totalCount || 0}{' '}
                  personas
                </span>
              </div>
              <Progress value={simulationStatus.progress || 0} />

              <div className='text-xs text-muted-foreground mt-2'>
                <p>
                  Active stages: {simulationStatus.activeStages || 0} of{' '}
                  {simulationStatus.totalStages || 0}
                </p>
                {simulationStatus.error && (
                  <p className='text-destructive mt-1'>Error: {simulationStatus.error}</p>
                )}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
