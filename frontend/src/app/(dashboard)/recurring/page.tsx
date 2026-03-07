'use client';

import { type ReactNode, useCallback, useEffect, useState } from 'react';
import { Edit, Pause, Play, Plus, Trash2, Clock } from 'lucide-react';
import { recurringApi, type RecurringTransaction } from '@/lib/api';

type RecurrenceType = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

interface RecurringForm {
  name: string;
  type: 1 | 2;
  amount: string;
  recurrenceType: RecurrenceType;
  dayOfMonth: number;
  startDate: string;
  endDate: string;
  remark: string;
}

const RECURRENCE_OPTIONS: Array<{ value: RecurrenceType; label: string }> = [
  { value: 'DAILY', label: '每天' },
  { value: 'WEEKLY', label: '每周' },
  { value: 'MONTHLY', label: '每月' },
  { value: 'YEARLY', label: '每年' },
];

const TYPE_OPTIONS = [
  { value: 1 as const, label: '收入' },
  { value: 2 as const, label: '支出' },
];

function getDefaultForm(): RecurringForm {
  return {
    name: '',
    type: 2,
    amount: '',
    recurrenceType: 'MONTHLY',
    dayOfMonth: new Date().getDate(),
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    remark: '',
  };
}

export default function RecurringPage() {
  const [recurringList, setRecurringList] = useState<RecurringTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<RecurringTransaction | null>(null);
  const [formData, setFormData] = useState<RecurringForm>(getDefaultForm());

  const fetchRecurring = useCallback(async () => {
    setLoading(true);
    try {
      const result = await recurringApi.getRecurringTransactions({ page: 1, pageSize: 100 });
      setRecurringList(result.list);
    } catch (error) {
      console.error('获取定期交易失败:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchRecurring();
  }, [fetchRecurring]);

  function resetForm(): void {
    setFormData(getDefaultForm());
  }

  async function handleSubmit(event: React.FormEvent): Promise<void> {
    event.preventDefault();

    try {
      if (editingItem) {
        await recurringApi.updateRecurringTransaction(editingItem.id, {
          name: formData.name,
          amount: Number.parseFloat(formData.amount),
          remark: formData.remark,
          endDate: formData.endDate || undefined,
        });
      } else {
        await recurringApi.createRecurringTransaction({
          name: formData.name,
          type: formData.type,
          amount: Number.parseFloat(formData.amount),
          recurrenceType: formData.recurrenceType,
          dayOfMonth: formData.dayOfMonth,
          startDate: formData.startDate,
          endDate: formData.endDate || undefined,
          remark: formData.remark,
        });
      }

      setShowModal(false);
      setEditingItem(null);
      resetForm();
      await fetchRecurring();
    } catch (error) {
      console.error('保存失败:', error);
    }
  }

  async function handleToggle(id: number): Promise<void> {
    try {
      await recurringApi.toggleStatus(id);
      await fetchRecurring();
    } catch (error) {
      console.error('状态切换失败:', error);
    }
  }

  async function handleDelete(id: number): Promise<void> {
    if (!confirm('确定要删除这条定期交易吗？')) {
      return;
    }

    try {
      await recurringApi.deleteRecurringTransaction(id);
      await fetchRecurring();
    } catch (error) {
      console.error('删除失败:', error);
    }
  }

  async function handleExecute(id: number): Promise<void> {
    try {
      await recurringApi.manualExecute(id);
      alert('执行成功');
    } catch (error) {
      console.error('执行失败:', error);
      alert('执行失败');
    }
  }

  function openEdit(item: RecurringTransaction): void {
    setEditingItem(item);
    setFormData({
      name: item.name,
      type: item.type as 1 | 2,
      amount: item.amount.toString(),
      recurrenceType: item.recurrenceType,
      dayOfMonth: item.dayOfMonth || new Date().getDate(),
      startDate: item.startDate,
      endDate: item.endDate || '',
      remark: item.remark || '',
    });
    setShowModal(true);
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">定期记账</h1>
          <button
            onClick={() => {
              resetForm();
              setEditingItem(null);
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            <Plus className="w-5 h-5" />
            新建定期记账
          </button>
        </div>

        <div className="bg-white rounded-lg shadow">
          {loading ? (
            <div className="p-8 text-center text-gray-500">加载中...</div>
          ) : recurringList.length === 0 ? (
            <div className="p-8 text-center text-gray-500">暂无定期记账，点击上方按钮创建一条</div>
          ) : (
            <div className="divide-y">
              {recurringList.map((item) => (
                <div key={item.id} className="p-4 flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 text-xs rounded ${item.type === 1 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {item.type === 1 ? '收入' : '支出'}
                      </span>
                      <span className="font-medium">{item.name}</span>
                      <span className={`px-2 py-1 text-xs rounded ${item.status === 1 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                        {item.status === 1 ? '启用' : '停用'}
                      </span>
                    </div>
                    <div className="mt-1 text-sm text-gray-500 flex items-center gap-4">
                      <span>金额: ¥{item.amount}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {RECURRENCE_OPTIONS.find((entry) => entry.value === item.recurrenceType)?.label}
                      </span>
                      {item.nextExecutionDate && <span>下次: {item.nextExecutionDate}</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button onClick={() => void handleExecute(item.id)} className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded" title="手动执行">
                      <Play className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => void handleToggle(item.id)}
                      className={`p-2 rounded ${item.status === 1 ? 'text-gray-600 hover:text-yellow-600 hover:bg-yellow-50' : 'text-gray-600 hover:text-green-600 hover:bg-green-50'}`}
                      title={item.status === 1 ? '停用' : '启用'}
                    >
                      <Pause className="w-5 h-5" />
                    </button>
                    <button onClick={() => openEdit(item)} className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded" title="编辑">
                      <Edit className="w-5 h-5" />
                    </button>
                    <button onClick={() => void handleDelete(item.id)} className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded" title="删除">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">{editingItem ? '编辑定期记账' : '新建定期记账'}</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Field label="名称">
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="类型">
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData((prev) => ({ ...prev, type: Number.parseInt(e.target.value, 10) as 1 | 2 }))}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      {TYPE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="金额">
                    <input
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData((prev) => ({ ...prev, amount: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg"
                      required
                    />
                  </Field>
                </div>

                <Field label="重复周期">
                  <select
                    value={formData.recurrenceType}
                    onChange={(e) => setFormData((prev) => ({ ...prev, recurrenceType: e.target.value as RecurrenceType }))}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    {RECURRENCE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </Field>

                {formData.recurrenceType === 'MONTHLY' && (
                  <Field label="每月几号">
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={formData.dayOfMonth}
                      onChange={(e) => setFormData((prev) => ({ ...prev, dayOfMonth: Number.parseInt(e.target.value, 10) || 1 }))}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </Field>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <Field label="开始日期">
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData((prev) => ({ ...prev, startDate: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg"
                      required
                    />
                  </Field>
                  <Field label="结束日期（可选）">
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData((prev) => ({ ...prev, endDate: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </Field>
                </div>

                <Field label="备注">
                  <textarea
                    value={formData.remark}
                    onChange={(e) => setFormData((prev) => ({ ...prev, remark: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg"
                    rows={3}
                  />
                </Field>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">
                    取消
                  </button>
                  <button type="submit" className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                    保存
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      {children}
    </div>
  );
}
