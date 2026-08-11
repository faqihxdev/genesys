import { describe, expect, it } from 'vitest';
import { getSafeRedirectPath } from './redirect';

describe('getSafeRedirectPath', () => {
  it('keeps local paths with query strings and fragments', () => {
    expect(getSafeRedirectPath('/project/all?tab=active#results')).toBe(
      '/project/all?tab=active#results'
    );
  });

  it.each([
    'https://example.com/phishing',
    '//example.com/phishing',
    '/\\example.com/phishing',
    'javascript:alert(1)',
  ])('rejects unsafe redirect destination %s', (destination) => {
    expect(getSafeRedirectPath(destination, '/project/all')).toBe('/project/all');
  });

  it('uses the fallback when no destination is provided', () => {
    expect(getSafeRedirectPath(null, '/auth')).toBe('/auth');
  });
});
