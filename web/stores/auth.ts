import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { TOKEN_KEY, USER_INFO_KEY, ENTERPRISE_ROLE } from '@/lib/constants';
import { isTokenExpired } from '@/lib/api';

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

// 用户角色类型
export type UserRole = typeof ENTERPRISE_ROLE[keyof typeof ENTERPRISE_ROLE];

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
  checkAuth: () => boolean;
  fetchProfile: () => Promise<void>;
}

// 检查用户是否有指定角色
export const hasRole = (user: UserInfo | null, roles: UserRole | UserRole[]): boolean => {
  if (!user || !user.role) return false;
  const roleArray = Array.isArray(roles) ? roles : [roles];
  return roleArray.includes(user.role as UserRole);
};

// 检查用户是否是超级管理员
export const isSuperAdmin = (user: UserInfo | null): boolean => {
  return user?.role === ENTERPRISE_ROLE.SUPER_ADMIN;
};

// 检查用户是否是财务管理员
export const isFinanceAdmin = (user: UserInfo | null): boolean => {
  return user?.role === ENTERPRISE_ROLE.FINANCE_ADMIN;
};

// 检查用户是否有管理权限
export const hasAdminRole = (user: UserInfo | null): boolean => {
  return user?.role === ENTERPRISE_ROLE.SUPER_ADMIN || user?.role === ENTERPRISE_ROLE.FINANCE_ADMIN;
};

// 检查用户是否可以编辑
export const canEdit = (user: UserInfo | null): boolean => {
  return user?.role !== ENTERPRISE_ROLE.READONLY;
};

// 检查用户是否只读
export const isReadOnly = (user: UserInfo | null): boolean => {
  return user?.role === ENTERPRISE_ROLE.READONLY;
};

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

      // 检查认证状态（检查Token是否有效）
      checkAuth: () => {
        const token = get().token;
        const user = get().user;
        if (!token || !user) {
          return false;
        }
        // 检查Token是否过期
        if (isTokenExpired(token)) {
          // Token已过期，清除状态
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_INFO_KEY);
          set({
            token: null,
            user: null,
            isAuthenticated: false,
          });
          return false;
        }
        return true;
      },

      // 获取用户信息
      fetchProfile: async () => {
        const token = get().token;
        if (!token) return;

        try {
          const response = await fetch('/api/v1/auth/profile', {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          const data = await response.json();
          if (data.code === 0 && data.data) {
            const user = data.data;
            localStorage.setItem(USER_INFO_KEY, JSON.stringify(user));
            set({ user });
          }
        } catch (error) {
          console.error('获取用户信息失败:', error);
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

// 权限检查选择器
export const useHasRole = (roles: UserRole | UserRole[]) => {
  const user = useUser();
  return hasRole(user, roles);
};

export const useIsSuperAdmin = () => {
  const user = useUser();
  return isSuperAdmin(user);
};

export const useIsFinanceAdmin = () => {
  const user = useUser();
  return isFinanceAdmin(user);
};

export const useCanEdit = () => {
  const user = useUser();
  return canEdit(user);
};

export const useIsReadOnly = () => {
  const user = useUser();
  return isReadOnly(user);
};
