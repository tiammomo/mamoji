'use client';

import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, Database, Download, RefreshCw, Upload } from 'lucide-react';
import { backupApi, BackupStatus } from '@/lib/api';

export default function BackupPage() {
  const [status, setStatus] = useState<BackupStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    try {
      const result = await backupApi.getStatus();
      setStatus(result);
    } catch (error) {
      console.error('获取备份状态失败:', error);
      setMessage({ type: 'error', text: '获取状态失败，请稍后重试' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handleExport = () => {
    try {
      backupApi.exportData();
      setMessage({ type: 'success', text: '导出已开始，请在浏览器下载列表中查看进度' });
    } catch (error) {
      setMessage({ type: 'error', text: '导出失败，请重试' });
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setImporting(true);
    setMessage(null);

    try {
      const result = await backupApi.importData(file);
      if (result.code === 0) {
        const importedCount = result.data?.importedCount ?? 0;
        setMessage({ type: 'success', text: `导入成功，共导入 ${importedCount} 条记录` });
        await fetchStatus();
      } else {
        setMessage({ type: 'error', text: result.message || '导入失败' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: '导入失败，请检查文件格式' });
    } finally {
      setImporting(false);
      event.target.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">数据备份与恢复</h1>

        {message && (
          <div
            className={`p-4 rounded-lg flex items-center gap-2 ${
              message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}
          >
            {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span>{message.text}</span>
          </div>
        )}

        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Database className="w-5 h-5" />
              数据统计
            </h2>
            <button
              onClick={fetchStatus}
              disabled={loading}
              className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50"
              title="刷新"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <div className="p-4 grid grid-cols-2 md:grid-cols-3 gap-4">
            {status ? (
              <>
                <StatCard label="用户" value={status.users} />
                <StatCard label="账户" value={status.accounts} />
                <StatCard label="分类" value={status.categories} />
                <StatCard label="交易" value={status.transactions} />
                <StatCard label="预算" value={status.budgets} />
                <StatCard label="账本" value={status.ledgers} />
              </>
            ) : (
              <div className="col-span-full text-center text-gray-500 py-6">暂无数据</div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 flex flex-col gap-4">
          <button
            onClick={handleExport}
            className="w-full py-2.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            导出数据
          </button>

          <label className="w-full py-2.5 rounded-lg bg-gray-100 text-gray-800 hover:bg-gray-200 flex items-center justify-center gap-2 cursor-pointer">
            <Upload className="w-4 h-4" />
            {importing ? '导入中...' : '导入备份文件'}
            <input type="file" accept=".json,.zip" className="hidden" onChange={handleImport} disabled={importing} />
          </label>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center p-3 bg-gray-50 rounded-lg">
      <div className="text-2xl font-bold text-indigo-600">{value}</div>
      <div className="text-sm text-gray-500">{label}</div>
    </div>
  );
}
