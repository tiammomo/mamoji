'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency } from '@/lib/utils';
import { reportApi } from '@/api';
import type { AccountSummary, CategoryReport, MonthlyReport, BalanceSheet } from '@/types';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { TrendingUp, TrendingDown, Wallet, DollarSign, TrendingUpIcon, TrendingDownIcon, BarChart3, PieChart as PieChartIcon, Activity } from 'lucide-react';
import { toast } from 'sonner';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FF6B6B', '#4ECDC4'];

export default function ReportsPage() {
  const [summary, setSummary] = useState<AccountSummary | null>(null);
  const [incomeExpense, setIncomeExpense] = useState<CategoryReport[]>([]);
  const [monthlyReport, setMonthlyReport] = useState<MonthlyReport | null>(null);
  const [balanceSheet, setBalanceSheet] = useState<BalanceSheet | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  useEffect(() => {
    loadReports();
  }, [currentMonth]);

  const loadReports = async () => {
    setLoading(true);
    try {
      const [year, month] = currentMonth.split('-').map(Number);
      const [summaryRes, incomeRes, monthlyRes, balanceRes] = await Promise.all([
        reportApi.getSummary(),
        reportApi.getIncomeExpense({ year, month }),
        reportApi.getMonthly({ year, month }),
        reportApi.getBalanceSheet(),
      ]);

      if (summaryRes.code === 200) setSummary(summaryRes.data);
      if (incomeRes.code === 200) setIncomeExpense(incomeRes.data || []);
      if (monthlyRes.code === 200) setMonthlyReport(monthlyRes.data);
      if (balanceRes.code === 200) setBalanceSheet(balanceRes.data);
    } catch (error) {
      toast.error('加载报表失败');
    } finally {
      setLoading(false);
    }
  };

  const incomeData = incomeExpense.filter((i) => i.type === 'income');
  const expenseData = incomeExpense.filter((i) => i.type === 'expense');

  if (loading) {
    return (
      <DashboardLayout title="报表统计">
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
    <DashboardLayout title="报表统计">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">报表统计</h2>
            <p className="text-muted-foreground">分析您的收支情况</p>
          </div>
          <Select value={currentMonth} onValueChange={setCurrentMonth}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => {
                const date = new Date();
                date.setMonth(date.getMonth() - i);
                const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                return (
                  <SelectItem key={value} value={value}>
                    {date.getFullYear()}年{date.getMonth() + 1}月
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-700 font-medium">本月收入</p>
                  <p className="text-2xl font-bold text-green-800">
                    {formatCurrency(monthlyReport?.totalIncome || 0)}
                  </p>
                </div>
                <div className="p-3 bg-green-200 rounded-full">
                  <TrendingUpIcon className="h-6 w-6 text-green-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-700 font-medium">本月支出</p>
                  <p className="text-2xl font-bold text-red-800">
                    {formatCurrency(monthlyReport?.totalExpense || 0)}
                  </p>
                </div>
                <div className="p-3 bg-red-200 rounded-full">
                  <TrendingDownIcon className="h-6 w-6 text-red-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={`bg-gradient-to-br ${(monthlyReport?.netIncome || 0) >= 0 ? 'from-blue-50 to-blue-100 border-blue-200' : 'from-orange-50 to-orange-100 border-orange-200'}`}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">净收入</p>
                  <p className={`text-2xl font-bold ${(monthlyReport?.netIncome || 0) >= 0 ? 'text-blue-800' : 'text-orange-800'}`}>
                    {formatCurrency(monthlyReport?.netIncome || 0)}
                  </p>
                </div>
                <div className="p-3 bg-blue-200 rounded-full">
                  <DollarSign className="h-6 w-6 text-blue-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-700 font-medium">净资产</p>
                  <p className="text-2xl font-bold text-purple-800">
                    {formatCurrency(summary?.netAssets || 0)}
                  </p>
                </div>
                <div className="p-3 bg-purple-200 rounded-full">
                  <Wallet className="h-6 w-6 text-purple-700" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <Tabs defaultValue="income-expense" className="space-y-4">
          <TabsList>
            <TabsTrigger value="income-expense" className="flex items-center gap-2">
              <PieChartIcon className="h-4 w-4" />
              收支分析
            </TabsTrigger>
            <TabsTrigger value="trend" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              趋势
            </TabsTrigger>
            <TabsTrigger value="balance" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              资产负债表
            </TabsTrigger>
          </TabsList>

          <TabsContent value="income-expense" className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              {/* Income Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    收入分布
                  </CardTitle>
                  <CardDescription>按分类统计的收入占比</CardDescription>
                </CardHeader>
                <CardContent>
                  {incomeData.length === 0 ? (
                    <div className="text-center py-12">
                      <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">本月暂无收入</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={incomeData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="totalAmount"
                          nameKey="categoryName"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {incomeData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatCurrency(value as number)} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {/* Expense Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingDown className="h-5 w-5 text-red-600" />
                    支出分布
                  </CardTitle>
                  <CardDescription>按分类统计的支出占比</CardDescription>
                </CardHeader>
                <CardContent>
                  {expenseData.length === 0 ? (
                    <div className="text-center py-12">
                      <TrendingDown className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">本月暂无支出</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={expenseData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="totalAmount"
                          nameKey="categoryName"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {expenseData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatCurrency(value as number)} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Income/Expense Details Table */}
            <Card>
              <CardHeader>
                <CardTitle>收支明细</CardTitle>
                <CardDescription>本月各分类收支详情</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Income Details */}
                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      收入明细
                    </h4>
                    {incomeData.length === 0 ? (
                      <p className="text-muted-foreground text-sm">暂无收入</p>
                    ) : (
                      <div className="space-y-2">
                        {incomeData.map((item, index) => (
                          <div key={index} className="flex justify-between items-center p-2 bg-green-50 rounded">
                            <span>{item.categoryName}</span>
                            <span className="font-medium text-green-700">
                              +{formatCurrency(item.totalAmount)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Expense Details */}
                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <TrendingDown className="h-4 w-4 text-red-600" />
                      支出明细
                    </h4>
                    {expenseData.length === 0 ? (
                      <p className="text-muted-foreground text-sm">暂无支出</p>
                    ) : (
                      <div className="space-y-2">
                        {expenseData.map((item, index) => (
                          <div key={index} className="flex justify-between items-center p-2 bg-red-50 rounded">
                            <span>{item.categoryName}</span>
                            <span className="font-medium text-red-700">
                              -{formatCurrency(item.totalAmount)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trend" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-blue-600" />
                  每日收支趋势
                </CardTitle>
                <CardDescription>{currentMonth} 月每日收入与支出对比</CardDescription>
              </CardHeader>
              <CardContent>
                {monthlyReport?.dailyData && monthlyReport.dailyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={monthlyReport.dailyData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(v) => v.slice(-2)}
                        tick={{ fill: 'muted-foreground' }}
                      />
                      <YAxis tick={{ fill: 'muted-foreground' }} />
                      <Tooltip
                        formatter={(value) => formatCurrency(value as number)}
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="income"
                        stroke="#22c55e"
                        strokeWidth={2}
                        name="收入"
                        dot={{ fill: '#22c55e', strokeWidth: 2 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="expense"
                        stroke="#ef4444"
                        strokeWidth={2}
                        name="支出"
                        dot={{ fill: '#ef4444', strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-12">
                    <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">暂无数据</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="balance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-purple-600" />
                  资产负债表
                </CardTitle>
                <CardDescription>当前资产与负债状况</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      资产
                    </h4>
                    {balanceSheet?.assets && balanceSheet.assets.length > 0 ? (
                      <div className="space-y-2">
                        {balanceSheet.assets.map((asset, index) => (
                          <div key={index} className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                            <span>{asset.name}</span>
                            <span className="font-medium text-green-700">
                              {formatCurrency(asset.amount)}
                            </span>
                          </div>
                        ))}
                        <div className="flex justify-between items-center p-3 font-bold bg-green-100 rounded-lg border-t-2 border-green-200">
                          <span>资产合计</span>
                          <span className="text-green-800">
                            {formatCurrency(balanceSheet.assets.reduce((sum, a) => sum + a.amount, 0))}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 bg-green-50 rounded-lg">
                        <p className="text-muted-foreground">暂无资产</p>
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <TrendingDown className="h-4 w-4 text-red-600" />
                      负债
                    </h4>
                    {balanceSheet?.liabilities && balanceSheet.liabilities.length > 0 ? (
                      <div className="space-y-2">
                        {balanceSheet.liabilities.map((liability, index) => (
                          <div key={index} className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                            <span>{liability.name}</span>
                            <span className="font-medium text-red-700">
                              {formatCurrency(liability.amount)}
                            </span>
                          </div>
                        ))}
                        <div className="flex justify-between items-center p-3 font-bold bg-red-100 rounded-lg border-t-2 border-red-200">
                          <span>负债合计</span>
                          <span className="text-red-800">
                            {formatCurrency(balanceSheet.liabilities.reduce((sum, l) => sum + l.amount, 0))}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 bg-red-50 rounded-lg">
                        <p className="text-muted-foreground">暂无负债</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Net Assets Summary */}
                <div className="mt-6 p-6 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-200">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">净资产</span>
                    <span className="text-3xl font-bold text-purple-700">
                      {formatCurrency(balanceSheet?.netAssets || 0)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
