// Transaction types
export type TransactionType = 'income' | 'expense' | 'transfer' | 'refund';

export interface Transaction {
  transactionId: number;
  userId: number;
  accountId: number;
  categoryId: number;
  budgetId?: number;
  refundId?: number;
  type: TransactionType;
  amount: number;
  currency: string;
  occurredAt: string;
  note?: string;
  status: 0 | 1;
  refundAmount?: number;
  refundTransactionId?: number;
  refundSummary?: RefundSummary;
}

export interface TransactionRequest {
  accountId: number;
  categoryId: number;
  type: TransactionType;
  amount: number;
  occurredAt?: string;
  note?: string;
  budgetId?: number;
  refundId?: number;
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

export interface TransactionWithRefundSummary extends Transaction {
  refundSummary?: RefundSummary;
}

// Refund types
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
