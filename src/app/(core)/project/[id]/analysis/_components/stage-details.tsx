'use client';

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ChevronDown, FileText, Info, Lightbulb } from 'lucide-react';
import { useState } from 'react';
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
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const toggleItem = (itemId: string) => {
    setExpandedItems((current) =>
      current.includes(itemId) ? current.filter((id) => id !== itemId) : [...current, itemId]
    );
  };

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
              <Collapsible
                key={idx}
                open={expandedItems.includes(item.item.id)}
                onOpenChange={() => toggleItem(item.item.id)}
                className='rounded-lg border bg-background/50 group transition-all duration-200 hover:shadow-sm'
              >
                <CollapsibleTrigger className='flex items-center justify-between w-full p-3 hover:bg-muted/50 transition-colors'>
                  <div className='flex items-center gap-2'>
                    <ChevronDown
                      className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ease-in-out ${
                        expandedItems.includes(item.item.id) ? 'transform rotate-180' : ''
                      }`}
                    />
                    <p className='text-sm font-medium group-hover:text-primary transition-colors'>
                      {item.item.name}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded-full ${
                      parseFloat(item.sentiment) > 0.5
                        ? 'bg-green-500/10 text-green-500 dark:bg-green-400/10 dark:text-green-400'
                        : parseFloat(item.sentiment) < 0.3
                          ? 'bg-red-500/10 text-red-500 dark:bg-red-400/10 dark:text-red-400'
                          : 'bg-yellow-500/10 text-yellow-500 dark:bg-yellow-400/10 dark:text-yellow-400'
                    }`}
                  >
                    Sentiment: {item.sentiment}
                  </span>
                </CollapsibleTrigger>
                <CollapsibleContent className='data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up'>
                  <div
                    className={`
                      px-4 pb-4 pt-4 border-t space-y-4
                      transition-all duration-200 ease-in-out
                      data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-top-2
                      data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-2
                    `}
                  >
                    <div className='space-y-2'>
                      <div className='flex items-center gap-2'>
                        <FileText className='h-4 w-4 text-primary' />
                        <p className='text-sm font-medium text-primary'>Summary</p>
                      </div>
                      <p className='text-sm text-muted-foreground pl-6'>{item.summary}</p>
                    </div>
                    <div className='space-y-2'>
                      <div className='flex items-center gap-2'>
                        <Lightbulb className='h-4 w-4 text-primary' />
                        <p className='text-sm font-medium text-primary'>Recommendation</p>
                      </div>
                      <p className='text-sm text-muted-foreground pl-6'>{item.recommendation}</p>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
