'use client';

import { Spinner } from '@/components/custom/spinner';
import {
  Button as ShadcnButton,
  type ButtonProps as ShadcnButtonProps,
} from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { forwardRef } from 'react';

export interface ButtonProps extends Omit<ShadcnButtonProps, 'asChild'> {
  /**
   * Whether the button is in a loading state
   * @default false
   */
  isLoading?: boolean;

  /**
   * The text to display when the button is loading
   * If not provided, the button's children will be displayed alongside the spinner
   */
  loadingText?: string;
}

/**
 * Custom button component that extends shadcn's button with loading state functionality
 */
const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, children, disabled, isLoading, loadingText, ...props }, ref) => {
    return (
      <ShadcnButton
        className={cn('flex items-center justify-center', className)}
        disabled={disabled || isLoading}
        ref={ref}
        {...props}
      >
        {isLoading ? (
          <>
            <Spinner size='sm' />
            <span>{loadingText || children}</span>
          </>
        ) : (
          children
        )}
      </ShadcnButton>
    );
  }
);
Button.displayName = 'Button';

export { Button };
