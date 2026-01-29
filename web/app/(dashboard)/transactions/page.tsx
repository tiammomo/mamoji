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
import { formatCurrency, formatDate, getTransactionTypeLabel } from '@/lib/utils';
import { transactionApi, accountApi, categoryApi, refundApi } from '@/api';
import type { Transaction, Account, Category, TransactionType, Refund, RefundSummary } from '@/types';
import { Plus, Search, Filter, ArrowUpCircle, ArrowDownCircle, Trash2, TrendingUp, TrendingDown, DollarSign, Calendar, Tag, Wallet, RotateCcw, Edit2 } from 'lucide-react';
import { toast } from 'sonner';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
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
  const [expandedTx, setExpandedTx] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    transactionId: 0,
    accountId: 0,
    categoryId: 0,
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
      const [txRes, accRes, catRes] = await Promise.all([
        transactionApi.list({ current: 1, size: 100 }),
        accountApi.list(),
        categoryApi.list(),
      ]);

      console.log('[Transactions] API响应:', {
        txRes: txRes?.code,
        accRes: accRes?.code,
        catRes: catRes?.code
      });

      if (txRes.code === 200) {
        const allTransactions = txRes.data?.records || [];
        console.log('[Transactions] 原始交易数量:', allTransactions.length);
        // 过滤掉退款交易（退款会关联到原交易显示）
        const normalTransactions = allTransactions.filter((t: Transaction) => t.type !== 'refund');
        console.log('[Transactions] 过滤后交易数量:', normalTransactions.length);
        setTransactions(normalTransactions);

        // 计算汇总
        const income = normalTransactions.filter(tx => tx.type === 'income').reduce((sum, tx) => sum + tx.amount, 0);
        const expense = normalTransactions.filter(tx => tx.type === 'expense').reduce((sum, tx) => sum + tx.amount, 0);
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
    try {
      // 格式化时间为 yyyy-MM-dd HH:mm:ss
      const formatDateTime = (dateStr: string) => {
        const date = new Date(dateStr);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
      };

      await transactionApi.create({
        accountId: formData.accountId,
        categoryId: formData.categoryId,
        type: formData.type,
        amount: parseFloat(formData.amount),
        occurredAt: formatDateTime(formData.occurredAt),
        note: formData.note,
      });
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
      type: tx.type?.toLowerCase() as TransactionType,
      amount: tx.amount.toString(),
      occurredAt: tx.occurredAt.split('T')[0],
      note: tx.note || '',
    });
    setDialogOpen(true);
  };

  // 打开退款对话框
  const openRefundDialog = async (tx: Transaction) => {
    if (tx.type !== 'expense') {
      toast.error('只能对支出交易进行退款');
      return;
    }

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

  const resetForm = () => {
    setEditingTransaction(null);
    setFormData({
      transactionId: 0,
      accountId: 0,
      categoryId: 0,
      type: 'expense',
      amount: '',
      occurredAt: new Date().toISOString().split('T')[0],
      note: '',
    });
  };

  const filteredTransactions = transactions.filter((tx) => {
    const matchesKeyword = !searchKeyword ||
      tx.note?.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      categories.find(c => c.categoryId === tx.categoryId)?.name?.toLowerCase().includes(searchKeyword.toLowerCase());
    const matchesType = filterType === 'all' || tx.type === filterType;

    // 日期筛选
    let matchesDate = true;
    if (tx.occurredAt && (startDate || endDate)) {
      const txDate = new Date(tx.occurredAt).toISOString().split('T')[0];
      if (startDate && txDate < startDate) matchesDate = false;
      if (endDate && txDate > endDate) matchesDate = false;
    }

    return matchesKeyword && matchesType && matchesDate;
  });

  const getCategoryName = (id: number) => categories.find((c) => c.categoryId === id)?.name || '未分类';
  const getAccountName = (id: number) => accounts.find((a) => a.accountId === id)?.name || '未知账户';

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
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-700 font-medium">总收入</p>
                  <p className="text-2xl font-bold text-green-800">+{formatCurrency(totalIncome)}</p>
                </div>
                <div className="p-3 bg-green-200 rounded-full">
                  <TrendingUp className="h-6 w-6 text-green-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-700 font-medium">总支出</p>
                  <p className="text-2xl font-bold text-red-800">-{formatCurrency(totalExpense)}</p>
                </div>
                <div className="p-3 bg-red-200 rounded-full">
                  <TrendingDown className="h-6 w-6 text-red-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={`bg-gradient-to-br ${totalIncome - totalExpense >= 0 ? 'from-blue-50 to-blue-100 border-blue-200' : 'from-orange-50 to-orange-100 border-orange-200'}`}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">净收支</p>
                  <p className="text-2xl font-bold">
                    {totalIncome - totalExpense >= 0 ? '+' : ''}{formatCurrency(totalIncome - totalExpense)}
                  </p>
                </div>
                <div className="p-3 bg-blue-200 rounded-full">
                  <DollarSign className="h-6 w-6 text-blue-700" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
              <div className="flex gap-2 flex-1">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="搜索交易..."
                    className="pl-9"
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                  />
                </div>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="类型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部</SelectItem>
                    <SelectItem value="income">收入</SelectItem>
                    <SelectItem value="expense">支出</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="date"
                  className="w-36"
                  placeholder="开始日期"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
                <span className="text-muted-foreground">至</span>
                <Input
                  type="date"
                  className="w-36"
                  placeholder="结束日期"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <div className="text-sm text-muted-foreground flex items-center">
                共 {filteredTransactions.length} 笔交易
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  交易列表
                </CardTitle>
                <CardDescription>所有交易记录明细</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {filteredTransactions.length === 0 ? (
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
                      {filteredTransactions.map((tx) => (
                        <div
                          key={tx.transactionId}
                          className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-full ${tx.type === 'income' ? 'bg-green-100' : 'bg-red-100'}`}>
                              {tx.type === 'income' ? (
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
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`font-semibold text-lg ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                              {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
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
                            {/* 退款按钮：仅对支出交易显示 */}
                            {tx.type === 'expense' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openRefundDialog(tx)}
                                className="hover:bg-blue-50 text-blue-600 hover:text-blue-700"
                              >
                                退款
                              </Button>
                            )}
                            {/* 退款金额显示 */}
                            {tx.type === 'expense' && (tx.refundAmount ?? 0) > 0 && (
                              <Button
                                variant="link"
                                size="sm"
                                className="text-green-600 h-auto p-0"
                                onClick={() => setExpandedTx(expandedTx === tx.transactionId ? null : tx.transactionId)}
                              >
                                (已退 {formatCurrency(tx.refundAmount ?? 0)})
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
                            {tx.type === 'expense' && (tx.refundAmount ?? 0) > 0 && expandedTx === tx.transactionId && (
                              <div className="mt-2 ml-auto w-full max-w-[200px]">
                                <div
                                  className="flex items-center justify-between p-2 rounded bg-green-50 border border-green-200 cursor-pointer hover:bg-green-100"
                                  onClick={() => openRefundDialog(tx)}
                                >
                                  <div className="flex items-center gap-2">
                                    <RotateCcw className="h-4 w-4 text-green-600" />
                                    <span className="text-sm text-green-800">
                                      退款
                                    </span>
                                  </div>
                                  <span className="font-semibold text-green-600">+{formatCurrency(tx.refundAmount ?? 0)}</span>
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  时间轴视图
                </CardTitle>
                <CardDescription>按日期分组展示交易</CardDescription>
              </CardHeader>
              <CardContent>
                {filteredTransactions.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    暂无交易记录
                  </div>
                ) : (
                  <div className="relative space-y-6 pl-4 border-l-2 border-muted ml-4">
                    {filteredTransactions.map((tx, index) => (
                      <div key={tx.transactionId} className="relative">
                        <div className={`absolute -left-[21px] top-1 p-2 rounded-full border-2 border-background ${tx.type === 'income' ? 'bg-green-100' : 'bg-red-100'}`}>
                          {tx.type === 'income' ? (
                            <TrendingUp className="h-4 w-4 text-green-600" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-600" />
                          )}
                        </div>
                        <div className="ml-6 p-4 rounded-lg border hover:bg-muted/50">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">{tx.note || getCategoryName(tx.categoryId)}</p>
                              <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                                <span>{getAccountName(tx.accountId)}</span>
                                <Badge variant="outline" className="text-xs">
                                  {getTransactionTypeLabel(tx.type)}
                                </Badge>
                              </p>
                            </div>
                            <span className={`font-semibold ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                              {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
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
            <DialogTitle>{editingTransaction ? '编辑交易' : '添加交易'}</DialogTitle>
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
                value={formData.categoryId?.toString() || '0'}
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

      {/* 退款对话框 */}
      <Dialog open={refundDialogOpen} onOpenChange={setRefundDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-blue-600" />
              退款
            </DialogTitle>
            <DialogDescription>为支出交易创建或管理退款</DialogDescription>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-4 py-4">
              {/* 原交易信息 */}
              <div className="p-4 rounded-lg bg-muted">
                <p className="text-sm text-muted-foreground">原交易</p>
                <p className="font-medium">{selectedTransaction.note || getCategoryName(selectedTransaction.categoryId)}</p>
                <p className="text-red-600 font-semibold">-{formatCurrency(selectedTransaction.amount)}</p>
              </div>

              {/* 退款汇总 */}
              {refundSummary && (
                <div className="grid grid-cols-2 gap-4 p-3 rounded-lg bg-green-50 border border-green-200">
                  <div>
                    <p className="text-xs text-green-600">已退金额</p>
                    <p className="text-lg font-semibold text-green-700">+{formatCurrency(refundSummary.totalRefunded)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-green-600">剩余可退</p>
                    <p className="text-lg font-semibold text-green-700">{formatCurrency(refundSummary.remainingRefundable)}</p>
                  </div>
                </div>
              )}

              {/* 退款记录列表 */}
              {refundList.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">退款记录</p>
                  {refundList.map((refund) => (
                    <div
                      key={refund.refundId}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50"
                    >
                      <div>
                        <p className="font-medium">{refund.note}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(refund.occurredAt, 'YYYY-MM-DD HH:mm')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-green-600">+{formatCurrency(refund.amount)}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => cancelRefund(refund)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          取消
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 新增退款 */}
              {(!refundSummary || refundSummary.remainingRefundable > 0) && (
                <>
                  {/* 退款金额 */}
                  <div className="space-y-2">
                    <Label htmlFor="refund-amount">新增退款金额</Label>
                    <Input
                      id="refund-amount"
                      type="number"
                      value={refundAmount}
                      onChange={(e) => setRefundAmount(e.target.value)}
                      placeholder="0.00"
                    />
                    {refundSummary && (
                      <p className="text-xs text-muted-foreground">
                        最高可退: {formatCurrency(refundSummary.remainingRefundable)}
                      </p>
                    )}
                  </div>

                  {/* 备注 */}
                  <div className="space-y-2">
                    <Label htmlFor="refund-note">备注</Label>
                    <Input
                      id="refund-note"
                      value={refundNote}
                      onChange={(e) => setRefundNote(e.target.value)}
                      placeholder="输入退款备注"
                    />
                  </div>
                </>
              )}

              {refundSummary && refundSummary.remainingRefundable <= 0 && (
                <p className="text-center text-muted-foreground">已全额退款</p>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setRefundDialogOpen(false)}>关闭</Button>
            {(!refundSummary || refundSummary.remainingRefundable > 0) && (
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
