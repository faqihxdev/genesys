import { FunnelOption, SimulationOption } from '@/app/(core)/project/[id]/analysis/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertCircle, ArrowRight, CheckCircle, FlaskConical } from 'lucide-react';

interface AnalysisSelectorsProps {
  funnels: FunnelOption[];
  simulations: SimulationOption[] | undefined;
  comparisonSimulations: SimulationOption[] | undefined;
  selectedFunnelId: string | null;
  selectedSimulationId: string | null;
  compareFunnelId: string | null;
  compareSimulationId: string | null;
  isComparisonMode: boolean;
  isLoadingSimulations: boolean;
  isLoadingComparisonSimulations: boolean;
  onFunnelSelect: (funnelId: string) => void;
  onSimulationSelect: (simulationId: string) => void;
  onCompareFunnelSelect: (funnelId: string) => void;
  onCompareSimulationSelect: (simulationId: string) => void;
}

function SimulationLabel({ simulation }: { simulation: SimulationOption }) {
  const date = new Date(simulation.createdAt)
    .toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
    .replace(',', ''); // Remove comma between date and time
  const hasNoAnalysis = simulation.status === 'complete' && !simulation.hasSummary;

  if (!hasNoAnalysis) {
    return (
      <span className='font-medium truncate flex items-center gap-2'>
        <span className='min-w-[11rem]'>Simulation {date}</span>
        <CheckCircle className='h-4 w-4 text-primary shrink-0' />
      </span>
    );
  }

  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className='font-medium truncate flex items-center gap-2'>
            <span className='min-w-[11rem]'>Simulation {date}</span>
            <AlertCircle className='h-4 w-4 text-muted-foreground shrink-0' />
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            This simulation is complete but has no analysis generated yet. Generate an analysis to
            view insights.
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function AnalysisSelectors({
  funnels,
  simulations,
  comparisonSimulations,
  selectedFunnelId,
  selectedSimulationId,
  compareFunnelId,
  compareSimulationId,
  isComparisonMode,
  isLoadingSimulations,
  isLoadingComparisonSimulations,
  onFunnelSelect,
  onSimulationSelect,
  onCompareFunnelSelect,
  onCompareSimulationSelect,
}: AnalysisSelectorsProps) {
  return (
    <div className='flex items-center justify-between gap-4'>
      {/* Base Selectors */}
      <div className='flex items-center gap-4'>
        <div className='relative'>
          {!selectedFunnelId && funnels?.length > 0 && (
            <span className='absolute -top-0.5 -left-0.5 flex h-3 w-3'>
              <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75'></span>
              <span className='relative inline-flex rounded-full h-3 w-3 bg-primary'></span>
            </span>
          )}
          <Select
            value={selectedFunnelId || undefined}
            onValueChange={onFunnelSelect}
            disabled={!funnels?.length}
          >
            <SelectTrigger className='w-[250px]'>
              <SelectValue placeholder='Select a funnel' />
            </SelectTrigger>
            <SelectContent>
              {funnels?.map((funnel) => (
                <SelectItem key={funnel.id} value={funnel.id}>
                  <div className='flex items-center justify-between w-full gap-4'>
                    <span className='font-medium truncate'>{funnel.name}</span>
                    <span className='text-xs text-muted-foreground shrink-0 flex items-center gap-1'>
                      {funnel.simulationCount}
                      <FlaskConical className='h-3.5 w-3.5' />
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Select
          value={selectedSimulationId || undefined}
          onValueChange={onSimulationSelect}
          disabled={!selectedFunnelId || isLoadingSimulations || !simulations?.length}
        >
          <SelectTrigger className='w-[250px]'>
            <SelectValue
              placeholder={
                isLoadingSimulations
                  ? 'Loading simulations...'
                  : !selectedFunnelId
                    ? 'Select a funnel first'
                    : 'Select a simulation'
              }
            />
          </SelectTrigger>
          <SelectContent>
            {simulations?.map((simulation) => (
              <SelectItem key={simulation.id} value={simulation.id}>
                <div className='flex items-center w-full gap-4'>
                  <SimulationLabel simulation={simulation} />
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Comparison Icon */}
      {isComparisonMode && (
        <div className='flex items-center justify-center'>
          <ArrowRight className='h-5 w-5 text-primary' />
        </div>
      )}

      {/* Comparison Selectors */}
      {isComparisonMode && (
        <div className='flex items-center gap-4'>
          <Select
            value={compareFunnelId || undefined}
            onValueChange={onCompareFunnelSelect}
            disabled={!funnels?.length}
          >
            <SelectTrigger className='w-[250px]'>
              <SelectValue placeholder='Select a funnel' />
            </SelectTrigger>
            <SelectContent>
              {funnels?.map((funnel) => (
                <SelectItem key={funnel.id} value={funnel.id}>
                  <div className='flex items-center justify-between w-full gap-4'>
                    <span className='font-medium truncate'>{funnel.name}</span>
                    <span className='text-xs text-muted-foreground shrink-0 flex items-center gap-1'>
                      {funnel.simulationCount}
                      <FlaskConical className='h-3.5 w-3.5' />
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={compareSimulationId || undefined}
            onValueChange={onCompareSimulationSelect}
            disabled={
              !compareFunnelId || isLoadingComparisonSimulations || !comparisonSimulations?.length
            }
          >
            <SelectTrigger className='w-[250px]'>
              <SelectValue
                placeholder={
                  isLoadingComparisonSimulations
                    ? 'Loading simulations...'
                    : !compareFunnelId
                      ? 'Select a funnel first'
                      : 'Select a simulation'
                }
              />
            </SelectTrigger>
            <SelectContent>
              {comparisonSimulations?.map((simulation) => (
                <SelectItem key={simulation.id} value={simulation.id}>
                  <div className='flex items-center w-full gap-4'>
                    <SimulationLabel simulation={simulation} />
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
