const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "/api/v1";

interface ApiError extends Error {
  code?: number;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getToken(): string | null {
    if (typeof window !== "undefined") {
      return localStorage.getItem("token");
    }
    return null;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getToken();

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    });

    const text = await response.text();

    if (!response.ok) {
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        data = { message: `请求失败 (${response.status})` };
      }
      const error: ApiError = new Error(data.message || "请求失败");
      error.code = data.code || response.status;

      // If 401 or 403, redirect to login
      if (response.status === 401 || response.status === 403) {
        if (typeof window !== "undefined") {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          window.location.href = "/login";
        }
      }

      throw error;
    }

    if (!text) {
      return {} as T;
    }

    const data = JSON.parse(text);
    return data.data;
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "GET" });
  }

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "DELETE" });
  }
}

export const api = new ApiClient(API_BASE);

// 用户类型定义
export interface User {
  id: number;
  email: string;
  nickname: string;
  role: number;
  roleName: string;
  permissions: number;
  permissionsName: string;
  familyId: number;
}

// 管理员用户 API
export const adminUserApi = {
  // 获取所有用户
  getUsers: () => api.get<User[]>("/admin/users"),

  // 创建用户
  createUser: (data: {
    email: string;
    password: string;
    nickname: string;
    role?: number;
    permissions?: number;
  }) => api.post<User>("/admin/users", data),

  // 更新用户
  updateUser: (id: number, data: {
    nickname?: string;
    role?: number;
    permissions?: number;
    password?: string;
  }) => api.put<User>(`/admin/users/${id}`, data),

  // 删除用户
  deleteUser: (id: number) => api.delete<void>(`/admin/users/${id}`),
};

// 用户资料 API
export interface UserProfile {
  id: number;
  email: string;
  nickname: string;
  avatarUrl: string;
}

export const userApi = {
  // 获取当前用户资料
  getProfile: () => api.get<UserProfile>("/auth/me"),

  // 更新用户资料（昵称、头像）
  updateProfile: (data: { nickname?: string; avatarUrl?: string }) =>
    api.put<UserProfile>("/auth/profile", data),

  // 修改密码
  changePassword: (oldPassword: string, newPassword: string) =>
    api.put<{ message: string }>("/auth/password", { oldPassword, newPassword }),
};
