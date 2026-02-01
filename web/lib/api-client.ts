/**
 * Enhanced API Client with Repository Pattern, Retry Logic, and Interceptors.
 */

import type { ApiResponse } from '@/types';

// ==================== HTTP Methods ====================

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

// ==================== Request Options ====================

interface RequestOptions extends Record<string, unknown> {
  params?: Record<string, unknown>;
  headers?: Record<string, string>;
  timeout?: number;
  retry?: number;
  retryDelay?: number;
}

// ==================== API Error ====================

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code?: number,
    public data?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }

  static isUnauthorized(error: unknown): boolean {
    return error instanceof ApiError && error.statusCode === 401;
  }

  static isForbidden(error: unknown): boolean {
    return error instanceof ApiError && error.statusCode === 403;
  }

  static isNotFound(error: unknown): boolean {
    return error instanceof ApiError && error.statusCode === 404;
  }

  static isServerError(error: unknown): boolean {
    return error instanceof ApiError && error.statusCode >= 500;
  }
}

// ==================== Request Interceptor ====================

type RequestInterceptor = (config: RequestInit) => RequestInit | Promise<RequestInit>;

const requestInterceptors: RequestInterceptor[] = [];

export function addRequestInterceptor(interceptor: RequestInterceptor): () => void {
  requestInterceptors.push(interceptor);
  return () => {
    const index = requestInterceptors.indexOf(interceptor);
    if (index > -1) requestInterceptors.splice(index, 1);
  };
}

// ==================== Response Interceptor ====================

type ResponseInterceptor = (response: Response) => Response | Promise<Response>;

const responseInterceptors: ResponseInterceptor[] = [];

export function addResponseInterceptor(interceptor: ResponseInterceptor): () => void {
  responseInterceptors.push(interceptor);
  return () => {
    const index = responseInterceptors.indexOf(interceptor);
    if (index > -1) responseInterceptors.splice(index, 1);
  };
}

// ==================== Retry Helper ====================

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number,
  baseDelay: number
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      const isRetryable =
        error instanceof ApiError &&
        (error.statusCode >= 500 || error.statusCode === 0);

      if (isRetryable && attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt);
        await sleep(delay + Math.random() * 100);
      } else {
        throw error;
      }
    }
  }

  throw lastError;
}

// ==================== Base API Client ====================

abstract class BaseApiClient {
  protected baseUrl: string;
  protected defaultHeaders: Record<string, string>;

  constructor(baseUrl: string = '/api/v1', defaultHeaders: Record<string, string> = {}) {
    this.baseUrl = baseUrl;
    this.defaultHeaders = defaultHeaders;
  }

  protected async request<T>(
    method: HttpMethod,
    endpoint: string,
    body?: unknown,
    options?: RequestOptions
  ): Promise<T> {
    const url = this.buildUrl(endpoint, options?.params);
    const maxRetries = options?.retry ?? 0;
    const baseDelay = options?.retryDelay ?? 1000;

    const executeRequest = async (): Promise<T> => {
      const headers = { ...this.defaultHeaders, ...options?.headers };

      const controller = new AbortController();
      const timeout = options?.timeout ?? 30000;
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        // Build request init
        let requestInit: RequestInit = {
          method,
          headers: {
            'Content-Type': 'application/json',
            ...headers,
          },
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal,
        };

        // Apply request interceptors
        for (const interceptor of requestInterceptors) {
          requestInit = await interceptor(requestInit);
        }

        const response = await fetch(url, requestInit);

        clearTimeout(timeoutId);

        // Apply response interceptors
        for (const interceptor of responseInterceptors) {
          await interceptor(response);
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new ApiError(
            errorData?.message || `HTTP ${response.status}`,
            response.status,
            errorData?.code,
            errorData
          );
        }

        // Handle empty responses
        const text = await response.text();
        return text ? JSON.parse(text) : (undefined as T);
      } catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof ApiError) {
          throw error;
        }
        if (error instanceof Error && error.name === 'AbortError') {
          throw new ApiError('Request timeout', 408);
        }
        throw new ApiError(error instanceof Error ? error.message : 'Network error', 0);
      }
    };

    return retryWithBackoff(executeRequest, maxRetries, baseDelay);
  }

  protected buildUrl(endpoint: string, params?: Record<string, unknown>): string {
    const url = `${this.baseUrl}${endpoint}`;
    if (!params || Object.keys(params).length === 0) {
      return url;
    }

    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });

    return `${url}?${searchParams.toString()}`;
  }

  protected get<T>(endpoint: string, params?: Record<string, unknown>, options?: RequestOptions): Promise<T> {
    return this.request<T>('GET', endpoint, undefined, { ...options, params });
  }

  protected post<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>('POST', endpoint, data, options);
  }

  protected put<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>('PUT', endpoint, data, options);
  }

  protected patch<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>('PATCH', endpoint, data, options);
  }

  protected delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>('DELETE', endpoint, undefined, options);
  }
}

// ==================== Repository Pattern API Client ====================

export class RepositoryApiClient<T, C, U, ID = number> extends BaseApiClient {
  constructor(baseUrl: string, defaultHeaders: Record<string, string> = {}) {
    super(`${baseUrl}`, defaultHeaders);
  }

  async list(params?: Record<string, unknown>): Promise<T[]> {
    return this.get<T[]>('/', params);
  }

  async getById(id: ID): Promise<T> {
    return this.get<T>(`/${id}`);
  }

  async create(data: C): Promise<ID> {
    return this.post<ID>('/', data);
  }

  async update(id: ID, data: Partial<U>): Promise<void> {
    await this.put(`/${id}`, data);
  }

  async modify(id: ID, data: Partial<U>): Promise<void> {
    await this.patch(`/${id}`, data);
  }

  async remove(id: ID): Promise<void> {
    await this.delete(`/${id}`);
  }
}

// ==================== Typed API Client ====================

export interface QueryOptions {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, unknown>;
}

export interface PaginatedResponse<T> {
  current: number;
  size: number;
  total: number;
  records: T[];
}

export function usePaginatedQuery<T>(
  client: { list: (params?: Record<string, unknown>) => Promise<PaginatedResponse<T>> },
  options: QueryOptions
) {
  const { page = 1, pageSize = 10, sortBy, sortOrder, filters } = options;

  return client.list({
    page,
    pageSize,
    sortBy,
    sortOrder,
    ...filters,
  });
}

// ==================== Auth Token Helper ====================

let authToken: string | null = null;

export function setAuthToken(token: string | null): void {
  authToken = token;
}

export function getAuthToken(): string | null {
  return authToken;
}

// Add automatic auth header interceptor
addRequestInterceptor((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    };
  }
  return config;
});
