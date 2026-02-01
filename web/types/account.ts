// Account types
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
  includeInTotal: number;
  status: 0 | 1;
}

export interface AccountRequest {
  name: string;
  accountType: AccountType;
  accountSubType?: AccountSubType;
  currency?: string;
  balance?: number;
  includeInTotal?: number;
}

export interface AccountSummary {
  totalAssets: number;
  totalLiabilities: number;
  netAssets: number;
  accountsCount: number;
  lastUpdated: string;
}
