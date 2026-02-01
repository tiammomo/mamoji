'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLedgerStore } from '@/store/ledgerStore';
import { ledgerApi } from '@/lib/ledger-api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Users, Wallet } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { RoleBadge } from '@/components/ledger/role-badge';

export default function LedgersPage() {
  const router = useRouter();
  const { ledgers, currentLedgerId, switchLedger, setLedgers, isLoading, setLoading } = useLedgerStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && ledgers.length === 0) {
      fetchLedgers();
    }
  }, [mounted]);

  const fetchLedgers = async () => {
    setLoading(true);
    try {
      const response = await ledgerApi.list();
      if (response.code === 0) {
        setLedgers(response.data.ledgers, response.data.defaultLedgerId);
      } else {
        toast.error(response.message || '获取账本列表失败');
      }
    } catch (error) {
      toast.error('获取账本列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (ledgerId: number) => {
    switchLedger(ledgerId);
    router.push('/dashboard');
  };

  if (!mounted || isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">我的账本</h2>
        <Button onClick={() => router.push('/ledgers/create')}>
          <Plus className="mr-2 h-4 w-4" />
          创建账本
        </Button>
      </div>

      {ledgers.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-12">
          <CardContent className="text-center">
            <Wallet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">还没有账本</h3>
            <p className="text-muted-foreground mb-4">创建你的第一个账本开始记账</p>
            <Button onClick={() => router.push('/ledgers/create')}>
              <Plus className="mr-2 h-4 w-4" />
              创建账本
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {ledgers.map((ledger) => (
            <Card
              key={ledger.ledgerId}
              className={`cursor-pointer transition-shadow hover:shadow-md ${
                currentLedgerId === ledger.ledgerId ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => handleSelect(ledger.ledgerId)}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-medium">
                  {ledger.name}
                </CardTitle>
                <RoleBadge role={ledger.role} />
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>{ledger.memberCount} 人</span>
                  </div>
                  {ledger.isDefault && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                      默认
                    </span>
                  )}
                </div>
                {ledger.description && (
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                    {ledger.description}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
