'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  ArrowDownRight,
  Calendar,
  DollarSign,
  FileText,
  RefreshCw,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { get } from '@/lib/api';

// 预算详情类型
interface BudgetDetailResponse {
  budgetId: number;
  name: string;
  type: string;
  category: string;
  totalAmount: number;
  usedAmount: number;
  remainingAmount: number;
  periodStart: string;
  periodEnd: string;
  status: string;
  usagePercent: number;
  transactions: TransactionResponse[];
  transactionCount: number;
  createdAt: string;
}

// 交易类型
interface TransactionResponse {
  transactionId: number;
  type: string;
  category: string;
  amount: number;
  note: string;
  accountName: string;
  occurredAt: string;
  createdAt: string;
}

// 分类标签映射
const EXPENSE_CATEGORY_LABELS: Record<string, string> = {
  operating: '经营成本',
  procurement: '进货成本',
  platform: '平台抽佣',
  advertising: '投流费用',
  logistics: '物流快递',
  packaging: '打包材料',
  office: '办公用品',
  utilities: '水电房租',
  equipment: '设备维修',
  travel: '差旅交通',
  entertainment: '业务招待',
  other: '其他支出',
};

interface BudgetDetailDialogProps {
  budgetId?: number | null;
  onBudgetUpdate?: () => void;
}

export function BudgetDetailDialog({
  budgetId,
  onBudgetUpdate,
}: BudgetDetailDialogProps) {
  const [open, setOpen] = useState(false);
  const [currentBudgetId, setCurrentBudgetId] = useState<number | null>(null);
  const [detail, setDetail] = useState<BudgetDetailResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 打开对话框
  const openDialog = (id: number) => {
    setCurrentBudgetId(id);
    setOpen(true);
  };

  // 设置全局打开函数
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as unknown as { __budgetDetailOpen__?: (id: number) => void }).__budgetDetailOpen__ = openDialog;
    }
    return () => {
      if (typeof window !== 'undefined') {
        const win = window as unknown as { __budgetDetailOpen__?: (id: number) => void };
        if (win.__budgetDetailOpen__) {
          delete win.__budgetDetailOpen__;
        }
      }
    };
  }, [openDialog]);

  // 获取预算详情
  const fetchBudgetDetail = async () => {
    if (!currentBudgetId) return;

    setLoading(true);
    setError(null);

    try {
      const data = await get<BudgetDetailResponse>(
        `/api/v1/budgets/${currentBudgetId}/detail`
      );
      setDetail(data);
    } catch (err: any) {
      console.error('获取预算详情失败:', err);
      setError(err.message || '获取预算详情失败');
    } finally {
      setLoading(false);
    }
  };

  // 监听对话框打开和budgetId变化
  useEffect(() => {
    if (open && currentBudgetId) {
      fetchBudgetDetail();
    } else if (!open) {
      setDetail(null);
      setError(null);
      setCurrentBudgetId(null);
    }
  }, [open, currentBudgetId]);

  // 刷新数据
  const handleRefresh = () => {
    fetchBudgetDetail();
    onBudgetUpdate?.();
  };

  // 根据时间范围计算预算状态
  const getBudgetTimeStatus = () => {
    if (!detail) return null;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const budgetStart = new Date(detail.periodStart);
    const budgetEnd = new Date(detail.periodEnd);

    if (budgetEnd < today) {
      return { status: 'ended', label: '已结束', color: 'destructive' };
    }
    if (budgetStart > today) {
      return { status: 'not_started', label: '未开始', color: 'secondary' };
    }
    return { status: 'in_progress', label: '进行中', color: 'success' };
  };

  // 获取状态标签
  const getStatusBadge = () => {
    const timeStatus = getBudgetTimeStatus();
    if (!timeStatus) return null;

    const { label, color } = timeStatus;

    // 颜色变体映射
    const variantMap: Record<string, 'destructive' | 'secondary' | 'success'> = {
      ended: 'destructive',      // 红色
      not_started: 'secondary',  // 灰色
      in_progress: 'success',    // 绿色
    };

    return <Badge variant={variantMap[color]}>{label}</Badge>;
  };

  // 获取分类显示名称
  const getCategoryLabel = (category: string) => {
    return EXPENSE_CATEGORY_LABELS[category] || category;
  };

  // 获取预算类型显示名称
  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      monthly: '月度预算',
      yearly: '年度预算',
      project: '项目预算',
    };
    return labels[type] || type;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl">
                {detail?.name || '预算详情'}
              </DialogTitle>
              <DialogDescription className="mt-1">
                {detail ? getTypeLabel(detail.type) + ' · ' + getCategoryLabel(detail.category) : ''}
              </DialogDescription>
            </div>
            {detail && (
              <div className="flex items-center gap-2">
                {getStatusBadge()}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleRefresh}
                  disabled={loading}
                  title="刷新"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            )}
          </div>
        </DialogHeader>

        {error && (
          <div className="p-4 mb-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
            {error}
          </div>
        )}

        {loading && !detail ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="ml-3 text-muted-foreground">加载中...</span>
          </div>
        ) : detail ? (
          <div className="space-y-6">
            {/* 预算概览 */}
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    总预算金额
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(detail.totalAmount)}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    已使用金额
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-destructive">
                    -{formatCurrency(detail.usedAmount)}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    剩余金额
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${detail.remainingAmount > 0 ? 'text-success' : 'text-destructive'}`}>
                    {formatCurrency(detail.remainingAmount)}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    预算周期
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span>{detail.periodStart} 至 {detail.periodEnd}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 使用进度条 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">预算使用进度</span>
                <span className="font-medium">{detail.usagePercent.toFixed(1)}%</span>
              </div>
              <Progress
                value={Math.min(detail.usagePercent, 100)}
                className="h-3"
              />
            </div>

            {/* 关联的交易记录 */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  关联支出记录
                </h3>
                <Badge variant="secondary">
                  共 {detail.transactionCount} 笔支出
                </Badge>
              </div>

              {detail.transactions.length === 0 ? (
                <div className="text-center py-8 border rounded-lg bg-muted/30">
                  <DollarSign className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">暂无关联的支出记录</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    创建支出时关联此预算，即可在此查看
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {detail.transactions.map((tx) => (
                    <div
                      key={tx.transactionId}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                          <ArrowDownRight className="w-5 h-5 text-destructive" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{tx.note || '无备注'}</span>
                            <Badge variant="outline" className="text-xs">
                              {getCategoryLabel(tx.category)}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                            <span>{tx.accountName}</span>
                            <span>·</span>
                            <span>{formatDate(tx.occurredAt, 'YYYY-MM-DD')}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-destructive">
                          -{formatCurrency(tx.amount)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDate(tx.createdAt, '完整')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            请选择要查看的预算
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
