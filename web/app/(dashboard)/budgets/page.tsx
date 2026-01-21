'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { formatCurrency, getBudgetStatusLabel } from '@/lib/utils';
import { budgetApi } from '@/api';
import type { Budget } from '@/types';
import { Plus, Edit, Trash2, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
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
      if (res.code === 0) {
        setBudgets(res.data || []);
      }
    } catch (error) {
      toast.error('加载预算失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
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

  if (loading) {
    return (
      <DashboardLayout title="预算管理">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="预算管理">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">我的预算 ({budgets.length})</h3>
          <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-1" /> 添加预算
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {budgets.length === 0 ? (
            <Card className="col-span-2">
              <CardContent className="py-12 text-center text-muted-foreground">
                暂无预算，点击添加按钮创建您的第一个预算
              </CardContent>
            </Card>
          ) : (
            budgets.map((budget) => {
              const percentage = budget.amount > 0 ? Math.min((budget.spent / budget.amount) * 100, 100) : 0;
              const status = getBudgetStatus(budget);
              const remaining = budget.amount - budget.spent;

              return (
                <Card key={budget.budgetId}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <p className="font-semibold text-lg">{budget.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {budget.startDate.split('T')[0]} 至 {budget.endDate.split('T')[0]}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(budget)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(budget.budgetId)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span>已花费</span>
                        <span className="font-medium">
                          {formatCurrency(budget.spent)} / {formatCurrency(budget.amount)}
                        </span>
                      </div>
                      <Progress value={percentage} className="h-3" />
                      <div className="flex justify-between items-center">
                        <Badge variant={status.variant}>
                          {status.icon} {status.label}
                        </Badge>
                        <span className={`text-sm font-medium ${remaining < 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {remaining < 0 ? '超支' : '剩余'} {formatCurrency(Math.abs(remaining))}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingBudget ? '编辑预算' : '添加预算'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>预算名称</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="如：月度餐饮预算"
              />
            </div>
            <div className="space-y-2">
              <Label>预算金额</Label>
              <Input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>开始日期</Label>
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>结束日期</Label>
                <Input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>预警阈值 (%)</Label>
              <Input
                type="number"
                value={formData.alertThreshold}
                onChange={(e) => setFormData({ ...formData, alertThreshold: parseInt(e.target.value) })}
                placeholder="80"
              />
              <p className="text-xs text-muted-foreground">当预算使用达到此百分比时发出预警</p>
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
