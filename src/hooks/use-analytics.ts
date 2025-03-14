/**
 * @description Custom hook for tracking user events and interactions
 * Provides a simple interface for tracking page views and custom events
 * with Umami Analytics
 */

// Umami type definitions for different API versions
type UmamiV1 = {
  trackView: (url: string) => void;
  trackEvent: (eventName: string, eventData?: Record<string, unknown>) => void;
};

type UmamiV2 = {
  track: (type: string, data?: Record<string, unknown>) => void;
};

type UmamiFunction = (event: string, data?: Record<string, unknown>) => void;

/**
 * Event data type for analytics tracking
 */
export type AnalyticsEventData = Record<string, unknown>;

/**
 * Hook for tracking analytics events
 * @returns Object containing functions for tracking events and page views
 */
export function useAnalytics() {
  /**
   * Track a custom event
   * @param eventName - The name of the event to track
   * @param eventData - Optional data to associate with the event
   */
  const trackEvent = (eventName: string, eventData?: AnalyticsEventData) => {
    if (typeof window === 'undefined' || !window.umami) return;

    try {
      // Check if umami is a function (direct call style)
      if (typeof window.umami === 'function') {
        (window.umami as UmamiFunction)(eventName, eventData);
      }
      // Modern v2 API
      else if (typeof (window.umami as UmamiV2).track === 'function') {
        (window.umami as UmamiV2).track(eventName, eventData);
      }
      // Older v1 API
      else if (typeof (window.umami as UmamiV1).trackEvent === 'function') {
        (window.umami as UmamiV1).trackEvent(eventName, eventData);
      }
    } catch (error) {
      console.error('[useAnalytics/trackEvent]:', error);
    }
  };

  /**
   * Track a page view
   * @param url - The URL to track
   */
  const trackPageView = (url: string) => {
    if (typeof window === 'undefined' || !window.umami) return;

    try {
      // Check if umami is a function (direct call style)
      if (typeof window.umami === 'function') {
        (window.umami as UmamiFunction)('pageview');
      }
      // Modern v2 API
      else if (typeof (window.umami as UmamiV2).track === 'function') {
        (window.umami as UmamiV2).track('pageview', { url });
      }
      // Older v1 API
      else if (typeof (window.umami as UmamiV1).trackView === 'function') {
        (window.umami as UmamiV1).trackView(url);
      }
    } catch (error) {
      console.error('[useAnalytics/trackPageView]:', error);
    }
  };

  /**
   * Track a user sign-up event
   * @param userId - The user ID
   * @param additionalData - Optional additional data
   */
  const trackSignUp = (userId: string, additionalData?: AnalyticsEventData) => {
    trackEvent('sign_up', {
      userId,
      ...additionalData,
    });
  };

  /**
   * Track a user login event
   * @param userId - The user ID
   * @param additionalData - Optional additional data
   */
  const trackLogin = (userId: string, additionalData?: AnalyticsEventData) => {
    trackEvent('login', {
      userId,
      ...additionalData,
    });
  };

  /**
   * Track a feature usage event
   * @param featureName - The name of the feature
   * @param additionalData - Optional additional data
   */
  const trackFeatureUsage = (featureName: string, additionalData?: AnalyticsEventData) => {
    trackEvent(`feature_${featureName}`, {
      feature: featureName,
      ...additionalData,
    });
  };

  return {
    trackEvent,
    trackPageView,
    trackSignUp,
    trackLogin,
    trackFeatureUsage,
  };
}
