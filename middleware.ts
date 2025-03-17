import { NextRequest, NextResponse } from 'next/server';
import { createClientForMiddleware } from './lib/supabase/middleware';

const protectedRoutes = ['/home', '/history', '/dashboard', '/settings'];

export async function middleware(request: NextRequest) {
  // Create Supabase client and response
  const { supabase, response } = createClientForMiddleware(request);

  // Get the user, which may refresh the session
  const { data: { user }, error } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Redirect authenticated users from root to /home
  if (pathname === '/' && user && !error) {
    return NextResponse.redirect(new URL('/home', request.url));
  }

  // Check if the route is protected
  const isProtectedRoute = protectedRoutes.some(route =>
    pathname === route || pathname.startsWith(`${route}/`)
  );

  // Redirect unauthenticated users from protected routes to login
  if (isProtectedRoute && (!user || error)) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  // Return the response with potential cookie updates
  return response;
}

export const config = {
  matcher: ['/', '/home/:path*', '/history/:path*', '/dashboard/:path*', '/settings/:path*'],
  // matcher: ['/home/:path*', '/history/:path*', '/dashboard/:path*', '/settings/:path*'],
};