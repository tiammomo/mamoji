"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { ArrowUpCircle, ArrowDownCircle, Plus, Filter, Wallet, Calendar, FileText, X, Pencil, RefreshCcw, Search, ChevronDown } from "lucide-react";

interface Transaction {
  id: number;
  type: number;
  amount: number;
  category: {
    id: number;
    name: string;
    icon: string;
  };
  account: {
    id: number;
    name: string;
  };
  user: {
    id: number;
    nickname: string;
  };
  date: string;
  remark: string;
  createdAt: string;
  // 退款相关字段
  refundedAmount?: number;
  refundableAmount?: number;
  canRefund?: boolean;
}

interface Category {
  id: number;
  name: string;
  icon: string;
  color: string;
}

interface Account {
  id: number;
  name: string;
  type: string;
}

export default function TransactionsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<number | null>(null);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: "",
    end: "",
  });
  const [showDateFilter, setShowDateFilter] = useState(false);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [categories, setCategories] = useState<{ income: Category[]; expense: Category[] }>({ income: [], expense: [] });
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Refund modal state
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundingTransaction, setRefundingTransaction] = useState<Transaction | null>(null);
  const [refundAmount, setRefundAmount] = useState("");
  const [refundLoading, setRefundLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    type: 2 as 1 | 2,
    amount: "",
    categoryId: null as number | null,
    accountId: null as number | null,
    date: new Date().toISOString().split("T")[0],
    remark: "",
  });

  // Check if should open modal from URL
  useEffect(() => {
    if (searchParams.get("new") === "1") {
      setShowModal(true);
    }
  }, [searchParams]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
  }, [router]);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
    });
    if (typeFilter) {
      params.append("type", typeFilter.toString());
    }
    if (dateRange.start) {
      params.append("startDate", dateRange.start);
    }
    if (dateRange.end) {
      params.append("endDate", dateRange.end);
    }

    api
      .get<{ list: Transaction[]; total: number }>(`/transactions?${params}`)
      .then((data) => {
        setTransactions(data.list);
        setTotal(data.total);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page, pageSize, typeFilter, dateRange]);

  // Load categories and accounts for modal
  useEffect(() => {
    if (showModal) {
      Promise.all([
        api.get<{ income: Category[]; expense: Category[] }>("/categories"),
        api.get<Account[]>("/accounts"),
      ])
        .then(([catData, accData]) => {
          setCategories(catData);
          setAccounts(accData);
          // Only set default values if not editing
          if (!editingTransaction && catData.expense.length > 0) {
            setFormData((prev) => ({
              ...prev,
              categoryId: catData.expense[0].id,
              accountId: accData.length > 0 ? accData[0].id : null,
            }));
          }
          // For editing, ensure accountId is set if accounts are loaded
          if (editingTransaction && accData.length > 0 && !formData.accountId) {
            setFormData((prev) => ({
              ...prev,
              accountId: accData[0].id,
            }));
          }
        })
        .catch(console.error)
        .finally(() => setCategoriesLoading(false));
    }
  }, [showModal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.categoryId || !formData.amount || !formData.accountId) return;

    setSubmitting(true);
    try {
      const data = {
        type: formData.type,
        amount: parseFloat(formData.amount),
        categoryId: formData.categoryId,
        accountId: formData.accountId,
        date: formData.date,
        remark: formData.remark,
      };

      if (editingTransaction) {
        await api.put(`/transactions/${editingTransaction.id}`, data);
      } else {
        await api.post("/transactions", data);
      }

      setShowModal(false);
      setEditingTransaction(null);
      setFormData({
        type: 2,
        amount: "",
        categoryId: null,
        accountId: null,
        date: new Date().toISOString().split("T")[0],
        remark: "",
      });
      // Refresh transactions
      setLoading(true);
      api
        .get<{ list: Transaction[]; total: number }>(`/transactions?page=1&pageSize=${pageSize}`)
        .then((data) => {
          setTransactions(data.list);
          setTotal(data.total);
          setPage(1);
        })
        .finally(() => setLoading(false));
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // 打开退款弹窗
  const handleRefundClick = (tx: Transaction) => {
    setRefundingTransaction(tx);
    setRefundAmount(tx.refundableAmount?.toString() || tx.amount.toString());
    setShowRefundModal(true);
  };

  // 提交退款
  const handleRefundSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundingTransaction || !refundAmount) return;

    setRefundLoading(true);
    try {
      await api.post(`/transactions/${refundingTransaction.id}/refund`, {
        amount: parseFloat(refundAmount),
        date: new Date().toISOString().split("T")[0],
      });

      setShowRefundModal(false);
      setRefundingTransaction(null);
      setRefundAmount("");
      // 刷新列表
      setLoading(true);
      api
        .get<{ list: Transaction[]; total: number }>(`/transactions?page=1&pageSize=${pageSize}`)
        .then((data) => {
          setTransactions(data.list);
          setTotal(data.total);
          setPage(1);
        })
        .finally(() => setLoading(false));
    } catch (err) {
      console.error(err);
      alert("退款失败: " + (err as Error).message);
    } finally {
      setRefundLoading(false);
    }
  };

  const currentCategories = formData.type === 1 ? categories.income : categories.expense;

  // Filter transactions by search keyword
  const filteredTransactions = transactions.filter((tx) => {
    if (!searchKeyword) return true;
    const keyword = searchKeyword.toLowerCase();
    return (
      tx.category.name.toLowerCase().includes(keyword) ||
      tx.account.name.toLowerCase().includes(keyword) ||
      (tx.remark && tx.remark.toLowerCase().includes(keyword)) ||
      tx.date.includes(keyword) ||
      tx.user.nickname.toLowerCase().includes(keyword)
    );
  });

  const totalPages = Math.ceil(total / pageSize);

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
          <h1 className="text-2xl font-bold text-gray-900">交易记录</h1>
          <p className="text-gray-500 mt-1">查看所有记账明细</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          记账
        </button>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-2xl shadow-sm p-4 mb-6">
        <div className="flex items-center gap-4 flex-wrap">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="搜索交易记录..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <Filter className="w-5 h-5 text-gray-400" />
          <div className="flex gap-2">
            <button
              onClick={() => setTypeFilter(null)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                typeFilter === null
                  ? "bg-indigo-100 text-indigo-700"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              全部
            </button>
            <button
              onClick={() => setTypeFilter(1)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                typeFilter === 1
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              收入
            </button>
            <button
              onClick={() => setTypeFilter(2)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                typeFilter === 2
                  ? "bg-red-100 text-red-700"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              支出
            </button>
            <button
              onClick={() => setTypeFilter(3)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                typeFilter === 3
                  ? "bg-blue-100 text-blue-700"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              退款
            </button>
          </div>
          {/* Date Range Filter */}
          <div className="relative flex items-center gap-2">
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
              <div className="absolute top-full mt-2 p-4 bg-white rounded-xl shadow-lg border z-10">
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
        </div>
      </div>

      {/* Transactions List */}
      {filteredTransactions.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Wallet className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500 mb-4">暂无交易记录</p>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            开始记账
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm">
          <div className="divide-y">
            {filteredTransactions.map((tx) => (
              <div
                key={tx.id}
                className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      tx.type === 1 ? "bg-green-100" : tx.type === 2 ? "bg-red-100" : "bg-blue-100"
                    }`}
                  >
                    {tx.type === 1 ? (
                      <ArrowUpCircle className="w-6 h-6 text-green-600" />
                    ) : tx.type === 2 ? (
                      <ArrowDownCircle className="w-6 h-6 text-red-600" />
                    ) : (
                      <RefreshCcw className="w-6 h-6 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {tx.category.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {tx.account.name} · {tx.user.nickname}
                    </p>
                    {tx.remark && (
                      <p className="text-sm text-gray-400">{tx.remark}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right min-w-[90px]">
                    <p
                      className={`text-lg font-semibold ${
                        tx.type === 1 ? "text-green-600" : tx.type === 2 ? "text-red-600" : "text-blue-600"
                      }`}
                    >
                      {tx.type === 1 ? "+" : tx.type === 2 ? "-" : "+"}¥{tx.amount.toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-500">{tx.date}</p>
                  </div>
                  {/* 操作按钮区域 - 保持对齐 */}
                  <div className="flex items-center gap-1">
                    {tx.type !== 3 && (
                      <button
                        onClick={() => {
                          setEditingTransaction(tx);
                          setFormData({
                            type: tx.type as 1 | 2,
                            amount: tx.amount.toString(),
                            categoryId: tx.category.id,
                            accountId: tx.account.id,
                            date: tx.date,
                            remark: tx.remark || "",
                          });
                          setShowModal(true);
                        }}
                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    )}
                    {/* 退款按钮 - 仅支出类型且可退款时显示 */}
                    {tx.type === 2 && tx.canRefund ? (
                      <button
                        onClick={() => handleRefundClick(tx)}
                        className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="退款"
                      >
                        <RefreshCcw className="w-4 h-4" />
                      </button>
                    ) : (
                      // 占位保持对齐
                      <div className="w-9" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 flex justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 bg-gray-100 rounded-lg disabled:opacity-50 hover:bg-gray-200 transition-colors"
              >
                上一页
              </button>
              <span className="px-4 py-2 text-gray-600">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 bg-gray-100 rounded-lg disabled:opacity-50 hover:bg-gray-200 transition-colors"
              >
                下一页
              </button>
            </div>
          )}
        </div>
      )}

      {/* Add Transaction Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-md mx-4 max-h-[85vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-bold">{editingTransaction ? "编辑记账" : "新增记账"}</h2>
              <button
                onClick={() => { setShowModal(false); setEditingTransaction(null); }}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              {/* Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">类型</label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        type: 1,
                        categoryId: categories.income[0]?.id || null,
                      }));
                    }}
                    className={`flex-1 py-2 rounded-lg font-medium transition-all ${
                      formData.type === 1
                        ? "bg-green-100 text-green-700 border-2 border-green-500"
                        : "bg-gray-50 text-gray-600 border-2 border-transparent hover:bg-gray-100"
                    }`}
                  >
                    <ArrowUpCircle className="w-5 h-5 mx-auto mb-1" />
                    收入
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        type: 2,
                        categoryId: categories.expense[0]?.id || null,
                      }));
                    }}
                    className={`flex-1 py-2 rounded-lg font-medium transition-all ${
                      formData.type === 2
                        ? "bg-red-100 text-red-700 border-2 border-red-500"
                        : "bg-gray-50 text-gray-600 border-2 border-transparent hover:bg-gray-100"
                    }`}
                  >
                    <ArrowDownCircle className="w-5 h-5 mx-auto mb-1" />
                    支出
                  </button>
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">金额</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg text-gray-400">¥</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.amount}
                    onChange={(e) => setFormData((prev) => ({ ...prev, amount: e.target.value }))}
                    required
                    className="w-full pl-9 pr-3 py-2.5 text-lg border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">分类</label>
                {categoriesLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-indigo-600"></div>
                  </div>
                ) : (
                  <div className="grid grid-cols-5 gap-2">
                    {currentCategories.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, categoryId: cat.id }))}
                        className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          formData.categoryId === cat.id
                            ? "bg-indigo-100 text-indigo-700 ring-2 ring-indigo-500"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Account */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">账户</label>
                <select
                  value={formData.accountId || ""}
                  onChange={(e) => setFormData((prev) => ({ ...prev, accountId: parseInt(e.target.value) }))}
                  required
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                >
                  <option value="">选择账户</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                  ))}
                </select>
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">日期</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                    required
                    className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>

              {/* Remark */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">备注</label>
                <textarea
                  value={formData.remark}
                  onChange={(e) => setFormData((prev) => ({ ...prev, remark: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none text-sm"
                  placeholder="可选备注"
                />
              </div>

              {/* Submit */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setEditingTransaction(null); }}
                  className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors text-sm"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={submitting || !formData.amount || !formData.categoryId || !formData.accountId}
                  className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                >
                  {submitting ? "保存中..." : "保存"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Refund Modal */}
      {showRefundModal && refundingTransaction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-sm mx-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-bold">退款</h2>
              <button
                onClick={() => { setShowRefundModal(false); setRefundingTransaction(null); }}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleRefundSubmit} className="p-4 space-y-4">
              {/* Original Transaction Info */}
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-gray-500 mb-1">原交易</p>
                <p className="font-medium text-gray-900">{refundingTransaction.category.name}</p>
                <p className="text-lg font-bold text-red-600">-¥{refundingTransaction.amount.toFixed(2)}</p>
                <p className="text-sm text-gray-500">{refundingTransaction.date}</p>
              </div>

              {/* Refundable Amount Info */}
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">已退款</span>
                <span className="text-gray-700">¥{((refundingTransaction as any).refundedAmount || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">可退款</span>
                <span className="text-green-600 font-medium">¥{refundingTransaction.refundableAmount?.toFixed(2) || "0.00"}</span>
              </div>

              {/* Refund Amount Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">退款金额</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg text-gray-400">¥</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={refundingTransaction.refundableAmount}
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    required
                    className="w-full pl-9 pr-3 py-2.5 text-lg border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Submit */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowRefundModal(false); setRefundingTransaction(null); }}
                  className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors text-sm"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={refundLoading || !refundAmount || parseFloat(refundAmount) <= 0}
                  className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                >
                  {refundLoading ? "处理中..." : "确认退款"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
