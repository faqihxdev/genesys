/**
 * @description Umami Analytics provider component for visitor tracking
 * This component adds the Umami Analytics script to track page views and user metrics
 * while respecting privacy regulations.
 */
'use client';

import Script from 'next/script';

export interface AnalyticsProviderProps {
  children: React.ReactNode;
}

// Main provider just adds the script and renders children
export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
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
      <AnalyticsTracker />
    </>
  );
}

// Separate component to handle page view tracking with proper hydration
import { usePathname, useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';

// This is a separate component that will be wrapped in Suspense
function SearchParamsTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window.umami !== 'undefined') {
      // Send page view to Umami when route changes
      window.umami.trackView(pathname);
    }
  }, [pathname, searchParams]);

  return null;
}

// This component wraps the tracker in Suspense to handle the CSR bailout
function AnalyticsTracker() {
  return (
    <Suspense fallback={null}>
      <SearchParamsTracker />
    </Suspense>
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
