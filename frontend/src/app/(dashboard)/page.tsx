"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { ArrowUpCircle, ArrowDownCircle, Wallet, Plus, TrendingUp, TrendingDown } from "lucide-react";

interface Stats {
  income: number;
  expense: number;
  balance: number;
}

interface Transaction {
  id: number;
  type: number;
  amount: number;
  category: {
    name: string;
    icon: string;
  };
  date: string;
  remark: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats>({ income: 0, expense: 0, balance: 0 });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");
    if (!token) {
      router.push("/login");
      return;
    }
    if (userStr) {
      const user = JSON.parse(userStr);
      setUserName(user.nickname || user.email);
    }

    Promise.all([
      api.get<Stats>("/stats/overview"),
      api.get<{ list: Transaction[] }>("/transactions?page=1&page_size=5"),
    ])
      .then(([statsData, transactionsData]) => {
        setStats(statsData);
        setTransactions(transactionsData.list);
      })
      .catch((err) => {
        console.error(err);
        if (err.code === 401) {
          localStorage.removeItem("token");
          router.push("/login");
        }
      })
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">欢迎回来，{userName}</h1>
        <p className="text-gray-500 mt-1">这是您本月的财务概览</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 shadow-sm border-2 border-green-500">
          <p className="text-gray-500 text-sm mb-3">本月收入</p>
          <p className="text-2xl font-bold text-green-600">¥{stats.income.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border-2 border-red-500">
          <p className="text-gray-500 text-sm mb-3">本月支出</p>
          <p className="text-2xl font-bold text-red-600">¥{stats.expense.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border-2 border-indigo-500">
          <p className="text-gray-500 text-sm mb-3">本月结余</p>
          <p className="text-2xl font-bold text-indigo-600">¥{stats.balance.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Link
          href="/transactions"
          className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow flex items-center gap-3"
        >
          <div className="p-2 bg-indigo-100 rounded-lg">
            <Plus className="w-5 h-5 text-indigo-600" />
          </div>
          <span className="font-medium text-gray-700">记账</span>
        </Link>
        <Link
          href="/transactions"
          className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow flex items-center gap-3"
        >
          <div className="p-2 bg-blue-100 rounded-lg">
            <TrendingUp className="w-5 h-5 text-blue-600" />
          </div>
          <span className="font-medium text-gray-700">交易记录</span>
        </Link>
        <Link
          href="/reports"
          className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow flex items-center gap-3"
        >
          <div className="p-2 bg-purple-100 rounded-lg">
            <ArrowDownCircle className="w-5 h-5 text-purple-600" />
          </div>
          <span className="font-medium text-gray-700">报表</span>
        </Link>
        <Link
          href="/budget"
          className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow flex items-center gap-3"
        >
          <div className="p-2 bg-orange-100 rounded-lg">
            <Wallet className="w-5 h-5 text-orange-600" />
          </div>
          <span className="font-medium text-gray-700">预算</span>
        </Link>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-2xl shadow-sm">
        <div className="p-5 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold">最近交易</h2>
          <Link
            href="/transactions"
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            查看全部 →
          </Link>
        </div>

        {transactions.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Wallet className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 mb-4">暂无交易记录</p>
            <Link
              href="/transactions"
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              开始记账
            </Link>
          </div>
        ) : (
          <div className="divide-y">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      tx.type === 1 ? "bg-green-100" : "bg-red-100"
                    }`}
                  >
                    {tx.type === 1 ? (
                      <ArrowUpCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <ArrowDownCircle className="w-5 h-5 text-red-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{tx.category.name}</p>
                    <p className="text-sm text-gray-500">{tx.date}</p>
                  </div>
                </div>
                <span
                  className={`text-lg font-semibold ${
                    tx.type === 1 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {tx.type === 1 ? "+" : "-"}¥{tx.amount.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
