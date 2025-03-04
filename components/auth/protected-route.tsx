"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";

/**
 * Props for the ProtectedRoute component.
 */
interface ProtectedRouteProps {
  children: React.ReactNode; // The content to be protected
}

/**
 * A higher-order component that protects routes by checking authentication status.
 * Redirects unauthenticated users to the login page and shows a loading state during checks.
 */
export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { state } = useAuth(); // Access authentication state from context
  const router = useRouter(); // Next.js router for navigation

  // Effect to handle redirects based on authentication status
  useEffect(() => {
    if (state.status === "unauthenticated") {
      router.push("/auth"); // Redirect to login page if unauthenticated
    }
  }, [state.status, router]); // Dependencies: re-run if status or router changes

  // Show loading UI while authentication status is being determined
  if (state.status === "loading") {
    return (
      <div className="flex justify-center items-center min-h-screen">
        Loading...
      </div>
    );
  }

  // If unauthenticated, return null (redirect happens in useEffect)
  if (state.status === "unauthenticated") {
    return null;
  }

  // Render protected content if authenticated
  return <>{children}</>;
}