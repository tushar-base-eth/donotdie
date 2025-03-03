/**
 * Protected Route Component
 * 
 * A higher-order component that handles route protection based on authentication status.
 * It ensures that:
 * 1. Unauthenticated users are redirected to the login page
 * 2. Shows loading state while checking authentication
 * 3. Only renders protected content for authenticated users
 * 4. Optionally checks for complete profile
 * 
 * @component
 * @example
 * ```tsx
 * <ProtectedRoute>
 *   <MyProtectedComponent />
 * </ProtectedRoute>
 * ```
 */

"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';

export interface ProtectedRouteProps {
  children: React.ReactNode;
  requireCompleteProfile?: boolean;
}

export function ProtectedRoute({ 
  children, 
  requireCompleteProfile = false 
}: ProtectedRouteProps) {
  const { state } = useAuth();
  const router = useRouter();

  // Redirect to auth page if user is not authenticated
  useEffect(() => {
    if (state.status === 'unauthenticated') {
      router.replace('/auth');
      return;
    }

    // If profile completeness check is required
    // if (requireCompleteProfile && 
    //     state.status === 'authenticated' && 
    //     state.user && 
    //     !state.user.isProfileComplete) {
    //   router.replace('/profile/complete');
    // }
  }, [state.status, state.user, router, requireCompleteProfile]);

  // Show loading spinner while checking auth state
  if (state.status === 'loading') {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // Check for complete profile if required
  // if (requireCompleteProfile && 
  //     state.status === 'authenticated' && 
  //     state.user && 
  //     !state.user.isProfileComplete) {
  //   return null;
  // }

  // Render children only if authenticated
  return state.status === 'authenticated' ? <>{children}</> : null;
}