import { Toaster } from '@/components/ui/toaster';
import { queryClient } from '@/lib/query-client';
import { QueryClientProvider } from '@tanstack/react-query';
import type { Metadata } from 'next';
import { AnalyticsProvider } from '../components/providers/analytics-provider';
import { JotaiProvider } from '../components/providers/jotai-provider';
import { ThemeProvider } from '../components/providers/theme-provider';
import './globals.css';

export const metadata: Metadata = {
  title: 'Genesys',
  description: 'Genesys',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // suppressHydrationWarning is a workaround to prevent hydration errors while using next-themes
    <html lang='en' suppressHydrationWarning>
      <body className='min-h-svh font-poppins antialiased'>
        <ThemeProvider attribute='class' defaultTheme='system' enableSystem>
          <JotaiProvider>
            <QueryClientProvider client={queryClient}>
              <AnalyticsProvider>
                {children}
                <Toaster />
              </AnalyticsProvider>
            </QueryClientProvider>
          </JotaiProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
