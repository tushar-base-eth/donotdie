import { NextRequest, NextResponse } from "next/server";
import { createClientForMiddleware } from "./lib/supabase/middleware";

const rateLimitMap = new Map<string, { count: number; lastReset: number }>();
const LIMIT = 10; // Max requests
const WINDOW = 60 * 1000; // 60 seconds in milliseconds

const protectedRoutes = ["/home", "/history", "/dashboard", "/settings"];

export async function middleware(request: NextRequest) {
  // Get the client's IP from the 'x-forwarded-for' header
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  const now = Date.now();
  const userLimit = rateLimitMap.get(ip) || { count: 0, lastReset: now };
  const pathname = request.nextUrl.pathname;

  // Apply rate limiting only to API routes
  if (pathname.startsWith("/api")) {
    // Reset count if the window has passed
    if (now - userLimit.lastReset > WINDOW) {
      rateLimitMap.set(ip, { count: 1, lastReset: now });
    } else {
      userLimit.count += 1;
      rateLimitMap.set(ip, userLimit);
    }

    // Block if limit exceeded
    if (userLimit.count > LIMIT) {
      return new NextResponse("Too Many Requests", { status: 429 });
    }
  }

  // Create Supabase client and response
  const { supabase, response } = createClientForMiddleware(request);

  // Get the user, which may refresh the session
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  // Log authentication errors for debugging
  if (error) {
    console.error("Auth error:", error);
  }

  // Redirect authenticated users from root to /home
  if (pathname === "/" && user && !error) {
    return NextResponse.redirect(new URL("/home", request.url));
  }

  // Check if the route is protected
  const isProtectedRoute = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );

  // Redirect unauthenticated users from protected routes to login
  if (isProtectedRoute && (!user || error)) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  // Return the response with potential cookie updates
  return response;
}

export const config = {
  matcher: [
    "/api/:path*",
    "/",
    "/home/:path*",
    "/history/:path*",
    "/dashboard/:path*",
    "/settings/:path*",
  ],
};
