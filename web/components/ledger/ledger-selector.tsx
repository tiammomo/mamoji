'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useLedgerStore } from '@/store/ledgerStore';
import { ledgerApi } from '@/lib/ledger-api';
import { Loader2, Wallet } from 'lucide-react';

export function LedgerSelector() {
  const router = useRouter();
  const {
    ledgers,
    currentLedgerId,
    currentLedger,
    setLedgers,
    switchLedger,
    isLoading,
    setLoading,
  } = useLedgerStore();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (ledgers.length === 0) {
      fetchLedgers();
    }
  }, []);

  const fetchLedgers = async () => {
    setLoading(true);
    try {
      const response = await ledgerApi.list();
      if (response.code === 0) {
        setLedgers(response.data.ledgers, response.data.defaultLedgerId);
      }
    } catch (error) {
      console.error('Failed to fetch ledgers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSwitch = (ledgerId: string) => {
    if (ledgerId === 'create') {
      router.push('/ledgers/create');
      return;
    }
    const id = parseInt(ledgerId);
    switchLedger(id);
    router.refresh();
  };

  if (!mounted || isLoading) {
    return (
      <div className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm text-muted-foreground">加载中...</span>
      </div>
    );
  }

  if (ledgers.length === 0) {
    return (
      <button
        onClick={() => router.push('/ledgers/create')}
        className="flex items-center gap-2 text-sm text-primary hover:underline"
      >
        <Wallet className="h-4 w-4" />
        创建账本
      </button>
    );
  }

  return (
    <Select
      value={currentLedgerId?.toString()}
      onValueChange={handleSwitch}
    >
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="选择账本" />
      </SelectTrigger>
      <SelectContent>
        {ledgers.map((ledger) => (
          <SelectItem key={ledger.ledgerId} value={ledger.ledgerId.toString()}>
            <div className="flex items-center gap-2">
              <span>{ledger.name}</span>
              {ledger.isDefault && (
                <span className="text-xs text-muted-foreground">(默认)</span>
              )}
            </div>
          </SelectItem>
        ))}
        <SelectItem value="create" className="text-primary font-medium">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            <span>+ 创建账本</span>
          </div>
        </SelectItem>
      </SelectContent>
    </Select>
  );
}
