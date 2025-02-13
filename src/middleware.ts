import { updateSession } from '@/lib/supabase/middleware';
import { NextResponse, type NextRequest } from 'next/server';

const publicRoutes = ['/', '/auth', '/terms', '/privacy'];

/**
 * Middleware to handle authentication and project route validation
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Handle public routes
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // Handle project routes
  if (pathname.startsWith('/project/')) {
    const projectIdMatch = pathname.match(/^\/project\/([^/]+)/);
    const projectId = projectIdMatch?.[1];

    // Skip validation for /project/all routes
    if (projectId === 'all') {
      return await updateSession(request);
    }

    // Validate project ID format
    if (!projectId || !/^[a-zA-Z0-9]{10}$/.test(projectId)) {
      // Rewrite to the not-found page while maintaining the URL
      return NextResponse.rewrite(new URL('/project/[id]/not-found', request.url));
    }
  }

  // Handle authentication for all other routes
  return await updateSession(request);
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
