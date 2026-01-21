import api, { get, post, put, del } from '@/lib/api';
import type {
  User,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  Category,
  CategoryRequest,
  Account,
  AccountRequest,
  Transaction,
  TransactionRequest,
  TransactionQueryParams,
  Budget,
  BudgetRequest,
  AccountSummary,
  CategoryReport,
  MonthlyReport,
  BalanceSheet,
  ReportQueryParams,
  PageResult,
  ApiResponse,
} from '@/types';

// ===========================================
// Auth API
// ===========================================
export const authApi = {
  login: (data: LoginRequest) => post<ApiResponse<LoginResponse>>('/auth/login', data),
  register: (data: RegisterRequest) => post<ApiResponse<void>>('/auth/register', data),
  logout: () => post<ApiResponse<void>>('/auth/logout'),
  profile: () => get<ApiResponse<User>>('/auth/profile'),
};

// ===========================================
// Account API
// ===========================================
export const accountApi = {
  list: () => get<ApiResponse<Account[]>>('/accounts'),
  get: (id: number) => get<ApiResponse<Account>>(`/accounts/${id}`),
  create: (data: AccountRequest) => post<ApiResponse<number>>('/accounts', data),
  update: (id: number, data: Partial<AccountRequest>) =>
    put<ApiResponse<void>>(`/accounts/${id}`, data),
  delete: (id: number) => del<ApiResponse<void>>(`/accounts/${id}`),
  getFlows: (id: number, params?: { page?: number; pageSize?: number }) =>
    get<ApiResponse<PageResult<Transaction>>>(`/accounts/${id}/flows`, params),
  getSummary: () => get<ApiResponse<AccountSummary>>('/accounts/summary'),
};

// ===========================================
// Transaction API
// ===========================================
export const transactionApi = {
  list: (params?: TransactionQueryParams) =>
    get<ApiResponse<PageResult<Transaction>>>('/transactions', params),
  get: (id: number) => get<ApiResponse<Transaction>>(`/transactions/${id}`),
  create: (data: TransactionRequest) => post<ApiResponse<number>>('/transactions', data),
  update: (id: number, data: Partial<TransactionRequest>) =>
    put<ApiResponse<void>>(`/transactions/${id}`, data),
  delete: (id: number) => del<ApiResponse<void>>(`/transactions/${id}`),
  getRecent: (limit?: number) =>
    get<ApiResponse<Transaction[]>>('/transactions/recent', { limit }),
};

// ===========================================
// Budget API
// ===========================================
export const budgetApi = {
  list: () => get<ApiResponse<Budget[]>>('/budgets'),
  get: (id: number) => get<ApiResponse<Budget>>(`/budgets/${id}`),
  create: (data: BudgetRequest) => post<ApiResponse<number>>('/budgets', data),
  update: (id: number, data: Partial<BudgetRequest>) =>
    put<ApiResponse<void>>(`/budgets/${id}`, data),
  delete: (id: number) => del<ApiResponse<void>>(`/budgets/${id}`),
  listActive: () => get<ApiResponse<Budget[]>>('/budgets/active'),
  getProgress: (id: number) => get<ApiResponse<{ spent: number; remaining: number; percentage: number }>>(
    `/budgets/${id}/progress`
  ),
};

// ===========================================
// Category API
// ===========================================
export const categoryApi = {
  list: (type?: 'income' | 'expense') =>
    get<ApiResponse<Category[]>>('/categories', { type }),
  get: (id: number) => get<ApiResponse<Category>>(`/categories/${id}`),
  create: (data: CategoryRequest) => post<ApiResponse<number>>('/categories', data),
  update: (id: number, data: Partial<CategoryRequest>) =>
    put<ApiResponse<void>>(`/categories/${id}`, data),
  delete: (id: number) => del<ApiResponse<void>>(`/categories/${id}`),
};

// ===========================================
// Report API
// ===========================================
export const reportApi = {
  getSummary: (params?: ReportQueryParams) =>
    get<ApiResponse<AccountSummary>>('/reports/summary', params),
  getIncomeExpense: (params?: ReportQueryParams) =>
    get<ApiResponse<CategoryReport[]>>('/reports/income-expense', params),
  getMonthly: (params: { year: number; month: number; accountId?: number }) =>
    get<ApiResponse<MonthlyReport>>('/reports/monthly', params),
  getBalanceSheet: () => get<ApiResponse<BalanceSheet>>('/reports/balance-sheet'),
  getTrend: (params: { startDate: string; endDate: string; type?: 'daily' | 'weekly' | 'monthly' }) =>
    get<ApiResponse<{ labels: string[]; income: number[]; expense: number[] }>>(
      '/reports/trend',
      params
    ),
};
