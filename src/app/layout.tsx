import { Toaster } from '@/components/ui/toaster';
import { queryClient } from '@/utils/query-client';
import { QueryClientProvider } from '@tanstack/react-query';
import type { Metadata } from 'next';
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
              {children}
              <Toaster />
            </QueryClientProvider>
          </JotaiProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
