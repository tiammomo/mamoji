'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { useIsAuthReady, useIsAuthenticated } from '@/hooks/useAuth';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isReady = useIsAuthReady();
  const isAuthenticated = useIsAuthenticated();

  // 登录页不需要检查认证
  if (pathname === '/login') {
    return <>{children}</>;
  }

  // 等待 auth 恢复
  if (!isReady) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // 未认证会由 AuthGuard 重定向
  if (!isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <>{children}</>;
}
