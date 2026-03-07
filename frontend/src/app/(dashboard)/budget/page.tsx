"use client";

import { type ReactNode, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Calendar, ChevronDown, Pencil, Plus, Search, Trash2, Wallet, X } from "lucide-react";
import { budgetApi, categoryApi, getErrorMessage, type Budget, type Category } from "@/lib/api";

interface BudgetWithUsage extends Budget {
  usageRate: number;
}

const STATUS_CONFIG: Record<number, { label: string; color: string }> = {
  0: { label: "已取消", color: "bg-gray-100 text-gray-600" },
  1: { label: "进行中", color: "bg-green-100 text-green-600" },
  2: { label: "已完成", color: "bg-blue-100 text-blue-600" },
  3: { label: "超支", color: "bg-red-100 text-red-600" },
};

interface NewBudgetForm {
  name: string;
  amount: number;
  startDate: string;
  endDate: string;
  warningThreshold: number;
  categoryId: number | null;
}

function getDefaultBudgetForm(): NewBudgetForm {
  const now = new Date();
  return {
    name: "",
    amount: 0,
    startDate: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10),
    endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10),
    warningThreshold: 85,
    categoryId: null,
  };
}

export default function BudgetPage() {
  const router = useRouter();
  const [budgets, setBudgets] = useState<BudgetWithUsage[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchKeyword, setSearchKeyword] = useState("");
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: "", end: "" });
  const [showDateFilter, setShowDateFilter] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newBudget, setNewBudget] = useState<NewBudgetForm>(getDefaultBudgetForm());
  const [editingBudget, setEditingBudget] = useState<BudgetWithUsage | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    void Promise.all([fetchBudgets(), fetchCategories()]).finally(() => setLoading(false));
  }, [router]);

  useEffect(() => {
    void fetchBudgets();
  }, [dateRange]);

  async function fetchBudgets(): Promise<void> {
    try {
      const allBudgets = await budgetApi.getBudgets();
      const filtered = allBudgets.filter((item) => {
        if (!dateRange.start && !dateRange.end) {
          return true;
        }
        const start = dateRange.start || item.startDate;
        const end = dateRange.end || item.endDate;
        return !(item.endDate < start || item.startDate > end);
      });

      setBudgets(
        filtered.map((item) => ({
          ...item,
          usageRate: item.usageRate ?? (item.amount > 0 ? (item.spent / item.amount) * 100 : 0),
        }))
      );
    } catch (error) {
      console.error("获取预算失败:", error);
    }
  }

  async function fetchCategories(): Promise<void> {
    try {
      const data = await categoryApi.getCategories();
      setCategories(data.expense);
    } catch (error) {
      console.error("获取分类失败:", error);
    }
  }

  async function handleCreateBudget(): Promise<void> {
    try {
      await budgetApi.createBudget({
        ...newBudget,
        amount: Number.parseFloat(String(newBudget.amount)),
        categoryId: newBudget.categoryId ?? undefined,
      });

      setShowAddModal(false);
      setNewBudget(getDefaultBudgetForm());
      await fetchBudgets();
    } catch (error) {
      alert(getErrorMessage(error, "创建预算失败"));
    }
  }

  async function handleDeleteBudget(id: number): Promise<void> {
    if (!confirm("确定要删除该预算吗？")) {
      return;
    }

    try {
      await budgetApi.deleteBudget(id);
      await fetchBudgets();
    } catch (error) {
      alert(getErrorMessage(error, "删除预算失败"));
    }
  }

  async function handleUpdateBudget(): Promise<void> {
    if (!editingBudget) {
      return;
    }

    try {
      await budgetApi.updateBudget(editingBudget.id, {
        name: editingBudget.name,
        amount: Math.max(0, Number.parseFloat(String(editingBudget.amount)) || 0),
        startDate: editingBudget.startDate,
        endDate: editingBudget.endDate,
        warningThreshold: Math.min(100, Math.max(0, editingBudget.warningThreshold)),
      });

      setEditingBudget(null);
      await fetchBudgets();
    } catch (error) {
      alert(getErrorMessage(error, "更新预算失败"));
    }
  }

  const filteredBudgets = useMemo(() => {
    if (!searchKeyword) {
      return budgets;
    }
    const keyword = searchKeyword.toLowerCase();
    return budgets.filter((item) => item.name.toLowerCase().includes(keyword));
  }, [budgets, searchKeyword]);

  const totalBudget = useMemo(() => filteredBudgets.reduce((sum, item) => sum + Number(item.amount), 0), [filteredBudgets]);
  const totalSpent = useMemo(() => filteredBudgets.reduce((sum, item) => sum + Number(item.spent), 0), [filteredBudgets]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">预算管理</h1>
          <p className="text-gray-500 mt-1">设置并跟踪你的预算使用情况</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <button
              onClick={() => setShowDateFilter((prev) => !prev)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                dateRange.start || dateRange.end ? "bg-indigo-100 text-indigo-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <Calendar className="w-4 h-4" />
              {dateRange.start && dateRange.end ? `${dateRange.start} ~ ${dateRange.end}` : "日期筛选"}
              <ChevronDown className={`w-4 h-4 transition-transform ${showDateFilter ? "rotate-180" : ""}`} />
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
                      setDateRange({ start: "", end: "" });
                      setShowDateFilter(false);
                    }}
                    className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
                  >
                    清除
                  </button>
                  <button onClick={() => setShowDateFilter(false)} className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg">
                    确定
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="搜索预算..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg w-48"
            />
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            <Plus className="w-5 h-5" />
            添加预算
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <SummaryCard title="总预算" value={totalBudget} className="border-indigo-500 text-indigo-600" />
        <SummaryCard title="已支出" value={totalSpent} className="border-red-500 text-red-600" />
        <SummaryCard
          title="剩余预算"
          value={totalBudget - totalSpent}
          className={(totalBudget - totalSpent >= 0 ? "border-green-500 text-green-600" : "border-orange-500 text-orange-600")}
        />
      </div>

      <div className="bg-white rounded-2xl shadow-sm">
        <div className="p-5 border-b">
          <h2 className="text-lg font-semibold text-gray-900">预算列表</h2>
        </div>

        <div className="divide-y">
          {filteredBudgets.length === 0 ? (
            <div className="p-12 text-center text-gray-500">暂无预算，请先添加一条预算</div>
          ) : (
            filteredBudgets.map((budget) => {
              const percentage = Number(budget.usageRate) || 0;
              const isOverBudget = percentage > 100;
              const isWarning = percentage >= budget.warningThreshold && !isOverBudget;
              const status = STATUS_CONFIG[budget.status] || STATUS_CONFIG[1];
              const leftAmount = Number(budget.amount) - Number(budget.spent);

              return (
                <div key={budget.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-gray-900">{budget.name}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${status.color}`}>{status.label}</span>
                      {isWarning && <AlertTriangle className="w-4 h-4 text-orange-500" />}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditingBudget(budget)}
                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                      >
                        <Pencil className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => void handleDeleteBudget(budget.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-sm ${isOverBudget ? "text-red-600" : "text-gray-600"}`}>
                      ¥{Number(budget.spent).toLocaleString("zh-CN", { minimumFractionDigits: 2 })} / ¥
                      {Number(budget.amount).toLocaleString("zh-CN", { minimumFractionDigits: 2 })}
                    </span>
                    <span className={`text-sm ${isOverBudget ? "text-red-500" : "text-gray-500"}`}>{percentage.toFixed(0)}%</span>
                  </div>

                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${isOverBudget ? "bg-red-500" : isWarning ? "bg-orange-500" : "bg-indigo-500"}`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-400">
                      {budget.startDate} - {budget.endDate}
                    </span>
                    <span className={`text-xs font-medium ${leftAmount >= 0 ? "text-green-600" : "text-red-600"}`}>
                      剩余 ¥{leftAmount.toLocaleString("zh-CN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold mb-4">添加预算</h2>

            <div className="space-y-4">
              <Field label="预算名称">
                <input
                  type="text"
                  value={newBudget.name}
                  onChange={(e) => setNewBudget((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                  placeholder="例如：月度餐饮预算"
                />
              </Field>

              <Field label="预算金额">
                <input
                  type="number"
                  step="0.01"
                  value={newBudget.amount}
                  onChange={(e) => setNewBudget((prev) => ({ ...prev, amount: Number.parseFloat(e.target.value) || 0 }))}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="开始日期">
                  <input
                    type="date"
                    value={newBudget.startDate}
                    onChange={(e) => setNewBudget((prev) => ({ ...prev, startDate: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                  />
                </Field>
                <Field label="结束日期">
                  <input
                    type="date"
                    value={newBudget.endDate}
                    onChange={(e) => setNewBudget((prev) => ({ ...prev, endDate: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                  />
                </Field>
              </div>

              <Field label="关联分类（可选）">
                <select
                  value={newBudget.categoryId || ""}
                  onChange={(e) =>
                    setNewBudget((prev) => ({ ...prev, categoryId: e.target.value ? Number.parseInt(e.target.value, 10) : null }))
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                >
                  <option value="">不关联分类</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="预警阈值 (%)">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={newBudget.warningThreshold}
                  onChange={(e) =>
                    setNewBudget((prev) => ({ ...prev, warningThreshold: Number.parseInt(e.target.value, 10) || 80 }))
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                />
              </Field>
            </div>

            <div className="flex gap-4 mt-6">
              <button onClick={() => setShowAddModal(false)} className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                取消
              </button>
              <button
                onClick={() => void handleCreateBudget()}
                disabled={!newBudget.name || !newBudget.amount || newBudget.amount < 0}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {editingBudget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">编辑预算</h2>
              <button onClick={() => setEditingBudget(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <Field label="预算名称">
                <input
                  type="text"
                  value={editingBudget.name}
                  onChange={(e) => setEditingBudget({ ...editingBudget, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                />
              </Field>

              <Field label="预算金额">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editingBudget.amount}
                  onChange={(e) =>
                    setEditingBudget({ ...editingBudget, amount: Math.max(0, Number.parseFloat(e.target.value) || 0) })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="开始日期">
                  <input
                    type="date"
                    value={editingBudget.startDate}
                    onChange={(e) => setEditingBudget({ ...editingBudget, startDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                  />
                </Field>
                <Field label="结束日期">
                  <input
                    type="date"
                    value={editingBudget.endDate}
                    onChange={(e) => setEditingBudget({ ...editingBudget, endDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                  />
                </Field>
              </div>

              <Field label="预警阈值 (%)">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={editingBudget.warningThreshold}
                  onChange={(e) =>
                    setEditingBudget({
                      ...editingBudget,
                      warningThreshold: Math.min(100, Math.max(0, Number.parseInt(e.target.value, 10) || 85)),
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                />
                <p className="text-xs text-gray-500 mt-1">达到阈值后显示预警提示</p>
              </Field>
            </div>

            <div className="flex gap-4 mt-6">
              <button onClick={() => setEditingBudget(null)} className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                取消
              </button>
              <button
                onClick={() => void handleUpdateBudget()}
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

function SummaryCard({ title, value, className }: { title: string; value: number; className: string }) {
  return (
    <div className={`bg-white rounded-2xl p-6 shadow-sm border-2 ${className}`}>
      <p className="text-gray-500 text-sm mb-3">{title}</p>
      <p className="text-2xl font-bold">¥{value.toLocaleString("zh-CN", { minimumFractionDigits: 2 })}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  );
}
