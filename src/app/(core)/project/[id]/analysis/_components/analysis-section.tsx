import { Badge } from '@/components/ui/badge';
import { Summary } from '@/db/schema/summary';
import { FileText, Lightbulb } from 'lucide-react';
import { useEffect, useRef } from 'react';

interface AnalysisSectionProps {
  baseSummary: Summary;
  compareSummary?: Summary;
  isComparisonMode?: boolean;
  baseFunnelName: string;
  baseSimulationId: string;
  compareFunnelName?: string;
  compareSimulationId?: string;
}

export function AnalysisSection({
  baseSummary,
  compareSummary,
  isComparisonMode,
  baseFunnelName,
  baseSimulationId,
  compareFunnelName,
  compareSimulationId,
}: AnalysisSectionProps) {
  // Refs for the content sections
  const baseSummaryRef = useRef<HTMLDivElement>(null);
  const baseRecommendationRef = useRef<HTMLDivElement>(null);
  const compareSummaryRef = useRef<HTMLDivElement>(null);
  const compareRecommendationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Function to adjust heights
    const adjustHeights = () => {
      if (!isComparisonMode || !compareSummary) return;

      // Get all elements
      const baseSummaryEl = baseSummaryRef.current;
      const baseRecommendationEl = baseRecommendationRef.current;
      const compareSummaryEl = compareSummaryRef.current;
      const compareRecommendationEl = compareRecommendationRef.current;

      if (
        !baseSummaryEl ||
        !baseRecommendationEl ||
        !compareSummaryEl ||
        !compareRecommendationEl
      ) {
        return;
      }

      // Reset heights to auto to get natural heights
      [baseSummaryEl, compareSummaryEl, baseRecommendationEl, compareRecommendationEl].forEach(
        (el) => {
          el.style.height = 'auto';
        }
      );

      // Get natural heights
      const summaryHeight = Math.max(baseSummaryEl.scrollHeight, compareSummaryEl.scrollHeight);
      const recommendationHeight = Math.max(
        baseRecommendationEl.scrollHeight,
        compareRecommendationEl.scrollHeight
      );

      // Set equal heights
      [baseSummaryEl, compareSummaryEl].forEach((el) => {
        el.style.height = `${summaryHeight}px`;
      });
      [baseRecommendationEl, compareRecommendationEl].forEach((el) => {
        el.style.height = `${recommendationHeight}px`;
      });
    };

    // Create ResizeObserver
    const resizeObserver = new ResizeObserver(adjustHeights);

    // Observe elements if in comparison mode
    if (isComparisonMode && compareSummary) {
      const elements = [
        baseSummaryRef.current,
        baseRecommendationRef.current,
        compareSummaryRef.current,
        compareRecommendationRef.current,
      ];

      elements.forEach((el) => {
        if (el) resizeObserver.observe(el);
      });
    }

    // Initial adjustment
    adjustHeights();

    // Cleanup
    return () => {
      resizeObserver.disconnect();
    };
  }, [isComparisonMode, compareSummary]);

  return (
    <div className={`grid gap-8 ${isComparisonMode ? 'md:grid-cols-2' : 'md:grid-cols-1'}`}>
      <div className='space-y-3'>
        {/* Base Badges */}
        <div className='flex items-center gap-2 mb-4'>
          <Badge className='bg-primary text-primary-foreground'>{baseFunnelName}</Badge>
          <Badge variant='outline' className='bg-primary/5 text-primary border-primary/20'>
            Simulation {baseSimulationId.split('-').pop()}
          </Badge>
        </div>

        {/* Base Summary */}
        <div className='rounded-lg border bg-background/50'>
          <div className='flex items-center gap-2 border-b p-3'>
            <FileText className='h-4 w-4 text-muted-foreground' />
            <h4 className='text-sm font-medium'>Analysis Summary</h4>
          </div>
          <div className='p-3' ref={baseSummaryRef}>
            <p className='text-sm text-muted-foreground'>{baseSummary.summary}</p>
          </div>
        </div>

        {/* Base Recommendation */}
        <div className='rounded-lg border bg-background/50'>
          <div className='flex items-center gap-2 border-b p-3 bg-primary/5'>
            <Lightbulb className='h-4 w-4 text-primary' />
            <h4 className='text-sm font-medium text-primary'>Recommendations</h4>
          </div>
          <div className='p-3' ref={baseRecommendationRef}>
            <p className='text-sm text-muted-foreground'>{baseSummary.recommendation}</p>
          </div>
        </div>
      </div>

      {isComparisonMode && compareSummary && compareFunnelName && compareSimulationId && (
        <div className='space-y-3'>
          {/* Comparison Badges */}
          <div className='flex items-center gap-2 mb-4'>
            <Badge className='bg-primary text-primary-foreground'>{compareFunnelName}</Badge>
            <Badge variant='outline' className='bg-primary/5 text-primary border-primary/20'>
              Simulation {compareSimulationId.split('-').pop()}
            </Badge>
          </div>

          {/* Comparison Summary */}
          <div className='rounded-lg border bg-background/50'>
            <div className='flex items-center gap-2 border-b p-3'>
              <FileText className='h-4 w-4 text-muted-foreground' />
              <h4 className='text-sm font-medium'>Analysis Summary</h4>
            </div>
            <div className='p-3' ref={compareSummaryRef}>
              <p className='text-sm text-muted-foreground'>{compareSummary.summary}</p>
            </div>
          </div>

          {/* Comparison Recommendation */}
          <div className='rounded-lg border bg-background/50'>
            <div className='flex items-center gap-2 border-b p-3 bg-primary/5'>
              <Lightbulb className='h-4 w-4 text-primary' />
              <h4 className='text-sm font-medium text-primary'>Recommendations</h4>
            </div>
            <div className='p-3' ref={compareRecommendationRef}>
              <p className='text-sm text-muted-foreground'>{compareSummary.recommendation}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
