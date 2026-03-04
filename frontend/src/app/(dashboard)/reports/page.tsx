"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

interface TrendData {
  month: string;
  income: number;
  expense: number;
}

interface CategoryStat {
  categoryId: number;
  categoryName: string;
  categoryIcon: string;
  amount: number;
  percentage: number;
}

interface MonthComparison {
  income: number;
  expense: number;
  balance: number;
  incomeChange: number;
  expenseChange: number;
  balanceChange: number;
}

export default function ReportsPage() {
  const router = useRouter();
  const [trend, setTrend] = useState<TrendData[]>([]);
  const [monthTrend, setMonthTrend] = useState<TrendData[]>([]);
  const [categoryStats, setCategoryStats] = useState<CategoryStat[]>([]);
  const [comparison, setComparison] = useState<MonthComparison | null>(null);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
  }, [router]);

  useEffect(() => {
    setLoading(true);

    const currentDate = new Date(month + "-01");
    const prevMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    const prevMonthStr = prevMonth.toISOString().slice(0, 7);

    Promise.all([
      api.get<TrendData[]>(`/stats/trend?startDate=${month}&endDate=${month}`),
      api.get<TrendData[]>(`/stats/trend?startDate=${prevMonthStr}&endDate=${month}`),
      api.get<CategoryStat[]>(`/stats/categories?type=2&month=${month}`),
      api.get<TrendData[]>(`/stats/trend?startDate=${prevMonthStr}&endDate=${prevMonthStr}`),
    ])
      .then(([currentData, trendData, categoryData, prevData]) => {
        setTrend(currentData);
        setMonthTrend(trendData);
        setCategoryStats(categoryData);

        const current = currentData[0] || { income: 0, expense: 0 };
        const prev = prevData[0] || { income: 0, expense: 0 };

        setComparison({
          income: current.income,
          expense: current.expense,
          balance: current.income - current.expense,
          incomeChange: prev.income > 0 ? ((current.income - prev.income) / prev.income) * 100 : 0,
          expenseChange: prev.expense > 0 ? ((current.expense - prev.expense) / prev.expense) * 100 : 0,
          balanceChange: prev.income - prev.expense !== 0
            ? ((current.income - current.expense) - (prev.income - prev.expense)) / Math.abs(prev.income - prev.expense) * 100
            : 0,
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [month]);

  const COLORS = [
    "#6366F1",
    "#8B5CF6",
    "#EC4899",
    "#F59E0B",
    "#10B981",
    "#3B82F6",
    "#F97316",
    "#14B8A6",
  ];

  const totalIncome = trend.reduce((sum, t) => sum + t.income, 0);
  const totalExpense = trend.reduce((sum, t) => sum + t.expense, 0);

  const formatChange = (value: number) => {
    const sign = value >= 0 ? "+" : "";
    return `${sign}${value.toFixed(1)}%`;
  };

  const getChangeColor = (value: number, type: "increase" | "decrease") => {
    if (type === "increase") {
      return value >= 0 ? "text-green-600" : "text-red-600";
    }
    return value <= 0 ? "text-green-600" : "text-red-600";
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white px-4 py-3 shadow-lg rounded-xl border border-gray-100">
          <p className="font-medium text-gray-900 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: ¥{entry.value.toLocaleString()}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">统计报表</h1>
          <p className="text-gray-500 mt-1">分析您的收支情况</p>
        </div>
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
        />
      </div>

      {/* Summary Cards with Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 shadow-sm border-2 border-green-500">
          <div className="flex items-center justify-between mb-3">
            <p className="text-gray-500 text-sm">本月收入</p>
            {comparison && (
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${getChangeColor(comparison.incomeChange, "increase")} bg-gray-100`}>
                {formatChange(comparison.incomeChange)} vs上月
              </span>
            )}
          </div>
          <p className="text-2xl font-bold text-green-600">
            ¥{totalIncome.toLocaleString("zh-CN", { minimumFractionDigits: 2 })}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border-2 border-red-500">
          <div className="flex items-center justify-between mb-3">
            <p className="text-gray-500 text-sm">本月支出</p>
            {comparison && (
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${getChangeColor(comparison.expenseChange, "decrease")} bg-gray-100`}>
                {formatChange(comparison.expenseChange)} vs上月
              </span>
            )}
          </div>
          <p className="text-2xl font-bold text-red-600">
            ¥{totalExpense.toLocaleString("zh-CN", { minimumFractionDigits: 2 })}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border-2 border-indigo-500">
          <div className="flex items-center justify-between mb-3">
            <p className="text-gray-500 text-sm">本月结余</p>
            {comparison && (
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${getChangeColor(comparison.balanceChange, "increase")} bg-gray-100`}>
                {formatChange(comparison.balanceChange)} vs上月
              </span>
            )}
          </div>
          <p className="text-2xl font-bold text-indigo-600">
            ¥{(totalIncome - totalExpense).toLocaleString("zh-CN", { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Bar Chart - Income vs Expense */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">收支对比</h2>
          {monthTrend.length === 0 ? (
            <div className="text-gray-400 text-center py-12 bg-gray-50 rounded-xl">
              暂无数据
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthTrend} barGap={8}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#9CA3AF", fontSize: 11 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#9CA3AF", fontSize: 11 }}
                  tickFormatter={(value) => `¥${value / 1000}k`}
                  dx={-10}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ paddingTop: "15px" }}
                  formatter={(value) => <span className="text-gray-600 text-sm">{value}</span>}
                />
                <Bar
                  dataKey="income"
                  name="收入"
                  fill="#22C55E"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
                <Bar
                  dataKey="expense"
                  name="支出"
                  fill="#EF4444"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Line Chart - Balance Trend */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">结余趋势</h2>
          {monthTrend.length === 0 ? (
            <div className="text-gray-400 text-center py-12 bg-gray-50 rounded-xl">
              暂无数据
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={monthTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#9CA3AF", fontSize: 11 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#9CA3AF", fontSize: 11 }}
                  tickFormatter={(value) => `¥${value / 1000}k`}
                  dx={-10}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="income"
                  name="收入"
                  stroke="#22C55E"
                  strokeWidth={2}
                  dot={{ fill: "#22C55E", strokeWidth: 2, r: 3 }}
                  activeDot={{ r: 5, strokeWidth: 0 }}
                />
                <Line
                  type="monotone"
                  dataKey="expense"
                  name="支出"
                  stroke="#EF4444"
                  strokeWidth={2}
                  dot={{ fill: "#EF4444", strokeWidth: 2, r: 3 }}
                  activeDot={{ r: 5, strokeWidth: 0 }}
                />
                <Line
                  type="monotone"
                  dataKey={(data) => data.income - data.expense}
                  name="结余"
                  stroke="#6366F1"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ fill: "#6366F1", strokeWidth: 2, r: 3 }}
                  activeDot={{ r: 5, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Category Stats */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-6">支出分类</h2>
        {categoryStats.length === 0 ? (
          <div className="text-gray-400 text-center py-16 bg-gray-50 rounded-xl">
            暂无数据
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Pie Chart */}
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={categoryStats}
                    dataKey="amount"
                    nameKey="categoryName"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={2}
                  >
                    {categoryStats.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                        stroke="none"
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) =>
                      `¥${value.toLocaleString("zh-CN", { minimumFractionDigits: 2 })}`
                    }
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "none",
                      borderRadius: "12px",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                  />
                  <Legend
                    layout="vertical"
                    verticalAlign="middle"
                    align="right"
                    formatter={(value) => (
                      <span className="text-gray-600 text-sm">{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Category List */}
            <div className="space-y-3">
              {categoryStats.map((stat, index) => (
                <div
                  key={stat.categoryId}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="font-medium text-gray-700">
                      {stat.categoryName}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-semibold text-gray-900">
                      ¥{stat.amount.toLocaleString("zh-CN", { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-gray-400 text-sm w-12 text-right">
                      {stat.percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-xl mt-4">
                <span className="font-semibold text-indigo-700">合计</span>
                <span className="font-bold text-indigo-700">
                  ¥{totalExpense.toLocaleString("zh-CN", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
