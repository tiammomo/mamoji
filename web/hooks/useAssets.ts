import { useState, useEffect, useCallback, useMemo } from 'react';
import { get, post, put, del } from '@/lib/api';
import { useUser } from '@/stores/auth';
import { useToast } from '@/components/ui/use-toast';
import {
  ASSET_CATEGORY,
  ASSET_CATEGORY_LABELS,
  FUND_SUB_TYPE,
  CREDIT_SUB_TYPE,
  TOPUP_SUB_TYPE,
  INVESTMENT_SUB_TYPE,
  DEBT_SUB_TYPE,
} from '@/lib/constants';

// 资产账户类型
export type AssetCategory = typeof ASSET_CATEGORY.FUND | typeof ASSET_CATEGORY.CREDIT | typeof ASSET_CATEGORY.TOPUP | typeof ASSET_CATEGORY.INVESTMENT | typeof ASSET_CATEGORY.DEBT;

// 账户数据
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
  bankCardType?: string;
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

// 账户汇总
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

// 表单数据
export interface AccountFormData {
  assetCategory: AssetCategory;
  subType: string;
  name: string;
  currency: string;
  accountNo: string;
  bankName: string;
  bankCode: string;
  bankCardType: string;
  creditLimit: string;
  outstandingBalance: string;
  billingDate: string;
  repaymentDate: string;
  availableBalance: string;
  investedAmount: string;
  totalValue: string;
  includeInTotal: boolean;
}

// 判断是否为银行卡类型
export const isBankType = (category: AssetCategory, subType: string): boolean => {
  return category === ASSET_CATEGORY.FUND && subType === FUND_SUB_TYPE.BANK;
};

// 判断是否为银行信用卡类型
export const isBankCardType = (category: AssetCategory, subType: string): boolean => {
  return category === ASSET_CATEGORY.CREDIT && subType === CREDIT_SUB_TYPE.BANK_CARD;
};

// 判断是否为信用卡类型
export const isCreditCardType = (category: AssetCategory): boolean => {
  return category === ASSET_CATEGORY.CREDIT;
};

// 分类配置
export const CATEGORY_CONFIG = {
  [ASSET_CATEGORY.FUND]: {
    label: ASSET_CATEGORY_LABELS[ASSET_CATEGORY.FUND],
    subTypes: FUND_SUB_TYPE,
    hasBankFields: true,
    hasCreditLimit: false,
    hasInvestedAmount: false,
  },
  [ASSET_CATEGORY.CREDIT]: {
    label: ASSET_CATEGORY_LABELS[ASSET_CATEGORY.CREDIT],
    subTypes: CREDIT_SUB_TYPE,
    hasBankFields: false,
    hasCreditLimit: true,
    hasInvestedAmount: false,
  },
  [ASSET_CATEGORY.TOPUP]: {
    label: ASSET_CATEGORY_LABELS[ASSET_CATEGORY.TOPUP],
    subTypes: TOPUP_SUB_TYPE,
    hasBankFields: false,
    hasCreditLimit: false,
    hasInvestedAmount: false,
  },
  [ASSET_CATEGORY.INVESTMENT]: {
    label: ASSET_CATEGORY_LABELS[ASSET_CATEGORY.INVESTMENT],
    subTypes: INVESTMENT_SUB_TYPE,
    hasBankFields: true,
    hasCreditLimit: false,
    hasInvestedAmount: true,
  },
  [ASSET_CATEGORY.DEBT]: {
    label: ASSET_CATEGORY_LABELS[ASSET_CATEGORY.DEBT],
    subTypes: DEBT_SUB_TYPE,
    hasBankFields: true,
    hasCreditLimit: false,
    hasInvestedAmount: false,
  },
} as const;

// 默认表单数据
export const getDefaultFormData = (): AccountFormData => ({
  assetCategory: ASSET_CATEGORY.FUND,
  subType: FUND_SUB_TYPE.CASH,
  name: '',
  currency: 'CNY',
  accountNo: '',
  bankName: '',
  bankCode: '',
  bankCardType: '',
  creditLimit: '',
  outstandingBalance: '',
  billingDate: '',
  repaymentDate: '',
  availableBalance: '',
  investedAmount: '',
  totalValue: '',
  includeInTotal: true,
});

