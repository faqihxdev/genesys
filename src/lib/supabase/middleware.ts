import env from '@/env';
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

interface UpdateSessionOptions {
  allowAnonymous?: boolean;
  invalidProjectId?: boolean;
  projectId?: string;
}

/**
 * @description Copies refreshed session cookies onto a redirect or rewrite response.
 * @param source - Response containing refreshed Supabase cookies
 * @param target - Response that should receive the cookies
 * @returns Target response with copied cookies
 */
function copyResponseCookies(source: NextResponse, target: NextResponse): NextResponse {
  source.cookies.getAll().forEach(({ name, value, ...options }) => {
    target.cookies.set(name, value, options);
  });

  return target;
}

/**
 * @description Refreshes the session and enforces route authentication.
 * @param request - NextRequest
 * @param options - Authentication and project-access options
 * @returns NextResponse
 */
export async function updateSession(
  request: NextRequest,
  options: UpdateSessionOptions = {}
): Promise<NextResponse> {
  // Create a response object to pass to the supabase client
  let supabaseResponse = NextResponse.next({
    request,
  });

  // Create a supabase client
  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        // Get all cookies from the request

        getAll() {
          return request.cookies.getAll();
        },
        // Set all cookies from the request
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: DO NOT REMOVE auth.getUser()

  // Get the user from the supabase client
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !options.allowAnonymous) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth';
    url.searchParams.set('next', `${request.nextUrl.pathname}${request.nextUrl.search}`);

    return copyResponseCookies(supabaseResponse, NextResponse.redirect(url));
  }

  if (user && options.invalidProjectId && options.projectId) {
    const notFoundUrl = request.nextUrl.clone();
    notFoundUrl.pathname = `/project/${options.projectId}/not-found`;

    return copyResponseCookies(supabaseResponse, NextResponse.rewrite(notFoundUrl));
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse;
}
