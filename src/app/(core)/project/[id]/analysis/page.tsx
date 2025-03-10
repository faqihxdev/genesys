'use client';

import { FloatingDebugPanel } from '@/components/custom/debug';
import { PageTitle } from '@/components/custom/page-title';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { withQuery } from '@/lib/utils';
import {
  generateSimulationSummary,
  getFunnelSimulations,
  getProjectFunnelsWithSimulations,
  getSimulationAnalysis,
} from '@/server/analysis';
import { useMutation, useQuery, UseQueryResult } from '@tanstack/react-query';
import {
  AlertCircle,
  BarChart3,
  FileText,
  GitCompare,
  HelpCircle,
  Info,
  Lightbulb,
  LineChart,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { AnalysisSelectors } from './_components/analysis-selectors';
import { AnalysisSkeleton } from './_components/analysis-skeleton';
import { FunnelSankey } from './_components/funnel-sankey';
import { StageDetails } from './_components/stage-details';
import { useAnalysisUrlState } from './_hooks/use-analysis-url-state';
import { FunnelAnalysis, KeyMetric, SimulationOption, StageAnalysis } from './types';

// Add type for error
interface ApiError {
  message: string;
  status?: number;
}

/**
 * Calculate the percentage difference between two numbers
 */
function calculatePercentageDiff(current: number, base: number): number {
  return ((current - base) / base) * 100;
}

export default function AnalysisPage() {
  const { toast } = useToast();
  const { id: projectId } = useParams();

  // State for selected stages
  const [baseSelectedStageId, setBaseSelectedStageId] = useState<string | null>(null);
  const [compareSelectedStageId, setCompareSelectedStageId] = useState<string | null>(null);

  // Query for fetching available funnels
  const {
    data: funnelsData,
    isLoading: isFunnelsLoading,
    error: funnelsError,
  } = useQuery({
    queryKey: ['funnels', projectId],
    queryFn: () => withQuery(getProjectFunnelsWithSimulations)({ projectId: projectId as string }),
    enabled: !!projectId,
  });

  // URL state management using the custom hook
  const {
    selectedFunnelId,
    selectedSimulationId,
    isComparisonMode,
    compareFunnelId,
    compareSimulationId,
    handleFunnelSelect,
    handleSimulationSelect,
    handleCompareFunnelSelect,
    handleCompareSimulationSelect,
    handleComparisonToggle,
  } = useAnalysisUrlState({
    funnels: funnelsData,
    isFunnelsLoading,
  });

  // Query for fetching available simulations for selected funnel
  const {
    data: simulationsData,
    isLoading: isSimulationsLoading,
  }: UseQueryResult<SimulationOption[], ApiError> = useQuery({
    queryKey: ['simulations', selectedFunnelId],
    queryFn: () => withQuery(getFunnelSimulations)({ funnelId: selectedFunnelId! }),
    enabled: !!selectedFunnelId,
  });

  // Query for fetching simulation analysis
  const {
    data: analysisData,
    isLoading: isAnalysisLoading,
    error: analysisError,
  }: UseQueryResult<FunnelAnalysis, ApiError> = useQuery({
    queryKey: ['analysis', selectedSimulationId],
    queryFn: () => withQuery(getSimulationAnalysis)({ simulationId: selectedSimulationId! }),
    enabled: !!selectedSimulationId,
  });

  // Query for fetching comparison analysis
  const { data: comparisonAnalysisData }: UseQueryResult<FunnelAnalysis, ApiError> = useQuery({
    queryKey: ['analysis', compareSimulationId],
    queryFn: () => withQuery(getSimulationAnalysis)({ simulationId: compareSimulationId! }),
    enabled: !!compareSimulationId && isComparisonMode,
  });

  // Get comparison simulations
  const {
    data: comparisonSimulationsData,
    isLoading: isComparisonSimulationsLoading,
  }: UseQueryResult<SimulationOption[], ApiError> = useQuery({
    queryKey: ['simulations', compareFunnelId],
    queryFn: () => withQuery(getFunnelSimulations)({ funnelId: compareFunnelId! }),
    enabled: !!compareFunnelId,
  });

  // Mutation for generating simulation summary
  const generateSummaryMutation = useMutation({
    mutationFn: withQuery(generateSimulationSummary),
    onSuccess: () => {
      toast({
        title: 'Analysis Complete',
        description: 'The simulation analysis has been generated successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Analysis Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Get the current analysis data
  const currentAnalysis = analysisData;

  // Get comparison analysis data
  const comparisonAnalysis =
    isComparisonMode && compareFunnelId && compareSimulationId ? comparisonAnalysisData : null;

  // Find selected stage details
  const selectedStage =
    baseSelectedStageId && currentAnalysis
      ? currentAnalysis.stages.find(
          (stage: StageAnalysis) => stage.stage.id === baseSelectedStageId
        )
      : null;
  const comparisonStage =
    comparisonAnalysis && compareSelectedStageId
      ? comparisonAnalysis.stages.find(
          (stage: StageAnalysis) => stage.stage.id === compareSelectedStageId
        )
      : null;

  // Handle loading states
  if (isFunnelsLoading) {
    return (
      <div className='space-y-6'>
        <PageTitle
          title='Analysis Dashboard'
          description='Comprehensive analysis and insights about your marketing funnels, persona behaviors, and conversion metrics across all campaigns.'
        />
        <AnalysisSkeleton />
      </div>
    );
  }

  // Handle funnel fetch error
  if (funnelsError) {
    return (
      <div className='space-y-6'>
        <PageTitle
          title='Analysis Dashboard'
          description='Comprehensive analysis and insights about your marketing funnels, persona behaviors, and conversion metrics across all campaigns.'
        />
        <Card className='bg-card'>
          <CardContent className='flex flex-col items-center justify-center py-12'>
            <div className='flex flex-col items-center gap-4 text-center'>
              <AlertCircle className='h-12 w-12 text-primary' />
              <div className='space-y-2'>
                <h3 className='text-lg font-semibold'>No Funnels Available</h3>
                <p className='text-sm text-muted-foreground max-w-md'>{funnelsError.message}</p>
                <div className='flex items-center justify-center gap-4 mt-6'>
                  <Link href={`/project/${projectId}/funnels`}>
                    <Button variant='default' size='sm'>
                      <LineChart className='h-4 w-4' />
                      Create Funnel
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`space-y-6 mx-auto ${isComparisonMode ? 'max-w-full' : 'max-w-4xl'}`}>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <PageTitle
          title='Analysis Dashboard'
          description='Comprehensive analysis and insights about your marketing funnels, persona behaviors, and conversion metrics across all campaigns.'
        />
        <div className='flex items-center gap-4'>
          <div className='flex items-center gap-2'>
            <label
              htmlFor='comparison-mode'
              className='flex items-center gap-2 text-sm font-medium'
            >
              Compare
            </label>
            <Switch
              id='comparison-mode'
              checked={isComparisonMode}
              onCheckedChange={handleComparisonToggle}
            />
          </div>
          <Button
            variant='outline'
            size='sm'
            className='gap-2'
            onClick={() => generateSummaryMutation.mutate({ simulationId: selectedSimulationId! })}
            disabled={generateSummaryMutation.isPending || !selectedSimulationId}
          >
            <Sparkles className='h-4 w-4' />
            {generateSummaryMutation.isPending ? 'Analyzing...' : 'Generate Analysis'}
          </Button>
        </div>
      </div>

      {/* Analysis Configuration */}
      <section className='border-border border rounded-lg p-2'>
        <AnalysisSelectors
          funnels={funnelsData || []}
          simulations={simulationsData}
          comparisonSimulations={comparisonSimulationsData}
          selectedFunnelId={selectedFunnelId}
          selectedSimulationId={selectedSimulationId}
          compareFunnelId={compareFunnelId}
          compareSimulationId={compareSimulationId}
          isComparisonMode={isComparisonMode}
          isLoadingSimulations={isSimulationsLoading}
          isLoadingComparisonSimulations={isComparisonSimulationsLoading}
          onFunnelSelect={handleFunnelSelect}
          onSimulationSelect={handleSimulationSelect}
          onCompareFunnelSelect={handleCompareFunnelSelect}
          onCompareSimulationSelect={handleCompareSimulationSelect}
        />
      </section>

      {/* Overall Summary */}
      {currentAnalysis?.summary ? (
        <section className={`grid gap-6 ${isComparisonMode ? 'lg:grid-cols-2' : 'lg:grid-cols-1'}`}>
          {/* Base Summary */}
          <div className='bg-card border rounded-lg'>
            <header className='p-4 border-b'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <GitCompare className='h-5 w-5 text-primary' />
                  <h2 className='text-lg font-semibold'>
                    {isComparisonMode ? 'Base Simulation Summary' : 'Overall Simulation Summary'}
                  </h2>
                </div>
                <Badge className='bg-primary/10 text-primary hover:bg-primary/15'>
                  {currentAnalysis.funnel.name}
                </Badge>
              </div>
            </header>
            <div className='p-6 space-y-6'>
              {/* Summary */}
              <div className='rounded-lg border bg-background/50'>
                <div className='flex items-center gap-2 border-b p-3'>
                  <FileText className='h-4 w-4 text-muted-foreground' />
                  <h4 className='text-sm font-medium'>Analysis Summary</h4>
                </div>
                <div className='p-3'>
                  <p className='text-sm text-muted-foreground'>{currentAnalysis.summary.summary}</p>
                </div>
              </div>

              {/* Recommendation */}
              <div className='rounded-lg border bg-background/50'>
                <div className='flex items-center gap-2 border-b p-3 bg-primary/5'>
                  <Lightbulb className='h-4 w-4 text-primary' />
                  <h4 className='text-sm font-medium text-primary'>Recommendations</h4>
                </div>
                <div className='p-3'>
                  <p className='text-sm text-muted-foreground'>
                    {currentAnalysis.summary.recommendation}
                  </p>
                </div>
              </div>

              {/* Metrics */}
              <div className='grid gap-4 grid-cols-2'>
                {currentAnalysis.metrics.map((metric: KeyMetric, index: number) => (
                  <div
                    key={index}
                    className='rounded-lg border bg-background/50 p-4 flex flex-col justify-between'
                  >
                    <div className='flex items-center justify-between'>
                      <p className='text-sm text-muted-foreground'>{metric.label}</p>
                      <TooltipProvider delayDuration={100}>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className='h-4 w-4 text-primary' />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{metric.description}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <div className='mt-2'>
                      <div className='flex items-baseline gap-2'>
                        <p className='text-2xl font-bold text-primary'>{metric.value}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Comparison Summary */}
          {isComparisonMode && (
            <div className='bg-card border rounded-lg flex flex-col h-full'>
              <header className='p-4 border-b'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    <GitCompare className='h-5 w-5 text-primary' />
                    <h2 className='text-lg font-semibold'>Comparison Simulation Summary</h2>
                  </div>
                  {comparisonAnalysis?.summary && (
                    <Badge className='bg-primary/10 text-primary hover:bg-primary/15'>
                      {comparisonAnalysis.funnel.name}
                    </Badge>
                  )}
                </div>
              </header>
              <div className='p-6 h-full'>
                {!compareFunnelId || !compareSimulationId ? (
                  <div className='flex flex-col items-center justify-center h-full py-12 text-center'>
                    <GitCompare className='h-12 w-12 text-primary mb-4' />
                    <h3 className='text-lg font-semibold'>Select Comparison Simulation</h3>
                    <p className='text-sm text-muted-foreground max-w-md'>
                      Choose a funnel and simulation to compare with the base analysis
                    </p>
                  </div>
                ) : comparisonAnalysis?.summary ? (
                  <div className='space-y-6'>
                    {/* Summary */}
                    <div className='rounded-lg border bg-background/50'>
                      <div className='flex items-center gap-2 border-b p-3'>
                        <FileText className='h-4 w-4 text-muted-foreground' />
                        <h4 className='text-sm font-medium'>Analysis Summary</h4>
                      </div>
                      <div className='p-3'>
                        <p className='text-sm text-muted-foreground'>
                          {comparisonAnalysis.summary.summary}
                        </p>
                      </div>
                    </div>

                    {/* Recommendation */}
                    <div className='rounded-lg border bg-background/50'>
                      <div className='flex items-center gap-2 border-b p-3 bg-primary/5'>
                        <Lightbulb className='h-4 w-4 text-primary' />
                        <h4 className='text-sm font-medium text-primary'>Recommendations</h4>
                      </div>
                      <div className='p-3'>
                        <p className='text-sm text-muted-foreground'>
                          {comparisonAnalysis.summary.recommendation}
                        </p>
                      </div>
                    </div>

                    {/* Metrics */}
                    <div className='grid gap-4 grid-cols-2'>
                      {comparisonAnalysis.metrics.map((metric: KeyMetric, index: number) => {
                        const baseMetric = currentAnalysis.metrics.find(
                          (m: KeyMetric) => m.label === metric.label
                        );
                        const diff = baseMetric
                          ? calculatePercentageDiff(
                              typeof metric.value === 'string'
                                ? parseFloat(metric.value)
                                : metric.value,
                              typeof baseMetric.value === 'string'
                                ? parseFloat(baseMetric.value)
                                : baseMetric.value
                            )
                          : undefined;
                        const showDiff = isComparisonMode && diff !== undefined && !isNaN(diff);

                        return (
                          <div
                            key={index}
                            className='rounded-lg border bg-background/50 p-4 flex flex-col justify-between'
                          >
                            <div className='flex items-center justify-between'>
                              <p className='text-sm text-muted-foreground'>{metric.label}</p>
                              <TooltipProvider delayDuration={100}>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Info className='h-4 w-4 text-primary' />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{metric.description}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                            <div className='mt-2'>
                              <div className='flex items-baseline gap-2'>
                                <p className='text-2xl font-bold text-primary'>{metric.value}</p>
                                {showDiff && (
                                  <span
                                    className={`text-xs ${
                                      diff > 0
                                        ? 'text-green-500 dark:text-green-400'
                                        : 'text-red-500 dark:text-red-400'
                                    }`}
                                  >
                                    {diff > 0 ? '+' : ''}
                                    {diff.toFixed(1)}%
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className='h-[300px] space-y-4'>
                    <div className='flex items-center justify-between mb-4'>
                      <Skeleton className='h-8 w-32' />
                      <Skeleton className='h-6 w-24' />
                    </div>
                    <Skeleton className='h-[250px] w-full' />
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      ) : (
        <div className='bg-card border rounded-lg flex flex-col h-full'>
          <header className='p-4 border-b'>
            <div className='flex items-center gap-2'>
              <GitCompare className='h-5 w-5 text-primary' />
              <h2 className='text-lg font-semibold'>Overall Simulation Summary</h2>
            </div>
          </header>
          <div className='p-6'>
            {!selectedFunnelId || !selectedSimulationId ? (
              <div className='flex flex-col items-center justify-center py-12 text-center'>
                <GitCompare className='h-12 w-12 text-primary mb-4' />
                <h3 className='text-lg font-semibold'>Select Simulation</h3>
                <p className='text-sm text-muted-foreground max-w-md'>
                  Select a funnel and simulation from the configuration above to begin analyzing
                </p>
              </div>
            ) : isAnalysisLoading ? (
              <div className='space-y-6'>
                {/* Summary Skeleton */}
                <div className='rounded-lg border bg-background/50'>
                  <div className='flex items-center gap-2 border-b p-3'>
                    <Skeleton className='h-4 w-4' />
                    <Skeleton className='h-4 w-32' />
                  </div>
                  <div className='p-3'>
                    <Skeleton className='h-20 w-full' />
                  </div>
                </div>
                {/* Recommendation Skeleton */}
                <div className='rounded-lg border bg-background/50'>
                  <div className='flex items-center gap-2 border-b p-3'>
                    <Skeleton className='h-4 w-4' />
                    <Skeleton className='h-4 w-32' />
                  </div>
                  <div className='p-3'>
                    <Skeleton className='h-20 w-full' />
                  </div>
                </div>
                {/* Metrics Skeleton */}
                <div className='grid gap-4 grid-cols-2'>
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className='rounded-lg border bg-background/50 p-4'>
                      <div className='flex items-center justify-between mb-2'>
                        <Skeleton className='h-4 w-24' />
                        <Skeleton className='h-4 w-4 rounded-full' />
                      </div>
                      <Skeleton className='h-8 w-20' />
                    </div>
                  ))}
                </div>
              </div>
            ) : analysisError ? (
              <div className='flex flex-col items-center justify-center py-12 text-center'>
                <AlertCircle className='h-12 w-12 text-primary mb-4' />
                <h3 className='text-lg font-semibold'>No Analysis Available</h3>
                <p className='text-sm text-muted-foreground max-w-md'>
                  {(analysisError as ApiError).message || 'Failed to load analysis'}
                </p>
                <div className='flex items-center justify-center gap-4 mt-6'>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() =>
                      generateSummaryMutation.mutate({ simulationId: selectedSimulationId })
                    }
                    disabled={generateSummaryMutation.isPending}
                  >
                    <Sparkles className='h-4 w-4 mr-2' />
                    {generateSummaryMutation.isPending ? 'Analyzing...' : 'Generate Analysis'}
                  </Button>
                  <Link href='/account/support'>
                    <Button variant='default' size='sm'>
                      <HelpCircle className='h-4 w-4 mr-2' />
                      Contact Support
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className='flex flex-col items-center justify-center py-12 text-center'>
                <LineChart className='h-12 w-12 text-primary mb-4' />
                <h3 className='text-lg font-semibold'>Select Simulation</h3>
                <p className='text-sm text-muted-foreground max-w-md'>
                  Select a funnel and simulation from the configuration above to begin analyzing
                </p>
                <Button
                  variant='outline'
                  size='sm'
                  className='mt-6'
                  onClick={() =>
                    generateSummaryMutation.mutate({ simulationId: selectedSimulationId })
                  }
                  disabled={generateSummaryMutation.isPending}
                >
                  <Sparkles className='h-4 w-4 mr-2' />
                  {generateSummaryMutation.isPending ? 'Analyzing...' : 'Generate Analysis'}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Funnel Flow and Stage Details */}
      <section className={`grid gap-6 ${isComparisonMode ? 'lg:grid-cols-2' : 'lg:grid-cols-1'}`}>
        {/* Base Sankey Diagram */}
        <div className='bg-card border rounded-lg flex flex-col h-full'>
          <header className='p-4 border-b'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <LineChart className='h-5 w-5 text-primary' />
                <h2 className='text-lg font-semibold'>
                  {isComparisonMode ? 'Base Funnel Flow' : 'Funnel Flow Visualization'}
                </h2>
              </div>
              {currentAnalysis && (
                <Badge className='bg-primary/10 text-primary hover:bg-primary/15'>
                  {currentAnalysis.funnel.name}
                </Badge>
              )}
            </div>
          </header>
          <div className='p-6 h-full'>
            {!selectedFunnelId || !selectedSimulationId ? (
              <div className='flex flex-col items-center justify-center h-full py-12 text-center'>
                <LineChart className='h-12 w-12 text-primary mb-4' />
                <h3 className='text-lg font-semibold'>Select Simulation</h3>
                <p className='text-sm text-muted-foreground max-w-md'>
                  Select a funnel and simulation from the configuration above to begin analyzing
                </p>
              </div>
            ) : isAnalysisLoading ? (
              <div className='h-[300px] space-y-4'>
                <div className='flex items-center justify-between mb-4'>
                  <Skeleton className='h-8 w-32' />
                  <Skeleton className='h-6 w-24' />
                </div>
                <Skeleton className='h-[250px] w-full' />
              </div>
            ) : analysisError ? (
              <div className='flex flex-col items-center justify-center h-full py-12 text-center'>
                <AlertCircle className='h-12 w-12 text-primary mb-4' />
                <h3 className='text-lg font-semibold'>No Analysis Available</h3>
                <p className='text-sm text-muted-foreground max-w-md'>
                  {(analysisError as ApiError).message || 'Failed to load analysis'}
                </p>
                <div className='flex items-center justify-center gap-4 mt-6'>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() =>
                      generateSummaryMutation.mutate({ simulationId: selectedSimulationId })
                    }
                    disabled={generateSummaryMutation.isPending}
                  >
                    <Sparkles className='h-4 w-4 mr-2' />
                    {generateSummaryMutation.isPending ? 'Analyzing...' : 'Generate Analysis'}
                  </Button>
                  <Link href='/account/support'>
                    <Button variant='default' size='sm'>
                      <HelpCircle className='h-4 w-4 mr-2' />
                      Contact Support
                    </Button>
                  </Link>
                </div>
              </div>
            ) : currentAnalysis ? (
              <div>
                {currentAnalysis && (
                  <FunnelSankey
                    data={currentAnalysis.sankey}
                    height={300}
                    onNodeClick={setBaseSelectedStageId}
                    selectedNodeId={baseSelectedStageId || undefined}
                  />
                )}
              </div>
            ) : null}
          </div>
        </div>

        {/* Comparison Sankey */}
        {isComparisonMode && (
          <div className='bg-card border rounded-lg flex flex-col h-full'>
            <header className='p-4 border-b'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <LineChart className='h-5 w-5 text-primary' />
                  <h2 className='text-lg font-semibold'>Comparison Funnel Flow</h2>
                </div>
                {comparisonAnalysis && (
                  <Badge className='bg-primary/10 text-primary hover:bg-primary/15'>
                    {comparisonAnalysis.funnel.name}
                  </Badge>
                )}
              </div>
            </header>
            <div className='p-6 h-full'>
              {!compareFunnelId || !compareSimulationId ? (
                <div className='flex flex-col items-center justify-center h-full py-12 text-center'>
                  <BarChart3 className='h-12 w-12 text-primary mb-4' />
                  <h3 className='text-lg font-semibold'>Select Comparison Simulation</h3>
                  <p className='text-sm text-muted-foreground max-w-md'>
                    Choose a funnel and simulation to compare with the base flow
                  </p>
                </div>
              ) : comparisonAnalysis ? (
                <div>
                  <FunnelSankey
                    data={comparisonAnalysis.sankey}
                    height={300}
                    onNodeClick={setCompareSelectedStageId}
                    selectedNodeId={compareSelectedStageId || undefined}
                  />
                </div>
              ) : (
                <div className='h-[300px] space-y-4'>
                  <div className='flex items-center justify-between mb-4'>
                    <Skeleton className='h-8 w-32' />
                    <Skeleton className='h-6 w-24' />
                  </div>
                  <Skeleton className='h-[250px] w-full' />
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Stage Details */}
      {currentAnalysis && (
        <section className={`grid gap-6 ${isComparisonMode ? 'lg:grid-cols-2' : 'lg:grid-cols-1'}`}>
          <div className='bg-card border rounded-lg flex flex-col h-full'>
            <header className='p-4 border-b'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <BarChart3 className='h-5 w-5 text-primary' />
                  <h2 className='text-lg font-semibold'>
                    {selectedStage ? `${selectedStage.stage.name} Analysis` : 'Stage Analysis'}
                  </h2>
                </div>
                <Badge className='bg-primary/10 text-primary hover:bg-primary/15'>
                  {currentAnalysis.funnel.name}
                </Badge>
              </div>
            </header>
            <div className='p-6 h-full'>
              {selectedStage ? (
                <StageDetails stage={selectedStage} showChanges={false} />
              ) : (
                <div className='flex flex-col items-center justify-center h-full py-12 text-center'>
                  <BarChart3 className='h-12 w-12 text-primary mb-4' />
                  <h3 className='text-lg font-semibold'>Select a Stage</h3>
                  <p className='text-sm text-muted-foreground max-w-md'>
                    Click on any stage in the funnel flow above to view detailed analysis
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Comparison Stage */}
          {isComparisonMode && (
            <div className='bg-card border rounded-lg flex flex-col h-full'>
              <header className='p-4 border-b'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    <BarChart3 className='h-5 w-5 text-primary' />
                    <h2 className='text-lg font-semibold'>
                      {comparisonStage
                        ? `${comparisonStage.stage.name} Analysis`
                        : 'Stage Analysis'}
                    </h2>
                  </div>
                  {comparisonAnalysis && (
                    <Badge className='bg-primary/10 text-primary hover:bg-primary/15'>
                      {comparisonAnalysis.funnel.name}
                    </Badge>
                  )}
                </div>
              </header>
              <div className='p-6 h-full'>
                {!compareFunnelId || !compareSimulationId ? (
                  <div className='flex flex-col items-center justify-center h-full py-12 text-center'>
                    <BarChart3 className='h-12 w-12 text-primary mb-4' />
                    <h3 className='text-lg font-semibold'>Select Comparison Simulation</h3>
                    <p className='text-sm text-muted-foreground max-w-md'>
                      Choose a funnel and simulation to compare stage details
                    </p>
                  </div>
                ) : !comparisonStage ? (
                  <div className='flex flex-col items-center justify-center h-full py-12 text-center'>
                    <BarChart3 className='h-12 w-12 text-primary mb-4' />
                    <h3 className='text-lg font-semibold'>Select a Stage</h3>
                    <p className='text-sm text-muted-foreground max-w-md'>
                      Click on any stage in the comparison funnel flow above to view detailed
                      analysis
                    </p>
                  </div>
                ) : (
                  <StageDetails
                    stage={comparisonStage}
                    baseStage={selectedStage || undefined}
                    showChanges={isComparisonMode}
                  />
                )}
              </div>
            </div>
          )}
        </section>
      )}

      <FloatingDebugPanel data={{ currentAnalysis, comparisonAnalysis }} />
    </div>
  );
}
