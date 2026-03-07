"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BarChart3, Calendar, ChevronDown } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Legend } from "recharts";
import { statsApi, type StatsCategory, type StatsTrend } from "@/lib/api";

const COLORS = ["#6366F1", "#8B5CF6", "#EC4899", "#F59E0B", "#10B981", "#3B82F6", "#F97316", "#14B8A6"];

export default function ReportsPage() {
  const router = useRouter();
  const [trend, setTrend] = useState<StatsTrend[]>([]);
  const [categoryStats, setCategoryStats] = useState<StatsCategory[]>([]);
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10),
    end: new Date().toISOString().slice(0, 10),
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
    }
  }, [router]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    Promise.all([
      statsApi.getTrend(dateRange.start, dateRange.end),
      statsApi.getCategories(2, dateRange.start, dateRange.end),
    ])
      .then(([trendData, categoryData]) => {
        if (!mounted) {
          return;
        }
        setTrend(trendData);
        setCategoryStats(categoryData);
      })
      .catch((error) => {
        console.error("获取报表数据失败:", error);
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [dateRange]);

  const totalIncome = useMemo(() => trend.reduce((sum, item) => sum + item.income, 0), [trend]);
  const totalExpense = useMemo(() => trend.reduce((sum, item) => sum + item.expense, 0), [trend]);
  const balance = totalIncome - totalExpense;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">统计报表</h1>
          <p className="text-gray-500 mt-1">分析你的收支变化</p>
        </div>

        <button
          onClick={() => router.push("/reports/advanced")}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700"
        >
          <BarChart3 className="w-5 h-5" />
          高级报表
        </button>

        <div className="relative">
          <button
            onClick={() => setShowDateFilter((prev) => !prev)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 bg-white"
          >
            <Calendar className="w-5 h-5 text-gray-400" />
            <span className="text-sm">{dateRange.start} ~ {dateRange.end}</span>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showDateFilter ? "rotate-180" : ""}`} />
          </button>

          {showDateFilter && (
            <div className="absolute right-0 top-full mt-2 p-4 bg-white rounded-xl shadow-lg border z-10">
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange((prev) => ({ ...prev, start: e.target.value }))}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                />
                <span className="text-gray-400">至</span>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange((prev) => ({ ...prev, end: e.target.value }))}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                />
              </div>
              <div className="flex justify-end gap-2 mt-3">
                <button
                  onClick={() => {
                    const today = new Date();
                    setDateRange({
                      start: new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10),
                      end: today.toISOString().slice(0, 10),
                    });
                    setShowDateFilter(false);
                  }}
                  className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  本月
                </button>
                <button
                  onClick={() => setShowDateFilter(false)}
                  className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  确定
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <SummaryCard title="总收入" value={totalIncome} color="text-green-600" />
        <SummaryCard title="总支出" value={totalExpense} color="text-red-600" />
        <SummaryCard title="结余" value={balance} color={balance >= 0 ? "text-indigo-600" : "text-red-600"} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">收支趋势</h2>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value: number, name: string) => [`¥${value.toLocaleString()}`, name]} />
              <Legend />
              <Line type="monotone" dataKey="income" name="收入" stroke="#10B981" strokeWidth={2} />
              <Line type="monotone" dataKey="expense" name="支出" stroke="#EF4444" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">支出分类</h2>
          {categoryStats.length > 0 ? (
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={categoryStats}
                  dataKey="amount"
                  nameKey="categoryName"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ categoryName, percentage }) => `${categoryName} ${percentage.toFixed(0)}%`}
                >
                  {categoryStats.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `¥${value.toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[320px] flex items-center justify-center text-gray-500">暂无数据</div>
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ title, value, color }: { title: string; value: number; color: string }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <p className="text-gray-500 text-sm mb-2">{title}</p>
      <p className={`text-2xl font-bold ${color}`}>¥{value.toLocaleString("zh-CN", { minimumFractionDigits: 2 })}</p>
    </div>
  );
}
