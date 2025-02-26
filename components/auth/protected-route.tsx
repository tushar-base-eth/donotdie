import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';

export function withAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: { requireComplete?: boolean } = {}
) {
  return function ProtectedRoute(props: P) {
    const { state } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (state.status === 'unauthenticated') {
        router.replace('/auth');
      } else if (
        state.status === 'authenticated' &&
        options.requireComplete &&
        state.user &&
        !state.user.isProfileComplete
      ) {
        router.replace('/settings');
      }
    }, [state.status, state.user, router]);

    if (state.status === 'loading') {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      );
    }

    if (state.status === 'unauthenticated') {
      return null;
    }

    return <WrappedComponent {...props} />;
  };
} 