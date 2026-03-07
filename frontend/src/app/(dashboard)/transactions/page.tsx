"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Wallet } from "lucide-react";
import { RefundModal, TransactionFilter, TransactionForm, TransactionItem } from "@/components/transactions";
import { useAccounts, useCategories, useCreateTransaction, useTransactions, useUpdateTransaction } from "@/lib/hooks";
import { api, type Transaction } from "@/lib/api";

export default function TransactionsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<number | null>(null);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: "", end: "" });
  const [showDateFilter, setShowDateFilter] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundingTransaction, setRefundingTransaction] = useState<Transaction | null>(null);

  useEffect(() => {
    if (searchParams.get("new") === "1") {
      setShowModal(true);
    }
  }, [searchParams]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
    }
  }, [router]);

  const queryParams = useMemo(
    () => ({
      page,
      pageSize: 20,
      type: typeFilter || undefined,
      startDate: dateRange.start || undefined,
      endDate: dateRange.end || undefined,
    }),
    [page, typeFilter, dateRange]
  );

  const { data: transactionsData, isLoading, refetch } = useTransactions(queryParams);
  const { data: categoriesData } = useCategories();
  const { data: accountsData } = useAccounts();

  const createMutation = useCreateTransaction();
  const updateMutation = useUpdateTransaction();

  const transactions = transactionsData?.list || [];
  const total = transactionsData?.total || 0;
  const categories = categoriesData || { income: [], expense: [] };
  const accounts = accountsData || [];

  const filteredTransactions = useMemo(() => {
    if (!searchKeyword) {
      return transactions;
    }
    const keyword = searchKeyword.toLowerCase();
    return transactions.filter(
      (tx) =>
        tx.category?.name.toLowerCase().includes(keyword) ||
        tx.account?.name.toLowerCase().includes(keyword) ||
        Boolean(tx.remark && tx.remark.toLowerCase().includes(keyword)) ||
        tx.date.includes(keyword) ||
        tx.user?.nickname.toLowerCase().includes(keyword)
    );
  }, [transactions, searchKeyword]);

  const totalPages = Math.ceil(total / 20);

  const handleSubmit = useCallback(
    async (data: {
      type: 1 | 2;
      amount: string;
      categoryId: number | null;
      accountId: number | null;
      date: string;
      remark: string;
    }) => {
      const payload = {
        type: data.type,
        amount: parseFloat(data.amount),
        categoryId: data.categoryId,
        accountId: data.accountId,
        date: data.date,
        remark: data.remark,
      };

      if (editingTransaction) {
        await updateMutation.mutateAsync({ id: editingTransaction.id, data: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }

      setShowModal(false);
      setEditingTransaction(null);
      refetch();
    },
    [editingTransaction, createMutation, updateMutation, refetch]
  );

  const handleRefund = useCallback(
    async (amount: number, date: string) => {
      if (!refundingTransaction) {
        return;
      }

      await api.post(`/transactions/${refundingTransaction.id}/refund`, {
        amount,
        date,
      });

      setShowRefundModal(false);
      setRefundingTransaction(null);
      refetch();
    },
    [refundingTransaction, refetch]
  );

  const handleEdit = useCallback((tx: Transaction) => {
    setEditingTransaction(tx);
    setShowModal(true);
  }, []);

  const handleRefundClick = useCallback((tx: Transaction) => {
    setRefundingTransaction(tx);
    setShowRefundModal(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowModal(false);
    setEditingTransaction(null);
  }, []);

  const handleCloseRefundModal = useCallback(() => {
    setShowRefundModal(false);
    setRefundingTransaction(null);
  }, []);

  if (isLoading) {
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

      <TransactionFilter
        searchKeyword={searchKeyword}
        setSearchKeyword={setSearchKeyword}
        typeFilter={typeFilter}
        setTypeFilter={setTypeFilter}
        dateRange={dateRange}
        setDateRange={setDateRange}
        showDateFilter={showDateFilter}
        setShowDateFilter={setShowDateFilter}
      />

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
              <TransactionItem key={tx.id} tx={tx} onEdit={handleEdit} onRefund={handleRefundClick} />
            ))}
          </div>

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

      <TransactionForm
        isOpen={showModal}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        categories={categories}
        accounts={accounts}
        editingTransaction={editingTransaction}
        loading={createMutation.isPending || updateMutation.isPending}
      />

      <RefundModal
        isOpen={showRefundModal}
        onClose={handleCloseRefundModal}
        onSubmit={handleRefund}
        transaction={refundingTransaction}
        loading={false}
      />
    </div>
  );
}
