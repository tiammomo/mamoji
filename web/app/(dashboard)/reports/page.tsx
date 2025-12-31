'use client';

import { Header } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, Download } from 'lucide-react';

export default function ReportsPage() {
  return (
    <div className="pt-2 px-4 pb-4 space-y-4">
      <Header
        title="报表统计"
        subtitle="查看财务数据分析和报表"
      />

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <BarChart3 className="w-12 h-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">报表统计功能开发中</p>
          <Button className="mt-4" disabled>
            <Download className="w-4 h-4 mr-2" />
            导出报表
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
