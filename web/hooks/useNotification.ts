'use client';

import { useCallback } from 'react';
import { toast } from 'sonner';

// ==================== Notification Types ====================

export type NotificationType = 'default' | 'success' | 'error' | 'warning' | 'info';

export interface NotificationOptions {
  title: string;
  description?: string;
  type?: NotificationType;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// ==================== useNotification Hook ====================

export function useNotification() {
  const notify = useCallback((options: NotificationOptions) => {
    const { title, description, type = 'default', duration, action } = options;

    const toastOptions = {
      duration,
      action: action
        ? {
            label: action.label,
            onClick: action.onClick,
          }
        : undefined,
    };

    switch (type) {
      case 'success':
        toast.success(title, { ...toastOptions, description });
        break;
      case 'error':
        toast.error(title, { ...toastOptions, description });
        break;
      case 'warning':
        toast.warning(title, { ...toastOptions, description });
        break;
      case 'info':
        toast.info(title, { ...toastOptions, description });
        break;
      default:
        toast(title, { ...toastOptions, description });
    }
  }, []);

  const success = useCallback(
    (title: string, description?: string) => {
      toast.success(title, { description });
    },
    []
  );

  const error = useCallback(
    (title: string, description?: string) => {
      toast.error(title, { description });
    },
    []
  );

  const warning = useCallback(
    (title: string, description?: string) => {
      toast.warning(title, { description });
    },
    []
  );

  const info = useCallback(
    (title: string, description?: string) => {
      toast.info(title, { description });
    },
    []
  );

  const promise = useCallback(
    <T>(promise: Promise<T>, options: {
      loading: string;
      success: string;
      error: string;
    }) => {
      return toast.promise(promise, {
        loading: options.loading,
        success: options.success,
        error: options.error,
      });
    },
    []
  );

  const dismiss = useCallback((toastId?: string) => {
    if (toastId) {
      toast.dismiss(toastId);
    } else {
      toast.dismiss();
    }
  }, []);

  return {
    notify,
    success,
    error,
    warning,
    info,
    promise,
    dismiss,
  };
}

// ==================== Convenience Hooks ====================

export function useSuccessNotification() {
  const { success } = useNotification();
  return success;
}

export function useErrorNotification() {
  const { error } = useNotification();
  return error;
}

export function usePromiseNotification() {
  const { promise } = useNotification();
  return promise;
}
