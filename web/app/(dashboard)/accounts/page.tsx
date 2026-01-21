'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Badge } from '@/components/ui/badge';
import { formatCurrency, getAccountTypeLabel } from '@/lib/utils';
import { accountApi } from '@/api';
import type { Account, AccountType } from '@/types';
import { Plus, Edit, Trash2, Wallet, CreditCard, Banknote } from 'lucide-react';
import { toast } from 'sonner';

const accountTypeOptions: { value: AccountType; label: string; icon: React.ReactNode }[] = [
  { value: 'bank', label: '银行账户', icon: <Wallet className="h-4 w-4" /> },
  { value: 'credit', label: '信用卡', icon: <CreditCard className="h-4 w-4" /> },
  { value: 'cash', label: '现金', icon: <Banknote className="h-4 w-4" /> },
  { value: 'alipay', label: '支付宝', icon: <Wallet className="h-4 w-4" /> },
  { value: 'wechat', label: '微信钱包', icon: <Wallet className="h-4 w-4" /> },
];

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
    includeInTotal: true,
  });

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      const res = await accountApi.list();
      if (res.code === 0) {
        setAccounts(res.data || []);
      }
    } catch (error) {
      toast.error('加载账户失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      if (editingAccount) {
        await accountApi.update(editingAccount.accountId, {
          name: formData.name,
          accountType: formData.accountType,
          balance: parseFloat(formData.balance) || 0,
          includeInTotal: formData.includeInTotal,
        });
        toast.success('账户更新成功');
      } else {
        await accountApi.create({
          name: formData.name,
          accountType: formData.accountType,
          currency: formData.currency,
          balance: parseFloat(formData.balance) || 0,
          includeInTotal: formData.includeInTotal,
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
      includeInTotal: true,
    });
  };

  const totalAssets = accounts
    .filter((a) => a.includeInTotal && a.balance > 0)
    .reduce((sum, a) => sum + a.balance, 0);

  const totalLiabilities = accounts
    .filter((a) => a.accountType === 'credit' || a.accountType === 'debt')
    .reduce((sum, a) => sum + Math.abs(a.balance), 0);

  return (
    <DashboardLayout title="账户管理">
      <div className="space-y-6">
        {/* Summary */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground">总资产</div>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(totalAssets)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground">总负债</div>
              <div className="text-2xl font-bold text-red-600">{formatCurrency(totalLiabilities)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground">净资产</div>
              <div className="text-2xl font-bold">{formatCurrency(totalAssets - totalLiabilities)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Account List */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">账户列表 ({accounts.length})</h3>
          <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-1" /> 添加账户
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => (
            <Card key={account.accountId}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-primary/10">
                      {accountTypeOptions.find((o) => o.value === account.accountType)?.icon}
                    </div>
                    <div>
                      <p className="font-medium">{account.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {getAccountTypeLabel(account.accountType)}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(account)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(account.accountId)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-2xl font-bold">{formatCurrency(account.balance)}</div>
                  <div className="flex gap-2 mt-2">
                    <Badge variant={account.includeInTotal ? 'default' : 'secondary'}>
                      {account.includeInTotal ? '计入总计' : '不计入'}
                    </Badge>
                    <Badge variant="outline">{account.currency}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingAccount ? '编辑账户' : '添加账户'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>账户名称</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="请输入账户名称"
              />
            </div>
            <div className="space-y-2">
              <Label>账户类型</Label>
              <Select
                value={formData.accountType}
                onValueChange={(value) => setFormData({ ...formData, accountType: value as AccountType })}
              >
                <SelectTrigger>
                  <SelectValue />
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
              <Label>余额</Label>
              <Input
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
                checked={formData.includeInTotal}
                onChange={(e) => setFormData({ ...formData, includeInTotal: e.target.checked })}
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
