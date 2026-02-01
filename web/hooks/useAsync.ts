'use client';

import { useState, useCallback } from 'react';

// ==================== Async State Types ====================

export type AsyncStatus = 'idle' | 'pending' | 'success' | 'error';

export interface AsyncState<T> {
  status: AsyncStatus;
  data: T | null;
  error: Error | null;
}

// ==================== useAsync Hook ====================

export function useAsync<T, Args extends unknown[]>(
  asyncFunction: (...args: Args) => Promise<T>,
  options?: {
    onSuccess?: (data: T) => void;
    onError?: (error: Error) => void;
  }
) {
  const [state, setState] = useState<AsyncState<T>>({
    status: 'idle',
    data: null,
    error: null,
  });

  const execute = useCallback(
    async (...args: Args) => {
      setState({ status: 'pending', data: null, error: null });

      try {
        const data = await asyncFunction(...args);
        setState({ status: 'success', data, error: null });
        options?.onSuccess?.(data);
        return data;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        setState({ status: 'error', data: null, error: err });
        options?.onError?.(err);
        throw err;
      }
    },
    [asyncFunction, options]
  );

  const reset = useCallback(() => {
    setState({ status: 'idle', data: null, error: null });
  }, []);

  return {
    ...state,
    execute,
    reset,
    isIdle: state.status === 'idle',
    isPending: state.status === 'pending',
    isSuccess: state.status === 'success',
    isError: state.status === 'error',
  };
}

// ==================== useAsyncCallback Hook ====================

export function useAsyncCallback<T, Args extends unknown[]>(
  callback: (...args: Args) => Promise<T>
) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(
    async (...args: Args): Promise<T> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await callback(...args);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [callback]
  );

  return {
    execute,
    isLoading,
    error,
    setError,
  };
}

// ==================== useDebouncedAsync Hook ====================

export function useDebouncedAsync<T, Args extends unknown[]>(
  asyncFunction: (...args: Args) => Promise<T>,
  delay: number = 500
) {
  const [debouncedValue, setDebouncedValue] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [triggered, setTriggered] = useState(false);

  const execute = useCallback(
    async (...args: Args) => {
      setIsLoading(true);
      setError(null);
      setTriggered(true);

      try {
        const result = await asyncFunction(...args);
        setDebouncedValue(result);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [asyncFunction, delay]
  );

  const reset = useCallback(() => {
    setDebouncedValue(null);
    setIsLoading(false);
    setError(null);
    setTriggered(false);
  }, []);

  return {
    debouncedValue,
    isLoading,
    error,
    triggered,
    execute,
    reset,
  };
}
