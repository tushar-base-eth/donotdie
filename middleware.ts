/**
 * Authentication Middleware
 *
 * Handles route protection and authentication redirects.
 * Ensures users are authenticated before accessing protected routes
 * and redirects authenticated users away from auth pages.
 *
 * Features:
 * - Route protection
 * - Authentication state checks
 * - Redirect handling
 *
 * UX Considerations:
 * - Seamless authentication flow
 * - Prevents unauthorized access
 * - Maintains proper navigation state
 */

import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const currentUser = request.cookies.get("donotdie_current_user")
  const isAuthPage = request.nextUrl.pathname === "/auth"

  // Redirect to auth page if not authenticated
  if (!currentUser && !isAuthPage) {
    return NextResponse.redirect(new URL("/auth", request.url))
  }

  // Redirect to home if already authenticated
  if (currentUser && isAuthPage) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}

