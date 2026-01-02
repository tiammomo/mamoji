// ==================== API Response Types ====================

export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
  traceId?: string;
}

export interface PaginatedResponse<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ==================== Account Types ====================

export type AssetCategory = 'fund' | 'credit' | 'topup' | 'investment' | 'debt';
export type BankCardType = 'type1' | 'type2';

export interface Account {
  accountId: number;
  enterpriseId: number;
  unitId: number;
  assetCategory: AssetCategory;
  subType: string;
  name: string;
  currency: string;
  accountNo?: string;
  bankName?: string;
  bankCardType?: BankCardType;
  creditLimit: number;
  outstandingBalance: number;
  billingDate: number;
  repaymentDate: number;
  availableBalance: number;
  investedAmount: number;
  totalValue: number;
  includeInTotal: number;
  status: number;
  createdAt: string;
}

export interface AccountSummary {
  totalBalance: number;
  totalAvailable: number;
  totalInvested: number;
  accountCount: number;
  lastMonthBalance: number;
  lastMonthAvailable: number;
  lastMonthInvested: number;
  balanceMoM: number;
  availableMoM: number;
  investedMoM: number;
  hasHistory: boolean;
}

// ==================== Transaction Types ====================

export type TransactionType = 'income' | 'expense';

export interface Transaction {
  transactionId: number;
  enterpriseId: number;
  unitId: number;
  userId: number;
  type: TransactionType;
  category: string;
  amount: number;
  accountId: number;
  budgetId?: number;
  occurredAt: string;
  tags?: string[];
  note?: string;
  status: number;
  createdAt: string;
  updatedAt?: string;
}

// ==================== Budget Types ====================

export type BudgetType = 'monthly' | 'yearly' | 'project';
export type BudgetStatus = 'active' | 'ended' | 'paused';

export interface Budget {
  budgetId: number;
  enterpriseId: number;
  unitId: number;
  name: string;
  type: BudgetType;
  category: string;
  totalAmount: number;
  usedAmount: number;
  periodStart: string;
  periodEnd: string;
  status: BudgetStatus;
  createdAt: string;
  updatedAt?: string;
}

export interface BudgetDetail extends Budget {
  remainingAmount: number;
  usagePercent: number;
  transactions?: Transaction[];
}

// ==================== User Types ====================

export type UserRole = 'admin' | 'user' | 'manager';

export interface User {
  userId: number;
  username: string;
  phone?: string;
  email?: string;
  avatar?: string;
  role: UserRole;
  status: number;
  createdAt: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
  expiresAt: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  phone?: string;
  email?: string;
}

// ==================== Enterprise Types ====================

export interface Enterprise {
  enterpriseId: number;
  name: string;
  creditCode?: string;
  contactPerson?: string;
  contactPhone?: string;
  address?: string;
  licenseImage?: string;
  status: number;
  createdAt: string;
}

// ==================== Request Types ====================

export interface CreateAccountRequest {
  enterpriseId: number;
  unitId?: number;
  assetCategory: AssetCategory;
  subType?: string;
  name: string;
  currency?: string;
  accountNo?: string;
  bankName?: string;
  bankCardType?: BankCardType;
  creditLimit?: number;
  outstandingBalance?: number;
  billingDate?: number;
  repaymentDate?: number;
  availableBalance?: number;
  investedAmount?: number;
  totalValue?: number;
  includeInTotal?: number;
}

export interface UpdateAccountRequest {
  unitId?: number;
  assetCategory?: AssetCategory;
  subType?: string;
  name?: string;
  currency?: string;
  accountNo?: string;
  bankName?: string;
  bankCardType?: BankCardType;
  creditLimit?: number;
  outstandingBalance?: number;
  billingDate?: number;
  repaymentDate?: number;
  availableBalance?: number;
  investedAmount?: number;
  totalValue?: number;
  includeInTotal?: number;
  status?: number;
}

export interface ListAccountRequest {
  unitId?: number;
  category?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface CreateTransactionRequest {
  enterpriseId: number;
  unitId: number;
  userId: number;
  type: TransactionType;
  category: string;
  amount: number;
  accountId: number;
  budgetId?: number;
  occurredAt: string;
  tags?: string[];
  note?: string;
}

export interface UpdateTransactionRequest {
  type?: TransactionType;
  category?: string;
  amount?: number;
  accountId?: number;
  budgetId?: number;
  occurredAt?: string;
  tags?: string[];
  note?: string;
  status?: number;
}

export interface ListTransactionRequest {
  accountId?: number;
  budgetId?: number;
  type?: TransactionType;
  category?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

export interface CreateBudgetRequest {
  enterpriseId: number;
  unitId: number;
  name: string;
  type: BudgetType;
  category: string;
  totalAmount: number;
  periodStart: string;
  periodEnd: string;
}

export interface UpdateBudgetRequest {
  name?: string;
  type?: BudgetType;
  category?: string;
  totalAmount?: number;
  periodStart?: string;
  periodEnd?: string;
  status?: BudgetStatus;
}

export interface ListBudgetRequest {
  unitId?: number;
  type?: BudgetType;
  category?: string;
  status?: BudgetStatus;
  page?: number;
  pageSize?: number;
}

// ==================== Report Types ====================

export interface OverviewReport {
  totalIncome: number;
  totalExpense: number;
  netIncome: number;
  accountBalance: number;
  transactionCount: number;
  period: string;
}

export interface CategoryReport {
  category: string;
  type: TransactionType;
  totalAmount: number;
  percent: number;
  count: number;
}

// ==================== JWT Payload ====================

export interface JWTPayload {
  exp: number;
  iat: number;
  userId: number;
  enterpriseId: number;
  username: string;
  role: string;
}
