"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { BottomNav } from "./bottom-nav";

/**
 * Conditionally renders the BottomNav based on authentication status and pathname.
 */
export function ConditionalBottomNav() {
  const pathname = usePathname(); // Current URL path
  const { state } = useAuth(); // Authentication state from context

  // Hide navigation if user is unauthenticated or on specific pages
  if (state.status !== "authenticated" || ["/", "/auth"].includes(pathname)) {
    return null;
  }

  return <BottomNav />;
}