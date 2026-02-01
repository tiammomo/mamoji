// User related types
export interface User {
  userId: number;
  username: string;
  phone?: string;
  email?: string;
  role: 'super_admin' | 'admin' | 'normal';
  status: 0 | 1;
  preference?: UserPreference;
}

export interface UserPreference {
  prefId: number;
  userId: number;
  currency: string;
  timezone: string;
  dateFormat: string;
  monthStart: number;
}

// Auth request/response types
export interface LoginRequest {
  username: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  userId: number;
  username: string;
  token: string;
  tokenType: string;
  expiresIn: number;
}

export interface RegisterRequest {
  username: string;
  password: string;
  phone?: string;
  email?: string;
}
