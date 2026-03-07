'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';

type ErrorTrackerOptions = {
  apiKey?: string;
  enabled?: boolean;
  ignoreErrors?: string[];
};

type ErrorContext = Record<string, unknown>;

const isClient = typeof window !== 'undefined';

export const ErrorTracker = {
  options: {
    enabled: false,
    ignoreErrors: [
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed with undelivered notifications',
      'Network Error',
      'Failed to fetch',
    ],
  } as ErrorTrackerOptions,

  init(options: ErrorTrackerOptions = {}) {
    this.options = { ...this.options, ...options };

    if (!isClient || !this.options.enabled) {
      return;
    }

    window.onerror = (message, source, lineno, colno, error) => {
      this.handleError(error || new Error(String(message)), { source, lineno, colno });
    };

    window.addEventListener('unhandledrejection', (event) => {
      this.handleError(event.reason as Error);
    });

    console.log('[ErrorTracker] initialized');
  },

  handleError(error: Error, context?: ErrorContext) {
    if (!this.options.enabled) {
      return;
    }

    const ignored = this.options.ignoreErrors?.some((message) => error.message?.includes(message));
    if (ignored) {
      return;
    }

    this.report(error, context);
  },

  report(error: Error, context?: ErrorContext) {
    const payload = {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      url: isClient ? window.location.href : '',
      ...context,
    };

    if (process.env.NODE_ENV === 'development') {
      console.error('[ErrorTracker]', payload);
      return;
    }

    if (isClient) {
      fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).catch(() => {
        // silent fail
      });
    }
  },

  trackError(error: Error, context?: ErrorContext) {
    this.handleError(error, context);
  },

  setUser(userId: string, email?: string) {
    if (!this.options.enabled || !isClient) {
      return;
    }

    console.log('[ErrorTracker] set user', userId, email);
  },
};

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] caught error', error, errorInfo);
    ErrorTracker.trackError(error, { componentStack: errorInfo.componentStack });
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex min-h-screen items-center justify-center">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900">页面出错了</h1>
              <p className="mt-2 text-gray-600">请刷新页面后重试</p>
              <button onClick={() => window.location.reload()} className="mt-4 rounded bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700">
                刷新页面
              </button>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

export default ErrorTracker;
