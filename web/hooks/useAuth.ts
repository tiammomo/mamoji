import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { authApi } from '@/api';
import type { User, LoginRequest } from '@/types';

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isReady: boolean;  // persist 是否已恢复完成
  login: (data: LoginRequest) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

// 自定义 storage，保留原始 localStorage 行为
const storage = {
  getItem: (name: string): string | null => {
    try {
      return localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name: string, value: string): void => {
    try {
      localStorage.setItem(name, value);
    } catch {}
  },
  removeItem: (name: string): void => {
    try {
      localStorage.removeItem(name);
    } catch {}
  },
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      isReady: false,

      login: async (data: LoginRequest) => {
        set({ isLoading: true, error: null });
        try {
          console.log('[Auth] 发送登录请求:', data);
          const response = await authApi.login(data);
          console.log('[Auth] 收到响应:', response);
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
              isReady: true,
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
            isReady: true,
          });
        });
      },

      checkAuth: async () => {
        const { token } = get();
        console.log('[checkAuth] token:', token ? 'present' : 'null');

        if (!token) {
          // 没有 token，标记为就绪但不尝试恢复（由 AuthGuard 处理）
          set({ isAuthenticated: false, isReady: true });
          return;
        }

        try {
          const response = await authApi.profile();
          console.log('[checkAuth] profile response:', response?.code);
          if (response && response.code === 200 && response.data) {
            set({
              user: response.data,
              isAuthenticated: true,
              isReady: true,
            });
            console.log('[checkAuth] Auth verified successfully');
          } else if (response?.code === 401 || response?.code === 403) {
            // Token 过期或无效
            console.log('[checkAuth] Token invalid, clearing...');
            set({ isAuthenticated: false, token: null, isReady: true });
          } else {
            // 其他错误（如 500），保持 token 不变
            console.log('[checkAuth] Profile API error, keeping token');
            set({ isReady: true });
          }
        } catch (error: any) {
          // 网络错误等，保持 token 不变，标记为就绪
          console.error('[checkAuth] error:', error?.message);
          // 如果是 401/403 错误，清除 token
          if (error?.message?.includes('401') || error?.message?.includes('403')) {
            set({ isAuthenticated: false, token: null, isReady: true });
          } else {
            set({ isReady: true });
          }
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'mamoji-auth',
      storage: createJSONStorage(() => storage),
      onRehydrateStorage: () => (state) => {
        // persist 恢复完成后设置 isReady
        if (state) {
          console.log('[Auth] persist hydration complete, token:', state.token ? 'present' : 'null');
          state.isReady = true;
        }
      },
    }
  )
);

// Selectors
export function useAuthLoading(): boolean {
  return useAuthStore((state) => state.isLoading);
}

export function useAuthError(): string | null {
  return useAuthStore((state) => state.error);
}

export function useCurrentUser(): User | null {
  return useAuthStore((state) => state.user);
}

export function useIsAuthReady(): boolean {
  return useAuthStore((state) => state.isReady);
}

export function useIsAuthenticated(): boolean {
  return useAuthStore((state) => state.isAuthenticated);
}
