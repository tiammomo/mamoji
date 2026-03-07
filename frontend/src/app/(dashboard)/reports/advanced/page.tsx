'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Calendar, DollarSign, PieChart as PieChartIcon, TrendingDown, TrendingUp } from 'lucide-react';
import { api } from '@/lib/api';

interface AnnualReport {
  year: number;
  totalIncome: number;
  totalExpense: number;
  totalBalance: number;
  monthlyData: Array<{ month: number; income: number; expense: number; balance: number }>;
  incomeByCategory: Array<{ categoryId: number; categoryName: string; amount: number }>;
  expenseByCategory: Array<{ categoryId: number; categoryName: string; amount: number }>;
}

interface BalanceSheet {
  monthlyIncome: number;
  monthlyExpense: number;
  monthlyBalance: number;
  yearlyIncome: number;
  yearlyExpense: number;
  yearlyBalance: number;
  netWorth: number;
  totalAssets: number;
}

interface Comparison {
  currentMonth: string;
  currentIncome: number;
  currentExpense: number;
  currentBalance: number;
  previousMonth: string;
  previousIncome: number;
  previousExpense: number;
  monthOverMonth: {
    incomeChange: number;
    expenseChange: number;
    balanceChange: number;
  };
  sameMonthLastYear: string;
  yearlyIncome: number;
  yearlyExpense: number;
  yearOverYear: {
    incomeChange: number;
    expenseChange: number;
    balanceChange: number;
  };
}

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

export default function AdvancedReportsPage() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [annualReport, setAnnualReport] = useState<AnnualReport | null>(null);
  const [balanceSheet, setBalanceSheet] = useState<BalanceSheet | null>(null);
  const [comparison, setComparison] = useState<Comparison | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'annual' | 'balance' | 'comparison'>('annual');

  const fetchAnnualReport = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<AnnualReport>(`/stats/annual?year=${year}`);
      setAnnualReport(data);
    } catch (error) {
      console.error('获取年度报告失败:', error);
    } finally {
      setLoading(false);
    }
  }, [year]);

  const fetchBalanceSheet = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<BalanceSheet>('/stats/balance-sheet');
      setBalanceSheet(data);
    } catch (error) {
      console.error('获取资产负债表失败:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchComparison = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<Comparison>(`/stats/comparison?month=${year}-01`);
      setComparison(data);
    } catch (error) {
      console.error('获取同比环比数据失败:', error);
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => {
    if (activeTab === 'annual') {
      fetchAnnualReport();
    } else if (activeTab === 'balance') {
      fetchBalanceSheet();
    } else {
      fetchComparison();
    }
  }, [activeTab, year, fetchAnnualReport, fetchBalanceSheet, fetchComparison]);

  function formatCurrency(value: number): string {
    return new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY' }).format(value);
  }

  function formatPercent(value: number): string {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">高级报表</h1>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-500" />
            <select value={year} onChange={(e) => setYear(parseInt(e.target.value, 10))} className="px-3 py-2 border rounded-lg">
              {[2024, 2025, 2026].map((item) => (
                <option key={item} value={item}>
                  {item} 年
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-2 mb-6">
          <TabButton active={activeTab === 'annual'} onClick={() => setActiveTab('annual')} label="年度报告" />
          <TabButton active={activeTab === 'balance'} onClick={() => setActiveTab('balance')} label="资产负债" />
          <TabButton active={activeTab === 'comparison'} onClick={() => setActiveTab('comparison')} label="同比环比" />
        </div>

        {loading ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">加载中...</div>
        ) : (
          <>
            {activeTab === 'annual' && annualReport && (
              <div className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  <StatCard title="年度收入" value={formatCurrency(annualReport.totalIncome)} icon={<TrendingUp className="w-5 h-5 text-green-500" />} />
                  <StatCard title="年度支出" value={formatCurrency(annualReport.totalExpense)} icon={<TrendingDown className="w-5 h-5 text-red-500" />} />
                  <StatCard title="年度结余" value={formatCurrency(annualReport.totalBalance)} icon={<DollarSign className="w-5 h-5 text-indigo-500" />} />
                </div>

                <div className="bg-white rounded-lg shadow p-4">
                  <h3 className="text-lg font-semibold mb-4">月度收支趋势</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={annualReport.monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      <Legend />
                      <Bar dataKey="income" name="收入" fill="#10B981" />
                      <Bar dataKey="expense" name="支出" fill="#EF4444" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <PiePanel title="收入分类" data={annualReport.incomeByCategory} />
                  <PiePanel title="支出分类" data={annualReport.expenseByCategory} />
                </div>
              </div>
            )}

            {activeTab === 'balance' && balanceSheet && (
              <div className="grid grid-cols-2 gap-4">
                <StatCard title="月收入" value={formatCurrency(balanceSheet.monthlyIncome)} icon={<TrendingUp className="w-5 h-5 text-green-500" />} />
                <StatCard title="月支出" value={formatCurrency(balanceSheet.monthlyExpense)} icon={<TrendingDown className="w-5 h-5 text-red-500" />} />
                <StatCard title="净资产" value={formatCurrency(balanceSheet.netWorth)} icon={<DollarSign className="w-5 h-5 text-indigo-500" />} />
                <StatCard title="总资产" value={formatCurrency(balanceSheet.totalAssets)} icon={<DollarSign className="w-5 h-5 text-indigo-500" />} />
              </div>
            )}

            {activeTab === 'comparison' && comparison && (
              <div className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  <StatCard title="当月收入" value={formatCurrency(comparison.currentIncome)} icon={<TrendingUp className="w-5 h-5 text-green-500" />} />
                  <StatCard title="当月支出" value={formatCurrency(comparison.currentExpense)} icon={<TrendingDown className="w-5 h-5 text-red-500" />} />
                  <StatCard title="当月结余" value={formatCurrency(comparison.currentBalance)} icon={<DollarSign className="w-5 h-5 text-indigo-500" />} />
                </div>

                <div className="bg-white rounded-lg shadow p-4">
                  <h3 className="text-lg font-semibold mb-4">变化幅度</h3>
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart
                      data={[
                        {
                          name: '收入',
                          monthOverMonth: comparison.monthOverMonth.incomeChange,
                          yearOverYear: comparison.yearOverYear.incomeChange,
                        },
                        {
                          name: '支出',
                          monthOverMonth: comparison.monthOverMonth.expenseChange,
                          yearOverYear: comparison.yearOverYear.expenseChange,
                        },
                        {
                          name: '结余',
                          monthOverMonth: comparison.monthOverMonth.balanceChange,
                          yearOverYear: comparison.yearOverYear.balanceChange,
                        },
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value: number) => formatPercent(value)} />
                      <Legend />
                      <Line type="monotone" dataKey="monthOverMonth" name="环比" stroke="#4F46E5" />
                      <Line type="monotone" dataKey="yearOverYear" name="同比" stroke="#10B981" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg ${active ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
    >
      {label}
    </button>
  );
}

function StatCard({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center gap-2 text-gray-500 mb-2">
        {icon}
        <span>{title}</span>
      </div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}

function PiePanel({ title, data }: { title: string; data: Array<{ categoryName: string; amount: number }> }) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <PieChartIcon className="w-5 h-5" />
        {title}
      </h3>
      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={data}
              dataKey="amount"
              nameKey="categoryName"
              cx="50%"
              cy="50%"
              outerRadius={80}
              label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value: number) => new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY' }).format(value)} />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <p className="text-center text-gray-500 py-8">暂无数据</p>
      )}
    </div>
  );
}
