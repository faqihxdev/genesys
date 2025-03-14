/**
 * @description Custom hook for tracking user events and interactions
 * Provides a simple interface for tracking page views and custom events
 * with Umami Analytics
 */

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
    if (typeof window !== 'undefined' && window.umami) {
      try {
        window.umami.trackEvent(eventName, eventData);
      } catch (error) {
        console.error('[useAnalytics/trackEvent]:', error);
      }
    }
  };

  /**
   * Track a page view
   * @param url - The URL to track
   */
  const trackPageView = (url: string) => {
    if (typeof window !== 'undefined' && window.umami) {
      try {
        window.umami.trackView(url);
      } catch (error) {
        console.error('[useAnalytics/trackPageView]:', error);
      }
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
