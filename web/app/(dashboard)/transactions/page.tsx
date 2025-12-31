'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Header } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import {
  Plus,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Download,
  Calendar,
  X,
  Edit,
  Trash2,
  ChevronDown,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { formatCurrency, formatDate, downloadCSV } from '@/lib/utils';
import {
  TRANSACTION_TYPE,
  INCOME_CATEGORY_LABELS,
  EXPENSE_CATEGORY_LABELS,
} from '@/lib/constants';
import { get, post, put, del } from '@/lib/api';
import { useUser } from '@/stores/auth';

// 交易类型 - 使用string类型以兼容后端返回的任何值
type TransactionType = string;

// 交易数据
interface Transaction {
  transactionId: number;
  type: TransactionType;
  category: string;
  amount: number;
  note: string;
  accountId: number;
  accountName: string;
  budgetId?: number;
  occurredAt: string;
  tags: string[];
  images?: string[];
  status?: number;
  createdAt?: string;
}

// 表单数据
interface TransactionFormData {
  type: TransactionType;
  amount: string;
  category: string;
  accountId: string;
  date: string;
  note: string;
  budgetId?: string; // 关联预算ID
}

// 预算选项数据（使用与后端一致的字段名）
interface BudgetOption {
  budgetId: number;
  name: string;
  category: string;
  totalAmount: number;
  usedAmount: number;
  periodStart: string;
  periodEnd: string;
  status: string; // 用于过滤活跃预算
}

