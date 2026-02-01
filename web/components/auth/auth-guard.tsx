'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore, useAuthLoading, useIsAuthReady } from '@/hooks/useAuth';

// Public routes that don't require authentication
const publicRoutes = ['/login', '/register', '/forgot-password'];

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, checkAuth } = useAuthStore();
  const isLoading = useAuthLoading();
  const isReady = useIsAuthReady();
  const [hasChecked, setHasChecked] = useState(false);

  // First, wait for persist to be ready
  useEffect(() => {
    if (!isReady) {
      console.log('[AuthGuard] Waiting for persist to be ready...');
      return;
    }
    console.log('[AuthGuard] Persist ready, isAuthenticated:', isAuthenticated);

    // If on public route, just mark as checked
    if (publicRoutes.some((route) => pathname.startsWith(route))) {
      setHasChecked(true);
      return;
    }

    // If already authenticated from persist, no need to check
    if (isAuthenticated) {
      setHasChecked(true);
      return;
    }

    // Otherwise, verify token with backend
    const verifyAuth = async () => {
      await checkAuth();
      setHasChecked(true);
    };

    verifyAuth();
  }, [isReady, isAuthenticated, pathname, checkAuth]);

  // Show loading state while checking
  if (!hasChecked || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // On public routes, render children even if not authenticated
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return <>{children}</>;
  }

  // On protected routes, require authentication
  if (!isAuthenticated) {
    router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
    return null;
  }

  return <>{children}</>;
}

// Higher-order component for protecting routes
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options?: { redirectTo?: string }
) {
  return function ProtectedComponent(props: P) {
    return (
      <AuthGuard>
        <Component {...props} />
      </AuthGuard>
    );
  };
}

// Hook for requiring authentication
export function useRequireAuth() {
  const { isAuthenticated, checkAuth } = useAuthStore();
  const isReady = useIsAuthReady();
  const router = useRouter();
  const pathname = usePathname();
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    if (!isReady) return;

    if (!isAuthenticated && !isVerifying) {
      setIsVerifying(true);
      checkAuth().then(() => {
        setIsVerifying(false);
      });
    }
  }, [isReady, isAuthenticated, isVerifying, checkAuth]);

  const requireAuth = (callback?: () => void) => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      return false;
    }
    callback?.();
    return true;
  };

  return { requireAuth, isVerifying };
}
