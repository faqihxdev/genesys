'use client';

import { PageTitle } from '@/components/custom/page-title';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ArrowLeftRight, BarChart3, Download, GitCompare, Info, LineChart } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { AnalysisSection } from './_components/analysis-section';
import { AnalysisSkeleton } from './_components/analysis-skeleton';
import { FunnelSankey } from './_components/funnel-sankey';
import { StageDetails } from './_components/stage-details';
import {
  mockAnalysisByFunnel,
  mockFunnelOptions,
  mockSimulationOptionsByFunnel,
} from './mock-data';
import { FunnelOption, KeyMetric } from './types';

/**
 * Calculate the percentage difference between two numbers
 */
function calculatePercentageDiff(current: number, base: number): number {
  return ((current - base) / base) * 100;
}

export default function AnalysisPage() {
  const { id: projectId } = useParams();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFunnelId, setSelectedFunnelId] = useState('fnl-mock-1');
  const [selectedSimulationId, setSelectedSimulationId] = useState('sim-mock-1');
  const [isComparisonMode, setIsComparisonMode] = useState(false);
  const [compareFunnelId, setCompareFunnelId] = useState<string | null>(null);
  const [compareSimulationId, setCompareSimulationId] = useState<string | null>(null);
  const [selectedStageId, setSelectedStageId] = useState<string | null>(null);

  // In a real app, these would be API calls
  const handleFunnelChange = (funnelId: string) => {
    setIsLoading(true);
    setSelectedFunnelId(funnelId);
    // Reset simulation selection for new funnel
    const firstSimulation = mockSimulationOptionsByFunnel[funnelId][0];
    setSelectedSimulationId(firstSimulation.id);
    setSelectedStageId(null);
    // Simulate API call
    setTimeout(() => setIsLoading(false), 1000);
  };

  const handleSimulationChange = (simulationId: string) => {
    setIsLoading(true);
    setSelectedSimulationId(simulationId);
    setSelectedStageId(null);
    // Simulate API call
    setTimeout(() => setIsLoading(false), 1000);
  };

  const handleComparisonToggle = (enabled: boolean) => {
    setIsLoading(true);
    setIsComparisonMode(enabled);
    if (!enabled) {
      setCompareFunnelId(null);
      setCompareSimulationId(null);
    } else if (!compareFunnelId) {
      // Default to the second funnel if available
      const otherFunnel = mockFunnelOptions.find((f: FunnelOption) => f.id !== selectedFunnelId);
      if (otherFunnel) {
        setCompareFunnelId(otherFunnel.id);
        setCompareSimulationId(mockSimulationOptionsByFunnel[otherFunnel.id][0].id);
      }
    }
    // Simulate API call
    setTimeout(() => setIsLoading(false), 1000);
  };

  const handleCompareFunnelChange = (funnelId: string) => {
    setIsLoading(true);
    setCompareFunnelId(funnelId);
    // Reset simulation selection for new funnel
    const firstSimulation = mockSimulationOptionsByFunnel[funnelId][0];
    setCompareSimulationId(firstSimulation.id);
    // Simulate API call
    setTimeout(() => setIsLoading(false), 1000);
  };

  const handleCompareSimulationChange = (simulationId: string) => {
    setIsLoading(true);
    setCompareSimulationId(simulationId);
    // Simulate API call
    setTimeout(() => setIsLoading(false), 1000);
  };

  if (isLoading) {
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

  // Get the current analysis data
  const currentAnalysis = mockAnalysisByFunnel[selectedFunnelId][selectedSimulationId];
  const comparisonAnalysis =
    isComparisonMode && compareFunnelId && compareSimulationId
      ? mockAnalysisByFunnel[compareFunnelId][compareSimulationId]
      : null;

  // Find selected stage details
  const selectedStage = selectedStageId
    ? currentAnalysis.stages.find((stage) => stage.stage.id === selectedStageId)
    : null;
  const comparisonStage =
    comparisonAnalysis && selectedStageId
      ? comparisonAnalysis.stages.find((stage) => stage.stage.id === selectedStageId)
      : null;

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <PageTitle
          title='Analysis Dashboard'
          description='Comprehensive analysis and insights about your marketing funnels, persona behaviors, and conversion metrics across all campaigns.'
        />
        <div className='flex items-center gap-4'>
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

      <Card className='bg-card'>
        <CardContent className='p-4'>
          <div className='flex flex-col gap-4 md:flex-row md:items-center'>
            <div className='flex flex-1 items-center gap-4'>
              <Select defaultValue={mockFunnelOptions[0].id} onValueChange={handleFunnelChange}>
                <SelectTrigger className='w-[250px] bg-background'>
                  <SelectValue placeholder='Select funnel' />
                </SelectTrigger>
                <SelectContent>
                  {mockFunnelOptions.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <ArrowLeftRight className='h-4 w-4 text-muted-foreground' />

              <Select
                defaultValue={mockSimulationOptionsByFunnel[mockFunnelOptions[0].id][0].id}
                onValueChange={handleSimulationChange}
              >
                <SelectTrigger className='w-[200px] bg-background'>
                  <SelectValue placeholder='Select simulation' />
                </SelectTrigger>
                <SelectContent>
                  {mockSimulationOptionsByFunnel[mockFunnelOptions[0].id].map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      Simulation {option.id.split('-').pop()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isComparisonMode && (
              <div className='flex items-center gap-4 md:pl-8 md:border-l border-border/50'>
                <Select
                  defaultValue={mockFunnelOptions[0].id}
                  onValueChange={handleCompareFunnelChange}
                >
                  <SelectTrigger className='w-[250px] bg-background'>
                    <SelectValue placeholder='Select comparison funnel' />
                  </SelectTrigger>
                  <SelectContent>
                    {mockFunnelOptions.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        {option.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <ArrowLeftRight className='h-4 w-4 text-muted-foreground' />

                <Select
                  defaultValue={mockSimulationOptionsByFunnel[mockFunnelOptions[0].id][0].id}
                  onValueChange={handleCompareSimulationChange}
                >
                  <SelectTrigger className='w-[200px] bg-background'>
                    <SelectValue placeholder='Select comparison simulation' />
                  </SelectTrigger>
                  <SelectContent>
                    {mockSimulationOptionsByFunnel[mockFunnelOptions[0].id].map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        Simulation {option.id.split('-').pop()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

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
              compareSummary={comparisonAnalysis?.summary}
              isComparisonMode={isComparisonMode}
              baseFunnelName={currentAnalysis.funnel.name}
              baseSimulationId={currentAnalysis.simulation.id}
              compareFunnelName={comparisonAnalysis?.funnel.name}
              compareSimulationId={comparisonAnalysis?.simulation.id}
            />

            {/* Key Metrics Grid */}
            <div className={`grid gap-8 ${isComparisonMode ? 'md:grid-cols-2' : 'md:grid-cols-1'}`}>
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

              {comparisonAnalysis && (
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
    </div>
  );
}
