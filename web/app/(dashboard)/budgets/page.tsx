'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  Edit,
  Trash2,
  Loader2,
} from 'lucide-react';
import { formatCurrency, formatPercent } from '@/lib/utils';
import { useUser } from '@/stores/auth';
import {
  BUDGET_TYPE,
  BUDGET_TYPE_LABELS,
  BUDGET_STATUS,
  BUDGET_STATUS_LABELS,
  EXPENSE_CATEGORY,
  EXPENSE_CATEGORY_LABELS,
} from '@/lib/constants';

interface Budget {
  budgetId: number;
  name: string;
  type: string;
  category: string;
  totalAmount: number;
  usedAmount: number;
  periodStart: string;
  periodEnd: string;
  status: string;
  enterpriseId?: number;
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'active':
      return <CheckCircle2 className="w-4 h-4 text-success" />;
    case 'exceeded':
      return <AlertTriangle className="w-4 h-4 text-destructive" />;
    case 'draft':
      return <Clock className="w-4 h-4 text-warning" />;
    default:
      return null;
  }
};

export default function BudgetsPage() {
  const user = useUser();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // 获取当日日期，格式化为 YYYY-MM-DD
  const getTodayDate = () => new Date().toISOString().split('T')[0];

  // 新建预算表单状态
  const [newBudget, setNewBudget] = useState({
    name: '',
    type: 'monthly',
    category: 'office',
    totalAmount: 0,
    periodStart: getTodayDate(),
    periodEnd: getTodayDate(),
  });

  // 获取预算列表
  const fetchBudgets = async () => {
    if (!user?.enterpriseId) {
      setIsInitialLoading(false);
      return;
    }
    try {
      const response = await fetch(`/api/v1/budgets?unitId=${user.enterpriseId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.code === 0 && data.data) {
          setBudgets(data.data);
        }
      }
    } catch (error) {
      console.error('获取预算列表失败:', error);
    } finally {
      setIsInitialLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, [user?.enterpriseId]);

  const filteredBudgets = budgets.filter((budget) => {
    if (activeTab === 'all') return true;
    return budget.status === activeTab;
  });

  const activeBudgets = budgets.filter((b) => b.status === 'active');
  const totalBudget = activeBudgets.reduce((sum, b) => sum + b.totalAmount, 0);
  const totalUsed = activeBudgets.reduce((sum, b) => sum + b.usedAmount, 0);
  const exceededCount = budgets.filter((b) => b.status === 'exceeded').length;

  const handleEdit = (budget: Budget) => {
    setEditingBudget(budget);
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (budgetId: number) => {
    if (!confirm('确定要删除此预算吗？')) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/v1/budgets/${budgetId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setBudgets((prev) => prev.filter((b) => b.budgetId !== budgetId));
      } else {
        alert('删除失败');
      }
    } catch (error) {
      console.error('删除预算失败:', error);
      alert('删除失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingBudget) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/v1/budgets/${editingBudget.budgetId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingBudget.name,
          type: editingBudget.type,
          category: editingBudget.category,
          totalAmount: editingBudget.totalAmount,
          periodStart: editingBudget.periodStart,
          periodEnd: editingBudget.periodEnd,
        }),
      });
      const data = await response.json();
      if (data.code === 0) {
        setBudgets((prev) =>
          prev.map((b) =>
            b.budgetId === editingBudget.budgetId ? { ...b, ...editingBudget } : b
          )
        );
        setIsEditDialogOpen(false);
      } else {
        alert(data.message || '更新失败');
      }
    } catch (error) {
      console.error('更新预算失败:', error);
      alert('更新失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 创建预算
  const handleCreateBudget = async () => {
    if (!newBudget.name || !newBudget.totalAmount || !newBudget.periodStart || !newBudget.periodEnd) {
      alert('请填写完整信息');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/v1/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newBudget,
          unitId: user?.enterpriseId,
        }),
      });
      const data = await response.json();
      if (data.code === 0 && data.data) {
        setBudgets((prev) => [...prev, data.data]);
        setIsDialogOpen(false);
        setNewBudget({
          name: '',
          type: 'monthly',
          category: 'office',
          totalAmount: 0,
          periodStart: '',
          periodEnd: '',
        });
      } else {
        alert(data.message || '创建失败');
      }
    } catch (error) {
      console.error('创建预算失败:', error);
      alert('创建失败');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <Header title="预算管理" subtitle="管理预算和审批流程" />

      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              活跃预算
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeBudgets.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              总预算金额
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalBudget)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              已使用金额
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalUsed)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              超支数量
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{exceededCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">全部</TabsTrigger>
            <TabsTrigger value="active">生效中</TabsTrigger>
            <TabsTrigger value="draft">草稿</TabsTrigger>
            <TabsTrigger value="exceeded">已超支</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          新建预算
        </Button>
      </div>

      {/* Budget List */}
      <div className="grid gap-4">
        {isInitialLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">加载中...</span>
          </div>
        ) : filteredBudgets.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
暂无预算数据
          </div>
        ) : (
          filteredBudgets.map((budget) => {
            const percent = (budget.usedAmount / budget.totalAmount) * 100;
            const isExceeded = budget.status === 'exceeded';

            return (
              <Card key={budget.budgetId}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <span className="font-semibold">{budget.name}</span>
                        {getStatusIcon(budget.status)}
                        <Badge
                          variant={isExceeded ? 'destructive' : 'default'}
                        >
                          {BUDGET_STATUS_LABELS[budget.status as keyof typeof BUDGET_STATUS_LABELS]}
                        </Badge>
                        <Badge variant="outline">
                          {BUDGET_TYPE_LABELS[budget.type as keyof typeof BUDGET_TYPE_LABELS]}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {EXPENSE_CATEGORY_LABELS[budget.category as keyof typeof EXPENSE_CATEGORY_LABELS]} ·
                        {budget.periodStart} 至 {budget.periodEnd}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(budget)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(budget.budgetId)}
                        disabled={isLoading}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>

                  <div className="mt-4">
                    <Progress
                      value={Math.min(percent, 100)}
                      className={isExceeded ? '[&_*]:bg-destructive' : ''}
                    />
                    <div className="flex items-center justify-between mt-2 text-sm text-muted-foreground">
                      <span>{percent.toFixed(1)}%</span>
                      <span>
                        剩余 {formatCurrency(budget.totalAmount - budget.usedAmount)}
                      </span>
                    </div>
                  </div>

                  {percent >= 80 && !isExceeded && (
                    <div className="mt-4 p-3 bg-warning/10 border border-warning/20 rounded-md flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-warning" />
                      <span className="text-sm text-warning">
                        预算使用已超过 80%，请注意控制支出
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Add Budget Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新建预算</DialogTitle>
            <DialogDescription>创建一个新的预算计划</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">预算名称</Label>
              <Input
                id="name"
                placeholder="如：1月生活支出预算"
                value={newBudget.name}
                onChange={(e) => setNewBudget({ ...newBudget, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>预算类型</Label>
                <Select
                  value={newBudget.type}
                  onValueChange={(value) => setNewBudget({ ...newBudget, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择类型" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(BUDGET_TYPE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>支出分类</Label>
                <Select
                  value={newBudget.category}
                  onValueChange={(value) => setNewBudget({ ...newBudget, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择分类" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(EXPENSE_CATEGORY_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">预算金额</Label>
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                value={newBudget.totalAmount || ''}
                onChange={(e) => setNewBudget({ ...newBudget, totalAmount: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>开始日期</Label>
                <Input
                  type="date"
                  value={newBudget.periodStart}
                  onChange={(e) => setNewBudget({ ...newBudget, periodStart: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>结束日期</Label>
                <Input
                  type="date"
                  value={newBudget.periodEnd}
                  onChange={(e) => setNewBudget({ ...newBudget, periodEnd: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleCreateBudget} disabled={isLoading}>
              {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              创建
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Budget Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑预算</DialogTitle>
            <DialogDescription>修改预算信息</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">预算名称</Label>
              <Input
                id="edit-name"
                value={editingBudget?.name || ''}
                onChange={(e) =>
                  setEditingBudget(editingBudget ? { ...editingBudget, name: e.target.value } : null)
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>预算类型</Label>
                <Select
                  value={editingBudget?.type || ''}
                  onValueChange={(value) =>
                    setEditingBudget(editingBudget ? { ...editingBudget, type: value } : null)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择类型" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(BUDGET_TYPE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>支出分类</Label>
                <Select
                  value={editingBudget?.category || ''}
                  onValueChange={(value) =>
                    setEditingBudget(editingBudget ? { ...editingBudget, category: value } : null)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择分类" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(EXPENSE_CATEGORY_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-amount">预算金额</Label>
              <Input
                id="edit-amount"
                type="number"
                value={editingBudget?.totalAmount || 0}
                onChange={(e) =>
                  setEditingBudget(
                    editingBudget ? { ...editingBudget, totalAmount: parseFloat(e.target.value) || 0 } : null
                  )
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>开始日期</Label>
                <Input
                  type="date"
                  value={editingBudget?.periodStart || ''}
                  onChange={(e) =>
                    setEditingBudget(editingBudget ? { ...editingBudget, periodStart: e.target.value } : null)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>结束日期</Label>
                <Input
                  type="date"
                  value={editingBudget?.periodEnd || ''}
                  onChange={(e) =>
                    setEditingBudget(editingBudget ? { ...editingBudget, periodEnd: e.target.value } : null)
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSaveEdit} disabled={isLoading}>
              {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
