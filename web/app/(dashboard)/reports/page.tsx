'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
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
import { TrendingUp, TrendingDown, Wallet, CreditCard } from 'lucide-react';
import { toast } from 'sonner';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

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

      if (summaryRes.code === 0) setSummary(summaryRes.data);
      if (incomeRes.code === 0) setIncomeExpense(incomeRes.data || []);
      if (monthlyRes.code === 0) setMonthlyReport(monthlyRes.data);
      if (balanceRes.code === 0) setBalanceSheet(balanceRes.data);
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
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="报表统计">
      <div className="space-y-6">
        {/* Month Selector */}
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">报表概览</h3>
          <Select value={currentMonth} onValueChange={setCurrentMonth}>
            <SelectTrigger className="w-40">
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
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-green-100">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">本月收入</p>
                  <p className="text-xl font-bold text-green-600">
                    {formatCurrency(monthlyReport?.totalIncome || 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-red-100">
                  <TrendingDown className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">本月支出</p>
                  <p className="text-xl font-bold text-red-600">
                    {formatCurrency(monthlyReport?.totalExpense || 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-blue-100">
                  <Wallet className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">净收入</p>
                  <p className="text-xl font-bold">
                    {formatCurrency(monthlyReport?.netIncome || 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-purple-100">
                  <CreditCard className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">净资产</p>
                  <p className="text-xl font-bold">
                    {formatCurrency(summary?.netAssets || 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <Tabs defaultValue="income-expense" className="space-y-4">
          <TabsList>
            <TabsTrigger value="income-expense">收支分析</TabsTrigger>
            <TabsTrigger value="trend">趋势</TabsTrigger>
            <TabsTrigger value="balance">资产负债表</TabsTrigger>
          </TabsList>

          <TabsContent value="income-expense" className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              {/* Income Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">收入分布</CardTitle>
                </CardHeader>
                <CardContent>
                  {incomeData.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">暂无数据</p>
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
                  <CardTitle className="text-base">支出分布</CardTitle>
                </CardHeader>
                <CardContent>
                  {expenseData.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">暂无数据</p>
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
          </TabsContent>

          <TabsContent value="trend" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">每日收支趋势</CardTitle>
              </CardHeader>
              <CardContent>
                {monthlyReport?.dailyData && monthlyReport.dailyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={monthlyReport.dailyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tickFormatter={(v) => v.slice(-2)} />
                      <YAxis />
                      <Tooltip formatter={(value) => formatCurrency(value as number)} />
                      <Legend />
                      <Line type="monotone" dataKey="income" stroke="#22c55e" name="收入" />
                      <Line type="monotone" dataKey="expense" stroke="#ef4444" name="支出" />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-muted-foreground py-8">暂无数据</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="balance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">资产负债表</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h4 className="font-medium mb-3">资产</h4>
                    {balanceSheet?.assets && balanceSheet.assets.length > 0 ? (
                      <div className="space-y-2">
                        {balanceSheet.assets.map((asset, index) => (
                          <div key={index} className="flex justify-between items-center p-2 bg-muted/50 rounded">
                            <span>{asset.name}</span>
                            <span className="font-medium">{formatCurrency(asset.amount)}</span>
                          </div>
                        ))}
                        <div className="flex justify-between items-center p-2 font-bold border-t">
                          <span>资产合计</span>
                          <span>{formatCurrency(balanceSheet.assets.reduce((sum, a) => sum + a.amount, 0))}</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">暂无数据</p>
                    )}
                  </div>
                  <div>
                    <h4 className="font-medium mb-3">负债</h4>
                    {balanceSheet?.liabilities && balanceSheet.liabilities.length > 0 ? (
                      <div className="space-y-2">
                        {balanceSheet.liabilities.map((liability, index) => (
                          <div key={index} className="flex justify-between items-center p-2 bg-muted/50 rounded">
                            <span>{liability.name}</span>
                            <span className="font-medium text-red-600">{formatCurrency(liability.amount)}</span>
                          </div>
                        ))}
                        <div className="flex justify-between items-center p-2 font-bold border-t">
                          <span>负债合计</span>
                          <span className="text-red-600">
                            {formatCurrency(balanceSheet.liabilities.reduce((sum, l) => sum + l.amount, 0))}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">暂无数据</p>
                    )}
                  </div>
                </div>
                <div className="mt-4 p-4 bg-primary/10 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">净资产</span>
                    <span className="text-xl font-bold">{formatCurrency(balanceSheet?.netAssets || 0)}</span>
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
