"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowDownCircle, ArrowUpCircle, Plus, TrendingUp, Wallet } from "lucide-react";
import { getErrorMessage, statsApi, transactionApi, type Transaction } from "@/lib/api";

interface DashboardStats {
  income: number;
  expense: number;
  balance: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({ income: 0, expense: 0, balance: 0 });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    const rawUser = localStorage.getItem("user");
    if (rawUser) {
      try {
        const parsed = JSON.parse(rawUser) as { nickname?: string; email?: string };
        setUserName(parsed.nickname || parsed.email || "用户");
      } catch {
        setUserName("用户");
      }
    }

    Promise.all([statsApi.getOverview(), transactionApi.getTransactions({ page: 1, pageSize: 5 })])
      .then(([statsData, txData]) => {
        setStats({ income: statsData.income, expense: statsData.expense, balance: statsData.balance });
        setTransactions(txData.list || []);
      })
      .catch((error: unknown) => {
        console.error(getErrorMessage(error, "加载首页数据失败"));
      })
      .finally(() => setLoading(false));
  }, [router]);

  const quickActions = useMemo(
    () => [
      { href: "/transactions", label: "记账", icon: Plus, color: "bg-indigo-100 text-indigo-600" },
      { href: "/transactions", label: "交易记录", icon: TrendingUp, color: "bg-blue-100 text-blue-600" },
      { href: "/reports", label: "报表", icon: ArrowDownCircle, color: "bg-purple-100 text-purple-600" },
      { href: "/budget", label: "预算", icon: Wallet, color: "bg-orange-100 text-orange-600" },
    ],
    []
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">欢迎回来，{userName}</h1>
        <p className="text-gray-500 mt-1">这是你本月的财务概览</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard title="本月收入" value={stats.income} color="text-green-600" border="border-green-500" />
        <StatCard title="本月支出" value={stats.expense} color="text-red-600" border="border-red-500" />
        <StatCard title="本月结余" value={stats.balance} color="text-indigo-600" border="border-indigo-500" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {quickActions.map((item) => (
          <Link
            key={item.href + item.label}
            href={item.href}
            className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow flex items-center gap-3"
          >
            <div className={`p-2 rounded-lg ${item.color}`}>
              <item.icon className="w-5 h-5" />
            </div>
            <span className="font-medium text-gray-700">{item.label}</span>
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm">
        <div className="p-5 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold">最近交易</h2>
          <Link href="/transactions" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
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
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              <Plus className="w-4 h-4" />
              开始记账
            </Link>
          </div>
        ) : (
          <div className="divide-y">
            {transactions.map((tx) => (
              <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.type === 1 ? "bg-green-100" : "bg-red-100"}`}>
                    {tx.type === 1 ? (
                      <ArrowUpCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <ArrowDownCircle className="w-5 h-5 text-red-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{tx.category?.name || tx.categoryName || "未分类"}</p>
                    <p className="text-sm text-gray-500">{tx.date}</p>
                  </div>
                </div>
                <span className={`text-lg font-semibold ${tx.type === 1 ? "text-green-600" : "text-red-600"}`}>
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

function StatCard({ title, value, color, border }: { title: string; value: number; color: string; border: string }) {
  return (
    <div className={`bg-white rounded-2xl p-6 shadow-sm border-2 ${border}`}>
      <p className="text-gray-500 text-sm mb-3">{title}</p>
      <p className={`text-2xl font-bold ${color}`}>¥{value.toLocaleString("zh-CN", { minimumFractionDigits: 2 })}</p>
    </div>
  );
}
