'use client';

import { Header } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Plus } from 'lucide-react';

export default function AssetsPage() {
  return (
    <div className="pt-2 px-4 pb-4 space-y-4">
      <Header
        title="资产管理"
        subtitle="管理您的固定资产和无形资产"
      />

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Building2 className="w-12 h-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">资产管理功能开发中</p>
          <Button className="mt-4" disabled>
            <Plus className="w-4 h-4 mr-2" />
            添加资产
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
