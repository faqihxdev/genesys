import { updateSession } from '@/lib/supabase/middleware';
import { type NextRequest } from 'next/server';

const publicRoutes = ['/', '/auth', '/terms', '/privacy'];

/**
 * @description Handles session refresh, authentication, and project membership validation.
 * @param request - Incoming Next.js request
 * @returns A response that preserves any refreshed authentication cookies
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublicRoute =
    publicRoutes.includes(pathname) ||
    pathname.startsWith('/auth/') ||
    pathname.startsWith('/api/public/');

  if (pathname.startsWith('/project/')) {
    const projectIdMatch = pathname.match(/^\/project\/([^/]+)/);
    const routeProjectId = projectIdMatch?.[1];

    if (routeProjectId !== 'all' && !routeProjectId?.match(/^prj-[a-z0-9]+-[a-z0-9]+$/)) {
      return updateSession(request, {
        projectId: routeProjectId ?? 'invalid',
        invalidProjectId: true,
      });
    }
  }

  return updateSession(request, {
    allowAnonymous: isPublicRoute,
  });
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - static assets (images)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
