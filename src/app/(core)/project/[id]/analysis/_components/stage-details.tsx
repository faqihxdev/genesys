'use client';

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { FileText, Info, Lightbulb } from 'lucide-react';
import { KeyMetric, StageAnalysis } from '../types';

interface StageDetailsProps {
  stage: StageAnalysis;
  baseStage?: StageAnalysis; // Base stage for comparison
  className?: string;
  showChanges?: boolean;
}

/**
 * Calculate the percentage difference between two numbers
 */
function calculatePercentageDiff(current: number, base: number): number {
  return ((current - base) / base) * 100;
}

/**
 * @description Component to display detailed information about a selected stage
 * @param stage - The stage analysis data to display
 * @param baseStage - The base stage for comparison (optional)
 * @param className - Optional className for styling
 * @param showChanges - Whether to show metric changes (used in comparison mode)
 */
export function StageDetails({
  stage,
  baseStage,
  className,
  showChanges = false,
}: StageDetailsProps) {
  // Calculate metric differences if in comparison mode and we have a base stage
  const getMetricDiff = (metric: KeyMetric): number | undefined => {
    if (!showChanges || !baseStage) return undefined;

    // Only calculate diff for numerical metrics
    const currentValue = typeof metric.value === 'string' ? parseFloat(metric.value) : metric.value;
    const baseMetric = baseStage.metrics.find((m) => m.label === metric.label);
    if (!baseMetric) return undefined;

    const baseValue =
      typeof baseMetric.value === 'string' ? parseFloat(baseMetric.value) : baseMetric.value;

    if (isNaN(currentValue) || isNaN(baseValue)) return undefined;
    return calculatePercentageDiff(currentValue, baseValue);
  };

  return (
    <div className={className}>
      <div className='flex items-center justify-between mb-4'>
        <h3 className='font-medium'>{stage.stage.name}</h3>
        <span className='text-sm font-medium text-primary'>{stage.conversionRate}% Conversion</span>
      </div>
      <div className='space-y-4'>
        {/* Analysis Section */}
        <div className='space-y-3'>
          {/* Summary */}
          <div className='rounded-lg border bg-background/50'>
            <div className='flex items-center gap-2 border-b p-3'>
              <FileText className='h-4 w-4 text-muted-foreground' />
              <h4 className='text-sm font-medium'>Analysis Summary</h4>
            </div>
            <div className='p-3'>
              <p className='text-sm text-muted-foreground'>{stage.summary}</p>
            </div>
          </div>

          {/* Recommendation */}
          <div className='rounded-lg border bg-background/50'>
            <div className='flex items-center gap-2 border-b p-3 bg-primary/5'>
              <Lightbulb className='h-4 w-4 text-primary' />
              <h4 className='text-sm font-medium text-primary'>Recommendations</h4>
            </div>
            <div className='p-3'>
              <p className='text-sm text-muted-foreground'>{stage.recommendation}</p>
            </div>
          </div>
        </div>

        {/* Metrics */}
        <div className='grid gap-3 grid-cols-2'>
          {stage.metrics.map((metric, idx) => {
            const diff = getMetricDiff(metric);
            const showDiff = showChanges && diff !== undefined;

            return (
              <div key={idx} className='rounded-lg border bg-background/50 p-3'>
                <div className='flex items-center justify-between'>
                  <p className='text-xs text-muted-foreground'>{metric.label}</p>
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
                <div className='mt-1'>
                  <div className='flex items-baseline gap-2'>
                    <p className='text-lg font-semibold text-primary'>{metric.value}</p>
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

        {/* Stage Items */}
        {stage.items.length > 0 && (
          <div className='space-y-3'>
            <h4 className='text-sm font-medium mb-2'>Content Items</h4>
            {stage.items.map((item, idx) => (
              <div key={idx} className='rounded-lg border bg-background/50 p-3 space-y-2'>
                <div className='flex items-center justify-between'>
                  <p className='text-sm font-medium'>{item.item.name}</p>
                  <span
                    className={`text-xs ${
                      parseFloat(item.sentiment) > 0.5
                        ? 'text-green-500 dark:text-green-400'
                        : parseFloat(item.sentiment) < 0.3
                          ? 'text-red-500 dark:text-red-400'
                          : 'text-yellow-500 dark:text-yellow-400'
                    }`}
                  >
                    Sentiment: {item.sentiment}
                  </span>
                </div>
                <div className='flex items-center justify-between'>
                  <p className='text-xs text-muted-foreground'>{item.summary}</p>
                  <TooltipProvider delayDuration={100}>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className='h-4 w-4 text-muted-foreground/50 ml-2' />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{item.summary}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
