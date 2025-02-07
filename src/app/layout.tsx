import { Toaster } from '@/components/ui/toaster';
import type { Metadata } from 'next';
import { ThemeProvider } from '../components/theme-provider';
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
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
