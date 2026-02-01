// Category types
export interface Category {
  categoryId: number;
  userId: number;
  name: string;
  type: 'income' | 'expense';
  status: 0 | 1;
}

export interface CategoryRequest {
  name: string;
  type: 'income' | 'expense';
}

// Budget types
export type BudgetStatus = 0 | 1 | 2 | 3;

export interface Budget {
  budgetId: number;
  userId: number;
  name: string;
  amount: number;
  spent: number;
  startDate: string;
  endDate: string;
  status: BudgetStatus;
  alertThreshold?: number;
}

export interface BudgetRequest {
  name: string;
  amount: number;
  startDate: string;
  endDate: string;
}

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
