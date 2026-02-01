'use client';

import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';

/**
 * Generic data fetching hook with caching and error handling.
 * Uses Repository Pattern for data access abstraction.
 */
export function useDataFetch<T>(
  fetchFn: () => Promise<T>,
  options?: {
    onSuccess?: (data: T) => void;
    onError?: (error: Error) => void;
    immediate?: boolean;
  }
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(options?.immediate ?? true);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchFn();
      setData(result);
      options?.onSuccess?.(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('获取数据失败');
      setError(error);
      options?.onError?.(error);
      toast.error(error.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchFn, options]);

  useEffect(() => {
    if (options?.immediate ?? true) {
      execute();
    }
  }, [execute, options?.immediate]);

  return {
    data,
    setData,
    loading,
    error,
    refetch: execute,
  };
}

/**
 * Hook for paginated data fetching.
 */
export function usePaginatedFetch<T>(
  fetchFn: (page: number, size: number) => Promise<{ data: T[]; total: number }>,
  options?: {
    pageSize?: number;
    onSuccess?: (data: T[]) => void;
    onError?: (error: Error) => void;
  }
) {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(options?.pageSize ?? 10);
  const [data, setData] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchPage = useCallback(
    async (newPage: number) => {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchFn(newPage, pageSize);
        setData(result.data);
        setTotal(result.total);
        setPage(newPage);
        options?.onSuccess?.(result.data);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('加载失败');
        setError(error);
        options?.onError?.(error);
      } finally {
        setLoading(false);
      }
    },
    [fetchFn, pageSize, options]
  );

  const nextPage = useCallback(() => {
    if (page * pageSize < total) {
      fetchPage(page + 1);
    }
  }, [page, pageSize, total, fetchPage]);

  const prevPage = useCallback(() => {
    if (page > 1) {
      fetchPage(page - 1);
    }
  }, [page, fetchPage]);

  const goToPage = useCallback(
    (newPage: number) => {
      if (newPage >= 1 && newPage <= Math.ceil(total / pageSize)) {
        fetchPage(newPage);
      }
    },
    [total, pageSize, fetchPage]
  );

  return {
    data,
    setData,
    total,
    page,
    pageSize,
    loading,
    error,
    fetchPage,
    nextPage,
    prevPage,
    goToPage,
    hasNextPage: page * pageSize < total,
    hasPrevPage: page > 1,
  };
}

/**
 * Hook for dependent data fetching (e.g., dropdown options based on another selection).
 */
export function useDependentFetch<T, P>(
  fetchFn: (param: P) => Promise<T[]>,
  options?: {
    onSuccess?: (data: T[]) => void;
    onError?: (error: Error) => void;
  }
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchByParam = useCallback(
    async (param: P) => {
      if (param == null) {
        setData([]);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const result = await fetchFn(param);
        setData(result);
        options?.onSuccess?.(result);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('加载失败');
        setError(error);
        options?.onError?.(error);
      } finally {
        setLoading(false);
      }
    },
    [fetchFn, options]
  );

  return {
    data,
    setData,
    loading,
    error,
    fetchByParam,
  };
}
