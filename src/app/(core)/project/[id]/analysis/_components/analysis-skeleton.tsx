import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function AnalysisSkeleton() {
  return (
    <div className='space-y-6 max-w-4xl mx-auto'>
      {/* Page Header */}
      <div className='flex items-center justify-between'>
        <div className='space-y-1'>
          <Skeleton className='h-7 w-[300px]' />
          <Skeleton className='h-5 w-[500px]' />
        </div>
        <div className='flex items-center gap-4'>
          <div className='flex items-center gap-2'>
            <Skeleton className='h-5 w-5 rounded-full' />
            <Skeleton className='h-4 w-16' />
          </div>
          <Skeleton className='h-9 w-[140px]' />
        </div>
      </div>

      {/* Analysis Configuration */}
      <Card className='border p-2'>
        <div className='flex items-center justify-between gap-4'>
          <div className='flex items-center gap-4 flex-1'>
            <Skeleton className='h-10 w-[250px]' />
            <Skeleton className='h-10 w-[250px]' />
          </div>
        </div>
      </Card>

      {/* Overall Summary */}
      <Card className='border'>
        <div className='p-4 border-b'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <Skeleton className='h-5 w-5' />
              <Skeleton className='h-6 w-48' />
            </div>
            <Skeleton className='h-6 w-24' />
          </div>
        </div>
        <div className='p-6 space-y-6'>
          {/* Summary */}
          <div className='rounded-lg border bg-background/50'>
            <div className='flex items-center gap-2 border-b p-3'>
              <Skeleton className='h-4 w-4' />
              <Skeleton className='h-4 w-32' />
            </div>
            <div className='p-3'>
              <Skeleton className='h-20 w-full' />
            </div>
          </div>
          {/* Recommendation */}
          <div className='rounded-lg border bg-background/50'>
            <div className='flex items-center gap-2 border-b p-3'>
              <Skeleton className='h-4 w-4' />
              <Skeleton className='h-4 w-32' />
            </div>
            <div className='p-3'>
              <Skeleton className='h-20 w-full' />
            </div>
          </div>
          {/* Metrics */}
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
      </Card>

      {/* Funnel Flow */}
      <Card className='border'>
        <div className='p-4 border-b'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <Skeleton className='h-5 w-5' />
              <Skeleton className='h-6 w-48' />
            </div>
            <Skeleton className='h-6 w-24' />
          </div>
        </div>
        <div className='p-6'>
          <div className='h-[300px] space-y-4'>
            <div className='flex items-center justify-between mb-4'>
              <Skeleton className='h-8 w-32' />
              <Skeleton className='h-6 w-24' />
            </div>
            <Skeleton className='h-[250px] w-full' />
          </div>
        </div>
      </Card>

      {/* Stage Details */}
      <Card className='border'>
        <div className='p-4 border-b'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <Skeleton className='h-5 w-5' />
              <Skeleton className='h-6 w-48' />
            </div>
            <Skeleton className='h-6 w-24' />
          </div>
        </div>
        <div className='p-6 space-y-6'>
          {/* Analysis Summary */}
          <div className='rounded-lg border bg-background/50'>
            <div className='flex items-center gap-2 border-b p-3'>
              <Skeleton className='h-4 w-4' />
              <Skeleton className='h-4 w-32' />
            </div>
            <div className='p-3'>
              <Skeleton className='h-20 w-full' />
            </div>
          </div>
          {/* Metrics */}
          <div className='grid gap-4 grid-cols-2'>
            {[1, 2].map((i) => (
              <div key={i} className='rounded-lg border bg-background/50 p-4'>
                <div className='flex items-center justify-between mb-2'>
                  <Skeleton className='h-4 w-24' />
                  <Skeleton className='h-4 w-4 rounded-full' />
                </div>
                <Skeleton className='h-8 w-20' />
              </div>
            ))}
          </div>
          {/* Content Items */}
          <div className='space-y-3'>
            <Skeleton className='h-5 w-24' />
            {[1, 2].map((i) => (
              <div key={i} className='rounded-lg border bg-background/50 p-3 space-y-2'>
                <div className='flex items-center justify-between'>
                  <Skeleton className='h-4 w-32' />
                  <Skeleton className='h-4 w-24' />
                </div>
                <Skeleton className='h-4 w-full' />
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
