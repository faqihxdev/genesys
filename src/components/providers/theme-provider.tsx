'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import * as React from 'react';

/**
 * @description Theme provider component that wraps Next Themes Provider
 * Sets dark as the default theme for better user experience
 */
export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider defaultTheme='dark' {...props}>
      {children}
    </NextThemesProvider>
  );
}
