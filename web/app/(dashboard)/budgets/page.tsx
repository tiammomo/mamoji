'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { formatCurrency, getBudgetStatusLabel } from '@/lib/utils';
import { budgetApi } from '@/api';
import type { Budget } from '@/types';
import { Plus, Edit, Trash2, AlertTriangle, CheckCircle, Clock, Target, TrendingUp, DollarSign, PieChart, Calendar } from 'lucide-react';
import { toast } from 'sonner';

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
    alertThreshold: 80,
  });

  useEffect(() => {
    loadBudgets();
  }, []);

  const loadBudgets = async () => {
    try {
      const res = await budgetApi.list();
      if (res.code === 200) {
        setBudgets(res.data || []);
      }
    } catch (error) {
      toast.error('加载预算失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('请输入预算名称');
      return;
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error('请输入有效金额');
      return;
    }
    if (formData.startDate >= formData.endDate) {
      toast.error('结束日期必须晚于开始日期');
      return;
    }
    try {
      if (editingBudget) {
        await budgetApi.update(editingBudget.budgetId, {
          name: formData.name,
          amount: parseFloat(formData.amount),
          startDate: formData.startDate,
          endDate: formData.endDate,
          alertThreshold: formData.alertThreshold,
        });
        toast.success('预算更新成功');
      } else {
        await budgetApi.create({
          name: formData.name,
          amount: parseFloat(formData.amount),
          startDate: formData.startDate,
          endDate: formData.endDate,
          alertThreshold: formData.alertThreshold,
        });
        toast.success('预算创建成功');
      }
      setDialogOpen(false);
      resetForm();
      loadBudgets();
    } catch (error) {
      toast.error(editingBudget ? '更新失败' : '创建失败');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除该预算吗？')) return;
    try {
      await budgetApi.delete(id);
      toast.success('删除成功');
      loadBudgets();
    } catch (error) {
      toast.error('删除失败');
    }
  };

  const openEditDialog = (budget: Budget) => {
    setEditingBudget(budget);
    setFormData({
      name: budget.name,
      amount: budget.amount.toString(),
      startDate: budget.startDate.split('T')[0],
      endDate: budget.endDate.split('T')[0],
      alertThreshold: budget.alertThreshold,
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingBudget(null);
    setFormData({
      name: '',
      amount: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
      alertThreshold: 80,
    });
  };

  const getBudgetStatus = (budget: Budget) => {
    const percentage = budget.amount > 0 ? (budget.spent / budget.amount) * 100 : 0;
    if (budget.status === 0) return { icon: <Clock className="h-4 w-4" />, variant: 'secondary' as const, label: '已取消' };
    if (percentage > 100) return { icon: <AlertTriangle className="h-4 w-4" />, variant: 'destructive' as const, label: '已超支' };
    if (percentage >= budget.alertThreshold) return { icon: <AlertTriangle className="h-4 w-4" />, variant: 'warning' as const, label: '预警' };
    return { icon: <CheckCircle className="h-4 w-4" />, variant: 'success' as const, label: '正常' };
  };

  const getProgressColor = (percentage: number, alertThreshold: number) => {
    if (percentage > 100) return 'bg-red-500';
    if (percentage >= alertThreshold) return 'bg-orange-500';
    if (percentage >= alertThreshold * 0.7) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  // Calculate summary stats
  const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
  const activeBudgets = budgets.filter(b => b.status === 1);
  const overBudgetCount = budgets.filter(b => {
    const percentage = b.amount > 0 ? (b.spent / b.amount) * 100 : 0;
    return percentage > 100;
  }).length;

  const filteredBudgets = budgets.filter(budget => {
    const percentage = budget.amount > 0 ? (budget.spent / budget.amount) * 100 : 0;
    switch (filterStatus) {
      case 'active':
        return budget.status === 1 && percentage <= 100;
      case 'over':
        return percentage > 100;
      case 'cancelled':
        return budget.status === 0;
      default:
        return true;
    }
  });

  if (loading) {
    return (
      <DashboardLayout title="预算管理">
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
    <DashboardLayout title="预算管理">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">预算管理</h2>
            <p className="text-muted-foreground">规划和控制您的支出</p>
          </div>
          <Button onClick={() => { resetForm(); setDialogOpen(true); }} size="lg">
            <Plus className="h-5 w-5 mr-2" />
            添加预算
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-700 font-medium">总预算</p>
                  <p className="text-2xl font-bold text-blue-800">{formatCurrency(totalBudget)}</p>
                </div>
                <div className="p-3 bg-blue-200 rounded-full">
                  <Target className="h-6 w-6 text-blue-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-700 font-medium">已支出</p>
                  <p className="text-2xl font-bold text-orange-800">{formatCurrency(totalSpent)}</p>
                </div>
                <div className="p-3 bg-orange-200 rounded-full">
                  <TrendingUp className="h-6 w-6 text-orange-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-700 font-medium">进行中</p>
                  <p className="text-2xl font-bold text-green-800">{activeBudgets.length} 个</p>
                </div>
                <div className="p-3 bg-green-200 rounded-full">
                  <PieChart className="h-6 w-6 text-green-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={`bg-gradient-to-br ${overBudgetCount > 0 ? 'from-red-50 to-red-100 border-red-200' : 'from-gray-50 to-gray-100 border-gray-200'}`}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-700 font-medium">超支预算</p>
                  <p className={`text-2xl font-bold ${overBudgetCount > 0 ? 'text-red-800' : 'text-gray-800'}`}>{overBudgetCount} 个</p>
                </div>
                <div className={`p-3 rounded-full ${overBudgetCount > 0 ? 'bg-red-200' : 'bg-gray-200'}`}>
                  <AlertTriangle className={`h-6 w-6 ${overBudgetCount > 0 ? 'text-red-700' : 'text-gray-700'}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter Tabs */}
        <Tabs value={filterStatus} onValueChange={setFilterStatus}>
          <TabsList>
            <TabsTrigger value="all">全部 ({budgets.length})</TabsTrigger>
            <TabsTrigger value="active">进行中 ({activeBudgets.length})</TabsTrigger>
            <TabsTrigger value="over" className="text-red-600">超支 ({overBudgetCount})</TabsTrigger>
            <TabsTrigger value="cancelled">已取消 ({budgets.filter(b => b.status === 0).length})</TabsTrigger>
          </TabsList>

          <TabsContent value={filterStatus} className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  预算列表
                </CardTitle>
                <CardDescription>管理您的各项预算</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {filteredBudgets.length === 0 ? (
                    <div className="col-span-2 text-center py-12">
                      <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground mb-4">暂无预算</p>
                      <Button onClick={() => { resetForm(); setDialogOpen(true); }} variant="outline">
                        <Plus className="h-4 w-4 mr-2" />
                        创建第一个预算
                      </Button>
                    </div>
                  ) : (
                    filteredBudgets.map((budget) => {
                      const percentage = budget.amount > 0 ? Math.min((budget.spent / budget.amount) * 100, 100) : 0;
                      const actualPercentage = budget.amount > 0 ? (budget.spent / budget.amount) * 100 : 0;
                      const status = getBudgetStatus(budget);
                      const remaining = budget.amount - budget.spent;

                      return (
                        <Card key={budget.budgetId} className="hover:shadow-md transition-shadow">
                          <CardContent className="pt-6">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1">
                                <p className="font-semibold text-lg">{budget.name}</p>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                  <Calendar className="h-3 w-3" />
                                  <span>{budget.startDate.split('T')[0]} 至 {budget.endDate.split('T')[0]}</span>
                                </div>
                              </div>
                              <div className="flex gap-1">
                                <Button variant="ghost" size="icon" onClick={() => openEditDialog(budget)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleDelete(budget.budgetId)} className="hover:bg-red-50 text-destructive hover:text-destructive">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>

                            <div className="space-y-3">
                              <div className="flex justify-between items-end">
                                <div>
                                  <p className="text-sm text-muted-foreground">已花费 / 预算</p>
                                  <p className="text-lg font-semibold">
                                    {formatCurrency(budget.spent)} <span className="text-muted-foreground">/</span> {formatCurrency(budget.amount)}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm text-muted-foreground">使用率</p>
                                  <p className={`text-lg font-semibold ${actualPercentage > 100 ? 'text-red-600' : actualPercentage >= budget.alertThreshold ? 'text-orange-600' : 'text-green-600'}`}>
                                    {actualPercentage.toFixed(1)}%
                                  </p>
                                </div>
                              </div>

                              <div className="relative">
                                <Progress
                                  value={percentage}
                                  className="h-3"
                                />
                                {/* Alert threshold marker */}
                                <div
                                  className="absolute top-0 w-0.5 h-3 bg-orange-400"
                                  style={{ left: `${budget.alertThreshold}%` }}
                                />
                              </div>

                              <div className="flex justify-between items-center pt-2">
                                <Badge variant={status.variant} className="flex items-center gap-1">
                                  {status.icon}
                                  {status.label}
                                </Badge>
                                <span className={`text-sm font-medium ${remaining < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                  {remaining < 0 ? (
                                    <>超支 {formatCurrency(Math.abs(remaining))}</>
                                  ) : (
                                    <>剩余 {formatCurrency(remaining)}</>
                                  )}
                                </span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingBudget ? '编辑预算' : '添加预算'}</DialogTitle>
            <DialogDescription>创建一个新的预算来控制您的支出</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="budget-name">预算名称</Label>
              <Input
                id="budget-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="如：月度餐饮预算"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="budget-amount">预算金额</Label>
              <Input
                id="budget-amount"
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="budget-start">开始日期</Label>
                <Input
                  id="budget-start"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="budget-end">结束日期</Label>
                <Input
                  id="budget-end"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="budget-threshold">预警阈值 (%)</Label>
              <Input
                id="budget-threshold"
                type="number"
                min={1}
                max={100}
                value={formData.alertThreshold}
                onChange={(e) => setFormData({ ...formData, alertThreshold: parseInt(e.target.value) })}
                placeholder="80"
              />
              <p className="text-xs text-muted-foreground">当预算使用达到此百分比时发出预警（橙色标记）</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
            <Button onClick={handleSubmit}>{editingBudget ? '保存' : '创建'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
