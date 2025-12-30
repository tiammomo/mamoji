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

// 初始化模拟用户数据（用于开发测试）
function initDevAuth(): { token: string; user: UserInfo } | null {
  if (typeof window !== 'undefined' && !localStorage.getItem(TOKEN_KEY)) {
    const mockUser: UserInfo = {
      userId: 1,
      username: 'admin',
      phone: '138****1234',
      enterpriseId: 1,
      enterpriseName: '示例企业',
      role: 'super_admin',
    };
    const mockToken = 'mock_jwt_token_dev';
    localStorage.setItem(TOKEN_KEY, mockToken);
    localStorage.setItem(USER_INFO_KEY, JSON.stringify(mockUser));
    return { token: mockToken, user: mockUser };
  }
  return null;
}

// 尝试恢复保存的认证状态
function getInitialAuthState(): { token: string | null; user: UserInfo | null; isAuthenticated: boolean } {
  if (typeof window === 'undefined') {
    return { token: null, user: null, isAuthenticated: false };
  }

  // 首先检查是否有保存的持久化状态
  try {
    const saved = localStorage.getItem('auth-storage');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.state?.isAuthenticated) {
        return {
          token: parsed.state.token,
          user: parsed.state.user,
          isAuthenticated: true,
        };
      }
    }
  } catch {
    // 忽略解析错误
  }

  // 如果没有保存的状态，初始化开发模拟认证
  const devAuth = initDevAuth();
  if (devAuth) {
    return {
      token: devAuth.token,
      user: devAuth.user,
      isAuthenticated: true,
    };
  }

  return { token: null, user: null, isAuthenticated: false };
}

const initialState = getInitialAuthState();

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: initialState.token,
      user: initialState.user,
      isAuthenticated: initialState.isAuthenticated,
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
