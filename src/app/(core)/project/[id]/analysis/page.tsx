'use client';

import { PageTitle } from '@/components/custom/page-title';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { withQuery } from '@/lib/utils';
import { generateSimulationSummary, getSimulationAnalysis } from '@/server/analysis';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  AlertCircle,
  BarChart3,
  Download,
  GitCompare,
  HelpCircle,
  Info,
  LineChart,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { AnalysisSection } from './_components/analysis-section';
import { AnalysisSkeleton } from './_components/analysis-skeleton';
import { FunnelSankey } from './_components/funnel-sankey';
import { StageDetails } from './_components/stage-details';
import { KeyMetric } from './types';

/**
 * Calculate the percentage difference between two numbers
 */
function calculatePercentageDiff(current: number, base: number): number {
  return ((current - base) / base) * 100;
}

export default function AnalysisPage() {
  const { toast } = useToast();
  const { id: projectId } = useParams();
  const [selectedFunnelId] = useState('fnl-mock-1');
  const [selectedSimulationId] = useState('sim-mock-1');
  const [isComparisonMode, setIsComparisonMode] = useState(false);
  const [compareFunnelId, setCompareFunnelId] = useState<string | null>(null);
  const [compareSimulationId, setCompareSimulationId] = useState<string | null>(null);
  const [selectedStageId, setSelectedStageId] = useState<string | null>(null);

  // Query for fetching simulation analysis
  const {
    data: analysisData,
    isLoading: isAnalysisLoading,
    error: analysisError,
  } = useQuery({
    queryKey: ['analysis', selectedSimulationId],
    queryFn: () => withQuery(getSimulationAnalysis)({ simulationId: selectedSimulationId }),
    enabled: !!selectedSimulationId,
  });

  // Query for fetching comparison analysis
  const { data: comparisonAnalysisData, isLoading: isComparisonLoading } = useQuery({
    queryKey: ['analysis', compareSimulationId],
    queryFn: () => withQuery(getSimulationAnalysis)({ simulationId: compareSimulationId! }),
    enabled: !!compareSimulationId && isComparisonMode,
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
  const selectedStage = selectedStageId
    ? currentAnalysis?.stages.find((stage) => stage.stage.id === selectedStageId)
    : null;
  const comparisonStage =
    comparisonAnalysis && selectedStageId
      ? comparisonAnalysis.stages.find((stage) => stage.stage.id === selectedStageId)
      : null;

  if (isAnalysisLoading || isComparisonLoading) {
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

  if (analysisError) {
    return (
      <div className='space-y-6'>
        <div className='flex items-center justify-between'>
          <PageTitle
            title='Analysis Dashboard'
            description='Comprehensive analysis and insights about your marketing funnels, persona behaviors, and conversion metrics across all campaigns.'
          />
          <div className='flex items-center gap-4'>
            <Button
              variant='outline'
              size='sm'
              className='gap-2'
              onClick={() => generateSummaryMutation.mutate({ simulationId: selectedSimulationId })}
              disabled={generateSummaryMutation.isPending}
            >
              <Sparkles className='h-4 w-4' />
              {generateSummaryMutation.isPending ? 'Analyzing...' : 'Generate Analysis'}
            </Button>
          </div>
        </div>
        <Card className='bg-card'>
          <CardContent className='flex flex-col items-center justify-center py-12'>
            <div className='flex flex-col items-center gap-4 text-center'>
              <AlertCircle className='h-12 w-12 text-muted-foreground/50' />
              <div className='space-y-2'>
                <h3 className='text-lg font-semibold'>No Analysis Available</h3>
                <p className='text-sm text-muted-foreground max-w-sm'>{analysisError.message}</p>
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
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!currentAnalysis) {
    return (
      <div className='space-y-6'>
        <div className='flex items-center justify-between'>
          <PageTitle
            title='Analysis Dashboard'
            description='Comprehensive analysis and insights about your marketing funnels, persona behaviors, and conversion metrics across all campaigns.'
          />
          <div className='flex items-center gap-4'>
            <Button
              variant='outline'
              size='sm'
              className='gap-2'
              onClick={() => generateSummaryMutation.mutate({ simulationId: selectedSimulationId })}
              disabled={generateSummaryMutation.isPending}
            >
              <Sparkles className='h-4 w-4' />
              {generateSummaryMutation.isPending ? 'Analyzing...' : 'Generate Analysis'}
            </Button>
          </div>
        </div>
        <Card className='bg-card'>
          <CardContent className='flex flex-col items-center justify-center py-12'>
            <div className='flex flex-col items-center gap-4 text-center'>
              <LineChart className='h-12 w-12 text-muted-foreground/50' />
              <div className='space-y-2'>
                <h3 className='text-lg font-semibold'>No Analysis Available</h3>
                <p className='text-sm text-muted-foreground'>
                  Generate an analysis to view insights about your funnel performance.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleComparisonToggle = (enabled: boolean) => {
    setIsComparisonMode(enabled);
    if (!enabled) {
      setCompareFunnelId(null);
      setCompareSimulationId(null);
    }
  };

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <PageTitle
          title='Analysis Dashboard'
          description='Comprehensive analysis and insights about your marketing funnels, persona behaviors, and conversion metrics across all campaigns.'
        />
        <div className='flex items-center gap-4'>
          <Button
            variant='outline'
            size='sm'
            className='gap-2'
            onClick={() => generateSummaryMutation.mutate({ simulationId: 'sim-mock-1' })}
            disabled={generateSummaryMutation.isPending}
          >
            <Sparkles className='h-4 w-4' />
            {generateSummaryMutation.isPending ? 'Analyzing...' : 'Generate Analysis'}
          </Button>
          <div className='flex items-center gap-2'>
            <Switch
              id='comparison-mode'
              checked={isComparisonMode}
              onCheckedChange={handleComparisonToggle}
            />
            <label
              htmlFor='comparison-mode'
              className='flex items-center gap-2 text-sm font-medium'
            >
              <GitCompare className='h-4 w-4' />
              Compare
            </label>
          </div>

          <Button variant='outline' size='sm' className='gap-2'>
            <Download className='h-4 w-4' />
            Export
          </Button>
        </div>
      </div>

      <div className='grid gap-6 lg:grid-cols-5'>
        {/* Sankey Diagram */}
        <Card className={`${selectedStage ? 'lg:col-span-3' : 'lg:col-span-5'} bg-card`}>
          <CardHeader className='p-4 border-b'>
            <div className='flex items-center gap-2'>
              <LineChart className='h-5 w-5 text-muted-foreground' />
              <CardTitle className='text-lg font-semibold'>
                {isComparisonMode ? 'Funnel Flow Comparison' : 'Funnel Flow Visualization'}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className='p-6'>
            <div
              className={`space-y-8 ${!isComparisonMode ? 'flex items-center justify-center' : ''}`}
            >
              <div className={!isComparisonMode ? 'w-full' : ''}>
                {isComparisonMode && (
                  <div className='flex items-center gap-2 mb-4'>
                    <Badge className='bg-primary text-primary-foreground'>
                      {currentAnalysis.funnel.name}
                    </Badge>
                    <Badge
                      variant='outline'
                      className='bg-primary/5 text-primary border-primary/20'
                    >
                      Simulation {selectedSimulationId.split('-').pop()}
                    </Badge>
                  </div>
                )}
                <FunnelSankey
                  data={currentAnalysis.sankey}
                  height={300}
                  onNodeClick={setSelectedStageId}
                  selectedNodeId={selectedStageId || undefined}
                />
              </div>
              {comparisonAnalysis && (
                <>
                  <div>
                    <div className='flex items-center gap-2 mb-4'>
                      <Badge className='bg-primary text-primary-foreground'>
                        {comparisonAnalysis.funnel.name}
                      </Badge>
                      <Badge
                        variant='outline'
                        className='bg-primary/5 text-primary border-primary/20'
                      >
                        Simulation {compareSimulationId?.split('-').pop()}
                      </Badge>
                    </div>
                    <FunnelSankey
                      data={comparisonAnalysis.sankey}
                      height={300}
                      onNodeClick={setSelectedStageId}
                      selectedNodeId={selectedStageId || undefined}
                    />
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Stage Details */}
        {selectedStage && (
          <Card className='lg:col-span-2 bg-card'>
            <CardHeader className='p-4 border-b'>
              <div className='flex items-center gap-2'>
                <BarChart3 className='h-5 w-5 text-muted-foreground' />
                <CardTitle className='text-lg font-semibold'>Detailed Stage Analysis</CardTitle>
              </div>
            </CardHeader>
            <CardContent className='p-6 space-y-6'>
              {isComparisonMode && (
                <div className='flex items-center gap-2 mb-4'>
                  <Badge className='bg-primary text-primary-foreground'>
                    {currentAnalysis.funnel.name}
                  </Badge>
                  <Badge variant='outline' className='bg-primary/5 text-primary border-primary/20'>
                    Stage Analysis
                  </Badge>
                </div>
              )}
              <StageDetails stage={selectedStage} showChanges={false} />
              {comparisonStage && (
                <>
                  <div className='flex items-center gap-2 mb-4'>
                    <Badge className='bg-primary text-primary-foreground'>
                      {comparisonAnalysis?.funnel.name}
                    </Badge>
                    <Badge
                      variant='outline'
                      className='bg-primary/5 text-primary border-primary/20'
                    >
                      Stage Analysis
                    </Badge>
                  </div>
                  <StageDetails
                    stage={comparisonStage}
                    baseStage={selectedStage}
                    showChanges={isComparisonMode}
                  />
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Overall Summary */}
      {currentAnalysis.summary && (
        <Card className='bg-card'>
          <CardHeader className='p-4 border-b'>
            <div className='flex items-center gap-2'>
              <GitCompare className='h-5 w-5 text-muted-foreground' />
              <CardTitle className='text-lg font-semibold'>Overall Simulation Summary</CardTitle>
            </div>
          </CardHeader>
          <CardContent className='p-6'>
            <div className='space-y-6'>
              {/* Analysis Section with equal heights */}
              <AnalysisSection
                baseSummary={currentAnalysis.summary}
                compareSummary={comparisonAnalysis?.summary || undefined}
                isComparisonMode={isComparisonMode}
                baseFunnelName={currentAnalysis.funnel.name}
                baseSimulationId={currentAnalysis.simulation.id}
                compareFunnelName={comparisonAnalysis?.funnel.name}
                compareSimulationId={comparisonAnalysis?.simulation.id}
              />

              {/* Key Metrics Grid */}
              <div
                className={`grid gap-8 ${isComparisonMode ? 'md:grid-cols-2' : 'md:grid-cols-1'}`}
              >
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
                              <Info className='h-4 w-4 text-muted-foreground/50' />
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

                {comparisonAnalysis && comparisonAnalysis.summary && (
                  <div className='grid gap-4 grid-cols-2'>
                    {comparisonAnalysis.metrics.map((metric: KeyMetric, index: number) => {
                      const baseMetric = currentAnalysis.metrics.find(
                        (m) => m.label === metric.label
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
                                  <Info className='h-4 w-4 text-muted-foreground/50' />
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
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analysis Data Debug Views */}
      <div className='space-y-4'>
        {/* Current Analysis Debug View */}
        {analysisData && (
          <Card className='bg-card'>
            <CardHeader className='p-4 border-b'>
              <div className='flex items-center gap-2'>
                <LineChart className='h-5 w-5 text-muted-foreground' />
                <CardTitle className='text-lg font-semibold'>
                  Current Analysis Data (Debug View)
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className='p-4'>
              <pre className='whitespace-pre-wrap overflow-auto max-h-[500px] text-xs'>
                {JSON.stringify(analysisData, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}

        {/* Comparison Analysis Debug View */}
        {isComparisonMode && comparisonAnalysis && (
          <Card className='bg-card'>
            <CardHeader className='p-4 border-b'>
              <div className='flex items-center gap-2'>
                <GitCompare className='h-5 w-5 text-muted-foreground' />
                <CardTitle className='text-lg font-semibold'>
                  Comparison Analysis Data (Debug View)
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className='p-4'>
              <pre className='whitespace-pre-wrap overflow-auto max-h-[500px] text-xs'>
                {JSON.stringify(comparisonAnalysis, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
