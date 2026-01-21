'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { formatCurrency } from '@/lib/utils';
import { accountApi, transactionApi, budgetApi } from '@/api';
import type { AccountSummary, Transaction, Budget } from '@/types';
import { TrendingUp, TrendingDown, Wallet, CreditCard, PiggyBank, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const [summary, setSummary] = useState<AccountSummary | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [summaryRes, transactionsRes, budgetsRes] = await Promise.all([
        accountApi.getSummary(),
        transactionApi.getRecent(5),
        budgetApi.listActive(),
      ]);

      if (summaryRes.code === 0) setSummary(summaryRes.data);
      if (transactionsRes.code === 0) setRecentTransactions(transactionsRes.data || []);
      if (budgetsRes.code === 0) setBudgets(budgetsRes.data || []);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="仪表盘">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="仪表盘">
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">总资产</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(summary?.totalAssets || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                {summary?.accountsCount || 0} 个账户
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">总负债</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {formatCurrency(summary?.totalLiabilities || 0)}
              </div>
              <p className="text-xs text-muted-foreground">信用卡+贷款</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">净资产</CardTitle>
              <PiggyBank className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(summary?.netAssets || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                {summary ? ((summary.totalAssets - summary.totalLiabilities) / summary.totalAssets * 100).toFixed(1) : 0}% 负债率
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">本月净收入</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                +{formatCurrency(3250)}
              </div>
              <p className="text-xs text-muted-foreground">较上月增长 12.5%</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Transactions */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>最近交易</CardTitle>
              <Link href="/transactions">
                <Button variant="ghost" size="sm">
                  查看全部 <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentTransactions.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">暂无交易记录</p>
                ) : (
                  recentTransactions.map((tx) => (
                    <div key={tx.transactionId} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${tx.type === 'income' ? 'bg-green-100' : 'bg-red-100'}`}>
                          {tx.type === 'income' ? (
                            <TrendingUp className="h-4 w-4 text-green-600" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{tx.note || '交易'}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(tx.occurredAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <span className={tx.type === 'income' ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                        {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Budget Progress */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>预算进度</CardTitle>
              <Link href="/budgets">
                <Button variant="ghost" size="sm">
                  管理预算 <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {budgets.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">暂无预算</p>
                ) : (
                  budgets.slice(0, 4).map((budget) => {
                    const percentage = budget.amount > 0 ? (budget.spent / budget.amount) * 100 : 0;
                    const isOver = budget.spent > budget.amount;
                    return (
                      <div key={budget.budgetId} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{budget.name}</span>
                          <span className="text-sm text-muted-foreground">
                            {formatCurrency(budget.spent)} / {formatCurrency(budget.amount)}
                          </span>
                        </div>
                        <Progress value={Math.min(percentage, 100)} className="h-2" />
                        <div className="flex items-center justify-between text-sm">
                          <Badge variant={isOver ? 'destructive' : percentage > 80 ? 'warning' : 'success'}>
                            {isOver ? '已超支' : `${percentage.toFixed(0)}%`}
                          </Badge>
                          <span className="text-muted-foreground">
                            剩余 {formatCurrency(budget.amount - budget.spent)}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
