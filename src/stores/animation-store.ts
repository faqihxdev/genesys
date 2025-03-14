/**
 * @description Store for managing animation settings with persistence
 */
import { atomWithStorage } from 'jotai/utils';

/**
 * @description Atom that tracks whether background animations are enabled
 * Uses localStorage to persist the user's preference across sessions
 */
export const animationsEnabledAtom = atomWithStorage('genesys-animations-enabled', true);
