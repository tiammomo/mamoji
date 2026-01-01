'use client';

import { useState, useEffect, useMemo } from 'react';
import { Header } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Switch } from '@/components/ui/switch';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Building2,
  Wallet,
  CreditCard,
  PiggyBank,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import {
  ASSET_CATEGORY,
  ASSET_CATEGORY_LABELS,
  FUND_SUB_TYPE_LABELS,
  CREDIT_SUB_TYPE_LABELS,
  TOPUP_SUB_TYPE_LABELS,
  INVESTMENT_SUB_TYPE_LABELS,
  DEBT_SUB_TYPE_LABELS,
  getSubTypeOptions,
  FUND_SUB_TYPE,
  CREDIT_SUB_TYPE,
  TOPUP_SUB_TYPE,
  INVESTMENT_SUB_TYPE,
  DEBT_SUB_TYPE,
  BANK_CARD_TYPE_LABELS,
  BANK_LIST,
} from '@/lib/constants';
import { get, post, put, del } from '@/lib/api';
import { useUser } from '@/stores/auth';

// 资产账户类型
type AssetCategory = typeof ASSET_CATEGORY.FUND | typeof ASSET_CATEGORY.CREDIT | typeof ASSET_CATEGORY.TOPUP | typeof ASSET_CATEGORY.INVESTMENT | typeof ASSET_CATEGORY.DEBT;

// 账户数据
interface Account {
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
  outstandingBalance: number; // 总欠款（信用卡）
  billingDate: number;         // 出账日期（1-28）
  repaymentDate: number;       // 还款日期（1-28）
  availableBalance: number;
  investedAmount: number;
  totalValue: number;
  includeInTotal: number;
  status: number;
  createdAt: string;
}

