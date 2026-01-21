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
        try {
          const response = await authApi.login(data);
          if (response.code === 0 && response.data) {
            set({
              token: response.data.token,
              user: response.data.user,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            throw new Error(response.message || '登录失败');
          }
        } catch (error) {
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
        const { token, isAuthenticated } = get();
        if (!token) {
          set({ isAuthenticated: false });
          return;
        }

        try {
          const response = await authApi.profile();
          if (response.code === 0 && response.data) {
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
