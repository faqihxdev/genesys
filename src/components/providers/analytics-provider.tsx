/**
 * @description Umami Analytics provider component for visitor tracking
 * This component adds the Umami Analytics script to track page views and user metrics
 * while respecting privacy regulations.
 */
'use client';

import env from '@/env';
import Script from 'next/script';

export interface AnalyticsProviderProps {
  children: React.ReactNode;
}

// Main provider just adds the script and renders children
export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  const websiteId = env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;

  return (
    <>
      {websiteId ? (
        <Script
          async
          src='https://cloud.umami.is/script.js'
          data-website-id={websiteId}
          strategy='afterInteractive'
          data-domains={env.NEXT_PUBLIC_UMAMI_DOMAINS}
        />
      ) : null}
      {children}
      {websiteId ? <AnalyticsTracker /> : null}
    </>
  );
}

// Separate component to handle page view tracking with proper hydration
import { usePathname, useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';

// Umami type definitions for different API versions
type UmamiV1 = {
  trackView: (url: string) => void;
  trackEvent: (eventName: string, eventData?: Record<string, unknown>) => void;
};

type UmamiV2 = {
  track: (type: string, data?: Record<string, unknown>) => void;
};

type UmamiFunction = (event: string, data?: Record<string, unknown>) => void;

// This is a separate component that will be wrapped in Suspense
function SearchParamsTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Handle page view tracking when route changes
    const trackPageView = () => {
      if (typeof window === 'undefined') return;

      // Check if umami exists on the window
      if (window.umami === undefined) return;

      try {
        // Check if umami is a function (direct call style)
        if (typeof window.umami === 'function') {
          (window.umami as UmamiFunction)('pageview');
        }
        // Check for modern v2 API
        else if (typeof (window.umami as UmamiV2).track === 'function') {
          (window.umami as UmamiV2).track('pageview');
        }
        // Check for older v1 API
        else if (typeof (window.umami as UmamiV1).trackView === 'function') {
          (window.umami as UmamiV1).trackView(pathname);
        }
      } catch (error) {
        console.error('[AnalyticsProvider/trackPageView]: ', error);
      }
    };

    // Execute tracking after a short delay to ensure Umami is fully loaded
    const timer = setTimeout(() => {
      trackPageView();
    }, 500);

    return () => clearTimeout(timer);
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

// Extend the Window interface to include Umami with different API versions
declare global {
  interface Window {
    umami?: UmamiV1 | UmamiV2 | UmamiFunction;
  }
}
