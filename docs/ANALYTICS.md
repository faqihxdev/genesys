# Genesys Analytics Implementation

This document outlines the analytics implementation for the Genesys project using Umami Analytics.

## Overview

Genesys uses [Umami Analytics](https://umami.is/) to track user metrics and behavior. Umami is a privacy-focused, GDPR-compliant, open-source analytics platform that provides insights without compromising user privacy.

## Key Features

- **Privacy-first**: No cookies are used, and all data is anonymized
- **GDPR-compliant**: Respects user privacy and provides necessary compliance
- **Lightweight**: Minimal impact on page load performance
- **Easy to use**: Simple API for tracking custom events and page views
- **Self-hostable**: Option to self-host for complete data ownership
- **Country/Location tracking**: View user demographics by country
- **Real-time data**: See user activity as it happens
- **Free tier available**: Perfect for startups and small to medium projects

## Setup Information

The Umami Analytics is already fully configured in the application with the following hardcoded settings:

- **Website ID**: `caf3880a-bef1-4e0a-821a-80171eecf8cd`
- **Script URL**: `https://cloud.umami.is/script.js`
- **Domain**: `genesys-theta.vercel.app`

No additional configuration is needed - analytics will automatically track page views and user metrics.

## Usage

### Automatic Page View Tracking

Page views are automatically tracked through the `AnalyticsProvider` wrapper in the root layout. No additional code is needed for basic page tracking.

### Custom Event Tracking

Use the `useAnalytics` hook to track custom events:

```tsx
import { useAnalytics } from '@/hooks/use-analytics';

export function YourComponent() {
  const { trackEvent } = useAnalytics();
  
  const handleAction = () => {
    trackEvent('button_clicked', {
      buttonName: 'signup_button',
      page: 'homepage'
    });
  };

  return <button onClick={handleAction}>Sign Up</button>;
}
```

### Predefined Event Tracking

The `useAnalytics` hook includes several predefined tracking functions:

- `trackSignUp(userId, data?)`: Track user registrations
- `trackLogin(userId, data?)`: Track user logins
- `trackFeatureUsage(featureName, data?)`: Track specific feature usage
- `trackPageView(url)`: Manually track page views (normally automatic)

## Dashboard Access

Access your analytics at: https://cloud.umami.is/

## Metrics Available

- **Realtime visitors**: See who is on your site right now
- **Visitor geography**: Country and region data for visitors
- **Device information**: Browser, OS, and device types
- **Referrers**: Where your traffic is coming from
- **Popular pages**: Which pages get the most views
- **Custom events**: Track specific user actions
- **Conversion funnels**: Analyze user flows (available in Umami Cloud Pro)

## Troubleshooting

If you're not seeing analytics data:

1. Check if you're accessing the site from the correct domain (`genesys-theta.vercel.app`)
2. Verify the website ID is correct in the AnalyticsProvider component
3. Check that the script URL is accessible
4. Check for any script blocking extensions in your browser
5. Verify the Analytics Provider is correctly added to your layout

## Privacy Considerations

Umami is designed to be privacy-focused:
- No cookies used
- No persistent storage on the client
- No personally identifiable information collected
- Compliant with GDPR, CCPA, and PECR

This makes it an excellent choice for projects that need analytics while respecting user privacy.
