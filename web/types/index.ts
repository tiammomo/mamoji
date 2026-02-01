// ===========================================
// Mamoji Core Types - TypeScript Definitions
// Modular re-exports
// ===========================================

// Common types
export * from './common';

// User types
export * from './user';

// Account types
export * from './account';

// Transaction types
export * from './transaction';

// Category & Budget types
export * from './category-budget';

// ===========================================
// Report Types (not yet modularized)
// ===========================================

export interface AccountSummary {
  totalAssets: number;
  totalLiabilities: number;
  netAssets: number;
  accountsCount: number;
  lastUpdated: string;
}

export interface ReportsSummary {
  totalIncome: number;
  totalExpense: number;
  netIncome: number;
  transactionCount: number;
  accountCount: number;
}

export interface CategoryReport {
  categoryId: number;
  categoryName: string;
  type: string;
  amount: number;
  count: number;
  percentage: number;
}

export interface MonthlyReport {
  year: number;
  month: number;
  totalIncome: number;
  totalExpense: number;
  netIncome: number;
  dailyData: DailyData[];
  startDate?: string;
  endDate?: string;
}

export interface DailyData {
  day: number;
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
  type: string;
  amount: number;
  percentage: number;
}

export interface LiabilityItem {
  name: string;
  amount: number;
}

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

// ===========================================
// API Response Types
// ===========================================

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

// ===========================================
// Refund Types (kept inline - small)
// ===========================================

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

// ===========================================
// Query Params Types
// ===========================================

export interface TransactionQueryParams {
  accountId?: number;
  categoryId?: number;
  type?: string;
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
