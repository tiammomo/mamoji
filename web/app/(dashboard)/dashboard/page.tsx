'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  CreditCard,
  Landmark,
  Wallet2,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

// 模拟数据
const mockStats = {
  totalAssets: 1288888.88,
  monthlyIncome: 58888.88,
  monthlyExpense: 38888.88,
  monthlyBalance: 20000.0,
};

const mockBudgets = [
  { name: '生活支出', used: 4000, total: 5000, status: 'active' },
  { name: '进货成本', used: 2000, total: 5000, status: 'active' },
  { name: '广告费用', used: 5000, total: 5000, status: 'exceeded' },
];

const mockInvestments = [
  { name: '贵州茅台', value: 50000, profit: 12.5 },
  { name: '易方达蓝筹', value: 30000, profit: -3.2 },
  { name: '黄金ETF', value: 15000, profit: 5.8 },
];

const mockRecentTransactions = [
  { id: 1, type: 'expense', amount: 88, category: '生活用品', account: '微信', time: '今天' },
  { id: 2, type: 'income', amount: 500, category: '电商收入', account: '支付宝', time: '今天' },
  { id: 3, type: 'expense', amount: 2000, category: '进货成本', account: '工商银行', time: '昨天' },
  { id: 4, type: 'income', amount: 8888, category: '主营业务', account: '建设银行', time: '昨天' },
];

export default function DashboardPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 模拟加载
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="p-6">
        <Header title="仪表盘" subtitle="欢迎使用小帅记账" />
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-32 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <Header title="仪表盘" subtitle="欢迎使用小帅记账" />

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总资产</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(mockStats.totalAssets)}</div>
            <p className="text-xs text-muted-foreground">较上月 +5.2%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">本月收入</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              +{formatCurrency(mockStats.monthlyIncome)}
            </div>
            <p className="text-xs text-muted-foreground">共 12 笔收入</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">本月支出</CardTitle>
            <ArrowDownRight className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              -{formatCurrency(mockStats.monthlyExpense)}
            </div>
            <p className="text-xs text-muted-foreground">共 28 笔支出</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">本月结余</CardTitle>
            <PiggyBank className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(mockStats.monthlyBalance)}
            </div>
            <p className="text-xs text-muted-foreground">储蓄率 33.9%</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Budget Status */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>预算状态</CardTitle>
                <CardDescription>本月预算执行情况</CardDescription>
              </div>
              <Button size="sm" variant="outline" onClick={() => router.push('/transactions')}>
                查看全部
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {mockBudgets.map((budget) => {
              const percent = (budget.used / budget.total) * 100;
              const isExceeded = budget.status === 'exceeded';

              return (
                <div key={budget.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{budget.name}</span>
                      {isExceeded && (
                        <Badge variant="destructive" className="text-xs">
                          超支
                        </Badge>
                      )}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {formatCurrency(budget.used)} / {formatCurrency(budget.total)}
                    </span>
                  </div>
                  <Progress
                    value={Math.min(percent, 100)}
                    className={isExceeded ? '[&_*]:bg-destructive' : ''}
                  />
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Investment Summary */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>理财收益专栏</CardTitle>
                <CardDescription>投资收益概览</CardDescription>
              </div>
              <Button size="sm" variant="outline" onClick={() => router.push('/investments')}>
                查看详情
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">本月收益</p>
                <p className="text-xl font-bold text-success">+¥3,250.00</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">收益率</p>
                <p className="text-xl font-bold text-success">+4.85%</p>
              </div>
            </div>

            <div className="space-y-3">
              {mockInvestments.map((inv) => (
                <div
                  key={inv.name}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{inv.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(inv.value)}
                    </p>
                  </div>
                  <div
                    className={`flex items-center gap-1 font-medium ${
                      inv.profit >= 0 ? 'text-success' : 'text-destructive'
                    }`}
                  >
                    {inv.profit >= 0 ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                    {inv.profit >= 0 ? '+' : ''}
                    {inv.profit}%
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>最近账单</CardTitle>
              <CardDescription>最近的收支记录</CardDescription>
            </div>
            <Button size="sm" onClick={() => router.push('/transactions')}>
              <Plus className="w-4 h-4 mr-1" />
              记一笔
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockRecentTransactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      tx.type === 'income' ? 'bg-success/10' : 'bg-destructive/10'
                    }`}
                  >
                    {tx.type === 'income' ? (
                      <ArrowUpRight className="w-5 h-5 text-success" />
                    ) : (
                      <ArrowDownRight className="w-5 h-5 text-destructive" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{tx.category}</p>
                    <p className="text-sm text-muted-foreground">
                      {tx.account} · {tx.time}
                    </p>
                  </div>
                </div>
                <span
                  className={`font-medium ${
                    tx.type === 'income' ? 'text-success' : 'text-destructive'
                  }`}
                >
                  {tx.type === 'income' ? '+' : '-'}
                  {formatCurrency(tx.amount)}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
