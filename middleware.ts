import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Define protected and authentication routes
const protectedRoutes = ['/dashboard', '/history', '/home', '/settings'];
const authRoutes = ['/auth/login', '/auth/callback', '/auth/signup']; // Add other auth routes if needed

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow authentication routes to proceed without interference
  if (authRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Check if the user is trying to access a protected route
  if (protectedRoutes.includes(pathname)) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const token = req.cookies.get('sb-access-token')?.value;

    // No token: redirect to login with the original path as a parameter
    if (!token) {
      const redirectUrl = new URL('/auth/login', req.url);
      redirectUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(redirectUrl);
    }

    // Validate the token
    const { data: { user }, error } = await supabase.auth.getUser(token);

    // Invalid token or no user: redirect to login
    if (error || !user) {
      const redirectUrl = new URL('/auth/login', req.url);
      redirectUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(redirectUrl);
    }
  }

  // Proceed to the requested page
  return NextResponse.next();
}