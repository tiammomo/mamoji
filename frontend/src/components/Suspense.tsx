"use client";

import { ReactNode, Suspense as ReactSuspense } from "react";
import { LoadingSpinner } from "./LoadingSpinner";

interface SuspenseProps {
  children: ReactNode;
  fallback?: ReactNode;
  fullPage?: boolean;
}

/**
 * 统一的 Suspense 包装组件
 * 用于处理异步数据的加载状态
 */
export function Suspense({ children, fallback, fullPage }: SuspenseProps) {
  const defaultFallback = fullPage ? (
    <div className="flex items-center justify-center min-h-[50vh]">
      <LoadingSpinner size="large" />
    </div>
  ) : (
    <div className="flex items-center justify-center py-8">
      <LoadingSpinner />
    </div>
  );

  return (
    <ReactSuspense fallback={fallback || defaultFallback}>
      {children}
    </ReactSuspense>
  );
}
