'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ledgerApi } from '@/lib/ledger-api';
import { useLedgerStore } from '@/store/ledgerStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ArrowLeft, Users, Settings, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { MemberList } from '@/components/ledger/member-list';
import { InviteModal } from '@/components/ledger/invite-modal';
import { Ledger, LedgerMember } from '@/types/ledger';
import Link from 'next/link';

export default function LedgerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const ledgerId = parseInt(params.id as string);
  const { currentLedger, switchLedger } = useLedgerStore();

  const [ledger, setLedger] = useState<Ledger | null>(null);
  const [members, setMembers] = useState<LedgerMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLedgerData();
  }, [ledgerId]);

  const fetchLedgerData = async () => {
    setIsLoading(true);
    try {
      const [ledgerRes, membersRes] = await Promise.all([
        ledgerApi.get(ledgerId),
        ledgerApi.listMembers(ledgerId),
      ]);

      if (ledgerRes.code === 0) {
        setLedger(ledgerRes.data);
        switchLedger(ledgerId);
      } else {
        toast.error(ledgerRes.message || '获取账本信息失败');
        router.push('/ledgers');
      }

      if (membersRes.code === 0) {
        setMembers(membersRes.data);
      }
    } catch (error) {
      toast.error('获取账本信息失败');
      router.push('/ledgers');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteLedger = async () => {
    if (!confirm('确定要删除这个账本吗？此操作不可恢复。')) {
      return;
    }

    try {
      const response = await ledgerApi.delete(ledgerId);
      if (response.code === 0) {
        toast.success('账本已删除');
        router.push('/ledgers');
      } else {
        toast.error(response.message || '删除账本失败');
      }
    } catch (error) {
      toast.error('删除账本失败');
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!ledger) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">账本不存在</p>
      </div>
    );
  }

  const isOwner = ledger.role === 'owner';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/ledgers"
            className="flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回
          </Link>
          <h2 className="text-2xl font-bold">{ledger.name}</h2>
        </div>
        {isOwner && (
          <Button variant="destructive" onClick={handleDeleteLedger}>
            <Trash2 className="mr-2 h-4 w-4" />
            删除账本
          </Button>
        )}
      </div>

      {ledger.description && (
        <p className="text-muted-foreground">{ledger.description}</p>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">成员数量</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ledger.memberCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">我的角色</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{ledger.role}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">货币</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ledger.currency}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <InviteModal ledgerId={ledgerId} onSuccess={fetchLedgerData}>
          <Button>
            <Users className="mr-2 h-4 w-4" />
            邀请成员
          </Button>
        </InviteModal>
      </div>

      <MemberList
        ledgerId={ledgerId}
        members={members}
        onRefresh={fetchLedgerData}
      />
    </div>
  );
}
