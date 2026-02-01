'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ledgerApi } from '@/lib/ledger-api';
import { useLedgerStore } from '@/store/ledgerStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function JoinPage({ params }: { params: { code: string } }) {
  const router = useRouter();
  const { addLedger, setCurrentLedger } = useLedgerStore();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ledgerName, setLedgerName] = useState<string | null>(null);

  useEffect(() => {
    // 先尝试获取邀请信息预览
    // 由于后端没有预览接口，直接尝试加入
    setIsLoading(false);
  }, []);

  const handleJoin = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await ledgerApi.joinByInvitation(params.code);
      if (response.code === 0) {
        toast.success('加入成功');

        // 获取账本信息并添加到列表
        const ledgerRes = await ledgerApi.get(response.data.ledgerId);
        if (ledgerRes.code === 0) {
          addLedger(ledgerRes.data);
          setCurrentLedger(ledgerRes.data);
        }

        router.push('/dashboard');
      } else {
        setError(response.message || '加入失败');
      }
    } catch (err: any) {
      setError(err.message || '加入失败，请确认邀请链接是否有效');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen items-center justify-center bg-muted/50">
      <Card className="w-[400px]">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">加入账本</CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="flex flex-col items-center text-center">
              <AlertCircle className="h-12 w-12 text-destructive mb-4" />
              <h2 className="text-xl font-semibold mb-2">无法加入账本</h2>
              <p className="text-muted-foreground mb-6">{error}</p>
              <Button variant="outline" onClick={() => router.push('/login')}>
                返回登录
              </Button>
            </div>
          ) : (
            <>
              <div className="flex flex-col items-center text-center mb-6">
                <CheckCircle className="h-16 w-16 text-primary mb-4" />
                <h3 className="text-lg font-medium">你收到一个账本邀请</h3>
                <p className="text-muted-foreground">
                  点击下方按钮加入账本，开始共同记账
                </p>
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={handleJoin}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    加入中...
                  </>
                ) : (
                  '加入账本'
                )}
              </Button>

              <p className="text-center text-sm text-muted-foreground mt-4">
                已有账号？{' '}
                <a href="/login" className="text-primary hover:underline">
                  登录后加入
                </a>
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
