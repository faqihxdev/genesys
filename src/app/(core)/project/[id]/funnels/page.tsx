'use client';

import { Button } from '@/components/ui/button';
import useHydration from '@/hooks/use-hydration';
import { GitFork } from 'lucide-react';
import { FunnelGrid } from './_components/funnel-grid';

export default function FunnelsPage() {
  const isHydrated = useHydration();

  return (
    <div className='flex h-full flex-col'>
      <div className='flex-none space-y-4 mb-4'>
        <div className='flex items-center justify-between'>
          <h1 className='text-2xl font-semibold'>Marketing Funnels</h1>
          <Button>
            <GitFork className="mr-2 h-4 w-4" />
            Create Funnel
          </Button>
        </div>
        <p className='text-muted-foreground text-sm'>
          Design and optimize your marketing funnels by analyzing how different personas interact with
          each stage of your customer journey.
        </p>
      </div>
      <div className='flex-grow'>
        {isHydrated && <FunnelGrid />}
      </div>
    </div>
  );
}