'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { ArrowUpRight, ArrowDownRight, Search } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import {
  TRANSACTION_TYPE,
  INCOME_CATEGORY_LABELS,
  EXPENSE_CATEGORY_LABELS,
} from '@/lib/constants';
import { get, post } from '@/lib/api';

type TransactionType = string;

interface Account {
  accountId: number;
  name: string;
}

interface BudgetOption {
  budgetId: number;
  name: string;
  category: string;
  totalAmount: number;
  usedAmount: number;
  periodStart: string;
  periodEnd: string;
  status: string;
}

interface QuickAddDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface FormData {
  type: TransactionType;
  amount: string;
  category: string;
  accountId: string;
  date: string;
  note: string;
  budgetId: string;
}

export function QuickAddDialog({ open, onOpenChange, onSuccess }: QuickAddDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [budgets, setBudgets] = useState<BudgetOption[]>([]);
  const [formData, setFormData] = useState<FormData>({
    type: 'expense',
    amount: '',
    category: '',
    accountId: '',
    date: new Date().toISOString().split('T')[0],
    note: '',
    budgetId: '',
  });
  const [budgetSearchQuery, setBudgetSearchQuery] = useState('');
  const [isBudgetSelectOpen, setIsBudgetSelectOpen] = useState(false);

  // 加载账户和预算数据
  useEffect(() => {
    if (open) {
      fetchAccounts();
      fetchBudgets();
      // 重置表单
      setFormData({
        type: 'expense',
        amount: '',
        category: '',
        accountId: '',
        date: new Date().toISOString().split('T')[0],
        note: '',
        budgetId: '',
      });
      setBudgetSearchQuery('');
    }
  }, [open]);

  const fetchAccounts = async () => {
    try {
      const data = await get<Account[]>('/api/v1/accounts');
      setAccounts(data || []);
      // 默认选择第一个账户
      if (data && data.length > 0 && !formData.accountId) {
        setFormData(prev => ({ ...prev, accountId: data[0].accountId.toString() }));
      }
    } catch (error) {
      console.error('无法加载账户列表', error);
    }
  };

  const fetchBudgets = async () => {
    try {
      const data = await get<BudgetOption[]>('/api/v1/budgets');
      setBudgets(data || []);
    } catch (error) {
      console.error('无法加载预算列表', error);
    }
  };

  // 筛选有效预算
  const availableBudgets = budgets.filter((budget) => {
    if (formData.type !== 'expense') return false;
    if (budget.status !== 'active') return false;
    return true;
  });

  // 检查预算是否过期
  const isBudgetExpired = (periodEnd: string) => {
    const now = new Date();
    const end = new Date(periodEnd + 'T23:59:59');
    return now > end;
  };

  // 搜索预算
  const searchedBudgets = availableBudgets
    .filter((budget) =>
      budget.name.toLowerCase().includes(budgetSearchQuery.toLowerCase()) ||
      budget.category.toLowerCase().includes(budgetSearchQuery.toLowerCase())
    )
    .slice(0, 10);

  // 验证表单
  const validateForm = (): boolean => {
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast({ title: '验证失败', description: '请输入有效金额', variant: 'destructive' });
      return false;
    }
    if (!formData.category) {
      toast({ title: '验证失败', description: '请选择分类', variant: 'destructive' });
      return false;
    }
    if (!formData.accountId) {
      toast({ title: '验证失败', description: '请选择账户', variant: 'destructive' });
      return false;
    }
    return true;
  };

  // 提交表单
  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const amountValue = parseFloat(formData.amount);
      const transactionData: Record<string, unknown> = {
        type: formData.type,
        amount: amountValue,
        category: formData.category,
        accountId: parseInt(formData.accountId),
        occurredAt: formData.date,
        note: formData.note.trim() || undefined,
      };

      if (formData.budgetId && formData.budgetId.trim() !== '') {
        transactionData.budgetId = parseInt(formData.budgetId);
      }

      await post('/api/v1/transactions', transactionData);

      toast({
        title: '保存成功',
        description: `${formData.type === 'income' ? '收入' : '支出'}已添加`,
      });

      onOpenChange(false);
      onSuccess?.();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '请稍后重试';
      toast({ title: '保存失败', description: errorMessage, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  // 选择类型
  const handleTypeSelect = (type: TransactionType) => {
    if (type === 'expense') {
      setFormData({ ...formData, type, category: '', budgetId: '' });
    } else {
      setFormData({ ...formData, type, category: '', budgetId: undefined as unknown as string });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>快速记账</DialogTitle>
          <DialogDescription>添加新的收入或支出记录</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto">
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
            <Label>分类 *</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="选择分类" />
              </SelectTrigger>
              <SelectContent>
                {formData.type === 'income'
                  ? Object.entries(INCOME_CATEGORY_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))
                  : Object.entries(EXPENSE_CATEGORY_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
              </SelectContent>
            </Select>
          </div>

          {/* 账户 */}
          <div className="space-y-2">
            <Label>账户 *</Label>
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
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsBudgetSelectOpen(!isBudgetSelectOpen)}
                  className="w-full h-10 px-3 py-2 text-sm border rounded-md bg-background hover:bg-accent hover:border-input transition-colors flex items-center justify-between text-left"
                >
                  <span className={formData.budgetId ? '' : 'text-muted-foreground'}>
                    {formData.budgetId === '' ? (
                      '不关联预算'
                    ) : formData.budgetId ? (
                      (() => {
                        const selected = availableBudgets.find(b => b.budgetId.toString() === formData.budgetId);
                        if (!selected) return '请选择预算';
                        return (
                          <span className="flex items-center gap-2">
                            {selected.name}
                            {isBudgetExpired(selected.periodEnd) && (
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
                  <Search className="w-4 h-4 text-muted-foreground" />
                </button>

                {isBudgetSelectOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => {
                        setIsBudgetSelectOpen(false);
                        setBudgetSearchQuery('');
                      }}
                    />
                    <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg">
                      <div className="p-2 border-b">
                        <Input
                          placeholder="搜索预算..."
                          value={budgetSearchQuery}
                          onChange={(e) => setBudgetSearchQuery(e.target.value)}
                          className="h-9"
                          autoFocus
                        />
                      </div>
                      <div className="max-h-48 overflow-y-auto py-1">
                        <button
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, budgetId: '' });
                            setIsBudgetSelectOpen(false);
                            setBudgetSearchQuery('');
                          }}
                          className={`w-full px-3 py-2 text-sm text-left hover:bg-accent ${
                            formData.budgetId === '' ? 'bg-accent/50' : ''
                          }`}
                        >
                          <div className="font-medium">不关联预算</div>
                        </button>
                        {searchedBudgets.map((budget) => (
                          <button
                            key={budget.budgetId}
                            type="button"
                            onClick={() => {
                              setFormData({ ...formData, budgetId: budget.budgetId.toString() });
                              setIsBudgetSelectOpen(false);
                              setBudgetSearchQuery('');
                            }}
                            className={`w-full px-3 py-2 text-sm text-left hover:bg-accent ${
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
                            <div className="text-xs text-muted-foreground">
                              剩余 {formatCurrency(budget.totalAmount - budget.usedAmount)}
                            </div>
                          </button>
                        ))}
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
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? '保存中...' : '保存'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
