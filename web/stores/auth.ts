import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { TOKEN_KEY, USER_INFO_KEY } from '@/lib/constants';

// 用户信息
export interface UserInfo {
  userId: number;
  username: string;
  phone?: string;
  email?: string;
  avatar?: string;
  enterpriseId?: number;
  enterpriseName?: string;
  role?: string;
}

// 登录请求参数
export interface LoginParams {
  username: string;
  password: string;
  captcha?: string;
  captchaId?: string;
}

// 登录响应
export interface LoginResponse {
  token: string;
  user: UserInfo;
  expiresAt: string;
}

// 认证状态
interface AuthState {
  token: string | null;
  user: UserInfo | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  login: (params: LoginParams) => Promise<void>;
  logout: () => void;
  setUser: (user: UserInfo) => void;
  setToken: (token: string) => void;
  updateUser: (user: Partial<UserInfo>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (params: LoginParams) => {
        set({ isLoading: true });
        try {
          const response = await fetch('/api/v1/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(params),
          });
          const data = await response.json();

          if (data.code === 0 && data.data) {
            const { token, user } = data.data;

            localStorage.setItem(TOKEN_KEY, token);
            localStorage.setItem(USER_INFO_KEY, JSON.stringify(user));

            set({
              token,
              user,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            throw new Error(data.message || '登录失败');
          }
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        // 调用后端登出接口
        const token = get().token;
        if (token) {
          fetch('/api/v1/auth/logout', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
          }).catch(console.error);
        }

        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_INFO_KEY);
        set({
          token: null,
          user: null,
          isAuthenticated: false,
        });
      },

      setUser: (user: UserInfo) => {
        localStorage.setItem(USER_INFO_KEY, JSON.stringify(user));
        set({ user });
      },

      setToken: (token: string) => {
        localStorage.setItem(TOKEN_KEY, token);
        set({ token, isAuthenticated: true });
      },

      updateUser: (updates: Partial<UserInfo>) => {
        const { user } = get();
        if (user) {
          const newUser = { ...user, ...updates };
          localStorage.setItem(USER_INFO_KEY, JSON.stringify(newUser));
          set({ user: newUser });
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      // 添加 onRehydrateStorage 来调试
      onRehydrateStorage: () => (state) => {
        console.log('Auth state rehydrated:', state);
      },
    }
  )
);

// 选择器
export const useToken = () => useAuthStore((state) => state.token);
export const useUser = () => useAuthStore((state) => state.user);
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const useAuthLoading = () => useAuthStore((state) => state.isLoading);
