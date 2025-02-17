import type { ActionResponse } from '@/server/_utils';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Wrap a server action that requires an input.
 *
 * @param action - A server action function that accepts input and returns ActionResponse.
 * @returns A function that takes the same input and returns a promise resolving to TOutput.
 */
export function withQuery<TInput, TOutput>(
  action: (input: TInput) => Promise<ActionResponse<TOutput>>
): (input: TInput) => Promise<TOutput>;

/**
 * Wrap a server action that does not require an input.
 *
 * @param action - A server action function that returns ActionResponse.
 * @returns A function that returns a promise resolving to TOutput.
 */
export function withQuery<TOutput>(
  action: () => Promise<ActionResponse<TOutput>>
): () => Promise<TOutput>;

/**
 * Implementation: Calls the action, checks for an error, and returns the data.
 *
 * @param action - The server action function.
 * @returns A wrapped function that can be used with TanStack Query.
 */
export function withQuery<TInput, TOutput>(
  action:
    | ((input: TInput) => Promise<ActionResponse<TOutput>>)
    | (() => Promise<ActionResponse<TOutput>>)
): ((input: TInput) => Promise<TOutput>) | (() => Promise<TOutput>) {
  return async (input?: TInput) => {
    const response = await (action as (input?: TInput) => Promise<ActionResponse<TOutput>>)(input);
    if (response.error) {
      throw new Error(response.error.message);
    }
    // Assert that data is not null.
    return response.data!;
  };
}

interface BreadcrumbItem {
  label: string;
  href: string;
}

/**
 * Generates breadcrumb items based on the current pathname segments
 * @param {string[]} pathSegments - The pathname segments
 * @returns {Array<BreadcrumbItem>} Array of breadcrumb items
 */
export function generateBreadcrumbs(pathSegments: string[] = []): BreadcrumbItem[] {
  const breadcrumbs: BreadcrumbItem[] = [];

  // Filter out route groups (segments in parentheses)
  const filteredSegments = pathSegments.filter(
    (segment) => !segment.startsWith('(') && !segment.endsWith(')')
  );

  // Handle root level
  if (filteredSegments.length === 0) {
    return [{ label: 'All Projects', href: '/project/all' }];
  }

  // Handle project routes
  if (filteredSegments[0] === 'project') {
    if (filteredSegments[1] === 'all') {
      breadcrumbs.push({ label: 'All Projects', href: '/project/all' });

      // Add settings if present
      if (filteredSegments[2] === 'settings') {
        breadcrumbs.push({ label: 'System Settings', href: '/project/all/settings' });
      }
    } else if (filteredSegments[1]) {
      breadcrumbs.push({ label: 'All Projects', href: '/project/all' });

      // Add project name and subsequent pages
      let currentPath = '/project';
      for (let i = 1; i < filteredSegments.length; i++) {
        const segment = filteredSegments[i];
        currentPath += `/${segment}`;

        const label = segment
          .split('-')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');

        breadcrumbs.push({ label, href: currentPath });
      }
    }
  }

  // Handle account routes
  if (filteredSegments[0] === 'account') {
    breadcrumbs.push({ label: 'Account', href: '/account' });

    if (filteredSegments[1]) {
      // Map specific account pages to better labels
      const pageLabels: Record<string, string> = {
        notifications: 'Notifications',
        billing: 'Billing',
        support: 'Support',
        feedback: 'Feedback',
      };

      const label =
        pageLabels[filteredSegments[1]] ||
        filteredSegments[1]
          .split('-')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');

      breadcrumbs.push({
        label,
        href: `/account/${filteredSegments[1]}`,
      });
    }
  }

  return breadcrumbs;
}
