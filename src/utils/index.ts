import type { ActionResponse } from '@/types/utils';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type ServerAction<TParams, TData> = (params: TParams) => Promise<ActionResponse<TData>>;
type ServerActionNoParams<TData> = () => Promise<ActionResponse<TData>>;

/**
 * @description Wraps a server action to be used with Tanstack Query
 * @param fn - The server action function
 * @returns A wrapped function that throws on error for Tanstack Query
 */
export function withQuery<TParams, TData>(
  fn: ServerAction<TParams, TData>
): (params: TParams) => Promise<TData>;
export function withQuery<TData>(fn: ServerActionNoParams<TData>): () => Promise<TData>;
export function withQuery<TParams, TData>(
  fn: ServerAction<TParams, TData> | ServerActionNoParams<TData>
) {
  return async (params?: TParams) => {
    // @ts-expect-error - We know this is safe because of the function overloads
    const result = await fn(params);

    if (result.error) {
      throw new Error(result.error.message);
    }

    if (result.data === null) {
      throw new Error('No data returned from server action');
    }

    return result.data;
  };
}

interface BreadcrumbItem {
  label: string;
  href: string;
}

/**
 * Generates breadcrumb items based on the current pathname segments
 * @param {string[]} slugs - The pathname segments
 * @returns {Array<BreadcrumbItem>} Array of breadcrumb items
 */
export function generateBreadcrumbs(slugs: string[] = []): BreadcrumbItem[] {
  return slugs.map((slug, index) => {
    const href = `/${slugs.slice(0, index + 1).join('/')}`;
    const label = slug.charAt(0).toUpperCase() + slug.slice(1);
    return { label, href };
  });
}