interface UseAssetsReturn {
  // 状态
  accounts: Account[];
  summary: AccountSummary | null;
  isLoading: boolean;
  isInitialLoading: boolean;
  searchQuery: string;
  // 计算属性
  filteredAccounts: Account[];
  accountsByCategory: Record<string, Account[]>;
  // 操作
  setSearchQuery: (query: string) => void;
  fetchAccounts: () => Promise<void>;
  createAccount: (data: Partial<Account>) => Promise<boolean>;
  updateAccount: (accountId: number, data: Partial<Account>) => Promise<boolean>;
  deleteAccount: (accountId: number) => Promise<boolean>;
}

export function useAssets(): UseAssetsReturn {
  const user = useUser();
  const { toast } = useToast();

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [summary, setSummary] = useState<AccountSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // 获取账户列表
  const fetchAccounts = useCallback(async () => {
    try {
      const data = await get<{ accounts: Account[]; summary: AccountSummary }>('/api/v1/accounts');
      setAccounts(data.accounts || []);
      setSummary(data.summary);
    } catch (error) {
      console.error('获取账户列表失败:', error);
      toast({ title: '错误', description: '获取账户列表失败', variant: 'destructive' });
    } finally {
      setIsInitialLoading(false);
    }
  }, [toast]);

  // 初始加载
  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  // 筛选账户
  const filteredAccounts = useMemo(() => {
    if (!searchQuery.trim()) return accounts;
    const query = searchQuery.toLowerCase();
    return accounts.filter(
      (account) =>
        account.name.toLowerCase().includes(query) ||
        account.bankName?.toLowerCase().includes(query) ||
        account.accountNo?.includes(query)
    );
  }, [accounts, searchQuery]);

  // 按分类分组
  const accountsByCategory = useMemo(() => {
    const result: Record<string, Account[]> = {};
    Object.values(ASSET_CATEGORY).forEach((category) => {
      result[category] = filteredAccounts.filter((a) => a.assetCategory === category);
    });
    return result;
  }, [filteredAccounts]);

  // 创建账户
  const createAccount = useCallback(async (data: Partial<Account>): Promise<boolean> => {
    setIsLoading(true);
    try {
      // 不传递unitId，让后端自动创建或获取默认记账单元
      const result = await post<Account>('/api/v1/accounts', data);
      if (result) {
        setAccounts((prev) => [...prev, result]);
        toast({ title: '成功', description: '账户创建成功' });
        return true;
      }
      return false;
    } catch (error) {
      console.error('创建账户失败:', error);
      toast({ title: '错误', description: '创建账户失败', variant: 'destructive' });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // 更新账户
  const updateAccount = useCallback(async (accountId: number, data: Partial<Account>): Promise<boolean> => {
    setIsLoading(true);
    try {
      await put(`/api/v1/accounts/${accountId}`, data);
      setAccounts((prev) =>
        prev.map((a) => (a.accountId === accountId ? { ...a, ...data } : a))
      );
      toast({ title: '成功', description: '账户更新成功' });
      return true;
    } catch (error) {
      console.error('更新账户失败:', error);
      toast({ title: '错误', description: '更新账户失败', variant: 'destructive' });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // 删除账户
  const deleteAccount = useCallback(async (accountId: number): Promise<boolean> => {
    setIsLoading(true);
    try {
      await del(`/api/v1/accounts/${accountId}`);
      setAccounts((prev) => prev.filter((a) => a.accountId !== accountId));
      toast({ title: '成功', description: '账户删除成功' });
      return true;
    } catch (error) {
      console.error('删除账户失败:', error);
      toast({ title: '错误', description: '删除账户失败', variant: 'destructive' });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  return {
    accounts,
    summary,
    isLoading,
    isInitialLoading,
    searchQuery,
    filteredAccounts,
    accountsByCategory,
    setSearchQuery,
    fetchAccounts,
    createAccount,
    updateAccount,
    deleteAccount,
  };
}
