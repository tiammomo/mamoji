'use client';

import { ReactNode } from 'react';
import { TooltipProvider } from '@/components/ui';
import {
  ToastProvider,
  ToastViewport,
} from '@/components/ui/toast';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <TooltipProvider>
      <ToastProvider>
        {children}
        <ToastViewport />
      </ToastProvider>
    </TooltipProvider>
  );
}
