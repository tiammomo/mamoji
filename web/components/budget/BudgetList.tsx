'use client';

import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Edit, Trash2, Eye, AlertTriangle, ArrowUpDown, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Budget } from '@/hooks/useBudgets';
import { BUDGET_TYPE_LABELS, EXPENSE_CATEGORY_LABELS } from '@/lib/constants';

// 根据时间范围计算预算状态
type BudgetTimeStatus = 'ended' | 'in_progress' | 'not_started';

const getBudgetTimeStatus = (budget: Budget): BudgetTimeStatus => {
  const now = new Date();
  // 使用字符串比较避免时区问题
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const budgetStart = budget.periodStart;
  const budgetEnd = budget.periodEnd;

  if (budgetEnd < today) return 'ended';
  if (budgetStart > today) return 'not_started';
  return 'in_progress';
};

const BUDGET_TIME_STATUS_LABELS: Record<BudgetTimeStatus, string> = {
  ended: '已结束',
  in_progress: '进行中',
  not_started: '未开始',
};

// 排序字段
type SortField = 'endDate' | 'startDate' | 'usageRatio' | 'totalAmount';

const SORT_FIELDS: Record<SortField, string> = {
  endDate: '结束时间',
  startDate: '开始时间',
  usageRatio: '使用比例',
  totalAmount: '总金额',
};

// 排序方向
type SortDirection = 'asc' | 'desc' | 'none';

interface BudgetListProps {
  budgets: Budget[];
  isLoading: boolean;
  isInitialLoading: boolean;
  onViewDetail: (budgetId: number) => void;
  onEdit: (budget: Budget) => void;
  onDelete: (budgetId: number) => void;
}

export function BudgetList({
  budgets,
  isLoading,
  isInitialLoading,
  onViewDetail,
  onEdit,
  onDelete,
}: BudgetListProps) {
  const [sortField, setSortField] = useState<SortField>('endDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('none');

  // 切换排序方向
  const toggleDirection = () => {
    if (sortDirection === 'none') {
      setSortDirection('asc');
    } else if (sortDirection === 'asc') {
      setSortDirection('desc');
    } else {
      setSortDirection('none');
    }
  };

  // 设置排序字段并重置为无序
  const handleFieldChange = (field: SortField) => {
    setSortField(field);
    setSortDirection('none');
  };

  // 排序后的预算列表
  const sortedBudgets = useMemo(() => {
    if (sortDirection === 'none') {
      return [...budgets];
    }

    return [...budgets].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'endDate':
          comparison = a.periodEnd.localeCompare(b.periodEnd);
          break;
        case 'startDate':
          comparison = a.periodStart.localeCompare(b.periodStart);
          break;
        case 'usageRatio': {
          const ratioA = a.usedAmount / a.totalAmount;
          const ratioB = b.usedAmount / b.totalAmount;
          comparison = ratioA - ratioB;
          break;
        }
        case 'totalAmount':
          comparison = a.totalAmount - b.totalAmount;
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [budgets, sortField, sortDirection]);

  if (isInitialLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">加载中...</span>
      </div>
    );
  }

  if (budgets.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        暂无预算数据
      </div>
    );
  }

  return (
    <div>
      {/* 排序选择器 */}
      <div className="flex items-center justify-between mb-4 p-3 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-background rounded-md p-1 shadow-sm">
            <Select value={sortField} onValueChange={(v) => handleFieldChange(v as SortField)}>
              <SelectTrigger className="w-28 h-8 border-0 shadow-none focus:ring-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(SORT_FIELDS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-1 bg-background rounded-md p-1 shadow-sm">
            <button
              onClick={toggleDirection}
              className={`p-1.5 rounded-sm transition-all ${
                sortDirection === 'asc'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="升序"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
            <button
              onClick={toggleDirection}
              className={`p-1.5 rounded-sm transition-all ${
                sortDirection === 'desc'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="降序"
            >
              <ArrowDown className="w-4 h-4" />
            </button>
            <button
              onClick={toggleDirection}
              className={`p-1.5 rounded-sm transition-all ${
                sortDirection === 'none'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="默认顺序"
            >
              <Minus className="w-4 h-4" />
            </button>
          </div>
        </div>
        <span className="text-sm text-muted-foreground">
          共 <span className="font-medium text-foreground">{budgets.length}</span> 个预算
        </span>
      </div>

      {/* 预算卡片网格 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedBudgets.map((budget) => {
          const percent = (budget.usedAmount / budget.totalAmount) * 100;
          const isExceeded = budget.usedAmount > budget.totalAmount;
          const timeStatus = getBudgetTimeStatus(budget);
          const remaining = budget.totalAmount - budget.usedAmount;

          return (
            <Card
              key={budget.budgetId}
              className="p-4 transition-all hover:shadow-md"
            >
              {/* 头部：标题和操作按钮 */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold truncate">{budget.name}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge
                      variant={timeStatus === 'ended' ? 'destructive' : timeStatus === 'in_progress' ? 'success' : 'secondary'}
                      size="sm"
                    >
                      {BUDGET_TIME_STATUS_LABELS[timeStatus]}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {BUDGET_TYPE_LABELS[budget.type as keyof typeof BUDGET_TYPE_LABELS]}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 ml-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => onViewDetail(budget.budgetId)}
                    title="查看详情"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => onEdit(budget)}
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => onDelete(budget.budgetId)}
                    disabled={isLoading}
                  >
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </Button>
                </div>
              </div>

              {/* 分类和时间 */}
              <p className="text-xs text-muted-foreground mb-3">
                {EXPENSE_CATEGORY_LABELS[budget.category as keyof typeof EXPENSE_CATEGORY_LABELS]}
                <span className="mx-1">·</span>
                {budget.periodStart} 至 {budget.periodEnd}
              </p>

              {/* 进度条 */}
              <div className="mb-2">
                <Progress
                  value={Math.min(percent, 100)}
                  className={`h-2 ${isExceeded ? '[&_*]:bg-destructive' : ''}`}
                />
              </div>

              {/* 金额信息 */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{percent.toFixed(1)}%</span>
                <span className={isExceeded ? 'text-destructive font-medium' : ''}>
                  {isExceeded ? '超支' : '剩余'} {formatCurrency(Math.abs(remaining))}
                </span>
              </div>

              {/* 80% 警告 */}
              {percent >= 80 && !isExceeded && (
                <div className="mt-3 p-2 bg-warning/10 border border-warning/20 rounded flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-warning flex-shrink-0" />
                  <span className="text-xs text-warning">预算使用超过 80%</span>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
