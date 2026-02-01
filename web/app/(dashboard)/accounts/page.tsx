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
import { formatCurrency } from '@/lib/utils';
import { getAccountTypeLabel } from '@/lib/icons';
import { accountApi } from '@/api';
import type { Account, AccountType } from '@/types';
import { Plus, Edit, Trash2, Wallet, CreditCard, Banknote, Building2, Smartphone, PiggyBank, TrendingUp, TrendingDown } from 'lucide-react';
import { toast } from 'sonner';

const accountTypeOptions: { value: AccountType; label: string; icon: React.ReactNode }[] = [
  { value: 'bank', label: '银行账户', icon: <Building2 className="h-4 w-4" /> },
  { value: 'credit', label: '信用卡', icon: <CreditCard className="h-4 w-4" /> },
  { value: 'cash', label: '现金', icon: <Banknote className="h-4 w-4" /> },
  { value: 'alipay', label: '支付宝', icon: <Smartphone className="h-4 w-4" /> },
  { value: 'wechat', label: '微信钱包', icon: <Smartphone className="h-4 w-4" /> },
];

const getTypeIcon = (type: string) => {
  const option = accountTypeOptions.find(o => o.value === type?.toLowerCase());
  return option?.icon || <Wallet className="h-4 w-4" />;
};

