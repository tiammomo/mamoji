'use client';

import { Header } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings as SettingsIcon } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="p-6 space-y-6">
      <Header
        title="系统设置"
        subtitle="管理账户和系统偏好设置"
      />

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <SettingsIcon className="w-12 h-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">系统设置功能开发中</p>
        </CardContent>
      </Card>
    </div>
  );
}
