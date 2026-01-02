'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface BudgetStatsProps {
  budgetsCount: number;
  totalBudget: number;
  totalUsed: number;
  exceededCount: number;
  momChange: {
    budget: { value: number; isPositive: boolean };
    used: { value: number; isPositive: boolean };
    exceeded: { value: number; isPositive: boolean };
  };
}

export function BudgetStats({
  budgetsCount,
  totalBudget,
  totalUsed,
  exceededCount,
  momChange,
}: BudgetStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            活跃预算
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{budgetsCount}</div>
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
          <div className="flex items-center gap-1 mt-1">
            {momChange.budget.isPositive ? (
              <TrendingUp className="w-3 h-3 text-success" />
            ) : (
              <TrendingDown className="w-3 h-3 text-destructive" />
            )}
            <span className={`text-xs ${momChange.budget.isPositive ? 'text-success' : 'text-destructive'}`}>
              {momChange.budget.isPositive ? '+' : ''}{momChange.budget.value.toFixed(1)}%
            </span>
            <span className="text-xs text-muted-foreground">环比上月</span>
          </div>
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
          <div className="flex items-center gap-1 mt-1">
            {momChange.used.isPositive ? (
              <TrendingUp className="w-3 h-3 text-destructive" />
            ) : (
              <TrendingDown className="w-3 h-3 text-success" />
            )}
            <span className={`text-xs ${momChange.used.isPositive ? 'text-destructive' : 'text-success'}`}>
              {momChange.used.isPositive ? '+' : ''}{momChange.used.value.toFixed(1)}%
            </span>
            <span className="text-xs text-muted-foreground">环比上月</span>
          </div>
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
          <div className="flex items-center gap-1 mt-1">
            {momChange.exceeded.isPositive ? (
              <TrendingUp className="w-3 h-3 text-destructive" />
            ) : (
              <TrendingDown className="w-3 h-3 text-success" />
            )}
            <span className={`text-xs ${momChange.exceeded.isPositive ? 'text-destructive' : 'text-success'}`}>
              {momChange.exceeded.isPositive ? '+' : ''}{momChange.exceeded.value.toFixed(1)}%
            </span>
            <span className="text-xs text-muted-foreground">环比上月</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