// 账户汇总
interface AccountSummary {
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
interface AccountFormData {
  assetCategory: AssetCategory;
  subType: string;
  name: string;
  currency: string;
  accountNo: string;
  bankName: string;
  bankCode: string;          // 银行代码（银行信用卡）
  bankCardType: string;
  creditLimit: string;       // 总额度
  outstandingBalance: string; // 总欠款
  billingDate: string;       // 出账日期
  repaymentDate: string;     // 还款日期
  availableBalance: string;
  investedAmount: string;
  totalValue: string;
  includeInTotal: boolean;
}

// 币种选项
const CURRENCY_OPTIONS = [
  { value: 'CNY', label: '人民币 (CNY)' },
  { value: 'USD', label: '美元 (USD)' },
  { value: 'EUR', label: '欧元 (EUR)' },
  { value: 'GBP', label: '英镑 (GBP)' },
  { value: 'JPY', label: '日元 (JPY)' },
  { value: 'HKD', label: '港币 (HKD)' },
];

// 判断是否为银行卡类型（需要开户行信息）
const isBankType = (category: AssetCategory, subType: string): boolean => {
  return category === ASSET_CATEGORY.FUND && subType === FUND_SUB_TYPE.BANK;
};

// 判断是否为银行信用卡类型
const isBankCardType = (category: AssetCategory, subType: string): boolean => {
  return category === ASSET_CATEGORY.CREDIT && subType === CREDIT_SUB_TYPE.BANK_CARD;
};

// 判断是否为信用卡类型（银行信用卡、花呗、其他）
const isCreditCardType = (category: AssetCategory): boolean => {
  return category === ASSET_CATEGORY.CREDIT;
};

// 出账日期选项（1-28日）
const BILLING_DATE_OPTIONS = Array.from({ length: 28 }, (_, i) => ({
  value: (i + 1).toString(),
  label: `每月${i + 1}日`,
}));

// 还款日期选项（1-28日）
const REPAYMENT_DATE_OPTIONS = Array.from({ length: 28 }, (_, i) => ({
  value: (i + 1).toString(),
  label: `每月${i + 1}日`,
}));

// 分类配置
const CATEGORY_CONFIG = {
  [ASSET_CATEGORY.FUND]: {
    icon: Wallet,
    color: 'text-blue-600 bg-blue-100',
    subTypes: FUND_SUB_TYPE,
    labels: FUND_SUB_TYPE_LABELS,
    hasBankFields: true,
    hasCreditLimit: false,
    hasInvestedAmount: false,
  },
  [ASSET_CATEGORY.CREDIT]: {
    icon: CreditCard,
    color: 'text-orange-600 bg-orange-100',
    subTypes: CREDIT_SUB_TYPE,
    labels: CREDIT_SUB_TYPE_LABELS,
    hasBankFields: false,
    hasCreditLimit: true,
    hasInvestedAmount: false,
  },
  [ASSET_CATEGORY.TOPUP]: {
    icon: PiggyBank,
    color: 'text-green-600 bg-green-100',
    subTypes: TOPUP_SUB_TYPE,
    labels: TOPUP_SUB_TYPE_LABELS,
    hasBankFields: false,
    hasCreditLimit: false,
    hasInvestedAmount: false,
  },
  [ASSET_CATEGORY.INVESTMENT]: {
    icon: TrendingUp,
    color: 'text-purple-600 bg-purple-100',
    subTypes: INVESTMENT_SUB_TYPE,
    labels: INVESTMENT_SUB_TYPE_LABELS,
    hasBankFields: true,
    hasCreditLimit: false,
    hasInvestedAmount: true,
  },
  [ASSET_CATEGORY.DEBT]: {
    icon: AlertCircle,
    color: 'text-red-600 bg-red-100',
    subTypes: DEBT_SUB_TYPE,
    labels: DEBT_SUB_TYPE_LABELS,
    hasBankFields: false,
    hasCreditLimit: false,
    hasInvestedAmount: false,
  },
};

export default function AssetsPage() {
  const { toast } = useToast();
  const user = useUser();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [summary, setSummary] = useState<AccountSummary | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  // 调试：打印用户信息
  useEffect(() => {
    console.log('[Assets] 当前用户信息:', JSON.stringify(user, null, 2));
  }, [user]);

  // 加载数据
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isInitialLoading) {
        console.log('[Assets] 加载超时，强制结束loading状态');
        setIsInitialLoading(false);
      }
    }, 5000);

    fetchAccounts();
    fetchSummary();

    return () => clearTimeout(timer);
  }, [user?.enterpriseId]);

  const fetchAccounts = async () => {
    try {
      const data = await get<Account[]>('/api/v1/accounts');
      console.log('[Assets] 账户列表:', JSON.stringify(data, null, 2));
      setAccounts(data || []);
    } catch (error) {
      console.error('获取账户列表失败:', error);
      setAccounts([]);
      toast({
        title: '加载失败',
        description: '无法加载账户列表',
        variant: 'destructive',
      });
    } finally {
      setIsInitialLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const data = await get<AccountSummary>('/api/v1/accounts/summary');
      setSummary(data);
    } catch (error) {
      console.error('获取账户汇总失败:', error);
    }
  };

  // 根据筛选条件过滤账户
  const filteredAccounts = useMemo(() => {
    return accounts.filter((account) => {
      const matchesSearch = !searchQuery ||
        account.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (account.accountNo && account.accountNo.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (account.bankName && account.bankName.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory = categoryFilter === 'all' || account.assetCategory === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [accounts, searchQuery, categoryFilter]);

  // 按分类分组统计
  const categoryStats = useMemo(() => {
    const stats: Record<string, { count: number; totalValue: number }> = {};
    accounts.forEach((account) => {
      if (!stats[account.assetCategory]) {
        stats[account.assetCategory] = { count: 0, totalValue: 0 };
      }
      stats[account.assetCategory].count += 1;
      stats[account.assetCategory].totalValue += account.totalValue || account.availableBalance;
    });
    return stats;
  }, [accounts]);

  // 获取子类型标签
  const getSubTypeLabel = (category: AssetCategory, subType: string): string => {
    const labels: Record<string, string> = getSubTypeOptions(category);
    return labels[subType] || subType;
  };

  // 打开新增对话框
  const handleAddAccount = () => {
    setEditingAccount(null);
    setFormData({
      assetCategory: ASSET_CATEGORY.FUND,
      subType: '',
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
    setIsDialogOpen(false);
    setTimeout(() => setIsDialogOpen(true), 0);
  };

  // 编辑账户
  const handleEditClick = (account: Account) => {
    setEditingAccount(account);
    // 根据 bankName 查找对应的 bankCode
    const bankCode = BANK_LIST.find(b => b.label === account.bankName)?.value || '';
    setFormData({
      assetCategory: account.assetCategory as AssetCategory,
      subType: account.subType,
      name: account.name,
      currency: account.currency || 'CNY',
      accountNo: account.accountNo || '',
      bankName: account.bankName || '',
      bankCode: bankCode,
      bankCardType: account.bankCardType || '',
      creditLimit: account.creditLimit > 0 ? account.creditLimit.toString() : '',
      outstandingBalance: account.outstandingBalance > 0 ? account.outstandingBalance.toString() : '',
      billingDate: account.billingDate > 0 ? account.billingDate.toString() : '',
      repaymentDate: account.repaymentDate > 0 ? account.repaymentDate.toString() : '',
      availableBalance: account.availableBalance > 0 ? account.availableBalance.toString() : '',
      investedAmount: account.investedAmount > 0 ? account.investedAmount.toString() : '',
      totalValue: account.totalValue > 0 ? account.totalValue.toString() : '',
      includeInTotal: account.includeInTotal === 1,
    });
    setIsDialogOpen(true);
  };

  // 删除账户
  const handleDeleteClick = async (accountId: number) => {
    if (!confirm('确定要删除这个账户吗？')) return;

    try {
      await del(`/api/v1/accounts/${accountId}`);
      setAccounts((prev) => prev.filter((a) => a.accountId !== accountId));
      toast({
        title: '删除成功',
        description: '账户已删除',
      });
      fetchSummary();
    } catch (error) {
      console.error('删除失败:', error);
      toast({
        title: '删除失败',
        description: '请稍后重试',
        variant: 'destructive',
      });
    }
  };

  // 表单状态
  const [formData, setFormData] = useState<AccountFormData>({
    assetCategory: ASSET_CATEGORY.FUND,
    subType: '',
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

  // 验证表单
  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      toast({
        title: '验证失败',
        description: '请输入账户名称',
        variant: 'destructive',
      });
      return false;
    }

    if (!formData.subType) {
      toast({
        title: '验证失败',
        description: '请选择子类型',
        variant: 'destructive',
      });
      return false;
    }

    // 银行卡类型必须填写开户行信息
    if (isBankType(formData.assetCategory, formData.subType) && !formData.bankName.trim()) {
      toast({
        title: '验证失败',
        description: '银行卡类型必须填写开户银行信息',
        variant: 'destructive',
      });
      return false;
    }

    // 银行信用卡必须选择发卡银行
    if (isBankCardType(formData.assetCategory, formData.subType) && !formData.bankCode.trim()) {
      toast({
        title: '验证失败',
        description: '请选择发卡银行',
        variant: 'destructive',
      });
      return false;
    }

    const availableBalance = parseFloat(formData.availableBalance) || 0;
    const investedAmount = parseFloat(formData.investedAmount) || 0;
    const totalValue = parseFloat(formData.totalValue) || 0;
    const creditLimit = parseFloat(formData.creditLimit) || 0;
    const outstandingBalance = parseFloat(formData.outstandingBalance) || 0;

    if (availableBalance < 0 || investedAmount < 0 || totalValue < 0 || creditLimit < 0 || outstandingBalance < 0) {
      toast({
        title: '验证失败',
        description: '金额不能为负数',
        variant: 'destructive',
      });
      return false;
    }

    return true;
  };

  // 提交表单
  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const availableBalance = parseFloat(formData.availableBalance) || 0;
      const investedAmount = parseFloat(formData.investedAmount) || 0;
      const totalValue = parseFloat(formData.totalValue) || (availableBalance + investedAmount);
      const creditLimit = parseFloat(formData.creditLimit) || 0;
      const outstandingBalance = parseFloat(formData.outstandingBalance) || 0;
      const billingDate = parseInt(formData.billingDate) || 0;
      const repaymentDate = parseInt(formData.repaymentDate) || 0;
      const includeInTotal = formData.includeInTotal ? 1 : 0;

      const accountData = {
        assetCategory: formData.assetCategory,
        subType: formData.subType,
        name: formData.name.trim(),
        currency: formData.currency,
        accountNo: formData.accountNo.trim() || undefined,
        bankName: isBankType(formData.assetCategory, formData.subType) ? formData.bankName.trim() : undefined,
        bankCardType: formData.bankCardType || undefined,
        creditLimit,
        outstandingBalance,
        billingDate,
        repaymentDate,
        availableBalance,
        investedAmount,
        totalValue,
        includeInTotal,
      };

      let savedAccount: Account;

      if (editingAccount) {
        // 编辑模式
        await put<Account>(`/api/v1/accounts/${editingAccount.accountId}`, accountData);

        setAccounts((prev) =>
          prev.map((a) =>
            a.accountId === editingAccount.accountId
              ? { ...a, ...accountData, totalValue }
              : a
          )
        );

        savedAccount = { ...editingAccount, ...accountData, totalValue };

        toast({
          title: '保存成功',
          description: `已更新账户 "${savedAccount.name}"`,
        });
      } else {
        // 新增模式
        savedAccount = await post<Account>('/api/v1/accounts', accountData);
        setAccounts((prev) => [savedAccount, ...prev]);

        toast({
          title: '保存成功',
          description: `已创建账户 "${savedAccount.name}"`,
        });
      }

      setIsDialogOpen(false);
      fetchSummary();
    } catch (error: unknown) {
      console.error('保存账户失败:', error);
      const errorMessage = error instanceof Error ? error.message : '请稍后重试';
      toast({
        title: '保存失败',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 获取当前分类配置
  const currentCategoryConfig = CATEGORY_CONFIG[formData.assetCategory];

  return (
    <div className="pt-2 px-4 pb-4 space-y-4">
      <Header
        title="资产管理"
        subtitle="统一管理所有资产账户"
      />

      {/* 汇总卡片 */}
      {summary && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                总资产
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(summary.totalBalance)}
              </div>
              <div className="flex items-center gap-1 mt-1">
                {summary.balanceMoM >= 0 ? (
                  <TrendingUp className="w-3 h-3 text-success" />
                ) : (
                  <TrendingUp className="w-3 h-3 text-destructive transform rotate-180" />
                )}
                <span className={`text-xs ${summary.balanceMoM >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {summary.balanceMoM >= 0 ? '+' : ''}{summary.balanceMoM.toFixed(1)}%
                </span>
                <span className="text-xs text-muted-foreground">环比上月</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                可用资金
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {formatCurrency(summary.totalAvailable)}
              </div>
              <div className="flex items-center gap-1 mt-1">
                {summary.availableMoM >= 0 ? (
                  <TrendingUp className="w-3 h-3 text-success" />
                ) : (
                  <TrendingUp className="w-3 h-3 text-destructive transform rotate-180" />
                )}
                <span className={`text-xs ${summary.availableMoM >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {summary.availableMoM >= 0 ? '+' : ''}{summary.availableMoM.toFixed(1)}%
                </span>
                <span className="text-xs text-muted-foreground">环比上月</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                投资理财
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {formatCurrency(summary.totalInvested)}
              </div>
              <div className="flex items-center gap-1 mt-1">
                {summary.investedMoM >= 0 ? (
                  <TrendingUp className="w-3 h-3 text-success" />
                ) : (
                  <TrendingUp className="w-3 h-3 text-destructive transform rotate-180" />
                )}
                <span className={`text-xs ${summary.investedMoM >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {summary.investedMoM >= 0 ? '+' : ''}{summary.investedMoM.toFixed(1)}%
                </span>
                <span className="text-xs text-muted-foreground">环比上月</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 分类统计 */}
      <div className="grid gap-2 md:grid-cols-5">
        {Object.entries(ASSET_CATEGORY_LABELS).map(([key, label]) => {
          const stat = categoryStats[key] || { count: 0, totalValue: 0 };
          const config = CATEGORY_CONFIG[key as AssetCategory];
          const Icon = config?.icon || Building2;
          return (
            <Card
              key={key}
              className={`cursor-pointer transition-all ${
                categoryFilter === key ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => setCategoryFilter(categoryFilter === key ? 'all' : key)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className={`p-2 rounded-lg ${config?.color || 'bg-gray-100'}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <Badge variant="secondary">{stat.count}</Badge>
                </div>
                <div className="mt-2">
                  <div className="font-medium text-sm">{label}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatCurrency(stat.totalValue)}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 操作栏 */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="relative max-w-md flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="搜索账户..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Select
            value={categoryFilter}
            onValueChange={(value) => setCategoryFilter(value)}
          >
            <SelectTrigger className="w-36">
              <SelectValue placeholder="全部分类" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部分类</SelectItem>
              {Object.entries(ASSET_CATEGORY_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" onClick={handleAddAccount}>
            <Plus className="w-4 h-4 mr-2" />
            添加账户
          </Button>
        </div>
      </div>

      {/* 账户列表 */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {isInitialLoading ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">加载中...</p>
              </div>
            ) : filteredAccounts.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">暂无账户</p>
                <Button className="mt-4" onClick={handleAddAccount}>
                  <Plus className="w-4 h-4 mr-2" />
                  添加第一个账户
                </Button>
              </div>
            ) : (
              filteredAccounts.map((account) => {
                const config = CATEGORY_CONFIG[account.assetCategory as AssetCategory];
                const Icon = config?.icon || Building2;
                const subTypeLabel = getSubTypeLabel(
                  account.assetCategory as AssetCategory,
                  account.subType
                );

                return (
                  <div
                    key={account.accountId}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${config?.color || 'bg-gray-100'}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{account.name}</p>
                          <Badge variant="outline" className="text-xs">
                            {ASSET_CATEGORY_LABELS[account.assetCategory as AssetCategory]}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {subTypeLabel}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                          {account.bankName && (
                            <>
                              <span>{account.bankName}</span>
                              <span>·</span>
                            </>
                          )}
                          {account.accountNo && (
                            <>
                              <span>{account.accountNo}</span>
                              <span>·</span>
                            </>
                          )}
                          <span>{account.createdAt?.split(' ')[0]}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="text-lg font-semibold">
                          {formatCurrency(account.totalValue || account.availableBalance)}
                        </span>
                        {account.assetCategory === ASSET_CATEGORY.CREDIT && account.creditLimit > 0 && (
                          <div className="text-xs text-muted-foreground">
                            额度: {formatCurrency(account.creditLimit)}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditClick(account)}
                          title="编辑"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClick(account.accountId)}
                          title="删除"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* 添加/编辑账户对话框 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{editingAccount ? '编辑账户' : '添加账户'}</DialogTitle>
            <DialogDescription>
              {editingAccount ? '修改账户信息' : '添加新的资产账户'}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-1">
            <div className="grid grid-cols-2 gap-x-4 gap-y-4 py-4">
            {/* 资产大类 */}
            <div className="space-y-2">
              <Label>资产大类 *</Label>
              <Select
                value={formData.assetCategory}
                onValueChange={(value: AssetCategory) => {
                  setFormData({
                    ...formData,
                    assetCategory: value,
                    subType: '',
                    bankCardType: '',
                    bankName: '',
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择资产大类" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ASSET_CATEGORY_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 子类型 */}
            <div className="space-y-2">
              <Label>子类型 *</Label>
              <Select
                value={formData.subType}
                onValueChange={(value) => setFormData({ ...formData, subType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择子类型" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(getSubTypeOptions(formData.assetCategory)).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 账户名称 */}
            <div className="col-span-2 space-y-2">
              <Label htmlFor="name">账户名称 *</Label>
              <Input
                id="name"
                placeholder="请输入账户名称"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            {/* 币种 */}
            <div className="space-y-2">
              <Label>币种</Label>
              <Select
                value={formData.currency}
                onValueChange={(value) => setFormData({ ...formData, currency: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择币种" />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 银行卡号（仅银行卡类型显示） */}
            {isBankType(formData.assetCategory, formData.subType) ? (
              <div className="space-y-2">
                <Label htmlFor="accountNo">银行卡号</Label>
                <Input
                  id="accountNo"
                  placeholder="请输入银行卡号"
                  value={formData.accountNo}
                  onChange={(e) => setFormData({ ...formData, accountNo: e.target.value })}
                />
              </div>
            ) : isCreditCardType(formData.assetCategory) ? (
              <div className="space-y-2">
                <Label>发卡银行 {isBankCardType(formData.assetCategory, formData.subType) && '*'}</Label>
                {isBankCardType(formData.assetCategory, formData.subType) ? (
                  <Select
                    value={formData.bankCode}
                    onValueChange={(value) => {
                      const bank = BANK_LIST.find(b => b.value === value);
                      setFormData({ ...formData, bankCode: value, bankName: bank?.label || '' });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择发卡银行" />
                    </SelectTrigger>
                    <SelectContent>
                      {BANK_LIST.map((bank) => (
                        <SelectItem key={bank.value} value={bank.value}>
                          {bank.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    placeholder="请输入信用卡类型"
                    disabled
                    className="bg-muted"
                  />
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <Label>发卡银行</Label>
                <Input
                  placeholder="请输入信用卡类型"
                  disabled
                  className="bg-muted"
                />
              </div>
            )}

            {/* 开户银行（仅银行卡类型显示） */}
            {isBankType(formData.assetCategory, formData.subType) && (
              <div className="space-y-2">
                <Label>开户银行 *</Label>
                <Select
                  value={formData.bankCode}
                  onValueChange={(value) => {
                    const bank = BANK_LIST.find(b => b.value === value);
                    setFormData({ ...formData, bankCode: value, bankName: bank?.label || '' });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择或搜索开户银行" />
                  </SelectTrigger>
                  <SelectContent>
                    {BANK_LIST.map((bank) => (
                      <SelectItem key={bank.value} value={bank.value}>
                        {bank.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* 银行卡类型（仅银行卡显示） */}
            {isBankType(formData.assetCategory, formData.subType) && (
              <div className="space-y-2">
                <Label>银行卡类型</Label>
                <Select
                  value={formData.bankCardType}
                  onValueChange={(value) => setFormData({ ...formData, bankCardType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择银行卡类型" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(BANK_CARD_TYPE_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* 总额度（所有信用卡类型显示） */}
            {isCreditCardType(formData.assetCategory) && (
              <div className="space-y-2">
                <Label htmlFor="creditLimit">总额度</Label>
                <Input
                  id="creditLimit"
                  type="number"
                  placeholder="请输入总额度"
                  value={formData.creditLimit}
                  onChange={(e) => setFormData({ ...formData, creditLimit: e.target.value })}
                />
              </div>
            )}

            {/* 总欠款（所有信用卡类型显示） */}
            {isCreditCardType(formData.assetCategory) && (
              <div className="space-y-2">
                <Label htmlFor="outstandingBalance">总欠款</Label>
                <Input
                  id="outstandingBalance"
                  type="number"
                  placeholder="请输入总欠款金额"
                  value={formData.outstandingBalance}
                  onChange={(e) => setFormData({ ...formData, outstandingBalance: e.target.value })}
                />
              </div>
            )}

            {/* 出账日期（所有信用卡类型显示） */}
            {isCreditCardType(formData.assetCategory) && (
              <div className="space-y-2">
                <Label>出账日期</Label>
                <Select
                  value={formData.billingDate}
                  onValueChange={(value) => setFormData({ ...formData, billingDate: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择出账日期" />
                  </SelectTrigger>
                  <SelectContent>
                    {BILLING_DATE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* 还款日期（所有信用卡类型显示） */}
            {isCreditCardType(formData.assetCategory) && (
              <div className="space-y-2">
                <Label>还款日期</Label>
                <Select
                  value={formData.repaymentDate}
                  onValueChange={(value) => setFormData({ ...formData, repaymentDate: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择还款日期" />
                  </SelectTrigger>
                  <SelectContent>
                    {REPAYMENT_DATE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* 账户余额（非信用卡类型显示） */}
            {!isCreditCardType(formData.assetCategory) && (
              <div className="space-y-2">
                <Label htmlFor="availableBalance">账户余额</Label>
                <Input
                  id="availableBalance"
                  type="number"
                  placeholder="请输入账户余额"
                  value={formData.availableBalance}
                  onChange={(e) => setFormData({ ...formData, availableBalance: e.target.value })}
                />
              </div>
            )}

            {/* 投资金额（仅投资理财显示） */}
            {currentCategoryConfig?.hasInvestedAmount && (
              <div className="space-y-2">
                <Label htmlFor="investedAmount">投资金额</Label>
                <Input
                  id="investedAmount"
                  type="number"
                  placeholder="请输入投资金额"
                  value={formData.investedAmount}
                  onChange={(e) => setFormData({ ...formData, investedAmount: e.target.value })}
                />
              </div>
            )}

            {/* 总价值（可选，用于覆盖自动计算） */}
            <div className="col-span-2 space-y-2">
              <Label htmlFor="totalValue">账户总价值</Label>
              <Input
                id="totalValue"
                type="number"
                placeholder="可选，不填则自动计算"
                value={formData.totalValue}
                onChange={(e) => setFormData({ ...formData, totalValue: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                账户余额 {formData.availableBalance || 0}
                {formData.investedAmount ? ` + 投资金额 ${formData.investedAmount}` : ''}
                {formData.assetCategory === ASSET_CATEGORY.CREDIT && formData.creditLimit ? `（信用额度 ${formData.creditLimit}）` : ''}
              </p>
            </div>

            {/* 是否计入总资产 */}
            <div className="col-span-2 flex items-center justify-between pt-2 border-t mt-2">
              <div className="space-y-0.5">
                <Label htmlFor="includeInTotal" className="text-base">计入总资产</Label>
                <p className="text-xs text-muted-foreground">开启后该账户金额将计入总资产统计</p>
              </div>
              <Switch
                id="includeInTotal"
                checked={formData.includeInTotal}
                onCheckedChange={(checked) => setFormData({ ...formData, includeInTotal: checked })}
              />
            </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isLoading}>
              取消
            </Button>
            <Button onClick={handleSubmit} disabled={isLoading}>
              {isLoading ? '保存中...' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
