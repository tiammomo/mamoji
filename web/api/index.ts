import { get, post, put, del } from '@/lib/api';
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
  ReportsSummary,
  CategoryReport,
  MonthlyReport,
  BalanceSheet,
  ReportQueryParams,
  PageResult,
  Refund,
  RefundRequest,
  RefundSummary,
  TransactionRefundResponse,
  TrendData,
  BudgetProgress,
} from '@/types';

// ===========================================
// Auth API
// ===========================================
export const authApi = {
  login: (data: LoginRequest) => post<LoginResponse>('/auth/login', data),
  register: (data: RegisterRequest) => post<void>('/auth/register', data),
  logout: () => post<void>('/auth/logout'),
  profile: () => get<User>('/auth/me'),
};

// ===========================================
// Account API
// ===========================================
export const accountApi = {
  list: () => get<Account[]>('/accounts'),
  get: (id: number) => get<Account>(`/accounts/${id}`),
  create: (data: AccountRequest) => post<number>('/accounts', data),
  update: (id: number, data: Partial<AccountRequest>) =>
    put<void>(`/accounts/${id}`, data),
  delete: (id: number) => del<void>(`/accounts/${id}`),
  getFlows: (id: number, params?: { page?: number; pageSize?: number }) =>
    get<PageResult<Transaction>>(`/accounts/${id}/flows`, params),
  getSummary: () => get<AccountSummary>('/accounts/summary'),
};

// ===========================================
// Transaction API
// ===========================================
export const transactionApi = {
  list: (params?: TransactionQueryParams) =>
    get<PageResult<Transaction>>('/transactions', params),
  get: (id: number) => get<Transaction>(`/transactions/${id}`),
  create: (data: TransactionRequest) => post<number>('/transactions', data),
  update: (id: number, data: Partial<TransactionRequest>) =>
    put<void>(`/transactions/${id}`, data),
  delete: (id: number) => del<void>(`/transactions/${id}`),
  getRecent: (limit?: number) =>
    get<Transaction[]>('/transactions/recent', { limit }),
  // Import/Export
  export: (params?: { startDate?: string; endDate?: string; type?: string }) =>
    get<string>('/transactions/export', params),
  getImportTemplate: () => get<string>('/transactions/import/template'),
  previewImport: (data: TransactionRequest[]) =>
    post<TransactionRequest[]>('/transactions/import/preview', data),
  import: (data: TransactionRequest[]) =>
    post<number[]>('/transactions/import', data),
};

// ===========================================
// Budget API
// ===========================================
export const budgetApi = {
  list: (activeOnly?: boolean) => get<Budget[]>('/budgets', { activeOnly }),
  get: (id: number) => get<Budget>(`/budgets/${id}`),
  create: (data: BudgetRequest) => post<number>('/budgets', data),
  update: (id: number, data: Partial<BudgetRequest>) =>
    put<void>(`/budgets/${id}`, data),
  delete: (id: number) => del<void>(`/budgets/${id}`),
  listActive: () => get<Budget[]>('/budgets', { activeOnly: true }),
  getProgress: (id: number) => get<BudgetProgress>(`/budgets/${id}/progress`),
};

// ===========================================
// Category API
// ===========================================
export const categoryApi = {
  list: (type?: 'income' | 'expense') =>
    get<Category[]>('/categories', { type }),
  get: (id: number) => get<Category>(`/categories/${id}`),
  create: (data: CategoryRequest) => post<number>('/categories', data),
  update: (id: number, data: Partial<CategoryRequest>) =>
    put<void>(`/categories/${id}`, data),
  delete: (id: number) => del<void>(`/categories/${id}`),
};

// ===========================================
// Report API
// ===========================================
export const reportApi = {
  getSummary: (params?: ReportQueryParams) =>
    get<ReportsSummary>('/reports/summary', params),
  getIncomeExpense: (params?: ReportQueryParams) =>
    get<CategoryReport[]>('/reports/income-expense', params),
  getMonthly: (params: { year: number; month: number; accountId?: number }) =>
    get<MonthlyReport>('/reports/monthly', params),
  getDailyByDateRange: (params: { startDate: string; endDate: string }) =>
    get<any>('/reports/daily', params),
  getBalanceSheet: () => get<BalanceSheet>('/reports/balance-sheet'),
  getTrend: (params: { startDate: string; endDate: string; period?: 'daily' | 'weekly' | 'monthly' }) =>
    get<TrendData[]>('/reports/trend', params),
};

// ===========================================
// Refund API
// ===========================================
export const refundApi = {
  // Get all refunds for a transaction
  getTransactionRefunds: (transactionId: number) =>
    get<TransactionRefundResponse>(`/transactions/${transactionId}/refunds`),
  // Create a refund for a transaction
  createRefund: (transactionId: number, data: RefundRequest) =>
    post<Refund>(`/transactions/${transactionId}/refunds`, data),
  // Cancel a refund
  cancelRefund: (transactionId: number, refundId: number) =>
    del<RefundSummary>(`/transactions/${transactionId}/refunds/${refundId}`),
};
