'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { transactionApi, accountApi, categoryApi } from '@/api';
import type { Transaction, Account, Category, TransactionType } from '@/types';
import { Plus, Search, Filter, ArrowUpCircle, ArrowDownCircle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [formData, setFormData] = useState({
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
      const [txRes, accRes, catRes] = await Promise.all([
        transactionApi.list({ page: 1, pageSize: 100 }),
        accountApi.list(),
        categoryApi.list(),
      ]);

      if (txRes.code === 0) setTransactions(txRes.data?.list || []);
      if (accRes.code === 0) setAccounts(accRes.data || []);
      if (catRes.code === 0) setCategories(catRes.data || []);
    } catch (error) {
      toast.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      await transactionApi.create({
        accountId: formData.accountId,
        categoryId: formData.categoryId,
        type: formData.type,
        amount: parseFloat(formData.amount),
        occurredAt: formData.occurredAt,
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

  const resetForm = () => {
    setFormData({
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
      tx.note?.toLowerCase().includes(searchKeyword.toLowerCase());
    const matchesType = filterType === 'all' || tx.type === filterType;
    return matchesKeyword && matchesType;
  });

  const getCategoryName = (id: number) => categories.find((c) => c.categoryId === id)?.name || '未分类';
  const getAccountName = (id: number) => accounts.find((a) => a.accountId === id)?.name || '未知账户';

  if (loading) {
    return (
      <DashboardLayout title="交易记录">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="交易记录">
      <div className="space-y-4">
        {/* Actions */}
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
          </div>
          <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-1" /> 添加交易
          </Button>
        </div>

        {/* Transaction List */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-3">
              {filteredTransactions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">暂无交易记录</p>
              ) : (
                filteredTransactions.map((tx) => (
                  <div
                    key={tx.transactionId}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-full ${tx.type === 'income' ? 'bg-green-100' : 'bg-red-100'}`}>
                        {tx.type === 'income' ? (
                          <ArrowUpCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <ArrowDownCircle className="h-5 w-5 text-red-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{tx.note || getCategoryName(tx.categoryId)}</p>
                        <div className="flex gap-2 text-sm text-muted-foreground">
                          <span>{getAccountName(tx.accountId)}</span>
                          <span>·</span>
                          <span>{formatDate(tx.occurredAt, 'YYYY-MM-DD')}</span>
                          <Badge variant="outline" className="text-xs">
                            {getTransactionTypeLabel(tx.type)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`font-semibold ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                        {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                      </span>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(tx.transactionId)}>
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加交易</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>类型</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value as TransactionType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">收入</SelectItem>
                    <SelectItem value="expense">支出</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>金额</Label>
                <Input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>账户</Label>
              <Select
                value={formData.accountId.toString()}
                onValueChange={(value) => setFormData({ ...formData, accountId: parseInt(value) })}
              >
                <SelectTrigger>
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
              <Label>分类</Label>
              <Select
                value={formData.categoryId.toString()}
                onValueChange={(value) => setFormData({ ...formData, categoryId: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择分类" />
                </SelectTrigger>
                <SelectContent>
                  {categories.filter((c) => c.type === formData.type).map((cat) => (
                    <SelectItem key={cat.categoryId} value={cat.categoryId.toString()}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>日期</Label>
              <Input
                type="date"
                value={formData.occurredAt}
                onChange={(e) => setFormData({ ...formData, occurredAt: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>备注</Label>
              <Input
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                placeholder="添加备注..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
            <Button onClick={handleSubmit}>创建</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
