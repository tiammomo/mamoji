'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import {
  Wallet,
  CreditCard,
  Landmark,
  Wallet2,
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { ACCOUNT_TYPE, ACCOUNT_TYPE_LABELS, type AccountType } from '@/lib/constants';
import { get, post, put, del } from '@/lib/api';

// 账户类型定义
interface Account {
  accountId: number;
  type: AccountType;
  name: string;
  balance: number;
  status: number;
  bankCardType?: string;
  creditLimit?: number;
}

// 账户表单数据
interface AccountFormData {
  name: string;
  type: AccountType;
  balance: string;
  note: string;
}

const getAccountIcon = (type: AccountType) => {
  switch (type) {
    case 'wechat':
      return <Wallet className="w-5 h-5 text-green-500" />;
    case 'alipay':
      return <Wallet2 className="w-5 h-5 text-blue-500" />;
    case 'bank':
      return <Landmark className="w-5 h-5 text-gray-500" />;
    case 'credit_card':
      return <CreditCard className="w-5 h-5 text-orange-500" />;
    case 'cash':
      return <Wallet className="w-5 h-5 text-yellow-500" />;
    default:
      return <Wallet className="w-5 h-5" />;
  }
};

export default function AccountsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingAccountId, setDeletingAccountId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // 表单状态
  const [formData, setFormData] = useState<AccountFormData>({
    name: '',
    type: 'cash',
    balance: '0',
    note: '',
  });

  // 加载账户列表
  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const data = await get<Account[]>('/api/v1/accounts');
      setAccounts(data || []);
    } catch (error) {
      toast({
        title: '加载失败',
        description: '无法加载账户列表',
        variant: 'destructive',
      });
    } finally {
      setIsInitialLoading(false);
    }
  };

  const filteredAccounts = accounts.filter(
    (acc) =>
      acc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ACCOUNT_TYPE_LABELS[acc.type].includes(searchQuery)
  );

  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

  // 打开新增对话框
  const handleAddAccount = () => {
    setEditingAccount(null);
    setFormData({ name: '', type: 'cash', balance: '0', note: '' });
    setIsDialogOpen(true);
  };

  // 打开编辑对话框
  const handleEditAccount = (account: Account) => {
    setEditingAccount(account);
    setFormData({
      name: account.name,
      type: account.type,
      balance: account.balance.toString(),
      note: '',
    });
    setIsDialogOpen(true);
  };

  // 打开删除确认对话框
  const handleDeleteClick = (accountId: number) => {
    setDeletingAccountId(accountId);
    setIsDeleteDialogOpen(true);
  };

  // 确认删除
  const handleConfirmDelete = async () => {
    if (!deletingAccountId) return;

    setIsLoading(true);
    try {
      await del(`/api/v1/accounts/${deletingAccountId}`);
      setAccounts((prev) => prev.filter((acc) => acc.accountId !== deletingAccountId));

      toast({
        title: '删除成功',
        description: '账户已删除',
      });
    } catch (error) {
      toast({
        title: '删除失败',
        description: '请稍后重试',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setIsDeleteDialogOpen(false);
      setDeletingAccountId(null);
    }
  };

  // 提交表单
  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast({
        title: '验证失败',
        description: '请输入账户名称',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const accountData = {
        name: formData.name,
        type: formData.type,
        balance: parseFloat(formData.balance) || 0,
      };

      if (editingAccount) {
        // 编辑模式
        await put(`/api/v1/accounts/${editingAccount.accountId}`, accountData);
        setAccounts((prev) =>
          prev.map((acc) =>
            acc.accountId === editingAccount.accountId
              ? { ...acc, ...accountData }
              : acc
          )
        );
        toast({
          title: '保存成功',
          description: '账户信息已更新',
        });
      } else {
        // 新增模式
        const newAccount = await post<Account>('/api/v1/accounts', accountData);
        setAccounts((prev) => [...prev, newAccount]);
        toast({
          title: '添加成功',
          description: '新账户已创建',
        });
      }

      setIsDialogOpen(false);
    } catch (error) {
      toast({
        title: editingAccount ? '保存失败' : '添加失败',
        description: '请稍后重试',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <Header
        title="账户管理"
        subtitle="管理您的所有账户资产"
      />

      {/* Summary Card */}
      <Card>
        <CardContent className="flex items-center justify-between py-6">
          <div>
            <p className="text-sm text-muted-foreground">账户总余额</p>
            <p className="text-3xl font-bold">{formatCurrency(totalBalance)}</p>
          </div>
          <Button onClick={handleAddAccount}>
            <Plus className="w-4 h-4 mr-2" />
            新增账户
          </Button>
        </CardContent>
      </Card>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="搜索账户..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Account List */}
      {!isInitialLoading && filteredAccounts.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredAccounts.map((account) => (
            <Card key={account.accountId} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                  {getAccountIcon(account.type)}
                </div>
                <div>
                  <CardTitle className="text-base">{account.name}</CardTitle>
                  <CardDescription>{ACCOUNT_TYPE_LABELS[account.type]}</CardDescription>
                </div>
              </div>
              <Button variant="ghost" size="icon">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">
                    <span className={account.balance < 0 ? 'text-destructive' : ''}>
                      {formatCurrency(account.balance)}
                    </span>
                  </p>
                  {account.type === 'credit_card' && account.creditLimit && (
                    <p className="text-xs text-muted-foreground">
                      额度: {formatCurrency(account.creditLimit)}
                    </p>
                  )}
                </div>
                <Badge variant={account.status === 1 ? 'default' : 'secondary'}>
                  {account.status === 1 ? '正常' : '停用'}
                </Badge>
              </div>

              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleEditAccount(account)}
                >
                  <Edit className="w-3 h-3 mr-1" />
                  编辑
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => handleDeleteClick(account.accountId)}
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  删除
                </Button>
              </div>
            </CardContent>
          </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {isInitialLoading ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">加载中...</p>
          </CardContent>
        </Card>
      ) : filteredAccounts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Wallet className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">暂无账户</p>
            <Button className="mt-4" onClick={handleAddAccount}>
              <Plus className="w-4 h-4 mr-2" />
              添加第一个账户
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingAccount ? '编辑账户' : '新增账户'}</DialogTitle>
            <DialogDescription>
              {editingAccount ? '修改账户信息' : '添加一个新的账户'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">账户名称 *</Label>
              <Input
                id="name"
                placeholder="如：工商银行(1234)"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">账户类型 *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value as AccountType })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择账户类型" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ACCOUNT_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="balance">当前余额</Label>
              <Input
                id="balance"
                type="number"
                placeholder="0.00"
                value={formData.balance}
                onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="note">备注</Label>
              <Input
                id="note"
                placeholder="可选备注信息"
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
              {isLoading ? '保存中...' : editingAccount ? '保存' : '添加'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              删除后无法恢复，是否确定删除该账户？
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isLoading}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete} disabled={isLoading}>
              {isLoading ? '删除中...' : '确认删除'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
