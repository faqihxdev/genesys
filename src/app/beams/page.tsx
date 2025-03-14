'use client';

import { AnimationToggle } from '@/components/custom/animation-toggle';
import { BeamsBackground } from '@/components/custom/beams-background';
import { Button } from '@/components/ui/button';
import { LucideMoon, LucideSun } from 'lucide-react';
import { useTheme } from 'next-themes';

/**
 * @description A standalone page that displays only the BeamsBackground component
 * Includes controls for toggling animations and theme for testing purposes
 */
export default function BeamsPage() {
  const { setTheme, resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <div className='w-full h-screen relative'>
      <BeamsBackground intensity='strong' />

      {/* Controls in the top-right corner */}
      <div className='absolute top-6 right-6 flex items-center gap-4 z-50'>
        <Button
          variant='ghost'
          size='icon'
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          className='h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm shadow-sm border'
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? <LucideSun className='h-5 w-5' /> : <LucideMoon className='h-5 w-5' />}
        </Button>
        <AnimationToggle />
      </div>

      {/* Information text */}
      <div className='absolute bottom-10 left-1/2 transform -translate-x-1/2 text-center z-50'>
        <div className='bg-background/80 backdrop-blur-sm rounded-lg px-4 py-2 shadow-lg border'>
          <p className='text-muted-foreground'>
            Use the controls in the top-right to toggle theme and animations
          </p>
        </div>
      </div>
    </div>
  );
}
