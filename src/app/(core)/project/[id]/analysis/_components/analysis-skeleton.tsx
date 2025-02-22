import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function AnalysisSkeleton() {
  return (
    <div className='space-y-6'>
      {/* Header Skeleton */}
      <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
        <div className='flex flex-1 items-center gap-4'>
          <Skeleton className='h-10 w-[250px]' />
          <Skeleton className='h-10 w-[200px]' />
        </div>
        <div className='flex items-center gap-4'>
          <Skeleton className='h-6 w-32' />
          <Skeleton className='h-9 w-28' />
        </div>
      </div>

      {/* Sankey Diagram Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className='h-6 w-48' />
          <Skeleton className='h-4 w-96' />
        </CardHeader>
        <CardContent>
          <Skeleton className='h-[300px] w-full' />
        </CardContent>
      </Card>

      {/* Summary Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className='h-6 w-32' />
          <Skeleton className='h-4 w-64' />
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            <Skeleton className='h-20 w-full' />
            <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className='h-24 w-full' />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stage Analysis Skeleton */}
      <div className='grid gap-4 md:grid-cols-2'>
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className='h-6 w-32' />
              <Skeleton className='h-4 w-48' />
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                <Skeleton className='h-16 w-full' />
                <div className='grid gap-2 grid-cols-2'>
                  <Skeleton className='h-12 w-full' />
                  <Skeleton className='h-12 w-full' />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
