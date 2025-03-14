'use client';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { animationsEnabledAtom } from '@/stores/animation-store';
import { useAtom } from 'jotai';
import { LucideEye, LucideEyeOff } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';

/**
 * @description Toggle button to enable/disable animations throughout the application
 * @returns {JSX.Element} The animation toggle button component
 */
export function AnimationToggle() {
  const [animationsEnabled, setAnimationsEnabled] = useAtom(animationsEnabledAtom);
  const [showInitialLabel, setShowInitialLabel] = useState(true);
  const { toast } = useToast();

  // Show the initial label for 5 seconds then hide it
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowInitialLabel(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  // Add an accessibility announcement when animation state changes
  useEffect(() => {
    // Skip on initial render
    if (typeof document !== 'undefined') {
      const announcement = document.getElementById('animation-status-announcement');
      if (announcement) {
        announcement.textContent = animationsEnabled
          ? 'Animations are now enabled'
          : 'Animations are now disabled for improved performance';
      }
    }
  }, [animationsEnabled]);

  const handleToggleAnimation = () => {
    const newState = !animationsEnabled;
    setAnimationsEnabled(newState);

    // Show toast notification
    toast({
      title: newState ? 'Animations Enabled' : 'Animations Disabled',
      description: newState
        ? 'Visual animations are now active.'
        : 'Animations disabled for improved performance.',
      variant: 'success',
    });

    // Reset the label visibility when button is clicked
    setShowInitialLabel(true);
    setTimeout(() => setShowInitialLabel(false), 3000);
  };

  return (
    <div
      className={`flex items-center space-x-2 transition-opacity duration-300 ${
        showInitialLabel ? 'opacity-100' : 'opacity-50 hover:opacity-100'
      }`}
    >
      {/* Screen reader announcement */}
      <div
        id='animation-status-announcement'
        className='sr-only'
        aria-live='polite'
        aria-atomic='true'
      />

      <AnimatePresence>
        {showInitialLabel && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
            className='bg-card/80 backdrop-blur-sm text-sm rounded-lg px-3 py-1.5 shadow-sm border'
          >
            {animationsEnabled ? 'Disable animations' : 'Enable animations'}
          </motion.div>
        )}
      </AnimatePresence>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant='ghost'
              size='icon'
              onClick={handleToggleAnimation}
              aria-label={animationsEnabled ? 'Disable animations' : 'Enable animations'}
              className='h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm shadow-sm border'
            >
              {animationsEnabled ? (
                <LucideEye className='h-5 w-5' />
              ) : (
                <LucideEyeOff className='h-5 w-5' />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side='left'>
            {animationsEnabled ? 'Disable animations' : 'Enable animations'}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
