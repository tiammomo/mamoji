'use client';

import { useState } from 'react';
import { Header } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  RefreshCw,
  MoreVertical,
} from 'lucide-react';
import { formatCurrency, formatPercent, calculateReturnRate } from '@/lib/utils';
import {
  INVESTMENT_PRODUCT_TYPE,
  INVESTMENT_PRODUCT_TYPE_LABELS,
} from '@/lib/constants';

// 模拟投资数据
const mockInvestments = [
  {
    investmentId: 1,
    name: '贵州茅台',
    productType: 'stock',
    productCode: '600519.SH',
    principal: 45000,
    currentValue: 50625,
    quantity: 100,
    costPrice: 450,
    currentPrice: 506.25,
    lastUpdatedAt: '2024-01-10',
    reminderDays: 3,
    status: 1,
  },
  {
    investmentId: 2,
    name: '易方达蓝筹精选',
    productType: 'fund',
    productCode: '005827',
    principal: 32000,
    currentValue: 30976,
    quantity: 15000,
    costPrice: 2.1333,
    currentPrice: 2.0651,
    lastUpdatedAt: '2024-01-05',
    reminderDays: 7,
    status: 1,
  },
  {
    investmentId: 3,
    name: '华安黄金ETF',
    productType: 'gold',
    productCode: '518880',
    principal: 14000,
    currentValue: 14805,
    quantity: 500,
    costPrice: 28,
    currentPrice: 29.61,
    lastUpdatedAt: '2024-01-08',
    reminderDays: 7,
    status: 1,
  },
  {
    investmentId: 4,
    name: '招商银行定期存款',
    productType: 'regular',
    principal: 50000,
    currentValue: 51250,
    startDate: '2023-07-01',
    endDate: '2024-07-01',
    interestRate: 2.5,
    lastUpdatedAt: '2024-01-01',
    reminderDays: 30,
    status: 1,
  },
];

export default function InvestmentsPage() {
  const [investments, setInvestments] = useState(mockInvestments);
  const [activeTab, setActiveTab] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const filteredInvestments = investments.filter((inv) => {
    if (activeTab === 'all') return true;
    return inv.productType === activeTab;
  });

  const totalPrincipal = investments.reduce((sum, inv) => sum + inv.principal, 0);
  const totalCurrentValue = investments.reduce((sum, inv) => sum + inv.currentValue, 0);
  const totalProfit = totalCurrentValue - totalPrincipal;
  const totalReturnRate = calculateReturnRate(totalCurrentValue, totalPrincipal);

  const getDaysSinceUpdate = (lastUpdated: string) => {
    const last = new Date(lastUpdated);
    const now = new Date();
    return Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="pt-2 px-4 pb-4 space-y-4">
      <Header title="理财收益" subtitle="管理投资组合和收益" />

      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              总本金
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalPrincipal)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              当前市值
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalCurrentValue)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              总收益
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                totalProfit >= 0 ? 'text-success' : 'text-destructive'
              }`}
            >
              {totalProfit >= 0 ? '+' : ''}
              {formatCurrency(totalProfit)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              收益率
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                totalReturnRate >= 0 ? 'text-success' : 'text-destructive'
              }`}
            >
              {formatPercent(totalReturnRate)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">全部</TabsTrigger>
            <TabsTrigger value="stock">股票</TabsTrigger>
            <TabsTrigger value="fund">基金</TabsTrigger>
            <TabsTrigger value="gold">黄金</TabsTrigger>
            <TabsTrigger value="regular">定期</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          添加投资
        </Button>
      </div>

      {/* Investment Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {filteredInvestments.map((inv) => {
          const profit = inv.currentValue - inv.principal;
          const returnRate = calculateReturnRate(inv.currentValue, inv.principal);
          const daysSinceUpdate = getDaysSinceUpdate(inv.lastUpdatedAt);
          const needsUpdate = daysSinceUpdate >= inv.reminderDays;

          return (
            <Card key={inv.investmentId}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{inv.name}</CardTitle>
                      <Badge variant="secondary">
                        {INVESTMENT_PRODUCT_TYPE_LABELS[inv.productType as keyof typeof INVESTMENT_PRODUCT_TYPE_LABELS]}
                      </Badge>
                    </div>
                    {inv.productCode && (
                      <p className="text-sm text-muted-foreground">{inv.productCode}</p>
                    )}
                  </div>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Value Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">当前市值</p>
                    <p className="text-xl font-bold">{formatCurrency(inv.currentValue)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">收益</p>
                    <div className={`flex items-center gap-1 ${profit >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {profit >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      <span className="font-bold">{formatCurrency(Math.abs(profit))}</span>
                      <span className="text-sm">({formatPercent(returnRate)})</span>
                    </div>
                  </div>
                </div>

                {/* Position Info */}
                {inv.quantity && (
                  <div className="flex justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <p className="text-sm text-muted-foreground">持仓数量</p>
                      <p className="font-medium">{inv.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">成本价</p>
                      <p className="font-medium">{inv.costPrice}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">当前价</p>
                      <p className="font-medium">{inv.currentPrice}</p>
                    </div>
                  </div>
                )}

                {/* Regular Deposit Info */}
                {inv.productType === 'regular' && inv.interestRate && (
                  <div className="flex justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <p className="text-sm text-muted-foreground">利率</p>
                      <p className="font-medium">{inv.interestRate}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">起息日</p>
                      <p className="font-medium">{inv.startDate}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">到期日</p>
                      <p className="font-medium">{inv.endDate}</p>
                    </div>
                  </div>
                )}

                {/* Update Warning */}
                {needsUpdate && (
                  <div className="flex items-center justify-between p-3 bg-warning/10 border border-warning/20 rounded-lg">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-warning" />
                      <span className="text-sm text-warning">
                        已 {daysSinceUpdate} 天未更新市值
                      </span>
                    </div>
                    <Button variant="outline" size="sm">
                      <RefreshCw className="w-3 h-3 mr-1" />
                      更新
                    </Button>
                  </div>
                )}

                {/* Last Updated */}
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>最后更新: {inv.lastUpdatedAt}</span>
                  <Button variant="ghost" size="sm">
                    <RefreshCw className="w-3 h-3 mr-1" />
                    更新市值
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Add Investment Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加投资</DialogTitle>
            <DialogDescription>添加新的投资产品</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">投资名称</Label>
              <Input id="name" placeholder="如：贵州茅台" />
            </div>
            <div className="space-y-2">
              <Label>产品类型</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="选择类型" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(INVESTMENT_PRODUCT_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">产品代码</Label>
              <Input id="code" placeholder="如：600519.SH" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="principal">投入本金</Label>
              <Input id="principal" type="number" placeholder="0.00" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reminder">更新提醒周期(天)</Label>
              <Input id="reminder" type="number" placeholder="7" defaultValue="7" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={() => setIsDialogOpen(false)}>添加</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
