'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Loader2 } from 'lucide-react';
import { Budget, getDefaultPeriod, BudgetTimeStatus } from '@/hooks/useBudgets';
import { BUDGET_TYPE_LABELS, EXPENSE_CATEGORY_LABELS } from '@/lib/constants';

interface BudgetFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingBudget: Budget | null;
  isLoading: boolean;
  onSubmit: (data: Partial<Budget>) => Promise<void>;
}

export function BudgetForm({ open, onOpenChange, editingBudget, isLoading, onSubmit }: BudgetFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'monthly',
    category: 'office',
    totalAmount: 0,
    periodStart: getDefaultPeriod('monthly').periodStart,
    periodEnd: getDefaultPeriod('monthly').periodEnd,
  });

  // Reset form when editing budget changes
  useEffect(() => {
    if (editingBudget) {
      setFormData({
        name: editingBudget.name,
        type: editingBudget.type,
        category: editingBudget.category,
        totalAmount: editingBudget.totalAmount,
        periodStart: editingBudget.periodStart,
        periodEnd: editingBudget.periodEnd,
      });
    } else {
      const defaultPeriod = getDefaultPeriod('monthly');
      setFormData({
        name: '',
        type: 'monthly',
        category: 'office',
        totalAmount: 0,
        periodStart: defaultPeriod.periodStart,
        periodEnd: defaultPeriod.periodEnd,
      });
    }
  }, [editingBudget, open]);

  const handleSubmit = async () => {
    if (!formData.name || !formData.totalAmount || !formData.periodStart || !formData.periodEnd) {
      return;
    }
    await onSubmit(formData);
  };

  const handleTypeChange = (value: string) => {
    const period = getDefaultPeriod(value);
    setFormData({ ...formData, type: value, periodStart: period.periodStart, periodEnd: period.periodEnd });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editingBudget ? '编辑预算' : '新建预算'}</DialogTitle>
          <DialogDescription>
            {editingBudget ? '修改预算信息' : '创建一个新的预算计划'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">预算名称</Label>
            <Input
              id="name"
              placeholder="如：1月生活支出预算"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>预算类型</Label>
              <Select value={formData.type} onValueChange={handleTypeChange}>
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
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
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
              value={formData.totalAmount || ''}
              onChange={(e) => setFormData({ ...formData, totalAmount: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>开始日期</Label>
              <Input
                type="date"
                value={formData.periodStart}
                onChange={(e) => setFormData({ ...formData, periodStart: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>结束日期</Label>
              <Input
                type="date"
                value={formData.periodEnd}
                onChange={(e) => setFormData({ ...formData, periodEnd: e.target.value })}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {editingBudget ? '保存' : '创建'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
