'use client';

import { Header } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell } from 'lucide-react';

export default function NotificationsPage() {
  return (
    <div className="p-6 space-y-6">
      <Header
        title="消息通知"
        subtitle="查看系统通知和消息"
      />

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Bell className="w-12 h-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">暂无消息</p>
        </CardContent>
      </Card>
    </div>
  );
}
