import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi } from '@/api';
import type { User, LoginRequest } from '@/types';

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (data: LoginRequest) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (data: LoginRequest) => {
        set({ isLoading: true, error: null });
        // 清除可能存在的旧 token，避免 403
        set({ token: null, isAuthenticated: false });
        try {
          console.log('[Auth] 发送登录请求:', data);
          const response = await authApi.login(data);
          console.log('[Auth] 收到响应:', response);
          // response 是包装对象: {code, data, message, success}
          if (response && response.code === 200 && response.data) {
            set({
              token: response.data.token,
              user: {
                userId: response.data.userId,
                username: response.data.username,
                role: 'normal',
                status: 1,
              },
              isAuthenticated: true,
              isLoading: false,
            });
            console.log('[Auth] 登录成功');
          } else {
            console.log('[Auth] 登录失败:', response?.message || '未知错误');
            throw new Error(response?.message || '登录失败');
          }
        } catch (error) {
          console.error('[Auth] 登录异常:', error);
          set({
            error: error instanceof Error ? error.message : '登录失败',
            isLoading: false,
          });
          throw error;
        }
      },

      logout: () => {
        authApi.logout().finally(() => {
          set({
            token: null,
            user: null,
            isAuthenticated: false,
            error: null,
          });
        });
      },

      checkAuth: async () => {
        const { token } = get();
        if (!token) {
          set({ isAuthenticated: false });
          return;
        }

        try {
          const response = await authApi.profile();
          if (response && response.code === 200 && response.data) {
            set({
              user: response.data,
              isAuthenticated: true,
            });
          } else {
            set({ isAuthenticated: false, token: null });
          }
        } catch {
          set({ isAuthenticated: false, token: null });
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'mamoji-auth',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
