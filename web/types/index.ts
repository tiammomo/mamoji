// ===========================================
// Mamoji Core Types - TypeScript Definitions
// ===========================================

// Common
export interface BaseEntity {
  id: number;
  createdAt: string;
  updatedAt: string;
}

// User
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
  preferenceId: number;
  userId: number;
  currency: string;
  timezone: string;
  dateFormat: string;
  startDayOfWeek: number;
}

// Category
export interface Category {
  categoryId: number;
  userId: number;
  name: string;
  type: 'income' | 'expense';
  icon?: string;
  parentId?: number;
  sort: number;
  status: 0 | 1;
}

// Account
export type AccountType =
  | 'bank'
  | 'credit'
  | 'cash'
  | 'alipay'
  | 'wechat'
  | 'gold'
  | 'fund_accumulation'
  | 'fund'
  | 'stock'
  | 'topup'
  | 'debt';

export type AccountSubType = 'bank_primary' | 'bank_secondary' | 'credit_card' | undefined;

export interface Account {
  accountId: number;
  userId: number;
  name: string;
  accountType: AccountType;
  accountSubType?: AccountSubType;
  currency: string;
  balance: number;
  includeInTotal: boolean;
  sort: number;
  status: 0 | 1;
  lastTransactionAt?: string;
}

// Transaction
export type TransactionType = 'income' | 'expense' | 'transfer' | 'refund';

export interface Transaction {
  transactionId: number;
  userId: number;
  accountId: number;
  categoryId: number;
  budgetId?: number;
  refundId?: number;  // 关联的原始交易ID（退款时使用）
  type: TransactionType;
  amount: number;
  currency: string;
  occurredAt: string;
  note?: string;
  attachments?: string[];
  status: 0 | 1;
  // 前端展示用字段
  refundAmount?: number;
  refundTransactionId?: number;
}

// Budget
export type BudgetStatus = 0 | 1 | 2 | 3; // 0=取消, 1=进行中, 2=已完成, 3=超支

export interface Budget {
  budgetId: number;
  userId: number;
  name: string;
  amount: number;
  spent: number;
  startDate: string;
  endDate: string;
  status: BudgetStatus;
  alertThreshold: number;
}

// Report Types
export interface AccountSummary {
  totalAssets: number;
  totalLiabilities: number;
  netAssets: number;
  accountsCount: number;
  lastUpdated: string;
}

// 财务报表汇总 (从 reports/summary API 返回)
export interface ReportsSummary {
  totalIncome: number;      // 总收入
  totalExpense: number;     // 总支出
  netIncome: number;        // 净收支
  transactionCount: number; // 交易数量
  accountCount: number;     // 账户数量
}

export interface CategoryReport {
  categoryId: number;
  categoryName: string;
  type: 'income' | 'expense';
  totalAmount: number;
  transactionCount: number;
  percentage: number;
}

export interface MonthlyReport {
  year: number;
  month: number;
  totalIncome: number;
  totalExpense: number;
  netIncome: number;
  dailyData: DailyData[];
  categoryBreakdown: CategoryReport[];
}

export interface DailyData {
  date: string;
  income: number;
  expense: number;
}

export interface BalanceSheet {
  asOfDate: string;
  assets: AssetItem[];
  liabilities: LiabilityItem[];
  netAssets: number;
}

export interface AssetItem {
  name: string;
  type: AccountType;
  amount: number;
  percentage: number;
}

export interface LiabilityItem {
  name: string;
  amount: number;
}

// API Request Types
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

export interface CategoryRequest {
  name: string;
  type: 'income' | 'expense';
  icon?: string;
  parentId?: number;
}

export interface AccountRequest {
  name: string;
  accountType: AccountType;
  accountSubType?: AccountSubType;
  currency?: string;
  balance?: number;
  includeInTotal?: boolean;
}

export interface TransactionRequest {
  accountId: number;
  categoryId: number;
  type: TransactionType;
  amount: number;
  occurredAt?: string;
  note?: string;
  budgetId?: number;
  refundId?: number;  // 关联的原始交易ID（退款时使用）
}

export interface BudgetRequest {
  name: string;
  amount: number;
  startDate: string;
  endDate: string;
  alertThreshold?: number;
}

export interface TransactionQueryParams {
  accountId?: number;
  categoryId?: number;
  type?: TransactionType;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  keyword?: string;
  current?: number;
  size?: number;
}

export interface ReportQueryParams {
  year?: number;
  month?: number;
  startDate?: string;
  endDate?: string;
  accountId?: number;
}

// API Response Types
export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
  timestamp: string;
}

export interface PageResult<T> {
  current: number;
  size: number;
  total: number;
  pages: number;
  records: T[];
}

// Form Types
export interface CreateCategoryForm {
  name: string;
  type: 'income' | 'expense';
  icon?: string;
  parentId?: number | null;
}

export interface CreateAccountForm {
  name: string;
  accountType: AccountType;
  accountSubType?: AccountSubType | null;
  currency: string;
  initialBalance: number;
  includeInTotal: boolean;
}

export interface CreateTransactionForm {
  accountId: number;
  categoryId: number;
  type: TransactionType;
  amount: string;
  occurredAt: string;
  note?: string;
  budgetId?: number | null;
}

export interface CreateBudgetForm {
  name: string;
  amount: string;
  startDate: string;
  endDate: string;
  alertThreshold: number;
}

// Auth Store
export interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  login: (data: LoginRequest) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

// Refund Types
export interface Refund {
  refundId: number;
  transactionId: number;
  amount: number;
  note: string;
  occurredAt: string;
  status: 0 | 1;
  createdAt: string;
}

export interface RefundSummary {
  totalRefunded: number;
  remainingRefundable: number;
  hasRefund: boolean;
  refundCount: number;
}

export interface TransactionRefundResponse {
  transaction: {
    transactionId: number;
    amount: number;
    type: string;
  };
  refunds: Refund[];
  summary: RefundSummary;
}

export interface RefundRequest {
  amount: number;
  occurredAt: string;
  note?: string;
}

// Extend Transaction with refundSummary (from API)
export interface TransactionWithRefundSummary extends Transaction {
  refundSummary?: RefundSummary;
}

// Budget Progress Type
export interface BudgetProgress {
  budgetId: number;
  name: string;
  amount: number;
  spent: number;
  remaining: number;
  progress: number;
  status: BudgetStatus;
  statusText: string;
  startDate: string;
  endDate: string;
  daysRemaining?: number;
  averageDailySpend?: number;
  projectedBalance?: number;
  createdAt: string;
}

// Trend Data Type
export interface TrendData {
  period: string;
  income: number;
  expense: number;
  netIncome: number;
  transactionCount: number;
  incomeChangePercent?: number;
  expenseChangePercent?: number;
  netIncomeChangePercent?: number;
}
