/**
 * @description Example component demonstrating how to use the analytics hook
 * This is just an example and not meant to be used directly in production
 */
'use client';

import { useAnalytics } from '@/hooks/use-analytics';
import { Button } from '../ui/button';

export function AnalyticsExample() {
  const { trackEvent, trackFeatureUsage } = useAnalytics();

  const handleButtonClick = () => {
    // Track a custom event when the button is clicked
    trackEvent('button_clicked', {
      buttonName: 'example_button',
      location: 'analytics_example_component',
    });
  };

  const handleFeatureUse = () => {
    // Track feature usage
    trackFeatureUsage('example_feature', {
      context: 'demo',
      timestamp: new Date().toISOString(),
    });
  };

  return (
    <div className='flex flex-col space-y-4 p-4'>
      <h3 className='text-xl font-medium'>Analytics Example</h3>
      <p className='text-muted-foreground'>
        This component demonstrates how to use the analytics hook to track events.
      </p>
      <div className='flex space-x-4'>
        <Button onClick={handleButtonClick}>Track Button Click</Button>
        <Button variant='outline' onClick={handleFeatureUse}>
          Track Feature Usage
        </Button>
      </div>
    </div>
  );
}
