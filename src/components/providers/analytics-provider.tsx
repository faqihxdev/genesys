/**
 * @description Umami Analytics provider component for visitor tracking
 * This component adds the Umami Analytics script to track page views and user metrics
 * while respecting privacy regulations. It uses a data-website-id and src from env variables.
 */
'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import Script from 'next/script';
import { useEffect } from 'react';

export interface AnalyticsProviderProps {
  children: React.ReactNode;
}

export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Track page views when the route changes
  useEffect(() => {
    if (typeof window.umami !== 'undefined') {
      // Send page view to Umami when route changes
      window.umami.trackView(pathname);
    }
  }, [pathname, searchParams]);

  return (
    <>
      <Script
        async
        src='https://cloud.umami.is/script.js'
        data-website-id='caf3880a-bef1-4e0a-821a-80171eecf8cd'
        strategy='afterInteractive'
        data-domains='genesys-theta.vercel.app'
      />
      {children}
    </>
  );
}

// Extend the Window interface to include Umami
declare global {
  interface Window {
    umami?: {
      trackView: (url: string) => void;
      trackEvent: (eventName: string, eventData?: Record<string, unknown>) => void;
    };
  }
}
