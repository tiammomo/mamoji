'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { formatCurrency, formatDate, getTransactionTypeLabel } from '@/lib/utils';
import { accountApi, transactionApi, budgetApi, reportApi } from '@/api';
import { useAuthStore } from '@/hooks/useAuth';
import type { AccountSummary, Transaction, Budget, ReportsSummary } from '@/types';
import { TrendingUp, TrendingDown, Wallet, CreditCard, PiggyBank, ArrowRight, TrendingUp as TrendingUpIcon, DollarSign, Target, Activity } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [summary, setSummary] = useState<AccountSummary | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [reportsSummary, setReportsSummary] = useState<ReportsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    loadDashboardData();
  }, [isAuthenticated, router]);

  const loadDashboardData = async () => {
    try {
      const [summaryRes, transactionsRes, budgetsRes, reportsRes] = await Promise.all([
        accountApi.getSummary(),
        transactionApi.getRecent(5),
        budgetApi.listActive(),
        reportApi.getSummary({ startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0] }),
      ]);

      if (summaryRes.code === 200) setSummary(summaryRes.data);
      if (transactionsRes.code === 200) setRecentTransactions(transactionsRes.data || []);
      if (budgetsRes.code === 200) setBudgets(budgetsRes.data || []);
      if (reportsRes.code === 200) setReportsSummary(reportsRes.data);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get monthly financial data from reports API
  const monthlyIncome = reportsSummary?.totalIncome || 0;
  const monthlyExpense = reportsSummary?.totalExpense || 0;
  const monthlyNet = reportsSummary?.netIncome || 0;

  if (loading) {
    return (
      <DashboardLayout title="仪表盘">
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
    <DashboardLayout title="仪表盘">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">仪表盘</h2>
            <p className="text-muted-foreground">欢迎回来，这是您的财务概览</p>
          </div>
          <div className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString('zh-CN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-700 font-medium">总资产</p>
                  <p className="text-2xl font-bold text-green-800">{formatCurrency(summary?.totalAssets || 0)}</p>
                  <p className="text-xs text-green-600 mt-1">{summary?.accountsCount || 0} 个账户</p>
                </div>
                <div className="p-3 bg-green-200 rounded-full">
                  <Wallet className="h-6 w-6 text-green-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-700 font-medium">总负债</p>
                  <p className="text-2xl font-bold text-red-800">{formatCurrency(summary?.totalLiabilities || 0)}</p>
                  <p className="text-xs text-red-600 mt-1">信用卡+贷款</p>
                </div>
                <div className="p-3 bg-red-200 rounded-full">
                  <CreditCard className="h-6 w-6 text-red-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-700 font-medium">净资产</p>
                  <p className="text-2xl font-bold text-blue-800">{formatCurrency(summary?.netAssets || 0)}</p>
                  <p className="text-xs text-blue-600 mt-1">
                    负债率 {summary ? ((summary.totalLiabilities / (summary.totalAssets || 1)) * 100).toFixed(1) : 0}%
                  </p>
                </div>
                <div className="p-3 bg-blue-200 rounded-full">
                  <PiggyBank className="h-6 w-6 text-blue-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={`bg-gradient-to-br ${monthlyNet >= 0 ? 'from-emerald-50 to-emerald-100 border-emerald-200' : 'from-orange-50 to-orange-100 border-orange-200'}`}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">本月净收入</p>
                  <p className={`text-2xl font-bold ${monthlyNet >= 0 ? 'text-emerald-800' : 'text-orange-800'}`}>
                    {monthlyNet >= 0 ? '+' : ''}{formatCurrency(monthlyNet)}
                  </p>
                  <p className="text-xs mt-1">
                    <span className={monthlyIncome > 0 ? 'text-green-600' : 'text-muted-foreground'}>
                      收入 {formatCurrency(monthlyIncome)}
                    </span>
                    {' / '}
                    <span className={monthlyExpense > 0 ? 'text-red-600' : 'text-muted-foreground'}>
                      支出 {formatCurrency(monthlyExpense)}
                    </span>
                  </p>
                </div>
                <div className={`p-3 rounded-full ${monthlyNet >= 0 ? 'bg-emerald-200' : 'bg-orange-200'}`}>
                  {monthlyNet >= 0 ? (
                    <TrendingUpIcon className="h-6 w-6 text-emerald-700" />
                  ) : (
                    <TrendingDown className="h-6 w-6 text-orange-700" />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Transactions */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  最近交易
                </CardTitle>
              </div>
              <Link href="/transactions">
                <Button variant="outline" size="sm">
                  查看全部 <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentTransactions.length === 0 ? (
                  <div className="text-center py-12">
                    <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">暂无交易记录</p>
                    <Link href="/transactions">
                      <Button variant="outline" size="sm">
                        添加交易
                      </Button>
                    </Link>
                  </div>
                ) : (
                  recentTransactions.map((tx) => (
                    <div
                      key={tx.transactionId}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${tx.type?.toLowerCase() === 'income' ? 'bg-green-100' : 'bg-red-100'}`}>
                          {tx.type?.toLowerCase() === 'income' ? (
                            <TrendingUp className="h-4 w-4 text-green-600" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{tx.note || getTransactionTypeLabel(tx.type)}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(tx.occurredAt, 'YYYY-MM-DD')}
                          </p>
                        </div>
                      </div>
                      <span className={`font-semibold ${tx.type?.toLowerCase() === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                        {tx.type?.toLowerCase() === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
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
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  预算进度
                </CardTitle>
              </div>
              <Link href="/budgets">
                <Button variant="outline" size="sm">
                  管理预算 <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {budgets.length === 0 ? (
                  <div className="text-center py-12">
                    <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">暂无预算</p>
                    <Link href="/budgets">
                      <Button variant="outline" size="sm">
                        创建预算
                      </Button>
                    </Link>
                  </div>
                ) : (
                  budgets.slice(0, 4).map((budget) => {
                    const percentage = budget.amount > 0 ? (budget.spent / budget.amount) * 100 : 0;
                    const isOver = budget.spent > budget.amount;
                    const remaining = budget.amount - budget.spent;

                    return (
                      <div key={budget.budgetId} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{budget.name}</span>
                          <span className="text-sm text-muted-foreground">
                            {formatCurrency(budget.spent)} / {formatCurrency(budget.amount)}
                          </span>
                        </div>
                        <Progress
                          value={Math.min(percentage, 100)}
                          className="h-2"
                        />
                        <div className="flex items-center justify-between text-sm">
                          <Badge
                            variant={isOver ? 'destructive' : percentage > 80 ? 'warning' : 'success'}
                            className={isOver ? '' : percentage > 80 ? 'bg-orange-500' : 'bg-green-500'}
                          >
                            {isOver ? '已超支' : `${percentage.toFixed(0)}%`}
                          </Badge>
                          <span className={`text-muted-foreground ${isOver ? 'text-red-600' : ''}`}>
                            {isOver ? (
                              <span className="text-red-600">超支 {formatCurrency(Math.abs(remaining))}</span>
                            ) : (
                              <span>剩余 {formatCurrency(remaining)}</span>
                            )}
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

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-3">
          <Link href="/transactions">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 rounded-full">
                    <DollarSign className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold">记一笔账</p>
                    <p className="text-sm text-muted-foreground">快速添加交易记录</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/accounts">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-100 rounded-full">
                    <Wallet className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold">账户管理</p>
                    <p className="text-sm text-muted-foreground">查看和管理账户</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/reports">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-100 rounded-full">
                    <Activity className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-semibold">财务报表</p>
                    <p className="text-sm text-muted-foreground">分析收支情况</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