const getTypeColorClass = (type: string) => {
  const t = type?.toLowerCase();
  switch (t) {
    case 'bank': return 'bg-blue-100 text-blue-600';
    case 'credit': return 'bg-orange-100 text-orange-600';
    case 'cash': return 'bg-green-100 text-green-600';
    case 'alipay': return 'bg-sky-100 text-sky-600';
    case 'wechat': return 'bg-emerald-100 text-emerald-600';
    default: return 'bg-gray-100 text-gray-600';
  }
};

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    accountType: 'bank' as AccountType,
    currency: 'CNY',
    balance: '0',
    includeInTotal: 1 as number, // backend: Integer (0/1)
  });

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      const res = await accountApi.list();
      if (res.code === 200) {
        setAccounts(res.data || []);
      }
    } catch (error) {
      toast.error('加载账户失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('请输入账户名称');
      return;
    }
    try {
      if (editingAccount) {
        await accountApi.update(editingAccount.accountId, {
          name: formData.name,
          accountType: formData.accountType,
          balance: parseFloat(formData.balance) || 0,
          includeInTotal: formData.includeInTotal as number,
        });
        toast.success('账户更新成功');
      } else {
        await accountApi.create({
          name: formData.name,
          accountType: formData.accountType,
          currency: formData.currency,
          balance: parseFloat(formData.balance) || 0,
          includeInTotal: formData.includeInTotal as number,
        });
        toast.success('账户创建成功');
      }
      setDialogOpen(false);
      resetForm();
      loadAccounts();
    } catch (error) {
      toast.error(editingAccount ? '更新失败' : '创建失败');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除该账户吗？')) return;
    try {
      await accountApi.delete(id);
      toast.success('删除成功');
      loadAccounts();
    } catch (error) {
      toast.error('删除失败');
    }
  };

  const openEditDialog = (account: Account) => {
    setEditingAccount(account);
    setFormData({
      name: account.name,
      accountType: account.accountType,
      currency: account.currency,
      balance: account.balance.toString(),
      includeInTotal: account.includeInTotal,
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingAccount(null);
    setFormData({
      name: '',
      accountType: 'bank',
      currency: 'CNY',
      balance: '0',
      includeInTotal: 1,
    });
  };

  // Calculate totals
  const totalAssets = accounts
    .filter((a) => a.includeInTotal && a.balance > 0)
    .reduce((sum, a) => sum + a.balance, 0);

  const totalLiabilities = accounts
    .filter((a) => a.accountType === 'credit' || a.accountType === 'debt')
    .reduce((sum, a) => sum + Math.abs(a.balance), 0);

  const netAssets = totalAssets - totalLiabilities;

  const bankAccounts = accounts.filter(a => a.accountType?.toLowerCase() === 'bank');
  const creditAccounts = accounts.filter(a => a.accountType?.toLowerCase() === 'credit');
  const digitalAccounts = accounts.filter(a => ['alipay', 'wechat'].includes(a.accountType?.toLowerCase()));
  const cashAccounts = accounts.filter(a => a.accountType?.toLowerCase() === 'cash');

  if (loading) {
    return (
      <DashboardLayout title="账户管理">
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
    <DashboardLayout title="账户管理">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">账户管理</h2>
            <p className="text-muted-foreground">管理您的所有账户资产</p>
          </div>
          <Button onClick={() => { resetForm(); setDialogOpen(true); }} size="lg">
            <Plus className="h-5 w-5 mr-2" />
            添加账户
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-white border-green-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-700 font-medium">总资产</p>
                  <p className="text-3xl font-bold text-green-700">{formatCurrency(totalAssets)}</p>
                  <p className="text-xs text-green-600 mt-1">计入净资产</p>
                </div>
                <div className="p-3 bg-green-50 rounded-full">
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-red-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-700 font-medium">总负债</p>
                  <p className="text-3xl font-bold text-red-700">{formatCurrency(totalLiabilities)}</p>
                  <p className="text-xs text-red-600 mt-1">信用卡等</p>
                </div>
                <div className="p-3 bg-red-50 rounded-full">
                  <TrendingDown className="h-8 w-8 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-blue-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-700 font-medium">净资产</p>
                  <p className="text-3xl font-bold text-blue-700">{formatCurrency(netAssets)}</p>
                  <p className="text-xs text-blue-600 mt-1">{accounts.length} 个账户</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-full">
                  <PiggyBank className="h-8 w-8 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Account Tabs */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">全部</TabsTrigger>
            <TabsTrigger value="bank">银行</TabsTrigger>
            <TabsTrigger value="credit">信用卡</TabsTrigger>
            <TabsTrigger value="digital">数字钱包</TabsTrigger>
            <TabsTrigger value="cash">现金</TabsTrigger>
          </TabsList>

          {/* All Accounts */}
          <TabsContent value="all" className="mt-6">
            <Card className="bg-white rounded-2xl shadow-sm">
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Wallet className="h-5 w-5 text-primary" />
                  账户列表
                  <Badge variant="secondary">{accounts.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                {accounts.length === 0 ? (
                  <div className="text-center py-12">
                    <Wallet className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground mb-4">暂无账户</p>
                    <Button onClick={() => { resetForm(); setDialogOpen(true); }} variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      添加第一个账户
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {accounts.map((account) => (
                      <Card key={account.accountId} className="bg-white hover:shadow-md transition-all rounded-xl border shadow-sm">
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className={`p-3 rounded-full ${getTypeColorClass(account.accountType?.toLowerCase() || '')}`}>
                                {getTypeIcon(account.accountType?.toLowerCase() || '')}
                              </div>
                              <div>
                                <p className="font-semibold">{account.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {getAccountTypeLabel(account.accountType?.toLowerCase() || '')}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditDialog(account)}
                                className="hover:bg-gray-100"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(account.accountId)}
                                className="hover:bg-red-50 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div className="flex items-baseline justify-between">
                              <span className="text-sm text-muted-foreground">余额</span>
                              <span className={`text-xl font-bold ${
                                account.balance < 0 ? 'text-red-600' : 'text-green-600'
                              }`}>
                                {formatCurrency(account.balance)}
                              </span>
                            </div>

                            <div className="flex gap-2">
                              <Badge
                                variant={account.includeInTotal ? 'default' : 'outline'}
                                className={account.includeInTotal ? 'bg-green-600' : ''}
                              >
                                {account.includeInTotal ? '计入总计' : '不计入'}
                              </Badge>
                              <Badge variant="outline">
                                {account.currency}
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bank Accounts */}
          <TabsContent value="bank" className="mt-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {bankAccounts.map((account) => (
                <Card key={account.accountId} className="bg-white hover:shadow-md transition-shadow rounded-xl border shadow-sm">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-3 rounded-full bg-blue-100">
                          <Building2 className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-semibold">{account.name}</p>
                          <p className="text-xs text-muted-foreground">银行账户</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(account)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(account.balance)}</p>
                  </CardContent>
                </Card>
              ))}
              {bankAccounts.length === 0 && (
                <div className="col-span-full text-center py-12 text-muted-foreground">
                  暂无银行账户
                </div>
              )}
            </div>
          </TabsContent>

          {/* Credit Cards */}
          <TabsContent value="credit" className="mt-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {creditAccounts.map((account) => (
                <Card key={account.accountId} className="bg-white hover:shadow-md transition-shadow rounded-xl border shadow-sm">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-3 rounded-full bg-orange-100">
                          <CreditCard className="h-5 w-5 text-orange-600" />
                        </div>
                        <div>
                          <p className="font-semibold">{account.name}</p>
                          <p className="text-xs text-muted-foreground">信用卡</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(account)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-2xl font-bold text-red-600">-{formatCurrency(Math.abs(account.balance))}</p>
                  </CardContent>
                </Card>
              ))}
              {creditAccounts.length === 0 && (
                <div className="col-span-full text-center py-12 text-muted-foreground">
                  暂无信用卡
                </div>
              )}
            </div>
          </TabsContent>

          {/* Digital Wallets */}
          <TabsContent value="digital" className="mt-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {digitalAccounts.map((account) => (
                <Card key={account.accountId} className="bg-white hover:shadow-md transition-shadow rounded-xl border shadow-sm">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-3 rounded-full bg-sky-100">
                          <Smartphone className="h-5 w-5 text-sky-600" />
                        </div>
                        <div>
                          <p className="font-semibold">{account.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {account.accountType === 'alipay' ? '支付宝' : '微信钱包'}
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(account)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(account.balance)}</p>
                  </CardContent>
                </Card>
              ))}
              {digitalAccounts.length === 0 && (
                <div className="col-span-full text-center py-12 text-muted-foreground">
                  暂无数字钱包
                </div>
              )}
            </div>
          </TabsContent>

          {/* Cash */}
          <TabsContent value="cash" className="mt-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {cashAccounts.map((account) => (
                <Card key={account.accountId} className="bg-white hover:shadow-md transition-shadow rounded-xl border shadow-sm">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-3 rounded-full bg-green-100">
                          <Banknote className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-semibold">{account.name}</p>
                          <p className="text-xs text-muted-foreground">现金</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(account)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(account.balance)}</p>
                  </CardContent>
                </Card>
              ))}
              {cashAccounts.length === 0 && (
                <div className="col-span-full text-center py-12 text-muted-foreground">
                  暂无现金账户
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingAccount ? '编辑账户' : '添加账户'}</DialogTitle>
            <DialogDescription>
              {editingAccount ? '修改账户信息' : '创建新的账户'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="account-name">账户名称</Label>
              <Input
                id="account-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="如：招商银行储蓄卡"
                maxLength={30}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="account-type">账户类型</Label>
              <Select
                value={formData.accountType}
                onValueChange={(value: AccountType) => setFormData({ ...formData, accountType: value })}
              >
                <SelectTrigger id="account-type">
                  <SelectValue placeholder="选择类型" />
                </SelectTrigger>
                <SelectContent>
                  {accountTypeOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <span className="flex items-center gap-2">
                        {opt.icon} {opt.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="account-balance">余额</Label>
              <Input
                id="account-balance"
                type="number"
                value={formData.balance}
                onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="includeInTotal"
                checked={!!formData.includeInTotal}
                onChange={(e) => setFormData({ ...formData, includeInTotal: e.target.checked ? 1 : 0 })}
                className="rounded"
              />
              <Label htmlFor="includeInTotal">计入总资产</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
            <Button onClick={handleSubmit}>{editingAccount ? '保存' : '创建'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
