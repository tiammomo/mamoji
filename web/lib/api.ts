import axios, { AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { useAuthStore } from '@/hooks/useAuth';
import { useLedgerStore } from '@/store/ledgerStore';

// API Base URL - can be overridden via environment variable
// Ensure trailing /api/v1
const getApiBaseUrl = () => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:48080';
  return baseUrl.replace(/\/$/, '') + '/api/v1';
};
const API_BASE_URL = getApiBaseUrl();

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
  },
  transformRequest: [(data) => JSON.stringify(data)],
  responseType: 'json',
});

// Request interceptor - add auth token and ledger id
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add current ledger ID to header
    const currentLedgerId = useLedgerStore.getState().currentLedgerId;
    if (currentLedgerId) {
      config.headers['X-Ledger-Id'] = currentLedgerId.toString();
    }

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor - return full response (not extracting data)
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError<{ message: string; code: number }>) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Token expired, invalid, or blacklisted - clear auth state
      console.warn('Auth error, clearing token and redirecting to login');
      useAuthStore.setState({
        token: null,
        user: null,
        isAuthenticated: false,
        error: null,
      });
      // Clear localStorage
      localStorage.removeItem('mamoji-auth');
      // Redirect to login if not already there
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    const message = error.response?.data?.message || error.message || 'An error occurred';
    console.error('API Error:', message);
    return Promise.reject(new Error(message));
  }
);

export default api;

// Helper methods - return full response, frontend accesses response.data
export const get = <T>(url: string, params?: object) =>
  api.get<{ code: number; message: string; data: T }>(url, { params }).then((res) => res.data);

export const post = <T>(url: string, data?: object) =>
  api.post<{ code: number; message: string; data: T }>(url, data).then((res) => res.data);

export const put = <T>(url: string, data?: object) =>
  api.put<{ code: number; message: string; data: T }>(url, data).then((res) => res.data);

export const del = <T>(url: string) =>
  api.delete<{ code: number; message: string; data: T }>(url).then((res) => res.data);
