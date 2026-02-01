'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { reportApi } from '@/api';
import { Calendar, ArrowRight } from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { TrendingUp, TrendingDown, Wallet, DollarSign, BarChart3, PieChart as PieChartIcon, Activity } from 'lucide-react';
import { toast } from 'sonner';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FF6B6B', '#4ECDC4'];

// 生成最近 6 个月的选项
const getRecentMonths = () => {
  const months = [];
  const now = new Date();
  for (let i = 0; i < 6; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const label = `${date.getFullYear()}年${date.getMonth() + 1}月`;
    months.push({ value, label });
  }
  return months;
};

interface CategoryReport {
  categoryId?: number;
  categoryName: string;
  type: string;
  amount: number;
  count: number;
  percentage?: number;
}

interface MonthlyData {
  day: number;
  income: number;
  expense: number;
}

interface BalanceSheetItem {
  accountId?: number;
  name: string;
  type?: string;
  balance: number;
}

export default function ReportsPage() {
  const [summary, setSummary] = useState<{ totalIncome: number; totalExpense: number; netIncome: number } | null>(null);
  const [incomeExpense, setIncomeExpense] = useState<CategoryReport[]>([]);
  const [monthlyData, setMonthlyData] = useState<{
    year: number;
    month: number;
    totalIncome: number;
    totalExpense: number;
    netIncome: number;
    dailyData: MonthlyData[];
  } | null>(null);
  // 上月汇总数据，用于环比对比
  const [prevMonthData, setPrevMonthData] = useState<{
    totalIncome: number;
    totalExpense: number;
    netIncome: number;
  } | null>(null);
  const [balanceSheet, setBalanceSheet] = useState<{
    totalAssets: number;
    totalLiabilities: number;
    netAssets: number;
    assets: BalanceSheetItem[];
    liabilities: BalanceSheetItem[];
  } | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [contentLoading, setContentLoading] = useState(false);
  // 日期筛选模式: 'month' 或 'range'
  const [dateMode, setDateMode] = useState<'month' | 'range'>('month');
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    // 默认显示上一个月（因为月初时当月可能没有数据）
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`;
  });
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  useEffect(() => {
    loadReports();
  }, [currentMonth, dateMode, startDate, endDate]);

  const loadReports = async () => {
    // 只显示内容加载状态，不显示整个页面 loading
    setContentLoading(true);

    try {
      let summaryRes, incomeRes, monthlyRes, prevMonthRes;

      if (dateMode === 'month') {
        const [year, month] = currentMonth.split('-').map(Number);
        // 转换为日期范围
        const firstDay = `${year}-${String(month).padStart(2, '0')}-01`;
        const lastDay = new Date(year, month, 0).toISOString().split('T')[0];

        [summaryRes, incomeRes, monthlyRes] = await Promise.all([
          reportApi.getSummary({ startDate: firstDay, endDate: lastDay }),
          reportApi.getIncomeExpense({ startDate: firstDay, endDate: lastDay }),
          reportApi.getMonthly({ year, month }),
        ]);

        // 获取上月数据用于环比
        const prevYear = month === 1 ? year - 1 : year;
        const prevMonth = month === 1 ? 12 : month - 1;
        const prevFirstDay = `${prevYear}-${String(prevMonth).padStart(2, '0')}-01`;
        const prevLastDay = new Date(prevYear, prevMonth, 0).toISOString().split('T')[0];
        prevMonthRes = await reportApi.getSummary({ startDate: prevFirstDay, endDate: prevLastDay });
      } else {
        // 日期范围模式
        if (!startDate || !endDate) {
          setContentLoading(false);
          return;
        }
        [summaryRes, incomeRes, monthlyRes] = await Promise.all([
          reportApi.getSummary({ startDate, endDate }),
          reportApi.getIncomeExpense({ startDate, endDate }),
          reportApi.getDailyByDateRange({ startDate, endDate }),
        ]);
        prevMonthRes = null; // 自定义模式不显示环比
      }

      const balanceRes = await reportApi.getBalanceSheet();

      if (summaryRes.code === 200 && summaryRes.data) {
        const data = summaryRes.data as any;
        setSummary({
          totalIncome: Number(data.totalIncome) || 0,
          totalExpense: Number(data.totalExpense) || 0,
          netIncome: Number(data.netIncome) || 0,
        });
      }
      if (incomeRes.code === 200) {
        const data = incomeRes.data as any[];
        setIncomeExpense(data.map((d) => ({
          categoryId: d.categoryId,
          categoryName: d.categoryName,
          type: d.type,
          amount: Number(d.amount) || 0,
          count: d.count || 0,
          percentage: d.percentage,
        })));
      }
      if (monthlyRes.code === 200) {
        const data = monthlyRes.data as any;
        setMonthlyData({
          year: data.year || (startDate ? parseInt(startDate.split('-')[0]) : new Date().getFullYear()),
          month: data.month || (startDate ? parseInt(startDate.split('-')[1]) : new Date().getMonth() + 1),
          totalIncome: Number(data.totalIncome) || 0,
          totalExpense: Number(data.totalExpense) || 0,
          netIncome: Number(data.netIncome) || 0,
          dailyData: (data.dailyData || []).map((d: any) => ({
            day: d.day,
            income: Number(d.income) || 0,
            expense: Number(d.expense) || 0,
          })),
        });
      }
      // 设置上月数据用于环比
      if (prevMonthRes && prevMonthRes.code === 200 && prevMonthRes.data) {
        const data = prevMonthRes.data as any;
        setPrevMonthData({
          totalIncome: Number(data.totalIncome) || 0,
          totalExpense: Number(data.totalExpense) || 0,
          netIncome: Number(data.netIncome) || 0,
        });
      } else {
        setPrevMonthData(null);
      }
      if (balanceRes.code === 200) {
        const data = balanceRes.data as any;
        setBalanceSheet({
          totalAssets: Number(data.totalAssets) || 0,
          totalLiabilities: Number(data.totalLiabilities) || 0,
          netAssets: Number(data.netAssets) || 0,
          assets: (data.assets || []).map((a: any) => ({
            accountId: a.accountId,
            name: a.name,
            type: a.type,
            balance: Number(a.balance) || 0,
          })),
          liabilities: (data.liabilities || []).map((l: any) => ({
            accountId: l.accountId,
            name: l.name,
            balance: Number(l.balance) || 0,
          })),
        });
      }
    } catch (error) {
      console.error('加载报表失败:', error);
      toast.error('加载报表失败');
    } finally {
      setContentLoading(false);
      setInitialLoading(false);
    }
  };

  const incomeData = incomeExpense.filter((i) => i.type?.toUpperCase() === 'INCOME');
  const expenseData = incomeExpense.filter((i) => i.type?.toUpperCase() === 'EXPENSE');

  const incomePieData = incomeData.map((d) => ({
    name: d.categoryName,
    value: d.amount,
  }));
  const expensePieData = expenseData.map((d) => ({
    name: d.categoryName,
    value: d.amount,
  }));

  const trendChartData = monthlyData?.dailyData.map((d) => ({
    date: `${d.day}日`,
    income: d.income,
    expense: d.expense,
  })) || [];

  // 计算环比变化百分比
  const calcChangePercent = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  // 格式化环比显示
  const formatChange = (current: number, previous: number): { text: string; color: string } => {
    const change = calcChangePercent(current, previous);
    if (change > 0) {
      return { text: `+${change}%`, color: 'text-green-600' };
    } else if (change < 0) {
      return { text: `${change}%`, color: 'text-red-600' };
    } else {
      return { text: '0%', color: 'text-gray-500' };
    }
  };

  // 初始加载
  if (initialLoading) {
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
          </div>
          <div className="flex items-center gap-2">
            {/* 模式切换 */}
            <div className="flex rounded-md border bg-background">
              <Button
                variant={dateMode === 'month' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => {
                  setDateMode('month');
                }}
                className="rounded-r-none"
              >
                按月
              </Button>
              <Button
                variant={dateMode === 'range' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => {
                  setDateMode('range');
                  // 默认设置为最近7天
                  const end = new Date();
                  const start = new Date();
                  start.setDate(start.getDate() - 7);
                  setStartDate(start.toISOString().split('T')[0]);
                  setEndDate(end.toISOString().split('T')[0]);
                }}
                className="rounded-l-none"
              >
                自定义
              </Button>
            </div>

            {dateMode === 'month' ? (
              <div className="flex items-center gap-2">
                <Select
                  value={currentMonth}
                  onValueChange={(value) => setCurrentMonth(value)}
                >
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="选择月份" />
                  </SelectTrigger>
                  <SelectContent>
                    {getRecentMonths().map((month) => (
                      <SelectItem key={month.value} value={month.value}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-36"
                  />
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <div className="relative">
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-36"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* 收入卡片 */}
          <Card className="bg-white border-green-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              {contentLoading ? (
                <div className="animate-pulse">
                  <div className="h-4 w-20 bg-green-200 rounded mb-2"></div>
                  <div className="h-8 w-32 bg-green-200 rounded"></div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm text-green-700 font-medium">
                      {dateMode === 'month' ? '本月收入' : '收入合计'}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-2xl font-bold text-green-800">
                      {formatCurrency(monthlyData?.totalIncome || 0)}
                    </p>
                    <div className="p-3 bg-green-200 rounded-full">
                      <TrendingUp className="h-6 w-6 text-green-700" />
                    </div>
                  </div>
                  {dateMode === 'month' && prevMonthData && (
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-muted-foreground">
                        上月 {formatCurrency(prevMonthData.totalIncome)}
                      </p>
                      <span className={`text-xs font-medium ${formatChange(monthlyData?.totalIncome || 0, prevMonthData.totalIncome).color}`}>
                        {formatChange(monthlyData?.totalIncome || 0, prevMonthData.totalIncome).text}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 支出卡片 */}
          <Card className="bg-white border-red-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              {contentLoading ? (
                <div className="animate-pulse">
                  <div className="h-4 w-20 bg-red-200 rounded mb-2"></div>
                  <div className="h-8 w-32 bg-red-200 rounded"></div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm text-red-700 font-medium">
                      {dateMode === 'month' ? '本月支出' : '支出合计'}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-2xl font-bold text-red-800">
                      {formatCurrency(monthlyData?.totalExpense || 0)}
                    </p>
                    <div className="p-3 bg-red-200 rounded-full">
                      <TrendingDown className="h-6 w-6 text-red-700" />
                    </div>
                  </div>
                  {dateMode === 'month' && prevMonthData && (
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-muted-foreground">
                        上月 {formatCurrency(prevMonthData.totalExpense)}
                      </p>
                      <span className={`text-xs font-medium ${formatChange(monthlyData?.totalExpense || 0, prevMonthData.totalExpense).color}`}>
                        {formatChange(monthlyData?.totalExpense || 0, prevMonthData.totalExpense).text}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 净收入卡片 */}
          <Card className={`bg-white ${(monthlyData?.netIncome || 0) >= 0 ? 'border-blue-200' : 'border-orange-200'} rounded-2xl shadow-sm hover:shadow-md transition-shadow`}>
            <CardContent className="pt-6">
              {contentLoading ? (
                <div className="animate-pulse">
                  <div className="h-4 w-16 bg-blue-200 rounded mb-2"></div>
                  <div className="h-8 w-28 bg-blue-200 rounded"></div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium">净收入</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className={`text-2xl font-bold ${(monthlyData?.netIncome || 0) >= 0 ? 'text-blue-800' : 'text-orange-800'}`}>
                      {formatCurrency(monthlyData?.netIncome || 0)}
                    </p>
                    <div className="p-3 bg-blue-200 rounded-full">
                      <DollarSign className="h-6 w-6 text-blue-700" />
                    </div>
                  </div>
                  {dateMode === 'month' && prevMonthData && (
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-muted-foreground">
                        上月 {formatCurrency(prevMonthData.netIncome)}
                      </p>
                      <span className={`text-xs font-medium ${formatChange(monthlyData?.netIncome || 0, prevMonthData.netIncome).color}`}>
                        {formatChange(monthlyData?.netIncome || 0, prevMonthData.netIncome).text}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 净资产卡片 */}
          <Card className="bg-white border-purple-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              {contentLoading ? (
                <div className="animate-pulse">
                  <div className="h-4 w-16 bg-purple-200 rounded mb-2"></div>
                  <div className="h-8 w-28 bg-purple-200 rounded"></div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-700 font-medium">净资产</p>
                    <p className="text-2xl font-bold text-purple-800">
                      {formatCurrency(balanceSheet?.netAssets || 0)}
                    </p>
                  </div>
                  <div className="p-3 bg-purple-200 rounded-full">
                    <Wallet className="h-6 w-6 text-purple-700" />
                  </div>
                </div>
              )}
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
                </CardHeader>
                <CardContent>
                  {contentLoading ? (
                    <div className="w-full h-[300px] bg-muted animate-pulse rounded flex items-center justify-center">
                      <p className="text-muted-foreground">加载中...</p>
                    </div>
                  ) : incomePieData.length === 0 ? (
                    <div className="text-center py-12">
                      <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">{dateMode === 'month' ? '本月暂无收入' : '暂无收入记录'}</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={incomePieData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                          nameKey="name"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {incomePieData.map((_, index) => (
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
                </CardHeader>
                <CardContent>
                  {contentLoading ? (
                    <div className="w-full h-[300px] bg-muted animate-pulse rounded flex items-center justify-center">
                      <p className="text-muted-foreground">加载中...</p>
                    </div>
                  ) : expensePieData.length === 0 ? (
                    <div className="text-center py-12">
                      <TrendingDown className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">{dateMode === 'month' ? '本月暂无支出' : '暂无支出记录'}</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={expensePieData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                          nameKey="name"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {expensePieData.map((_, index) => (
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

            {/* Income/Expense Details */}
            <Card className="bg-white rounded-2xl shadow-sm">
              <CardHeader className="border-b">
                <CardTitle className="text-lg">收支明细</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
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
                              +{formatCurrency(item.amount)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

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
                              -{formatCurrency(item.amount)}
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
            <Card className="bg-white rounded-2xl shadow-sm">
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Activity className="h-5 w-5 text-blue-600" />
                  每日收支趋势
                </CardTitle>
              </CardHeader>
              <CardContent>
                {contentLoading ? (
                  <div className="w-full h-[400px] bg-muted animate-pulse rounded flex items-center justify-center">
                    <p className="text-muted-foreground">加载中...</p>
                  </div>
                ) : trendChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={trendChartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis
                        dataKey="date"
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
            <Card className="bg-white rounded-2xl shadow-sm">
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BarChart3 className="h-5 w-5 text-purple-600" />
                  资产负债表
                </CardTitle>
              </CardHeader>
              <CardContent>
                {contentLoading ? (
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <div className="h-6 w-16 bg-muted animate-pulse rounded"></div>
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-12 bg-muted animate-pulse rounded-lg"></div>
                      ))}
                    </div>
                    <div className="space-y-2">
                      <div className="h-6 w-16 bg-muted animate-pulse rounded"></div>
                      {[1, 2].map((i) => (
                        <div key={i} className="h-12 bg-muted animate-pulse rounded-lg"></div>
                      ))}
                    </div>
                  </div>
                ) : (
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
                                {formatCurrency(asset.balance)}
                              </span>
                            </div>
                          ))}
                          <div className="flex justify-between items-center p-3 font-bold bg-green-100 rounded-lg border-t-2 border-green-200">
                            <span>资产合计</span>
                            <span className="text-green-800">
                              {formatCurrency(balanceSheet.totalAssets)}
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
                                {formatCurrency(liability.balance)}
                              </span>
                            </div>
                          ))}
                          <div className="flex justify-between items-center p-3 font-bold bg-red-100 rounded-lg border-t-2 border-red-200">
                            <span>负债合计</span>
                            <span className="text-red-800">
                              {formatCurrency(balanceSheet.totalLiabilities)}
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
                )}

                <div className="mt-6 p-6 bg-white rounded-xl border border-purple-200 shadow-sm">
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