export default function TransactionsPage() {
  const { toast } = useToast();
  const user = useUser();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<{ accountId: number; name: string }[]>([]);
  const [budgets, setBudgets] = useState<BudgetOption[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // 调试：打印用户信息
  useEffect(() => {
    console.log('[User] 当前用户信息:', JSON.stringify(user, null, 2));
  }, [user]);

  // 筛选状态
  const [filter, setFilter] = useState({
    type: '',
    category: '',
    accountId: '',
    dateRange: '',
  });

  // ========== 时间筛选功能 ==========
  // 获取北京时间（Asia/Shanghai）
  const getBeijingDate = () => {
    // 通过添加时区偏移获取北京时间
    const now = new Date();
    const beijingTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);
    return beijingTime;
  };

  // 格式化日期为 YYYY-MM-DD
  const formatDateToString = (date: Date) => {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // 获取当月最后一天
  const getMonthLastDay = (year: number, month: number) => {
    return new Date(Date.UTC(year, month + 1, 0));
  };

  // 默认时间范围：当月第一天到今天（基于北京时间）
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>(() => {
    const beijingNow = getBeijingDate();
    const year = beijingNow.getUTCFullYear();
    const month = beijingNow.getUTCMonth();
    const firstDay = new Date(Date.UTC(year, month, 1));
    const today = new Date(Date.UTC(year, month, beijingNow.getUTCDate()));
    return {
      start: formatDateToString(firstDay),
      end: formatDateToString(today),
    };
  });

  // 快速选择时间范围
  const quickRanges = [
    { label: '今日', value: 'today' },
    { label: '本周', value: 'week' },
    { label: '本月', value: 'month' },
    { label: '本季', value: 'quarter' },
    { label: '本年', value: 'year' },
  ];

  // 计算时间范围（基于北京时间，严格按照自然周/月/年定义）
  const calculateDateRange = (type: string): { start: string; end: string } => {
    const beijingNow = getBeijingDate();
    const year = beijingNow.getUTCFullYear();
    const month = beijingNow.getUTCMonth();
    const day = beijingNow.getUTCDate();

    switch (type) {
      case 'today':
        // 今日：当天 00:00:00 至 23:59:59
        return {
          start: formatDateToString(beijingNow),
          end: formatDateToString(beijingNow),
        };
      case 'week':
        // 本周：本周一 00:00:00 至 本周日 23:59:59
        // 获取本周一（星期日为0，星期一到星期六为1-6）
        const dayOfWeek = beijingNow.getUTCDay();
        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const weekStart = new Date(Date.UTC(year, month, day + mondayOffset));
        const weekEnd = new Date(Date.UTC(year, month, day + mondayOffset + 6));
        return {
          start: formatDateToString(weekStart),
          end: formatDateToString(weekEnd),
        };
      case 'month':
        // 本月：当月1号 00:00:00 至 当月最后一天 23:59:59
        const monthStart = new Date(Date.UTC(year, month, 1));
        const monthEnd = getMonthLastDay(year, month);
        return {
          start: formatDateToString(monthStart),
          end: formatDateToString(monthEnd),
        };
      case 'quarter':
        // 本季：本季度第一天 00:00:00 至 本季度最后一天 23:59:59
        const quarterMonth = Math.floor(month / 3) * 3;
        const quarterStart = new Date(Date.UTC(year, quarterMonth, 1));
        const quarterEnd = getMonthLastDay(year, quarterMonth + 2);
        return {
          start: formatDateToString(quarterStart),
          end: formatDateToString(quarterEnd),
        };
      case 'year':
        // 本年：当年1月1日 00:00:00 至 当年12月31日 23:59:59
        return {
          start: `${year}-01-01`,
          end: `${year}-12-31`,
        };
      default:
        return {
          start: formatDateToString(beijingNow),
          end: formatDateToString(beijingNow),
        };
    }
  };

  // 格式化日期显示
  const formatDateRangeDisplay = (start: string, end: string) => {
    return `${start} 至 ${end}`;
  };

  // 检查交易日期是否在范围内
  const isTransactionInRange = (tx: Transaction) => {
    // 兼容后端返回的两种日期格式：ISO (2025-01-01T00:00:00) 或 普通格式 (2025-01-01 00:00:00)
    let txDate = tx.occurredAt;
    if (txDate.includes('T')) {
      txDate = txDate.split('T')[0];
    } else if (txDate.includes(' ')) {
      txDate = txDate.split(' ')[0];
    }
    return txDate >= dateRange.start && txDate <= dateRange.end;
  };
  // ========== 时间筛选功能结束 ==========

  // 表单状态
  const [formData, setFormData] = useState<TransactionFormData>({
    type: 'expense',
    amount: '',
    category: '',
    accountId: '',
    date: formatDate(new Date(), 'YYYY-MM-DD'),
    note: '',
  });

  // 预算搜索状态
  const [budgetSearchQuery, setBudgetSearchQuery] = useState('');
  const [isBudgetSelectOpen, setIsBudgetSelectOpen] = useState(false);

  // 加载数据
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isInitialLoading) {
        console.log('[Transactions] 加载超时，强制结束loading状态');
        setIsInitialLoading(false);
      }
    }, 5000); // 5秒超时

    fetchTransactions();
    fetchAccounts();
    fetchBudgets();

    return () => clearTimeout(timer);
  }, [user?.enterpriseId]);

  const fetchTransactions = async () => {
    try {
      const response = await get<Transaction[]>('/api/v1/transactions');
      const transactions = response || [];
      console.log('[Transactions] 收支记录:', JSON.stringify(transactions, null, 2));
      // 检查是否有关联预算
      const transactionsWithBudget = transactions.filter(t => t.budgetId);
      console.log('[Transactions] 有关联预算的交易:', JSON.stringify(transactionsWithBudget, null, 2));
      setTransactions(transactions);
    } catch (error) {
      console.error('获取交易记录失败:', error);
      setTransactions([]);
      toast({
        title: '加载失败',
        description: '无法加载交易记录',
        variant: 'destructive',
      });
    } finally {
      setIsInitialLoading(false);
    }
  };

  const fetchAccounts = async () => {
    try {
      const data = await get<{ accountId: number; name: string }[]>('/api/v1/accounts');
      setAccounts(data || []);
    } catch (error) {
      console.error('无法加载账户列表');
    }
  };

  // 获取预算列表（用于关联预算）
  const fetchBudgets = async () => {
    try {
      // 后端从 JWT Token 中获取 enterpriseId，无需传参
      console.log('[Budgets] 请求预算列表...');
      const data = await get<BudgetOption[]>('/api/v1/budgets');
      console.log('[Budgets] 原始预算数据:', JSON.stringify(data, null, 2));
      if (data) {
        console.log('[Budgets] 预算数量:', data.length);
        console.log('[Budgets] 预算列表:', data.map(b => ({ id: b.budgetId, name: b.name, status: b.status, period: `${b.periodStart} ~ ${b.periodEnd}` })));
        setBudgets(data);
      } else {
        console.log('[Budgets] 返回数据为空');
      }
    } catch (error) {
      console.error('[Budgets] 无法加载预算列表:', error);
    }
  };

  // 筛选有效预算（只显示状态为 active 的预算）
  const availableBudgets = useMemo(() => {
    return budgets.filter((budget) => {
      // 只处理支出类型
      if (formData.type !== 'expense') return false;
      // 排除软删除的预算（status不为active）
      if (budget.status !== 'active') return false;
      return true;
    });
  }, [budgets, formData.type]);

  // 检查预算是否在有效期内
  const isBudgetExpired = (periodEnd: string) => {
    const now = new Date();
    const end = new Date(periodEnd + 'T23:59:59');
    return now > end;
  };

  // 根据搜索关键词筛选预算
  const filteredBudgets = useMemo(() => {
    const query = budgetSearchQuery.toLowerCase().trim();
    if (!query) return availableBudgets;
    return availableBudgets.filter((budget) =>
      budget.name.toLowerCase().includes(query) ||
      budget.category.toLowerCase().includes(query)
    );
  }, [availableBudgets, budgetSearchQuery]);

  // 搜索结果最多显示10条
  const searchedBudgets = useMemo(() => {
    return filteredBudgets.slice(0, 10);
  }, [filteredBudgets]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const txType = String(tx.type).trim();
      const tabValue = activeTab.trim();

      const typeMatches = tabValue === 'all' ||
        (tabValue === 'income' && txType === 'income') ||
        (tabValue === 'expense' && txType === 'expense');

      const matchesSearch = !searchQuery ||
        (tx.note?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
        (tx.tags?.some((tag) => (tag?.toLowerCase() ?? '').includes(searchQuery.toLowerCase())) ?? false);

      const matchesFilter = (!filter.type || String(tx.type).trim() === filter.type.trim()) &&
        (!filter.category || tx.category === filter.category) &&
        (!filter.accountId || tx.accountId.toString() === filter.accountId);

      // 时间范围筛选
      const matchesDateRange = isTransactionInRange(tx);

      return typeMatches && matchesSearch && matchesFilter && matchesDateRange;
    });
  }, [transactions, activeTab, searchQuery, filter, dateRange]);

  // 统计数据基于时间范围
  const totalIncome = useMemo(() => {
    return transactions
      .filter((tx) => tx.type === 'income' && isTransactionInRange(tx))
      .reduce((sum, tx) => sum + tx.amount, 0);
  }, [transactions, dateRange]);

  const totalExpense = useMemo(() => {
    return transactions
      .filter((tx) => tx.type === 'expense' && isTransactionInRange(tx))
      .reduce((sum, tx) => sum + tx.amount, 0);
  }, [transactions, dateRange]);

  // ========== 上月统计数据（用于环比计算） ==========
  // 计算上月的时间范围
  const lastMonthRange = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-11

    // 上月
    let lastYear = currentYear;
    let lastMonth = currentMonth - 1;
    if (lastMonth < 0) {
      lastMonth = 11;
      lastYear--;
    }

    const start = new Date(lastYear, lastMonth, 1);
    const end = new Date(lastYear, lastMonth + 1, 0); // 上月最后一天

    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    };
  }, []);

  // 检查交易是否在指定时间范围内
  const isTransactionInLastMonthRange = useCallback((tx: Transaction) => {
    const txDate = new Date(tx.occurredAt);
    const start = new Date(lastMonthRange.start);
    const end = new Date(lastMonthRange.end);
    // 设置时间为当天0点
    txDate.setHours(0, 0, 0, 0);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return txDate >= start && txDate <= end;
  }, [lastMonthRange]);

  // 上月收入和支出
  const lastMonthIncome = useMemo(() => {
    return transactions
      .filter((tx) => tx.type === 'income' && isTransactionInLastMonthRange(tx))
      .reduce((sum, tx) => sum + tx.amount, 0);
  }, [transactions, isTransactionInLastMonthRange]);

  const lastMonthExpense = useMemo(() => {
    return transactions
      .filter((tx) => tx.type === 'expense' && isTransactionInLastMonthRange(tx))
      .reduce((sum, tx) => sum + tx.amount, 0);
  }, [transactions, isTransactionInLastMonthRange]);

  // 计算环比增长率 (本月 - 上月) / 上月 * 100
  const calculateMoMChange = (current: number, last: number): { value: number; isPositive: boolean } => {
    if (last === 0) {
      // 上月为0，本月有收入则视为大幅增长
      return { value: current > 0 ? 100 : 0, isPositive: current >= 0 };
    }
    const change = ((current - last) / last) * 100;
    return { value: Math.abs(change), isPositive: change >= 0 };
  };

  const incomeMoM = useMemo(() => calculateMoMChange(totalIncome, lastMonthIncome), [totalIncome, lastMonthIncome]);
  const expenseMoM = useMemo(() => calculateMoMChange(totalExpense, lastMonthExpense), [totalExpense, lastMonthExpense]);

  // 打开新增对话框
  const handleAddTransaction = () => {
    setEditingTransaction(null);
    // 默认选择"不关联预算"
    setFormData({
      type: 'expense',
      amount: '',
      category: '',
      accountId: '',
      date: formatDate(new Date(), 'YYYY-MM-DD'),
      note: '',
      budgetId: '', // 默认不关联预算
    });
    // 重置预算搜索状态
    setBudgetSearchQuery('');
    setIsDialogOpen(false);
    setTimeout(() => setIsDialogOpen(true), 0);
  };

  // 编辑交易
  const handleEditClick = (tx: Transaction) => {
    setEditingTransaction(tx);
    setFormData({
      type: tx.type,
      amount: tx.amount.toString(),
      category: tx.category,
      accountId: tx.accountId.toString(),
      date: formatDate(tx.occurredAt, 'YYYY-MM-DD'),
      note: tx.note,
      budgetId: tx.budgetId ? tx.budgetId.toString() : undefined,
    });
    setIsDialogOpen(true);
  };

  // 删除交易
  const handleDeleteClick = async (transactionId: number) => {
    if (!confirm('确定要删除这条记录吗？')) return;

    try {
      await del(`/api/v1/transactions/${transactionId}`);
      setTransactions((prev) => prev.filter((t) => t.transactionId !== transactionId));
      // 刷新预算列表（如果删除的交易有关联预算）
      fetchBudgets();
      toast({
        title: '删除成功',
        description: '交易记录已删除',
      });
    } catch (error) {
      console.error('删除失败:', error);
      toast({
        title: '删除失败',
        description: '请稍后重试',
        variant: 'destructive',
      });
    }
  };

  // 选择交易类型
  const handleTypeSelect = (type: TransactionType) => {
    if (type === 'expense') {
      // 切换到支出时，默认不关联预算
      setFormData({ ...formData, type, category: '', budgetId: '' });
    } else {
      // 切换到收入时，清除预算选择
      setFormData({ ...formData, type, category: '', budgetId: undefined });
    }
  };

  // ========== 数据验证逻辑 ==========
  /**
   * 验证表单数据的有效性
   * @returns 验证通过返回 true，否则返回 false
   */
  const validateForm = (): boolean => {
    // 验证金额：必填且大于0
    if (!formData.amount || formData.amount.trim() === '') {
      toast({
        title: '验证失败',
        description: '请输入金额',
        variant: 'destructive',
      });
      return false;
    }

    const amountValue = parseFloat(formData.amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      toast({
        title: '验证失败',
        description: '请输入有效的金额（大于0）',
        variant: 'destructive',
      });
      return false;
    }

    // 验证金额上限（防止输入错误）
    if (amountValue > 99999999) {
      toast({
        title: '金额过大',
        description: '金额不能超过 99,999,999',
        variant: 'destructive',
      });
      return false;
    }

    // 验证分类：必填
    if (!formData.category || formData.category.trim() === '') {
      toast({
        title: '验证失败',
        description: '请选择分类',
        variant: 'destructive',
      });
      return false;
    }

    // 验证账户：必填
    if (!formData.accountId || formData.accountId.trim() === '') {
      toast({
        title: '验证失败',
        description: '请选择账户',
        variant: 'destructive',
      });
      return false;
    }

    // 验证日期：必填且有效
    if (!formData.date || formData.date.trim() === '') {
      toast({
        title: '验证失败',
        description: '请选择日期',
        variant: 'destructive',
      });
      return false;
    }

    // 验证日期不能是未来日期（可选限制）
    const selectedDate = new Date(formData.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate > today) {
      toast({
        title: '日期无效',
        description: '不能选择未来的日期',
        variant: 'destructive',
      });
      return false;
    }

    return true;
  };

  // ========== 保存功能 ==========
  /**
   * 提交表单数据到服务器
   * 包含完整的错误处理和用户反馈
   */
  const handleSubmit = async () => {
    // 执行数据验证
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // 构建提交数据
      const amountValue = parseFloat(formData.amount);
      const transactionData: Record<string, unknown> = {
        type: formData.type,
        amount: amountValue,
        category: formData.category,
        accountId: parseInt(formData.accountId),
        occurredAt: formData.date,
        note: formData.note.trim() || undefined, // 空字符串转为 undefined
      };

      // 处理预算关联（仅当选择了预算时才发送）
      if (formData.budgetId && formData.budgetId.trim() !== '') {
        transactionData.budgetId = parseInt(formData.budgetId);
      }

      // 获取账户信息用于显示
      const account = accounts.find((a) => a.accountId === parseInt(formData.accountId));
      const categoryLabel = formData.type === 'income'
        ? INCOME_CATEGORY_LABELS[formData.category as keyof typeof INCOME_CATEGORY_LABELS]
        : EXPENSE_CATEGORY_LABELS[formData.category as keyof typeof EXPENSE_CATEGORY_LABELS];

      let savedTransaction: Transaction;

      if (editingTransaction) {
        // ========== 编辑模式 ==========
        await put<Transaction>(`/api/v1/transactions/${editingTransaction.transactionId}`, transactionData);

        // 更新本地状态
        setTransactions((prev) =>
          prev.map((t) =>
            t.transactionId === editingTransaction.transactionId
              ? {
                  ...t,
                  ...transactionData,
                  accountName: account?.name || t.accountName,
                }
              : t
          )
        );

        savedTransaction = {
          ...editingTransaction,
          ...transactionData,
          accountName: account?.name || editingTransaction.accountName,
        };

        toast({
          title: '保存成功',
          description: `已将 "${editingTransaction.note || categoryLabel}" 更新为 ${formData.type === 'income' ? '+' : '-'}${formatCurrency(amountValue)}`,
        });
      } else {
        // ========== 新增模式 ==========
        savedTransaction = await post<Transaction>('/api/v1/transactions', transactionData);

        // 确保账户名称正确显示
        if (account) {
          savedTransaction.accountName = account.name;
        }

        // 更新交易列表（添加到列表开头）
        setTransactions((prev) => [savedTransaction, ...prev]);

        // 刷新预算列表以更新已使用金额
        fetchBudgets();

        toast({
          title: '保存成功',
          description: `已添加 ${formData.type === 'income' ? '收入' : '支出'} "${savedTransaction.note || categoryLabel}" ${formData.type === 'income' ? '+' : '-'}${formatCurrency(amountValue)}`,
        });
      }

      // 关闭对话框
      setIsDialogOpen(false);
    } catch (error: unknown) {
      // ========== 错误处理 ==========
      console.error('保存交易记录失败:', error);

      // 获取更详细的错误信息
      const errorMessage = error instanceof Error ? error.message : '请稍后重试';

      toast({
        title: '保存失败',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      // 无论成功或失败，都关闭加载状态
      setIsLoading(false);
    }
  };

  // 导出数据
  const handleExport = () => {
    const data = filteredTransactions.map((tx) => ({
      日期: formatDate(tx.occurredAt, 'YYYY-MM-DD'),
      类型: tx.type === 'income' ? '收入' : '支出',
      分类: tx.type === 'income'
        ? INCOME_CATEGORY_LABELS[tx.category as keyof typeof INCOME_CATEGORY_LABELS]
        : EXPENSE_CATEGORY_LABELS[tx.category as keyof typeof EXPENSE_CATEGORY_LABELS],
      金额: tx.amount,
      账户: tx.accountName,
      备注: tx.note,
    }));

    const csvContent = downloadCSV(data);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `交易记录_${formatDate(new Date(), 'YYYY-MM-DD')}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: '导出成功',
      description: `已导出 ${filteredTransactions.length} 条记录`,
    });
  };

  // 清空筛选
  const handleClearFilter = () => {
    setFilter({ type: '', category: '', accountId: '', dateRange: '' });
    setIsFilterOpen(false);
  };

  return (
    <div className="pt-2 px-4 pb-4 space-y-4">
      <Header
        title="收支记录"
        subtitle="管理所有收入和支出"
      />

      {/* 时间筛选器 */}
      <div className="flex items-center justify-between bg-muted/30 p-3 rounded-lg border">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">时间范围：</span>
          <span className="text-sm text-primary font-semibold">{formatDateRangeDisplay(dateRange.start, dateRange.end)}</span>
        </div>
        <div className="flex items-center gap-1">
          {quickRanges.map((range) => (
            <Button
              key={range.value}
              variant={
                formatDateRangeDisplay(dateRange.start, dateRange.end) ===
                formatDateRangeDisplay(calculateDateRange(range.value).start, calculateDateRange(range.value).end)
                  ? 'default'
                  : 'ghost'
              }
              size="sm"
              onClick={() => setDateRange(calculateDateRange(range.value))}
            >
              {range.label}
            </Button>
          ))}
          <div className="flex items-center gap-1 ml-2 border-l pl-2">
            <Input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="w-32 h-8 text-xs"
            />
            <span className="text-muted-foreground text-xs">至</span>
            <Input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="w-32 h-8 text-xs"
            />
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              总收入
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              +{formatCurrency(totalIncome)}
            </div>
            <div className="flex items-center gap-1 mt-1">
              {incomeMoM.isPositive ? (
                <TrendingUp className="w-3 h-3 text-success" />
              ) : (
                <TrendingDown className="w-3 h-3 text-destructive" />
              )}
              <span className={`text-xs ${incomeMoM.isPositive ? 'text-success' : 'text-destructive'}`}>
                {incomeMoM.isPositive ? '+' : ''}{incomeMoM.value.toFixed(1)}%
              </span>
              <span className="text-xs text-muted-foreground">环比上月</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              总支出
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              -{formatCurrency(totalExpense)}
            </div>
            <div className="flex items-center gap-1 mt-1">
              {expenseMoM.isPositive ? (
                <TrendingUp className="w-3 h-3 text-destructive" />
              ) : (
                <TrendingDown className="w-3 h-3 text-success" />
              )}
              <span className={`text-xs ${expenseMoM.isPositive ? 'text-destructive' : 'text-success'}`}>
                {expenseMoM.isPositive ? '+' : ''}{expenseMoM.value.toFixed(1)}%
              </span>
              <span className="text-xs text-muted-foreground">环比上月</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              结余
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalIncome - totalExpense)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              上月 {formatCurrency(lastMonthIncome - lastMonthExpense)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="relative max-w-md flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="搜索账单..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsFilterOpen(true)}>
            <Filter className="w-4 h-4 mr-2" />
            筛选
            {(filter.type || filter.category || filter.accountId) && (
              <Badge variant="secondary" className="ml-2 h-5">
                已筛选
              </Badge>
            )}
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            导出
          </Button>
          <Button size="sm" onClick={handleAddTransaction}>
            <Plus className="w-4 h-4 mr-2" />
            记一笔
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">全部</TabsTrigger>
          <TabsTrigger value="income">收入</TabsTrigger>
          <TabsTrigger value="expense">支出</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {isInitialLoading ? (
                  <div className="text-center py-12">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-muted-foreground">加载中...</p>
                  </div>
                ) : filteredTransactions.length === 0 ? (
                  <div className="text-center py-12">
                    <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">暂无记录</p>
                    <Button className="mt-4" onClick={handleAddTransaction}>
                      <Plus className="w-4 h-4 mr-2" />
                      添加第一笔记录
                    </Button>
                  </div>
                ) : (
                  filteredTransactions.map((tx) => (
                    <div
                      key={tx.transactionId}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center ${
                            tx.type === 'income' ? 'bg-success/10' : 'bg-destructive/10'
                          }`}
                        >
                          {tx.type === 'income' ? (
                            <ArrowUpRight className="w-6 h-6 text-success" />
                          ) : (
                            <ArrowDownRight className="w-6 h-6 text-destructive" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{tx.note}</p>
                            <Badge variant="outline" className="text-xs">
                              {tx.type === 'income'
                                ? INCOME_CATEGORY_LABELS[tx.category as keyof typeof INCOME_CATEGORY_LABELS]
                                : EXPENSE_CATEGORY_LABELS[tx.category as keyof typeof EXPENSE_CATEGORY_LABELS]}
                            </Badge>
                            {/* 预算关联信息 */}
                            {tx.budgetId ? (
                              <Badge variant="secondary" className="text-xs">
                                {budgets.find(b => b.budgetId === tx.budgetId)?.name || '未知预算'}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs text-muted-foreground">
                                不涉及预算管理
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                            <span>{tx.accountName}</span>
                            <span>·</span>
                            <span>{formatDate(tx.occurredAt, 'YYYY-MM-DD')}</span>
                            {tx.tags && tx.tags.length > 0 && (
                              <>
                                <span>·</span>
                                <span>{tx.tags.join(', ')}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span
                          className={`text-lg font-semibold ${
                            tx.type === 'income' ? 'text-success' : 'text-destructive'
                          }`}
                        >
                          {tx.type === 'income' ? '+' : '-'}
                          {formatCurrency(tx.amount)}
                        </span>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditClick(tx)}
                            title="编辑"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteClick(tx.transactionId)}
                            title="删除"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Transaction Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingTransaction ? '编辑交易' : '记一笔'}</DialogTitle>
            <DialogDescription>
              {editingTransaction ? '修改交易记录信息' : '添加新的收入或支出记录'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* 类型选择 */}
            <div className="space-y-2">
              <Label>类型 *</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={formData.type === 'income' ? 'default' : 'outline'}
                  className={`flex-1 ${
                    formData.type === 'income'
                      ? 'bg-success hover:bg-success/90'
                      : 'border-success text-success hover:bg-success/10'
                  }`}
                  onClick={() => handleTypeSelect('income')}
                >
                  <ArrowUpRight className="w-4 h-4 mr-2" />
                  收入
                </Button>
                <Button
                  type="button"
                  variant={formData.type === 'expense' ? 'destructive' : 'outline'}
                  className={`flex-1 ${
                    formData.type === 'expense'
                      ? ''
                      : 'border-destructive text-destructive hover:bg-destructive/10'
                  }`}
                  onClick={() => handleTypeSelect('expense')}
                >
                  <ArrowDownRight className="w-4 h-4 mr-2" />
                  支出
                </Button>
              </div>
            </div>

            {/* 金额 */}
            <div className="space-y-2">
              <Label htmlFor="amount">金额 *</Label>
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              />
            </div>

            {/* 分类 */}
            <div className="space-y-2">
              <Label htmlFor="category">分类 *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择分类" />
                </SelectTrigger>
                <SelectContent>
                  {formData.type === 'income' ? (
                    // 收入类型：只显示收入分类
                    Object.entries(INCOME_CATEGORY_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))
                  ) : formData.type === 'expense' ? (
                    // 支出类型：只显示支出分类
                    Object.entries(EXPENSE_CATEGORY_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))
                  ) : (
                    // 默认：显示所有分类
                    <>
                      <div className="text-xs font-medium text-muted-foreground px-2 py-1">
                        收入分类
                      </div>
                      {Object.entries(INCOME_CATEGORY_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                      <div className="border-t my-1" />
                      <div className="text-xs font-medium text-muted-foreground px-2 py-1">
                        支出分类
                      </div>
                      {Object.entries(EXPENSE_CATEGORY_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* 账户 */}
            <div className="space-y-2">
              <Label htmlFor="account">账户 *</Label>
              <Select
                value={formData.accountId}
                onValueChange={(value) => setFormData({ ...formData, accountId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择账户" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.length > 0 ? (
                    accounts.map((account) => (
                      <SelectItem key={account.accountId} value={account.accountId.toString()}>
                        {account.name}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-2 text-sm text-muted-foreground">暂无可用账户</div>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* 日期 */}
            <div className="space-y-2">
              <Label htmlFor="date">日期</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>

            {/* 预算关联（仅支出时显示） */}
            {formData.type === 'expense' && (
              <div className="space-y-2">
                <Label>关联预算</Label>
                <p className="text-xs text-muted-foreground">
                  请选择该笔支出对应的预算项目，如无需关联预算可选择"不关联预算"
                </p>
                {/* 自定义可搜索预算选择器 */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsBudgetSelectOpen(!isBudgetSelectOpen)}
                    className="w-full h-10 px-3 py-2 text-sm border rounded-md bg-background hover:bg-accent hover:border-input transition-colors flex items-center justify-between text-left"
                  >
                    <span className={formData.budgetId !== undefined && formData.budgetId !== '' ? '' : 'text-muted-foreground'}>
                      {formData.budgetId === '' ? (
                        '不关联预算'
                      ) : formData.budgetId ? (
                        (() => {
                          const selected = availableBudgets.find(b => b.budgetId.toString() === formData.budgetId);
                          if (!selected) return '请选择预算';
                          const expired = isBudgetExpired(selected.periodEnd);
                          return (
                            <span className="flex items-center gap-2">
                              {selected.name}
                              {expired && (
                                <span className="text-xs text-destructive bg-destructive/10 px-1.5 py-0.5 rounded">
                                  已过期
                                </span>
                              )}
                              <span>（剩余 {formatCurrency(selected.totalAmount - selected.usedAmount)}）</span>
                            </span>
                          );
                        })()
                      ) : (
                        '请选择预算'
                      )}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isBudgetSelectOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* 下拉面板 */}
                  {isBudgetSelectOpen && (
                    <>
                      {/* 遮罩层 */}
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => {
                          setIsBudgetSelectOpen(false);
                          setBudgetSearchQuery('');
                        }}
                      />
                      {/* 选择面板 */}
                      <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg">
                        {/* 搜索框 */}
                        <div className="p-2 border-b">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              placeholder="搜索预算名称或分类..."
                              value={budgetSearchQuery}
                              onChange={(e) => setBudgetSearchQuery(e.target.value)}
                              className="pl-9 h-9"
                              autoFocus
                            />
                          </div>
                        </div>
                        {/* 预算列表 */}
                        <div className="max-h-60 overflow-y-auto py-1">
                          {/* 搜索框为空时：显示所有选项 */}
                          {!budgetSearchQuery.trim() && (
                            <>
                              {/* 不关联预算选项 */}
                              <button
                                type="button"
                                onClick={() => {
                                  setFormData({ ...formData, budgetId: '' });
                                  setIsBudgetSelectOpen(false);
                                  setBudgetSearchQuery('');
                                }}
                                className={`w-full px-3 py-2 text-sm text-left hover:bg-accent transition-colors ${
                                  formData.budgetId === '' ? 'bg-accent/50' : ''
                                }`}
                              >
                                <div className="font-medium">不关联预算</div>
                                <div className="text-xs text-muted-foreground mt-0.5">
                                  不将此项支出关联到任何预算
                                </div>
                              </button>
                            </>
                          )}

                          {/* 搜索时有内容：显示搜索结果 */}
                          {budgetSearchQuery.trim() && (
                            <div className="px-3 py-2 text-xs text-muted-foreground">
                              搜索结果
                            </div>
                          )}

                          {/* 预算选项（搜索时限制最多10条） */}
                          {searchedBudgets.length > 0 ? (
                            searchedBudgets.map((budget) => (
                              <button
                                key={budget.budgetId}
                                type="button"
                                onClick={() => {
                                  setFormData({ ...formData, budgetId: budget.budgetId.toString() });
                                  setIsBudgetSelectOpen(false);
                                  setBudgetSearchQuery('');
                                }}
                                className={`w-full px-3 py-2 text-sm text-left hover:bg-accent transition-colors ${
                                  formData.budgetId === budget.budgetId.toString() ? 'bg-accent/50' : ''
                                }`}
                              >
                                <div className="font-medium flex items-center gap-2">
                                  {budget.name}
                                  {isBudgetExpired(budget.periodEnd) && (
                                    <span className="text-xs text-destructive bg-destructive/10 px-1.5 py-0.5 rounded">
                                      已过期
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-muted-foreground mt-0.5">
                                  分类: {budget.category} · 有效期: {budget.periodStart} 至 {budget.periodEnd}
                                  <span className="ml-2 text-success">
                                    剩余 {formatCurrency(budget.totalAmount - budget.usedAmount)}
                                  </span>
                                </div>
                              </button>
                            ))
                          ) : (
                            <div className="px-3 py-4 text-sm text-muted-foreground text-center">
                              {budgetSearchQuery.trim()
                                ? '未找到匹配的预算'
                                : availableBudgets.length === 0
                                  ? '暂无可用预算，请先创建预算'
                                  : ''}
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* 备注 */}
            <div className="space-y-2">
              <Label htmlFor="note">备注</Label>
              <Input
                id="note"
                placeholder="添加备注..."
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              />
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

      {/* Filter Dialog */}
      <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              筛选条件
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* 类型筛选 */}
            <div className="space-y-2">
              <Label>交易类型</Label>
              <Select
                value={filter.type}
                onValueChange={(value) => setFilter({ ...filter, type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="全部类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">全部类型</SelectItem>
                  <SelectItem value="income">收入</SelectItem>
                  <SelectItem value="expense">支出</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 分类筛选 */}
            <div className="space-y-2">
              <Label>分类</Label>
              <Select
                value={filter.category}
                onValueChange={(value) => setFilter({ ...filter, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="全部分类" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">全部分类</SelectItem>
                  <div className="text-xs font-medium text-muted-foreground px-2 py-1">
                    收入分类
                  </div>
                  {Object.entries(INCOME_CATEGORY_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                  <div className="border-t my-1" />
                  <div className="text-xs font-medium text-muted-foreground px-2 py-1">
                    支出分类
                  </div>
                  {Object.entries(EXPENSE_CATEGORY_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 账户筛选 */}
            <div className="space-y-2">
              <Label>账户</Label>
              <Select
                value={filter.accountId}
                onValueChange={(value) => setFilter({ ...filter, accountId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="全部账户" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">全部账户</SelectItem>
                  {accounts.map((account) => (
                    <SelectItem key={account.accountId} value={account.accountId.toString()}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="flex justify-between">
            <Button variant="ghost" onClick={handleClearFilter}>
              <X className="w-4 h-4 mr-2" />
              清空筛选
            </Button>
            <Button onClick={() => setIsFilterOpen(false)}>
              确定
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
