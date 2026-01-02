'use client';

import { useState, useCallback } from 'react';
import { Header } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus } from 'lucide-react';
import { useBudgets, Budget } from '@/hooks/useBudgets';
import { BudgetFilters, BudgetStats, BudgetList, BudgetForm } from '@/components/budget';
import { BudgetDetailDialog } from '@/components/budget-detail-dialog';

type TabValue = 'all' | 'ended' | 'in_progress' | 'not_started';

export default function BudgetsPage() {
  const {
    budgets,
    isLoading,
    isInitialLoading,
    dateRange,
    budgetsInRange,
    totalBudget,
    totalUsed,
    exceededCount,
    momChange,
    setDateRange,
    fetchBudgets,
    createBudget,
    updateBudget,
    deleteBudget,
  } = useBudgets();

  const [activeTab, setActiveTab] = useState<TabValue>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);

  // 根据 Tab 筛选预算
  const getBudgetTimeStatus = useCallback((budget: Budget): 'ended' | 'in_progress' | 'not_started' => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const budgetStart = new Date(budget.periodStart);
    const budgetEnd = new Date(budget.periodEnd);

    if (budgetEnd < today) return 'ended';
    if (budgetStart > today) return 'not_started';
    return 'in_progress';
  }, []);

  const filteredBudgets = useCallback(() => {
    if (activeTab === 'all') return budgetsInRange;
    return budgetsInRange.filter((budget) => getBudgetTimeStatus(budget) === activeTab);
  }, [budgetsInRange, activeTab, getBudgetTimeStatus]);

  // 处理操作
  const handleCreateBudget = async (data: Partial<Budget>) => {
    const success = await createBudget(data);
    if (success) {
      setIsDialogOpen(false);
    }
  };

  const handleUpdateBudget = async (data: Partial<Budget>) => {
    if (!editingBudget) return;
    const success = await updateBudget(editingBudget.budgetId, data);
    if (success) {
      setIsEditDialogOpen(false);
      setEditingBudget(null);
    }
  };

  const handleEdit = (budget: Budget) => {
    setEditingBudget(budget);
    setIsEditDialogOpen(true);
  };

  const handleDelete = useCallback(async (budgetId: number) => {
    const confirmed = window.confirm('确定要删除此预算吗？');
    if (!confirmed) return;
    await deleteBudget(budgetId);
  }, [deleteBudget]);

  const handleViewDetail = (budgetId: number) => {
    if (typeof window !== 'undefined') {
      const openFn = (window as unknown as { __budgetDetailOpen__?: (id: number) => void }).__budgetDetailOpen__;
      openFn?.(budgetId);
    }
  };

  const openCreateDialog = () => {
    setEditingBudget(null);
    setIsDialogOpen(true);
  };

  return (
    <div className="pt-2 px-4 pb-4 space-y-4">
      <Header title="预算管理" subtitle="管理预算和审批流程" />

      {/* 时间筛选器 */}
      <BudgetFilters dateRange={dateRange} onDateRangeChange={setDateRange} />

      {/* 统计卡片 */}
      <BudgetStats
        budgetsCount={budgetsInRange.length}
        totalBudget={totalBudget}
        totalUsed={totalUsed}
        exceededCount={exceededCount}
        momChange={momChange}
      />

      {/* 操作栏 */}
      <div className="flex items-center justify-between">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)}>
          <TabsList>
            <TabsTrigger value="all">全部</TabsTrigger>
            <TabsTrigger value="ended">已结束</TabsTrigger>
            <TabsTrigger value="in_progress">进行中</TabsTrigger>
            <TabsTrigger value="not_started">未开始</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button onClick={openCreateDialog}>
          <Plus className="w-4 h-4 mr-2" />
          新建预算
        </Button>
      </div>

      {/* 预算列表 */}
      <BudgetList
        budgets={filteredBudgets()}
        isLoading={isLoading}
        isInitialLoading={isInitialLoading}
        onViewDetail={handleViewDetail}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* 新建预算表单 */}
      <BudgetForm
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        editingBudget={null}
        isLoading={isLoading}
        onSubmit={handleCreateBudget}
      />

      {/* 编辑预算表单 */}
      <BudgetForm
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        editingBudget={editingBudget}
        isLoading={isLoading}
        onSubmit={handleUpdateBudget}
      />

      {/* 预算详情弹窗 */}
      <BudgetDetailDialog onBudgetUpdate={fetchBudgets} />
    </div>
  );
}
