import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { TOKEN_KEY } from './constants';

// API响应基础结构
export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
  traceId?: string;
}

// JWT Token 解码
interface JWTPayload {
  exp: number;
  iat: number;
  userId: number;
  enterpriseId: number;
  username: string;
  role: string;
}

// 解码JWT Token的通用函数
const decodeJWT = (token: string): JWTPayload | null => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
};

// 检查Token是否过期
export const isTokenExpired = (token: string): boolean => {
  const payload = decodeJWT(token);
  if (!payload) return true;
  const now = Math.floor(Date.now() / 1000);
  return payload.exp < now;
};

// 获取Token剩余有效时间（秒）
export const getTokenRemainingTime = (token: string): number => {
  const payload = decodeJWT(token);
  if (!payload) return 0;
  const now = Math.floor(Date.now() / 1000);
  return Math.max(0, payload.exp - now);
};

// 创建Axios实例
const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8888',
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // 请求拦截器
  client.interceptors.request.use(
    (config) => {
      const token = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
      if (token) {
        // 检查Token是否过期
        if (isTokenExpired(token)) {
          // Token已过期，触发清理
          if (typeof window !== 'undefined') {
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem('mamoji_user_info');
            // 跳转到登录页
            if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
              window.location.href = '/login?expired=1';
            }
          }
          return Promise.reject(new ApiError(401, '登录已过期，请重新登录'));
        }
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // 响应拦截器 - 只处理状态码
  client.interceptors.response.use(
    (response: AxiosResponse) => {
      return response;
    },
    (error: AxiosError<ApiResponse>) => {
      if (error.response) {
        const status = error.response.status;
        const { code, message } = error.response.data || {};

        // 401未授权 - 清除Token并跳转登录
        if (status === 401 || code === 401) {
          if (typeof window !== 'undefined') {
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem('mamoji_user_info');
            if (!window.location.pathname.includes('/login')) {
              window.location.href = '/login?reason=unauthorized';
            }
          }
        }

        return Promise.reject(new ApiError(code || status, message || '请求失败', error.response));
      }
      if (error.request) {
        return Promise.reject(new ApiError(500, '网络连接异常，请检查网络', error.request));
      }
      return Promise.reject(new ApiError(500, '请求配置错误', error.config));
    }
  );

  return client;
};

// API错误类
export class ApiError extends Error {
  code: number;
  traceId?: string;

  constructor(code: number, message: string, response?: AxiosResponse | AxiosRequestConfig) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    if (response && 'headers' in response) {
      const headers = (response as AxiosResponse).headers;
      this.traceId = headers?.['trace-id'] as string;
    }
  }
}

// API客户端单例
export const api = createApiClient();

// 通用请求方法
export async function request<T>(
  config: AxiosRequestConfig
): Promise<T> {
  const response = await api.request<ApiResponse<T>>(config);
  const apiResponse = response.data as ApiResponse<T>;
  if (apiResponse.code === 0) {
    return apiResponse.data as T;
  }
  throw new ApiError(apiResponse.code, apiResponse.message, response);
}

// GET请求
export function get<T>(
  url: string,
  params?: Record<string, unknown>,
  config?: AxiosRequestConfig
): Promise<T> {
  return request<T>({
    method: 'GET',
    url,
    params,
    ...config,
  });
}

// POST请求
export function post<T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig
): Promise<T> {
  return request<T>({
    method: 'POST',
    url,
    data,
    ...config,
  });
}

// PUT请求
export function put<T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig
): Promise<T> {
  return request<T>({
    method: 'PUT',
    url,
    data,
    ...config,
  });
}

// PATCH请求
export function patch<T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig
): Promise<T> {
  return request<T>({
    method: 'PATCH',
    url,
    data,
    ...config,
  });
}

// DELETE请求
export function del<T>(
  url: string,
  params?: Record<string, unknown>,
  config?: AxiosRequestConfig
): Promise<T> {
  return request<T>({
    method: 'DELETE',
    url,
    params,
    ...config,
  });
}

// 文件上传
export async function upload<T>(
  url: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<T> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post<ApiResponse<T>>(url, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(progress);
      }
    },
  });

  const apiResponse = response.data as ApiResponse<T>;
  if (apiResponse.code === 0) {
    return apiResponse.data as T;
  }
  throw new ApiError(apiResponse.code, apiResponse.message, response);
}
