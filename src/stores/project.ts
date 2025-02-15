import { atomWithStorage } from 'jotai/utils';

/**
 * Atom for storing the current project ID
 * Persists in localStorage and handles invalid states
 */
export const currentProjectIdAtom = atomWithStorage<string | null>('currentProjectId', null);

/**
 * Atom for storing the last valid project ID
 * Used as a fallback when current project is invalid/removed
 */
export const lastValidProjectIdAtom = atomWithStorage<string | null>('lastValidProjectId', null);
