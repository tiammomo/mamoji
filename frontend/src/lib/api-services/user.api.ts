import { api } from "../api.client";
import type { User, UserProfile } from "../api.types";

export const adminUserApi = {
  getUsers: () => api.get<User[]>("/admin/users"),
  createUser: (data: {
    email: string;
    password: string;
    nickname: string;
    role?: number;
    permissions?: number;
  }) => api.post<User>("/admin/users", data),
  updateUser: (
    id: number,
    data: {
      nickname?: string;
      role?: number;
      permissions?: number;
      password?: string;
    }
  ) => api.put<User>(`/admin/users/${id}`, data),
  deleteUser: (id: number) => api.delete<void>(`/admin/users/${id}`),
};

export const userApi = {
  getProfile: () => api.get<UserProfile>("/auth/me"),
  updateProfile: (data: { nickname?: string; avatarUrl?: string }) => api.put<UserProfile>("/auth/profile", data),
  changePassword: (oldPassword: string, newPassword: string) =>
    api.put<{ message: string }>("/auth/password", { oldPassword, newPassword }),
};
