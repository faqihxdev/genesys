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
export function withQuery(action: any): any {
  return async (input?: any) => {
    const response = await action(input);
    if (response.error) {
      // Optionally, you might want to throw a custom error type.
      throw new Error(response.error.message);
    }
    return response.data;
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

interface GenerateIdOptions {
  /**
   * Number of random characters in the ID (excluding prefix)
   * @default 10
   */
  length?: number;
  /**
   * Optional prefix for the ID (e.g., 'user_', 'proj_')
   * Will be separated from the random string with an underscore
   */
  prefix?: string;
}

/**
 * Generates a unique ID with configurable length and optional prefix
 * @param options Configuration options for ID generation
 * @returns A string in the format '[prefix]XXXXXXXXXX'
 * @example
 * generateId({ length: 10, prefix: 'proj_' }) // => 'proj_aB2cD4eF5g'
 * generateId({ length: 8 }) // => 'xK4mP9nQ'
 */
export function generateId(options: GenerateIdOptions = {}): string {
  const { length = 10, prefix } = options;

  // Validate inputs
  if (length < 1) throw new Error('ID length must be at least 1 character');
  if (length > 32) throw new Error('ID length must not exceed 32 characters');
  if (prefix && !/^[a-zA-Z][a-zA-Z0-9]*$/.test(prefix)) {
    throw new Error('Prefix must start with a letter and contain only letters and numbers');
  }

  // Characters set excluding easily confused characters
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  let uniqueString = '';

  // Generate random string
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    uniqueString += characters[randomIndex];
  }

  // Add prefix if provided
  return prefix ? `${prefix}${uniqueString}` : uniqueString;
}
