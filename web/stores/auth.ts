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
          // TODO: 调用登录API
          // const response = await post<LoginResponse>('/api/v1/auth/login', params);
          // const { token, user } = response;

          // 模拟登录成功
          const mockUser: UserInfo = {
            userId: 1,
            username: params.username,
            phone: '138****1234',
            enterpriseId: 1,
            enterpriseName: '示例企业',
            role: 'super_admin',
          };
          const mockToken = 'mock_jwt_token_' + Date.now();

          localStorage.setItem(TOKEN_KEY, mockToken);
          localStorage.setItem(USER_INFO_KEY, JSON.stringify(mockUser));

          set({
            token: mockToken,
            user: mockUser,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
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
        set({ token });
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
    }
  )
);

// 选择器
export const useToken = () => useAuthStore((state) => state.token);
export const useUser = () => useAuthStore((state) => state.user);
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const useAuthLoading = () => useAuthStore((state) => state.isLoading);
