/**
 * 项目名称: Mamoji 记账系统
 * 文件名: api.ts
 * 功能描述: Axios HTTP 客户端封装，提供统一的 API 请求和响应处理
 *
 * 创建日期: 2024-01-01
 * 作者: tiammomo
 * 版本: 1.0.0
 */

import axios, { AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { useAuthStore } from '@/hooks/useAuth';
import { useLedgerStore } from '@/store/ledgerStore';

// ==================== API 配置 ====================

/**
 * 获取 API 基础 URL
 * <p>
 * 支持通过环境变量 NEXT_PUBLIC_API_URL 覆盖默认值。
 * 确保 URL 格式正确并统一添加 /api/v1 后缀。
 * </p>
 *
 * @returns 完整的 API 基础 URL
 */
const getApiBaseUrl = () => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:48080';
  // 移除末尾斜杠并添加 API 版本路径
  return baseUrl.replace(/\/$/, '') + '/api/v1';
};

const API_BASE_URL = getApiBaseUrl();

// ==================== Axios 实例创建 ====================

/**
 * 创建 Axios HTTP 客户端实例
 * <p>
 * 预设基础配置，包括基础 URL、超时时间、请求头等。
 * </p>
 */
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 秒超时
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
  },
  transformRequest: [(data) => JSON.stringify(data)],
  responseType: 'json',
});

// ==================== 请求拦截器 ====================

/**
 * 请求拦截器 - 添加认证令牌和账本 ID
 * <p>
 * 在每个请求发送前，自动添加：
 * <ul>
 *   <li>Authorization: Bearer token（用于身份认证）</li>
 *   <li>X-Ledger-Id: 当前选中的账本 ID（用于多账本数据隔离）</li>
 * </ul>
 * </p>
 */
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 添加 JWT 认证令牌
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // 添加当前账本 ID 到请求头（多账本支持）
    const currentLedgerId = useLedgerStore.getState().currentLedgerId;
    if (currentLedgerId) {
      config.headers['X-Ledger-Id'] = currentLedgerId.toString();
    }

    return config;
  },
  (error: AxiosError) => {
    // 请求错误处理
    return Promise.reject(error);
  }
);

// ==================== 响应拦截器 ====================

/**
 * 响应拦截器 - 统一处理响应和错误
 * <p>
 * 处理以下场景：
 * <ul>
 *   <li>401/403: 认证失败，清除登录状态并跳转登录页</li>
 *   <li>其他错误: 提取错误消息并抛出</li>
 * </ul>
 * </p>
 */
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // 直接返回完整响应，数据部分由调用方处理
    return response;
  },
  (error: AxiosError<{ message: string; code: number }>) => {
    // 处理认证错误（令牌过期、无效、拉黑等）
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.warn('认证失败，清除登录状态并跳转登录页');
      // 清除认证状态
      useAuthStore.setState({
        token: null,
        user: null,
        isAuthenticated: false,
        error: null,
      });
      // 清除本地存储的认证信息
      localStorage.removeItem('mamoji-auth');
      // 非登录页情况下跳转登录
      if (
        typeof window !== 'undefined' &&
        !window.location.pathname.includes('/login')
      ) {
        window.location.href = '/login';
      }
    }
    // 提取并抛出错误消息
    const message =
      error.response?.data?.message || error.message || '请求失败，请稍后重试';
    console.error('API 错误:', message);
    return Promise.reject(new Error(message));
  }
);

// ==================== 导出封装方法 ====================

/**
 * 默认导出配置好的 Axios 实例
 */
export default api;

/**
 * GET 请求封装
 *
 * @param url    请求路径
 * @param params URL 查询参数
 * @returns Promise<响应数据>
 */
export const get = <T>(url: string, params?: object) =>
  api.get<{ code: number; message: string; data: T }>(url, { params }).then(
    (res) => res.data
  );

/**
 * POST 请求封装
 *
 * @param url  请求路径
 * @param data 请求体数据
 * @returns Promise<响应数据>
 */
export const post = <T>(url: string, data?: object) =>
  api.post<{ code: number; message: string; data: T }>(url, data).then(
    (res) => res.data
  );

/**
 * PUT 请求封装
 *
 * @param url  请求路径
 * @param data 请求体数据
 * @returns Promise<响应数据>
 */
export const put = <T>(url: string, data?: object) =>
  api.put<{ code: number; message: string; data: T }>(url, data).then(
    (res) => res.data
  );

/**
 * DELETE 请求封装
 *
 * @param url 请求路径
 * @returns Promise<响应数据>
 */
export const del = <T>(url: string) =>
  api.delete<{ code: number; message: string; data: T }>(url).then(
    (res) => res.data
  );
