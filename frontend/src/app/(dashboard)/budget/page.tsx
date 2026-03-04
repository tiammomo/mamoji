"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Wallet, Plus, TrendingUp, Target, Trash2, AlertTriangle, Pencil, X, Search, Calendar, ChevronDown } from "lucide-react";

interface Budget {
  id: number;
  name: string;
  amount: number;
  spent: number;
  startDate: string;
  endDate: string;
  warningThreshold: number;
  status: number;
  usageRate: number;
  categoryId?: number;
}

interface Category {
  id: number;
  name: string;
  type: number;
}

const statusConfig: Record<number, { label: string; color: string }> = {
  0: { label: "已取消", color: "bg-gray-100 text-gray-600" },
  1: { label: "进行中", color: "bg-green-100 text-green-600" },
  2: { label: "已完成", color: "bg-blue-100 text-blue-600" },
  3: { label: "超支", color: "bg-red-100 text-red-600" },
};

export default function BudgetPage() {
  const router = useRouter();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: "",
    end: "",
  });
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [newBudget, setNewBudget] = useState({
    name: "",
    amount: 0,
    startDate: new Date().toISOString().slice(0, 7) + "-01",
    endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().slice(0, 10),
    warningThreshold: 85,
    categoryId: null as number | null,
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    fetchBudgets();
    fetchCategories();
  }, [router]);

  // Fetch budgets when date range changes
  useEffect(() => {
    fetchBudgets();
  }, [dateRange]);

  const fetchBudgets = async () => {
    try {
      const params = new URLSearchParams();
      if (dateRange.start) params.append("startDate", dateRange.start);
      if (dateRange.end) params.append("endDate", dateRange.end);
      const queryString = params.toString();
      const data = await api.get<Budget[]>(`/budgets${queryString ? '?' + queryString : ''}`);
      setBudgets(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await api.get<{ income: Category[]; expense: Category[] }>("/categories");
      setCategories(data.expense);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateBudget = async () => {
    try {
      await api.post("/budgets", {
        ...newBudget,
        amount: parseFloat(String(newBudget.amount)),
      });
      setShowAddModal(false);
      setNewBudget({
        name: "",
        amount: 0,
        startDate: new Date().toISOString().slice(0, 7) + "-01",
        endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().slice(0, 10),
        warningThreshold: 85,
        categoryId: null,
      });
      fetchBudgets();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteBudget = async (id: number) => {
    if (!confirm("确定要删除该预算吗？")) return;
    try {
      await api.delete(`/budgets/${id}`);
      fetchBudgets();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateBudget = async () => {
    if (!editingBudget) return;
    try {
      await api.put(`/budgets/${editingBudget.id}`, {
        name: editingBudget.name,
        amount: Math.max(0, parseFloat(String(editingBudget.amount)) || 0),
        startDate: editingBudget.startDate,
        endDate: editingBudget.endDate,
        warningThreshold: Math.min(100, Math.max(0, editingBudget.warningThreshold)),
      });
      setEditingBudget(null);
      fetchBudgets();
    } catch (err) {
      console.error(err);
    }
  };

  // Filter budgets by search keyword
  const filteredBudgets = budgets.filter((budget) => {
    if (!searchKeyword) return true;
    const keyword = searchKeyword.toLowerCase();
    return budget.name.toLowerCase().includes(keyword);
  });

  const totalBudget = filteredBudgets.reduce((sum, b) => sum + Number(b.amount), 0);
  const totalSpent = filteredBudgets.reduce((sum, b) => sum + Number(b.spent), 0);

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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">预算管理</h1>
          <p className="text-gray-500 mt-1">设置和管理您的月度预算</p>
        </div>
        <div className="flex items-center gap-4">
          {/* Date Range Filter */}
          <div className="relative">
            <button
              onClick={() => setShowDateFilter(!showDateFilter)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                dateRange.start || dateRange.end
                  ? "bg-indigo-100 text-indigo-700"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <Calendar className="w-4 h-4" />
              {dateRange.start && dateRange.end
                ? `${dateRange.start} ~ ${dateRange.end}`
                : "日期筛选"}
              <ChevronDown className={`w-4 h-4 transition-transform ${showDateFilter ? "rotate-180" : ""}`} />
            </button>
            {showDateFilter && (
              <div className="absolute right-0 top-full mt-2 p-4 bg-white rounded-xl shadow-lg border z-10">
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="text-gray-400">至</span>
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="flex justify-end gap-2 mt-3">
                  <button
                    onClick={() => {
                      setDateRange({ start: "", end: "" });
                      setShowDateFilter(false);
                    }}
                    className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
                  >
                    清除
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
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="搜索预算..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent w-48"
            />
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            添加预算
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 shadow-sm border-2 border-indigo-500">
          <p className="text-gray-500 text-sm mb-3">总预算</p>
          <p className="text-2xl font-bold text-indigo-600">¥{totalBudget.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border-2 border-red-500">
          <p className="text-gray-500 text-sm mb-3">已支出</p>
          <p className="text-2xl font-bold text-red-600">¥{totalSpent.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</p>
        </div>

        <div className={`bg-white rounded-2xl p-6 shadow-sm border-2 ${totalBudget - totalSpent >= 0 ? "border-green-500" : "border-orange-500"}`}>
          <p className="text-gray-500 text-sm mb-3">剩余预算</p>
          <p className={`text-2xl font-bold ${totalBudget - totalSpent >= 0 ? "text-green-600" : "text-orange-600"}`}>
            ¥{(totalBudget - totalSpent).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Budget List */}
      <div className="bg-white rounded-2xl shadow-sm">
        <div className="p-5 border-b">
          <h2 className="text-lg font-semibold text-gray-900">预算列表</h2>
        </div>
        <div className="divide-y">
          {filteredBudgets.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              暂无预算，请添加第一个预算
            </div>
          ) : (
            filteredBudgets.map((budget) => {
              const percentage = Number(budget.usageRate) || 0;
              const isOverBudget = percentage > 100;
              const isWarning = percentage >= budget.warningThreshold && !isOverBudget;
              const status = statusConfig[budget.status] || statusConfig[1];

              return (
                <div
                  key={budget.id}
                  className="p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-gray-900">{budget.name}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${status.color}`}>
                        {status.label}
                      </span>
                      {isWarning && (
                        <AlertTriangle className="w-4 h-4 text-orange-500" />
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditingBudget(budget)}
                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      >
                        <Pencil className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteBudget(budget.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-sm ${isOverBudget ? "text-red-600" : "text-gray-600"}`}>
                      ¥{Number(budget.spent).toLocaleString('zh-CN', { minimumFractionDigits: 2 })} / ¥{Number(budget.amount).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                    </span>
                    <span className={`text-sm ${isOverBudget ? "text-red-500" : "text-gray-500"}`}>
                      {percentage.toFixed(0)}%
                    </span>
                  </div>

                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isOverBudget ? "bg-red-500" : isWarning ? "bg-orange-500" : "bg-indigo-500"
                      }`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-400">
                      {budget.startDate} - {budget.endDate}
                    </span>
                    <span className={`text-xs font-medium ${Number(budget.amount) - Number(budget.spent) >= 0 ? "text-green-600" : "text-red-600"}`}>
                      剩余 ¥{(Number(budget.amount) - Number(budget.spent)).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold mb-4">添加预算</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">预算名称</label>
                <input
                  type="text"
                  value={newBudget.name}
                  onChange={(e) => setNewBudget({ ...newBudget, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="例如：月度餐饮预算"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">预算金额</label>
                <input
                  type="number"
                  step="0.01"
                  value={newBudget.amount}
                  onChange={(e) => setNewBudget({ ...newBudget, amount: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">开始日期</label>
                  <input
                    type="date"
                    value={newBudget.startDate}
                    onChange={(e) => setNewBudget({ ...newBudget, startDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">结束日期</label>
                  <input
                    type="date"
                    value={newBudget.endDate}
                    onChange={(e) => setNewBudget({ ...newBudget, endDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">关联分类（可选）</label>
                <select
                  value={newBudget.categoryId || ""}
                  onChange={(e) => setNewBudget({ ...newBudget, categoryId: e.target.value ? parseInt(e.target.value) : null })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">不关联分类</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">预警阈值 (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={newBudget.warningThreshold}
                  onChange={(e) => setNewBudget({ ...newBudget, warningThreshold: parseInt(e.target.value) || 80 })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div className="flex gap-4 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                取消
              </button>
              <button
                onClick={handleCreateBudget}
                disabled={!newBudget.name || !newBudget.amount || newBudget.amount < 0}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingBudget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">编辑预算</h2>
              <button
                onClick={() => setEditingBudget(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">预算名称</label>
                <input
                  type="text"
                  value={editingBudget.name}
                  onChange={(e) => setEditingBudget({ ...editingBudget, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">预算金额</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editingBudget.amount}
                  onChange={(e) => setEditingBudget({ ...editingBudget, amount: Math.max(0, parseFloat(e.target.value) || 0) })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">开始日期</label>
                  <input
                    type="date"
                    value={editingBudget.startDate}
                    onChange={(e) => setEditingBudget({ ...editingBudget, startDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">结束日期</label>
                  <input
                    type="date"
                    value={editingBudget.endDate}
                    onChange={(e) => setEditingBudget({ ...editingBudget, endDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">预警阈值 (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={editingBudget.warningThreshold}
                  onChange={(e) => setEditingBudget({ ...editingBudget, warningThreshold: Math.min(100, Math.max(0, parseInt(e.target.value) || 85)) })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-xs text-gray-500 mt-1">超过此百分比显示预警提醒</p>
              </div>
            </div>
            <div className="flex gap-4 mt-6">
              <button
                onClick={() => setEditingBudget(null)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                取消
              </button>
              <button
                onClick={handleUpdateBudget}
                disabled={!editingBudget.name || editingBudget.amount < 0}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
