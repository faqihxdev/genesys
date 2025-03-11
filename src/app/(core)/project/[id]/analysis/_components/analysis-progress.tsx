import { Sparkles } from 'lucide-react';

interface AnalysisProgressProps {
  isGenerating: boolean;
  simulationName?: string;
}

export function AnalysisProgress({ isGenerating, simulationName }: AnalysisProgressProps) {
  if (!isGenerating) return null;

  return (
    <div className='bg-card border rounded-lg mb-6'>
      <div className='px-6 py-4 bg-primary/5 space-y-3'>
        <div className='flex items-center'>
          <div className='flex-shrink-0 mr-3'>
            <div className='h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center'>
              <Sparkles className='h-4 w-4 text-primary' />
            </div>
          </div>
          <div className='flex-1'>
            <h4 className='text-sm font-medium text-primary'>
              Generating Analysis for Simulation {simulationName}
            </h4>
          </div>
        </div>

        <div className='space-y-1.5'>
          <div className='flex justify-between text-xs text-muted-foreground'>
            <span>Analysis in progress</span>
            <span>This may take a minute...</span>
          </div>
          <div className='relative w-full h-1.5 bg-primary/10 rounded-full overflow-hidden'>
            <div className='absolute top-0 bottom-0 left-0 w-24 bg-primary rounded-full animate-rolling'></div>
          </div>
        </div>
      </div>
    </div>
  );
}
