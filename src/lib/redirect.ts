/**
 * @description Returns a same-origin redirect path or a safe fallback.
 * @param value - User-provided redirect destination
 * @param fallback - Local path used when the destination is unsafe
 * @returns A normalized local path
 */
export function getSafeRedirectPath(value: string | null, fallback = '/'): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) {
    return fallback;
  }

  const baseUrl = new URL('https://genesys.local');
  const destination = new URL(value, baseUrl);

  if (destination.origin !== baseUrl.origin) {
    return fallback;
  }

  return `${destination.pathname}${destination.search}${destination.hash}`;
}
