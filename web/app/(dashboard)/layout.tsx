'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/hooks/useAuth';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, checkAuth } = useAuthStore();

  useEffect(() => {
    // Skip auth check for login page
    if (pathname === '/login') return;

    if (!isAuthenticated) {
      checkAuth().then(() => {
        if (!useAuthStore.getState().isAuthenticated) {
          router.push('/login');
        }
      });
    }
  }, [isAuthenticated, checkAuth, router, pathname]);

  // Don't render children if not authenticated (will redirect)
  if (pathname === '/login') {
    return <>{children}</>;
  }

  if (!isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <>{children}</>;
}
