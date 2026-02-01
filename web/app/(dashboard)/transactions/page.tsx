'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { formatCurrency, formatDate, DATE_PRESETS, getDateRangeFromPreset, type DateRangePreset } from '@/lib/utils';
import { getTransactionTypeLabel } from '@/lib/icons';
import { transactionApi, accountApi, categoryApi, refundApi, budgetApi } from '@/api';
import type { Transaction, Account, Category, TransactionType, Refund, RefundSummary, Budget } from '@/types';
import { Plus, Search, Filter, ArrowUpCircle, ArrowDownCircle, Trash2, TrendingUp, TrendingDown, DollarSign, Calendar, Tag, Wallet, RotateCcw, Edit2, ChevronDown, ChevronUp, SlidersHorizontal, Check, Square } from 'lucide-react';
import { toast } from 'sonner';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [refundList, setRefundList] = useState<Refund[]>([]);
  const [refundSummary, setRefundSummary] = useState<RefundSummary | null>(null);
  const [refundAmount, setRefundAmount] = useState<string>('');
  const [refundNote, setRefundNote] = useState<string>('');
  const [selectedRefund, setSelectedRefund] = useState<Refund | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedDatePreset, setSelectedDatePreset] = useState<DateRangePreset>('all');
  const [filterAccount, setFilterAccount] = useState<string>('all');
  const [amountMin, setAmountMin] = useState<string>('');
  const [amountMax, setAmountMax] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedTxIds, setSelectedTxIds] = useState<Set<number>>(new Set());
  const [expandedTx, setExpandedTx] = useState<number | null>(null);
  // 记住上次使用的分类和账户
  const [lastUsedAccountId, setLastUsedAccountId] = useState<number>(0);
  const [lastUsedCategoryId, setLastUsedCategoryId] = useState<number>(0);
  const [lastUsedBudgetId, setLastUsedBudgetId] = useState<number>(0);
  const [lastUsedType, setLastUsedType] = useState<TransactionType>('expense');
  const [formData, setFormData] = useState({
    transactionId: 0,
    accountId: 0,
    categoryId: 0,
    budgetId: 0,
    type: 'expense' as TransactionType,
    amount: '',
    occurredAt: new Date().toISOString().split('T')[0],
    note: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      console.log('[Transactions] 开始加载数据...');
      const [txRes, accRes, catRes, budgetRes] = await Promise.all([
        transactionApi.list({ current: 1, size: 100 }),
        accountApi.list(),
        categoryApi.list(),
        budgetApi.listActive(),
      ]);

      console.log('[Transactions] API响应:', {
        txRes: txRes?.code,
        accRes: accRes?.code,
        catRes: catRes?.code,
        budgetRes: budgetRes?.code
      });

      if (txRes.code === 200) {
        const allTransactions = txRes.data?.records || [];
        console.log('[Transactions] 原始交易数量:', allTransactions.length);
        // 过滤掉退款交易（退款会关联到原交易显示）
        const normalTransactions = allTransactions.filter((t: Transaction) => t.type !== 'refund');
        console.log('[Transactions] 过滤后交易数量:', normalTransactions.length);
        setTransactions(normalTransactions);

        // 计算汇总
        const income = normalTransactions.filter(tx => tx.type?.toLowerCase() === 'income').reduce((sum, tx) => sum + tx.amount, 0);
        const expense = normalTransactions.filter(tx => tx.type?.toLowerCase() === 'expense').reduce((sum, tx) => sum + tx.amount, 0);
        console.log('[Transactions] 收入:', income, '支出:', expense);
      }
      if (accRes.code === 200) {
        console.log('[Transactions] 账户数量:', (accRes.data || []).length);
        setAccounts(accRes.data || []);
      }
      if (catRes.code === 200) {
        console.log('[Transactions] 分类数量:', (catRes.data || []).length);
        setCategories(catRes.data || []);
      }
      if (budgetRes.code === 200) {
        console.log('[Transactions] 预算数量:', (budgetRes.data || []).length);
        setBudgets(budgetRes.data || []);
      }
    } catch (error) {
      console.error('[Transactions] 加载数据失败:', error);
      toast.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (formData.accountId === 0) {
      toast.error('请选择账户');
      return;
    }
    if (formData.categoryId === 0) {
      toast.error('请选择分类');
      return;
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error('请输入有效金额');
      return;
    }
    // 支出必须关联预算
    if (formData.type?.toLowerCase() === 'expense' && formData.budgetId === 0) {
      toast.error('请选择预算');
      return;
    }
    try {
      // 格式化时间为 yyyy-MM-dd HH:mm:ss
      const formatDateTime = (dateStr: string) => {
        const date = new Date(dateStr);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
      };

      await transactionApi.create({
        accountId: formData.accountId,
        categoryId: formData.categoryId,
        budgetId: formData.budgetId > 0 ? formData.budgetId : undefined,
        type: formData.type,
        amount: parseFloat(formData.amount),
        occurredAt: formatDateTime(formData.occurredAt),
        note: formData.note,
      });
      // 保存本次使用的分类和账户，下次创建时自动填充
      setLastUsedAccountId(formData.accountId);
      setLastUsedCategoryId(formData.categoryId);
      setLastUsedBudgetId(formData.budgetId);
      setLastUsedType(formData.type);
      toast.success('创建成功');
      setDialogOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      toast.error('创建失败');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除该交易吗？')) return;
    try {
      await transactionApi.delete(id);
      toast.success('删除成功');
      loadData();
    } catch (error) {
      toast.error('删除失败');
    }
  };

  // 打开编辑对话框
  const openEditDialog = (tx: Transaction) => {
    setEditingTransaction(tx);
    setFormData({
      transactionId: tx.transactionId,
      accountId: tx.accountId,
      categoryId: tx.categoryId,
      budgetId: tx.budgetId || 0,
      type: tx.type?.toLowerCase() as TransactionType,
      amount: tx.amount.toString(),
      occurredAt: tx.occurredAt.split('T')[0],
      note: tx.note || '',
    });
    setDialogOpen(true);
  };

  // 打开退款对话框
  const openRefundDialog = async (tx: Transaction) => {
    setSelectedTransaction(tx);

    try {
      // 获取退款列表和汇总
      const response = await refundApi.getTransactionRefunds(tx.transactionId);
      if (response.code === 200) {
        setRefundList(response.data.refunds);
        setRefundSummary(response.data.summary);

        // 如果有退款记录，默认选择第一笔
        if (response.data.refunds.length > 0) {
          const firstRefund = response.data.refunds[0];
          setSelectedRefund(firstRefund);
          setRefundAmount(firstRefund.amount.toString());
          // 提取退款备注（去掉"退款："前缀）
          const noteText = firstRefund.note || '';
          setRefundNote(noteText.replace(/^退款：/, ''));
        } else {
          setSelectedRefund(null);
          setRefundAmount(tx.amount.toString());
          setRefundNote(tx.note || '');
        }
      }
    } catch (error) {
      // 如果获取失败，使用默认状态
      setRefundList([]);
      setRefundSummary(null);
      setSelectedRefund(null);
      setRefundAmount(tx.amount.toString());
      setRefundNote(tx.note || '');
    }

    setRefundDialogOpen(true);
  };

  // 取消退款
  const cancelRefund = async (refund: Refund) => {
    if (!selectedTransaction) return;
    if (!confirm('确定要取消该退款吗？')) return;
    try {
      await refundApi.cancelRefund(selectedTransaction.transactionId, refund.refundId);
      toast.success('退款已取消');
      // 刷新退款列表
      const response = await refundApi.getTransactionRefunds(selectedTransaction.transactionId);
      if (response.code === 200) {
        setRefundList(response.data.refunds);
        setRefundSummary(response.data.summary);
      }
      loadData();
    } catch (error) {
      toast.error('取消退款失败');
    }
  };

  // 执行退款（创建新退款）
  const handleRefund = async () => {
    if (!selectedTransaction) return;

    const amount = parseFloat(refundAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('请输入有效的退款金额');
      return;
    }
    if (refundSummary && amount > refundSummary.remainingRefundable) {
      toast.error('退款金额超出可退范围');
      return;
    }

    try {
      // 格式化时间为 yyyy-MM-dd HH:mm:ss
      const formatDateTime = (dateStr: string) => {
        const date = new Date(dateStr);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
      };

      await refundApi.createRefund(selectedTransaction.transactionId, {
        amount: amount,
        occurredAt: formatDateTime(new Date().toISOString()),
        note: refundNote,
      });

      toast.success('退款成功');
      setRefundDialogOpen(false);
      loadData();
    } catch (error) {
      toast.error('退款失败');
    }
  };

  // 处理日期快捷选项变更
  const handleDatePresetChange = (preset: DateRangePreset) => {
    setSelectedDatePreset(preset);
    const range = getDateRangeFromPreset(preset);
    if (range) {
      setStartDate(range.startDate);
      setEndDate(range.endDate);
    } else {
      setStartDate('');
      setEndDate('');
    }
  };

  // 清除日期筛选
  const clearDateFilter = () => {
    setSelectedDatePreset('all');
    setStartDate('');
    setEndDate('');
  };

  // 切换单个交易选中状态
  const toggleTxSelect = (id: number) => {
    const newSet = new Set(selectedTxIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedTxIds(newSet);
  };

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (selectedTxIds.size === sortedTransactions.length) {
      setSelectedTxIds(new Set());
    } else {
      setSelectedTxIds(new Set(sortedTransactions.map(tx => tx.transactionId)));
    }
  };

  // 批量删除
  const handleBatchDelete = async () => {
    if (selectedTxIds.size === 0) return;
    if (!confirm(`确定要删除选中的 ${selectedTxIds.size} 笔交易吗？`)) return;

    try {
      const deletePromises = Array.from(selectedTxIds).map(id => transactionApi.delete(id));
      await Promise.all(deletePromises);
      toast.success(`成功删除 ${selectedTxIds.size} 笔交易`);
      setSelectedTxIds(new Set());
      loadData();
    } catch (error) {
      toast.error('批量删除失败');
    }
  };

  const resetForm = () => {
    setEditingTransaction(null);
    setFormData({
      transactionId: 0,
      accountId: lastUsedAccountId,
      categoryId: lastUsedCategoryId,
      budgetId: lastUsedBudgetId,
      type: lastUsedType,
      amount: '',
      occurredAt: new Date().toISOString().split('T')[0],
      note: '',
    });
  };

  // 清除记忆的选项
  const clearLastUsed = () => {
    setLastUsedAccountId(0);
    setLastUsedCategoryId(0);
    setLastUsedBudgetId(0);
    setLastUsedType('expense');
    setFormData({
      transactionId: 0,
      accountId: 0,
      categoryId: 0,
      budgetId: 0,
      type: 'expense',
      amount: '',
      occurredAt: new Date().toISOString().split('T')[0],
      note: '',
    });
    toast.info('已清除记忆的选项');
  };

  const filteredTransactions = transactions.filter((tx) => {
    const matchesKeyword = !searchKeyword ||
      tx.note?.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      categories.find(c => c.categoryId === tx.categoryId)?.name?.toLowerCase().includes(searchKeyword.toLowerCase());
    const matchesType = filterType === 'all' || tx.type === filterType;
    const matchesAccount = filterAccount === 'all' || tx.accountId.toString() === filterAccount;

    // 日期筛选
    let matchesDate = true;
    if (tx.occurredAt && (startDate || endDate)) {
      const txDate = new Date(tx.occurredAt).toISOString().split('T')[0];
      if (startDate && txDate < startDate) matchesDate = false;
      if (endDate && txDate > endDate) matchesDate = false;
    }

    // 金额范围筛选
    let matchesAmount = true;
    if (amountMin && tx.amount < parseFloat(amountMin)) matchesAmount = false;
    if (amountMax && tx.amount > parseFloat(amountMax)) matchesAmount = false;

    return matchesKeyword && matchesType && matchesAccount && matchesDate && matchesAmount;
  });

  // 排序后的交易列表
  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    if (sortBy === 'amount') {
      return sortOrder === 'asc' ? a.amount - b.amount : b.amount - a.amount;
    }
    // 默认按日期排序
    const dateA = new Date(a.occurredAt).getTime();
    const dateB = new Date(b.occurredAt).getTime();
    return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
  });

  const getCategoryName = (id: number) => categories.find((c) => c.categoryId === id)?.name || '未分类';
  const getAccountName = (id: number) => accounts.find((a) => a.accountId === id)?.name || '未知账户';
  const getBudgetName = (id?: number) => {
    if (!id) return null;
    return budgets.find((b) => b.budgetId === id)?.name || null;
  };

  // Calculate totals from ALL transactions (not filtered)
  const totalIncome = transactions
    .filter(tx => tx.type?.toUpperCase() === 'INCOME')
    .reduce((sum, tx) => sum + (tx.amount || 0), 0);
  const totalExpense = transactions
    .filter(tx => tx.type?.toUpperCase() === 'EXPENSE')
    .reduce((sum, tx) => sum + (tx.amount || 0), 0);

  // Debug: Log the transactions and totals
  console.log('[Transactions] 总交易数:', transactions.length);
  console.log('[Transactions] 收入:', totalIncome, '支出:', totalExpense);

  if (loading) {
    return (
      <DashboardLayout title="交易记录">
        <div className="flex items-center justify-center h-96">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="text-muted-foreground">加载中...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="交易记录">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">交易记录</h2>
            <p className="text-muted-foreground">管理您的每一笔收支</p>
          </div>
          <Button onClick={() => { resetForm(); setDialogOpen(true); }} size="lg">
            <Plus className="h-5 w-5 mr-2" />
            添加交易
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-white border-green-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-700 font-medium">总收入</p>
                  <p className="text-2xl font-bold text-green-700">+{formatCurrency(totalIncome)}</p>
                </div>
                <div className="p-3 bg-green-50 rounded-full">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-red-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-700 font-medium">总支出</p>
                  <p className="text-2xl font-bold text-red-700">-{formatCurrency(totalExpense)}</p>
                </div>
                <div className="p-3 bg-red-50 rounded-full">
                  <TrendingDown className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={`bg-white ${totalIncome - totalExpense >= 0 ? 'border-blue-200' : 'border-orange-200'} rounded-2xl shadow-sm hover:shadow-md transition-shadow`}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">净收支</p>
                  <p className={`text-2xl font-bold ${totalIncome - totalExpense >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
                    {totalIncome - totalExpense >= 0 ? '+' : ''}{formatCurrency(totalIncome - totalExpense)}
                  </p>
                </div>
                <div className={`p-3 rounded-full ${totalIncome - totalExpense >= 0 ? 'bg-blue-50' : 'bg-orange-50'}`}>
                  <DollarSign className={`h-6 w-6 ${totalIncome - totalExpense >= 0 ? 'text-blue-600' : 'text-orange-600'}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-white rounded-2xl shadow-sm">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4">
              {/* 第一行：搜索、类型和账户筛选（始终显示） */}
              <div className="flex flex-wrap gap-2">
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="搜索交易..."
                    className="pl-9"
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                  />
                </div>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-28">
                    <SelectValue placeholder="类型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部类型</SelectItem>
                    <SelectItem value="income">收入</SelectItem>
                    <SelectItem value="expense">支出</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterAccount} onValueChange={setFilterAccount}>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="账户" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部账户</SelectItem>
                    {accounts.map((acc) => (
                      <SelectItem key={acc.accountId} value={acc.accountId.toString()}>
                        {acc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {/* 高级筛选切换按钮 */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className="gap-1"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  高级筛选
                  {showAdvancedFilters ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </Button>
              </div>

              {/* 高级筛选面板（可折叠） */}
              {showAdvancedFilters && (
                <div className="flex flex-col gap-4 p-4 rounded-lg bg-muted/50 border">
                  {/* 日期快捷选项 */}
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-sm text-muted-foreground mr-1">日期:</span>
                    {DATE_PRESETS.map((preset) => (
                      <Button
                        key={preset.key}
                        variant={selectedDatePreset === preset.key ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleDatePresetChange(preset.key)}
                        className="text-xs"
                      >
                        {preset.label}
                      </Button>
                    ))}
                    <div className="flex items-center gap-2 ml-2">
                      <Input
                        type="date"
                        className="w-32 h-8 text-xs"
                        placeholder="开始日期"
                        value={startDate}
                        onChange={(e) => {
                          setStartDate(e.target.value);
                          setSelectedDatePreset('all');
                        }}
                      />
                      <span className="text-muted-foreground text-xs">至</span>
                      <Input
                        type="date"
                        className="w-32 h-8 text-xs"
                        placeholder="结束日期"
                        value={endDate}
                        onChange={(e) => {
                          setEndDate(e.target.value);
                          setSelectedDatePreset('all');
                        }}
                      />
                    </div>
                  </div>

                  {/* 金额范围 */}
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-sm text-muted-foreground mr-1">金额:</span>
                    <Input
                      type="number"
                      placeholder="最小金额"
                      className="w-28 h-8 text-xs"
                      value={amountMin}
                      onChange={(e) => setAmountMin(e.target.value)}
                    />
                    <span className="text-muted-foreground text-xs">至</span>
                    <Input
                      type="number"
                      placeholder="最大金额"
                      className="w-28 h-8 text-xs"
                      value={amountMax}
                      onChange={(e) => setAmountMax(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* 统计信息和排序 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">
                    共 <span className="font-medium">{sortedTransactions.length}</span> 笔交易
                  </span>
                  {/* 显示活跃筛选器标签 */}
                  {(filterType !== 'all' || filterAccount !== 'all' || startDate || endDate || amountMin || amountMax) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setFilterType('all');
                        setFilterAccount('all');
                        clearDateFilter();
                        setAmountMin('');
                        setAmountMax('');
                      }}
                      className="text-xs h-6 px-2 text-muted-foreground"
                    >
                      清除筛选
                    </Button>
                  )}
                </div>
                {/* 排序选项 */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">排序:</span>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-24 h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date">按日期</SelectItem>
                      <SelectItem value="amount">按金额</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2"
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  >
                    {sortOrder === 'asc' ? '↑ 升序' : '↓ 降序'}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transaction Tabs */}
        <Tabs defaultValue="list" className="w-full">
          <TabsList>
            <TabsTrigger value="list" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              列表视图
            </TabsTrigger>
            <TabsTrigger value="timeline" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              时间轴
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="mt-6">
            <Card className="bg-white rounded-2xl shadow-sm">
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <DollarSign className="h-5 w-5 text-primary" />
                  交易列表
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {sortedTransactions.length === 0 ? (
                    <div className="text-center py-12">
                      <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground mb-4">暂无交易记录</p>
                      <Button onClick={() => { resetForm(); setDialogOpen(true); }} variant="outline">
                        <Plus className="h-4 w-4 mr-2" />
                        添加第一笔交易
                      </Button>
                    </div>
                  ) : (
                    <>
                      {/* 批量操作栏 */}
                      {sortedTransactions.length > 0 && (
                        <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50 mb-2">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={toggleSelectAll}
                              className="text-xs h-8"
                            >
                              {selectedTxIds.size === sortedTransactions.length ? (
                                <Check className="h-4 w-4 mr-1" />
                              ) : (
                                <Square className="h-4 w-4 mr-1" />
                              )}
                              {selectedTxIds.size === sortedTransactions.length ? '取消全选' : '全选'}
                            </Button>
                            <span className="text-xs text-muted-foreground">
                              已选择 {selectedTxIds.size} 笔
                            </span>
                          </div>
                          {selectedTxIds.size > 0 && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={handleBatchDelete}
                              className="text-xs h-8"
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              批量删除
                            </Button>
                          )}
                        </div>
                      )}
                      {sortedTransactions.map((tx) => (
                        <div
                          key={tx.transactionId}
                          className={`flex items-center justify-between p-4 rounded-xl border hover:bg-muted/50 transition-colors ${selectedTxIds.has(tx.transactionId) ? 'bg-primary/5 border-primary' : 'bg-card'}`}
                        >
                          <div className="flex items-center gap-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleTxSelect(tx.transactionId)}
                              className="p-0 h-auto"
                            >
                              {selectedTxIds.has(tx.transactionId) ? (
                                <Check className="h-5 w-5 text-primary" />
                              ) : (
                                <Square className="h-5 w-5 text-muted-foreground" />
                              )}
                            </Button>
                            <div className={`p-2.5 rounded-full ${tx.type?.toLowerCase() === 'income' ? 'bg-green-50' : 'bg-red-50'}`}>
                              {tx.type?.toLowerCase() === 'income' ? (
                                <ArrowUpCircle className="h-5 w-5 text-green-600" />
                              ) : (
                                <ArrowDownCircle className="h-5 w-5 text-red-600" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-lg">{tx.note || getCategoryName(tx.categoryId)}</p>
                              <div className="flex gap-2 text-sm text-muted-foreground mt-1">
                                <span className="flex items-center gap-1">
                                  <Wallet className="h-3 w-3" />
                                  {getAccountName(tx.accountId)}
                                </span>
                                <span>·</span>
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {formatDate(tx.occurredAt, 'YYYY-MM-DD')}
                                </span>
                                <span>·</span>
                                <Badge variant="outline" className="text-xs">
                                  {getTransactionTypeLabel(tx.type)}
                                </Badge>
                                {tx.budgetId && (
                                  <>
                                    <span>·</span>
                                    <Badge variant="secondary" className="text-xs">
                                      {getBudgetName(tx.budgetId)}
                                    </Badge>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`font-semibold text-lg ${tx.type?.toLowerCase() === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                              {tx.type?.toLowerCase() === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                            </span>
                            {/* 编辑按钮 */}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(tx)}
                              className="hover:bg-blue-50 text-blue-600 hover:text-blue-700"
                              title="编辑"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            {/* 退款按钮：对收入和支出交易都显示 */}
                            {(tx.type?.toLowerCase() === 'expense' || tx.type?.toLowerCase() === 'income') && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openRefundDialog(tx)}
                                className="hover:bg-blue-50 text-blue-600 hover:text-blue-700"
                              >
                                {tx.type?.toLowerCase() === 'income' ? '退还' : '退款'}
                              </Button>
                            )}
                            {/* 退款金额显示 */}
                            {(tx.type?.toLowerCase() === 'expense' || tx.type?.toLowerCase() === 'income') && (tx.refundAmount ?? 0) > 0 && (
                              <Button
                                variant="link"
                                size="sm"
                                className="text-green-600 h-auto p-0"
                                onClick={() => setExpandedTx(expandedTx === tx.transactionId ? null : tx.transactionId)}
                              >
                                (已{tx.type?.toLowerCase() === 'income' ? '退还' : '退'} {formatCurrency(tx.refundAmount ?? 0)})
                              </Button>
                            )}
                            {/* 删除按钮 */}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(tx.transactionId)}
                              className="hover:bg-red-50 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            {/* 退款明细展开 */}
                            {(tx.type?.toLowerCase() === 'expense' || tx.type?.toLowerCase() === 'income') && (tx.refundAmount ?? 0) > 0 && expandedTx === tx.transactionId && (
                              <div className="mt-2 ml-auto w-full max-w-[200px]">
                                <div
                                  className={`flex items-center justify-between p-2 rounded cursor-pointer hover:bg-green-100 ${tx.type?.toLowerCase() === 'income'
                                    ? 'bg-orange-50 border border-orange-200'
                                    : 'bg-green-50 border border-green-200'}`}
                                  onClick={() => openRefundDialog(tx)}
                                >
                                  <div className="flex items-center gap-2">
                                    <RotateCcw className={`h-4 w-4 ${tx.type?.toLowerCase() === 'income' ? 'text-orange-600' : 'text-green-600'}`} />
                                    <span className={`text-sm ${tx.type?.toLowerCase() === 'income' ? 'text-orange-800' : 'text-green-800'}`}>
                                      {tx.type?.toLowerCase() === 'income' ? '退还' : '退款'}
                                    </span>
                                  </div>
                                  <span className={`font-semibold ${tx.type?.toLowerCase() === 'income' ? 'text-orange-600' : 'text-green-600'}`}>
                                    {tx.type?.toLowerCase() === 'income' ? '-' : '+'}{formatCurrency(tx.refundAmount ?? 0)}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="timeline" className="mt-6">
            <Card className="bg-white rounded-2xl shadow-sm">
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Calendar className="h-5 w-5 text-primary" />
                  时间轴视图
                </CardTitle>
              </CardHeader>
              <CardContent>
                {sortedTransactions.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    暂无交易记录
                  </div>
                ) : (
                  <div className="relative space-y-6 pl-4 border-l-2 border-muted ml-4">
                    {sortedTransactions.map((tx, index) => (
                      <div key={tx.transactionId} className="relative">
                        <div className={`absolute -left-[21px] top-1 p-2 rounded-full border-2 border-background ${tx.type?.toLowerCase() === 'income' ? 'bg-green-50' : 'bg-red-50'}`}>
                          {tx.type?.toLowerCase() === 'income' ? (
                            <TrendingUp className="h-4 w-4 text-green-600" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-600" />
                          )}
                        </div>
                        <div className="ml-6 p-4 rounded-xl border bg-card hover:bg-muted/50 transition-colors">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">{tx.note || getCategoryName(tx.categoryId)}</p>
                              <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                                <span>{getAccountName(tx.accountId)}</span>
                                <Badge variant="outline" className="text-xs">
                                  {getTransactionTypeLabel(tx.type)}
                                </Badge>
                                {tx.budgetId && (
                                  <Badge variant="secondary" className="text-xs">
                                    {getBudgetName(tx.budgetId)}
                                  </Badge>
                                )}
                              </p>
                            </div>
                            <span className={`font-semibold ${tx.type?.toLowerCase() === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                              {tx.type?.toLowerCase() === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>{editingTransaction ? '编辑交易' : '添加交易'}</DialogTitle>
              {/* 记忆功能提示和清除按钮 */}
              {!editingTransaction && (lastUsedAccountId > 0 || lastUsedCategoryId > 0) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearLastUsed}
                  className="text-xs h-7 text-muted-foreground hover:text-foreground"
                >
                  清除记忆
                </Button>
              )}
            </div>
            <DialogDescription>{editingTransaction ? '修改交易信息' : '记录一笔新的收入或支出'}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tx-type">类型</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: TransactionType) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger id="tx-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">
                      <span className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        收入
                      </span>
                    </SelectItem>
                    <SelectItem value="expense">
                      <span className="flex items-center gap-2">
                        <TrendingDown className="h-4 w-4 text-red-600" />
                        支出
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tx-amount">金额</Label>
                <Input
                  id="tx-amount"
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tx-account">账户</Label>
              <Select
                value={formData.accountId?.toString() || '0'}
                onValueChange={(value) => setFormData({ ...formData, accountId: parseInt(value) || 0 })}
              >
                <SelectTrigger id="tx-account">
                  <SelectValue placeholder="选择账户" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((acc) => (
                    <SelectItem key={acc.accountId} value={acc.accountId.toString()}>
                      {acc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tx-category">分类</Label>
              <Select
                value={formData.categoryId ? formData.categoryId.toString() : '0'}
                onValueChange={(value) => setFormData({ ...formData, categoryId: parseInt(value) || 0 })}
              >
                <SelectTrigger id="tx-category">
                  <SelectValue placeholder="选择分类" />
                </SelectTrigger>
                <SelectContent>
                  {categories.filter((c) => c.type?.toLowerCase() === formData.type?.toLowerCase()).map((cat) => (
                    <SelectItem key={cat.categoryId} value={cat.categoryId.toString()}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {formData.type?.toLowerCase() === 'expense' && (
              <div className="space-y-2">
                <Label htmlFor="tx-budget">预算（必选）</Label>
                <Select
                  value={formData.budgetId?.toString() || '0'}
                  onValueChange={(value) => setFormData({ ...formData, budgetId: parseInt(value) || 0 })}
                >
                  <SelectTrigger id="tx-budget">
                    <SelectValue placeholder="选择预算" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">不关联预算</SelectItem>
                    {budgets.map((budget) => (
                      <SelectItem key={budget.budgetId} value={budget.budgetId.toString()}>
                        {budget.name}（剩余 {formatCurrency(budget.amount - budget.spent)}）
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="tx-date">日期</Label>
              <Input
                id="tx-date"
                type="date"
                value={formData.occurredAt}
                onChange={(e) => setFormData({ ...formData, occurredAt: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tx-note">备注</Label>
              <Input
                id="tx-note"
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                placeholder="添加备注..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
            <Button onClick={handleSubmit}>{editingTransaction ? '保存' : '创建'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 退款管理弹窗 */}
      <Dialog open={refundDialogOpen} onOpenChange={setRefundDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-blue-600" />
              退款管理
            </DialogTitle>
            <DialogDescription>查看和管理交易退款记录</DialogDescription>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-4 py-4">
              {/* 原交易信息卡片 - 根据类型显示不同颜色 */}
              {(() => {
                const isIncome = selectedTransaction.type?.toLowerCase() === 'income';
                return (
                  <div className={`p-4 rounded-lg border ${isIncome
                    ? 'bg-gradient-to-br from-green-50 to-green-100 border-green-200'
                    : 'bg-gradient-to-br from-red-50 to-red-100 border-red-200'}`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className={`text-xs ${isIncome ? 'text-green-600' : 'text-red-600'} mb-1`}>
                          {isIncome ? '原收入' : '原支出'}
                        </p>
                        <p className="font-medium text-lg">{selectedTransaction.note || getCategoryName(selectedTransaction.categoryId)}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {formatDate(selectedTransaction.occurredAt, 'YYYY-MM-DD HH:mm')} · {getAccountName(selectedTransaction.accountId)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`text-2xl font-bold ${isIncome ? 'text-green-600' : 'text-red-600'}`}>
                          {isIncome ? '+' : '-'}{formatCurrency(selectedTransaction.amount)}
                        </p>
                        <p className={`text-xs ${isIncome ? 'text-green-500' : 'text-red-500'}`}>
                          {isIncome ? '需退还' : '可退还'}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* 退款进度条 */}
              {refundSummary && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">退款进度</span>
                    <span className="font-medium">
                      {formatCurrency(refundSummary.totalRefunded)} / {formatCurrency(selectedTransaction.amount)}
                    </span>
                  </div>
                  <div className="h-3 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${selectedTransaction.type?.toLowerCase() === 'income' ? 'bg-orange-500' : 'bg-green-500'}`}
                      style={{
                        width: `${Math.min((refundSummary.totalRefunded / selectedTransaction.amount) * 100, 100)}%`
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>已退: {formatCurrency(refundSummary.totalRefunded)}</span>
                    <span className={`${selectedTransaction.type?.toLowerCase() === 'income' ? 'text-orange-600' : 'text-green-600'} font-medium`}>
                      剩余: {formatCurrency(refundSummary.remainingRefundable)}
                    </span>
                  </div>
                </div>
              )}

              {/* 快捷金额按钮 */}
              {refundSummary && refundSummary.remainingRefundable > 0 && (
                <div className="space-y-2">
                  <Label>快捷金额</Label>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setRefundAmount(refundSummary.remainingRefundable.toString())}
                      className="flex-1"
                    >
                      全部{selectedTransaction.type?.toLowerCase() === 'income' ? '退还' : '退款'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setRefundAmount(Math.round(refundSummary.remainingRefundable / 2 * 100) / 100 + '')}
                      className="flex-1"
                    >
                      50% {selectedTransaction.type?.toLowerCase() === 'income' ? '退还' : '退款'}
                    </Button>
                  </div>
                </div>
              )}

              {/* 新增退款表单 */}
              {(!refundSummary || refundSummary.remainingRefundable > 0) && (
                <div className="p-4 rounded-lg bg-muted/50 space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="refund-amount">
                      {selectedTransaction.type?.toLowerCase() === 'income' ? '退还金额' : '退款金额'}
                    </Label>
                    <Input
                      id="refund-amount"
                      type="number"
                      value={refundAmount}
                      onChange={(e) => setRefundAmount(e.target.value)}
                      placeholder="0.00"
                      className="text-lg font-medium"
                    />
                    {refundSummary && (
                      <p className="text-xs text-muted-foreground">
                        最高可退: {formatCurrency(refundSummary.remainingRefundable)}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="refund-note">备注</Label>
                    <Input
                      id="refund-note"
                      value={refundNote}
                      onChange={(e) => setRefundNote(e.target.value)}
                      placeholder="输入退款备注"
                    />
                  </div>
                </div>
              )}

              {/* 退款记录列表 */}
              {refundList.length > 0 ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2">
                      <RotateCcw className="h-4 w-4" />
                      退款明细
                    </Label>
                    <span className="text-xs text-muted-foreground">共 {refundList.length} 笔</span>
                  </div>
                  <div className="max-h-60 overflow-y-auto space-y-2 border rounded-lg p-2 bg-muted/30">
                    {refundList.map((refund, index) => (
                      <div
                        key={refund.refundId}
                        className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${selectedTransaction?.type?.toLowerCase() === 'income' ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{refund.note || '退款'}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(refund.occurredAt, 'YYYY-MM-DD HH:mm:ss')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`font-semibold ${selectedTransaction?.type?.toLowerCase() === 'income' ? 'text-orange-600' : 'text-green-600'}`}>
                            {selectedTransaction?.type?.toLowerCase() === 'income' ? '-' : '+'}{formatCurrency(refund.amount)}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => cancelRefund(refund)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 px-2"
                            title="撤销该笔退款"
                          >
                            撤销
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* 汇总信息 */}
                  {refundSummary && (
                    <div className="flex justify-between items-center p-2 rounded bg-muted/50 text-sm">
                      <span className="text-muted-foreground">累计退款</span>
                      <span className={`font-semibold ${selectedTransaction?.type?.toLowerCase() === 'income' ? 'text-orange-600' : 'text-green-600'}`}>
                        {selectedTransaction?.type?.toLowerCase() === 'income' ? '-' : '+'}{formatCurrency(refundSummary.totalRefunded)}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                refundSummary && refundSummary.totalRefunded > 0 && (
                  <div className="text-center py-4 text-muted-foreground">
                    <p>暂无退款记录</p>
                  </div>
                )
              )}

              {/* 全额退款提示 */}
              {refundSummary && refundSummary.remainingRefundable <= 0 && (
                <div className="flex items-center justify-center gap-2 p-4 rounded-lg bg-green-50 border border-green-200">
                  <RotateCcw className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-700">已全额退款</span>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setRefundDialogOpen(false)}>关闭</Button>
            {selectedTransaction && (!refundSummary || refundSummary.remainingRefundable > 0) && (
              <Button onClick={handleRefund} className="bg-blue-600 hover:bg-blue-700">
                确认退款
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
