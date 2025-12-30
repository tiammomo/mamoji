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
  Calendar,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { formatCurrency, formatPercent } from '@/lib/utils';
import { useUser } from '@/stores/auth';
import { get, post, put, del } from '@/lib/api';
import { TOKEN_KEY } from '@/lib/constants';
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
  const formatDateRange = (start: string, end: string) => {
    return `${start} 至 ${end}`;
  };

  // ========== 时间筛选功能结束 ==========

  // 获取当日日期（北京时间），格式化为 YYYY-MM-DD
  const getTodayDate = () => {
    const now = new Date();
    // 获取北京时间偏移（UTC+8）
    const beijingTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);
    return beijingTime.toISOString().split('T')[0];
  };

  // 根据预算类型获取默认周期（北京时间）
  const getDefaultPeriod = (type: string): { periodStart: string; periodEnd: string } => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    // 获取北京时间偏移
    const beijingOffset = 8 * 60 * 60 * 1000;

    switch (type) {
      case 'monthly':
        // 月度预算：当月第一天到最后一天（北京时间）
        const firstDayOfMonth = new Date(Date.UTC(year, month, 1, 0, 0, 0));
        const lastDayOfMonth = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59));
        return {
          periodStart: firstDayOfMonth.toISOString().split('T')[0],
          periodEnd: lastDayOfMonth.toISOString().split('T')[0],
        };
      case 'yearly':
        // 年度预算：当年1月1日到12月31日（北京时间）
        return {
          periodStart: `${year}-01-01`,
          periodEnd: `${year}-12-31`,
        };
      case 'project':
      default:
        // 项目预算：当天（北京时间）
        const today = new Date(Date.UTC(year, now.getMonth(), now.getDate()));
        return {
          periodStart: today.toISOString().split('T')[0],
          periodEnd: today.toISOString().split('T')[0],
        };
    }
  };

  // 新建预算表单状态
  const [newBudget, setNewBudget] = useState({
    name: '',
    type: 'monthly',
    category: 'office',
    totalAmount: 0,
    periodStart: getDefaultPeriod('monthly').periodStart,
    periodEnd: getDefaultPeriod('monthly').periodEnd,
  });

  // 获取预算列表
  const fetchBudgets = async () => {
    if (!user?.enterpriseId) {
      setIsInitialLoading(false);
      return;
    }
    try {
      const data = await get<Budget[]>(`/api/v1/budgets?unitId=${user.enterpriseId}`);
      // 过滤掉已删除的预算（status=ended）
      const activeBudgets = (data || []).filter(b => b.status !== 'ended');
      setBudgets(activeBudgets);
    } catch (error) {
      console.error('获取预算列表失败:', error);
    } finally {
      setIsInitialLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, [user?.enterpriseId]);

  // 检查预算周期是否与选择的时间范围重叠
  const isBudgetInRange = (budget: Budget) => {
    const budgetStart = new Date(budget.periodStart);
    const budgetEnd = new Date(budget.periodEnd);
    const filterStart = new Date(dateRange.start);
    const filterEnd = new Date(dateRange.end);
    return budgetStart <= filterEnd && budgetEnd >= filterStart;
  };

  const filteredBudgets = budgets.filter((budget) => {
    if (activeTab === 'all') return true;
    return budget.status === activeTab;
  });

  // 根据时间范围筛选预算（只统计与时间范围重叠的预算）
  const budgetsInRange = budgets.filter((b) => isBudgetInRange(b) && b.status === 'active');
  const totalBudget = budgetsInRange.reduce((sum, b) => sum + b.totalAmount, 0);
  const totalUsed = budgetsInRange.reduce((sum, b) => sum + b.usedAmount, 0);
  const exceededCount = budgets.filter((b) => isBudgetInRange(b) && b.status === 'exceeded').length;

  const handleEdit = (budget: Budget) => {
    setEditingBudget(budget);
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (budgetId: number) => {
    console.log('[Budgets] 开始删除预算:', budgetId);
    if (!confirm('确定要删除此预算吗？')) {
      console.log('[Budgets] 用户取消删除');
      return;
    }

    setIsLoading(true);
    try {
      console.log('[Budgets] 发送删除请求:', `/api/v1/budgets/${budgetId}`);
      await del(`/api/v1/budgets/${budgetId}`);
      console.log('[Budgets] 删除成功，更新本地状态');
      setBudgets((prev) => {
        const newBudgets = prev.filter((b) => b.budgetId !== budgetId);
        console.log('[Budgets] 预算列表更新:', prev.length, '->', newBudgets.length);
        return newBudgets;
      });
    } catch (error) {
      console.error('[Budgets] 删除预算失败:', error);
      alert('删除失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingBudget) return;

    setIsLoading(true);
    try {
      await put(`/api/v1/budgets/${editingBudget.budgetId}`, {
        name: editingBudget.name,
        type: editingBudget.type,
        category: editingBudget.category,
        totalAmount: editingBudget.totalAmount,
        periodStart: editingBudget.periodStart,
        periodEnd: editingBudget.periodEnd,
      });
      setBudgets((prev) =>
        prev.map((b) =>
          b.budgetId === editingBudget.budgetId ? { ...b, ...editingBudget } : b
        )
      );
      setIsEditDialogOpen(false);
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
      const data = await post<Budget>('/api/v1/budgets', {
        ...newBudget,
        unitId: user?.enterpriseId,
      });
      if (data) {
        setBudgets((prev) => [...prev, data]);
        setIsDialogOpen(false);
        setNewBudget({
          name: '',
          type: 'monthly',
          category: 'office',
          totalAmount: 0,
          periodStart: '',
          periodEnd: '',
        });
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

      {/* 时间筛选器 */}
      <div className="flex items-center justify-between bg-muted/30 p-3 rounded-lg border">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">时间范围：</span>
          <span className="text-sm text-primary font-semibold">{formatDateRange(dateRange.start, dateRange.end)}</span>
        </div>
        <div className="flex items-center gap-1">
          {quickRanges.map((range) => (
            <Button
              key={range.value}
              variant={
                formatDateRange(dateRange.start, dateRange.end) ===
                formatDateRange(calculateDateRange(range.value).start, calculateDateRange(range.value).end)
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
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              活跃预算
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{budgetsInRange.length}</div>
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
        <Button onClick={() => {
          const defaultPeriod = getDefaultPeriod('monthly');
          setNewBudget({
            name: '',
            type: 'monthly',
            category: 'office',
            totalAmount: 0,
            periodStart: defaultPeriod.periodStart,
            periodEnd: defaultPeriod.periodEnd,
          });
          setIsDialogOpen(true);
        }}>
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
                  onValueChange={(value) => {
                    const period = getDefaultPeriod(value);
                    setNewBudget({ ...newBudget, type: value, periodStart: period.periodStart, periodEnd: period.periodEnd });
                  }}
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
