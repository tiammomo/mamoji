"use client";

import { type ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDownCircle, ArrowUpCircle, Calendar, FileText } from "lucide-react";
import { categoryApi, getErrorMessage, transactionApi, type Category } from "@/lib/api";

export default function NewTransactionPage() {
  const router = useRouter();

  const [type, setType] = useState<1 | 2>(2);
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [remark, setRemark] = useState("");

  const [categories, setCategories] = useState<{ income: Category[]; expense: Category[] }>({ income: [], expense: [] });
  const [loading, setLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  useEffect(() => {
    categoryApi
      .getCategories()
      .then((data) => {
        setCategories(data);
        if (data.expense.length > 0) {
          setCategoryId(data.expense[0].id);
        }
      })
      .catch((error: unknown) => {
        console.error(getErrorMessage(error, "获取分类失败"));
      })
      .finally(() => setCategoriesLoading(false));
  }, []);

  const currentCategories = type === 1 ? categories.income : categories.expense;

  async function handleSubmit(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    if (!categoryId || !amount) {
      return;
    }

    setLoading(true);
    try {
      await transactionApi.createTransaction({
        type,
        amount: Number.parseFloat(amount),
        categoryId,
        date,
        remark,
      });
      router.push("/");
    } catch (error: unknown) {
      console.error(getErrorMessage(error, "保存失败"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">新增记账</h1>
        <p className="text-gray-500 mt-1">记录一条收支明细</p>
      </div>

      <div className="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Section title="类型">
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => {
                  setType(1);
                  if (categories.income.length > 0) {
                    setCategoryId(categories.income[0].id);
                  }
                }}
                className={`flex-1 py-4 rounded-xl font-medium transition-all ${
                  type === 1
                    ? "bg-green-100 text-green-700 border-2 border-green-500"
                    : "bg-gray-50 text-gray-600 border-2 border-transparent hover:bg-gray-100"
                }`}
              >
                <ArrowUpCircle className="w-6 h-6 mx-auto mb-2" />
                收入
              </button>
              <button
                type="button"
                onClick={() => {
                  setType(2);
                  if (categories.expense.length > 0) {
                    setCategoryId(categories.expense[0].id);
                  }
                }}
                className={`flex-1 py-4 rounded-xl font-medium transition-all ${
                  type === 2
                    ? "bg-red-100 text-red-700 border-2 border-red-500"
                    : "bg-gray-50 text-gray-600 border-2 border-transparent hover:bg-gray-100"
                }`}
              >
                <ArrowDownCircle className="w-6 h-6 mx-auto mb-2" />
                支出
              </button>
            </div>
          </Section>

          <Section title="金额">
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-gray-400">¥</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                required
                className="w-full pl-12 pr-4 py-4 text-3xl border border-gray-200 rounded-xl"
                placeholder="0.00"
              />
            </div>
          </Section>

          <Section title="分类">
            {categoriesLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600" />
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-3">
                {currentCategories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setCategoryId(category.id)}
                    className={`p-3 rounded-xl text-center transition-all ${
                      categoryId === category.id ? "ring-2 ring-offset-2 ring-indigo-500" : "hover:bg-gray-50"
                    }`}
                    style={{ backgroundColor: categoryId === category.id ? `${category.color}20` : undefined }}
                  >
                    <div className="w-10 h-10 mx-auto rounded-full flex items-center justify-center text-white text-sm font-medium" style={{ backgroundColor: category.color }}>
                      {category.icon.charAt(0)}
                    </div>
                    <p className="mt-2 text-xs font-medium">{category.name}</p>
                  </button>
                ))}
              </div>
            )}
          </Section>

          <Section title="日期">
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                required
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl"
              />
            </div>
          </Section>

          <Section title="备注">
            <div className="relative">
              <FileText className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
              <textarea
                value={remark}
                onChange={(event) => setRemark(event.target.value)}
                rows={3}
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl resize-none"
                placeholder="可选备注"
              />
            </div>
          </Section>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading || !categoryId || !amount}
              className="flex-1 py-4 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? "保存中..." : "保存"}
            </button>
            <button type="button" onClick={() => router.back()} className="px-6 py-4 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200">
              取消
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <label className="block text-sm font-medium text-gray-700 mb-4">{title}</label>
      {children}
    </div>
  );
}
