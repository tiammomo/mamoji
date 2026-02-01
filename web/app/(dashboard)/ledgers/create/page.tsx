'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ledgerApi } from '@/lib/ledger-api';
import { useLedgerStore } from '@/store/ledgerStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { CreateLedgerRequest } from '@/types/ledger';
import Link from 'next/link';

export default function CreateLedgerPage() {
  const router = useRouter();
  const { addLedger } = useLedgerStore();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<CreateLedgerRequest>({
    name: '',
    description: '',
    currency: 'CNY',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('请输入账本名称');
      return;
    }

    setIsLoading(true);
    try {
      const response = await ledgerApi.create(formData);
      if (response.code === 0) {
        const newLedger = {
          ledgerId: response.data.ledgerId,
          name: formData.name,
          description: formData.description,
          ownerId: 0, // Will be set by backend
          isDefault: false,
          currency: formData.currency || 'CNY',
          role: 'owner' as const,
          memberCount: 1,
          createdAt: new Date().toISOString(),
        };
        addLedger(newLedger);
        toast.success('账本创建成功');
        router.push('/ledgers');
      } else {
        toast.error(response.message || '创建账本失败');
      }
    } catch (error) {
      toast.error('创建账本失败');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="mb-6">
        <Link
          href="/ledgers"
          className="flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          返回账本列表
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>创建账本</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">账本名称 *</Label>
              <Input
                id="name"
                placeholder="例如：家庭账本、个人账本"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">描述（可选）</Label>
              <Input
                id="description"
                placeholder="账本描述"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">货币</Label>
              <Select
                value={formData.currency}
                onValueChange={(value) =>
                  setFormData({ ...formData, currency: value })
                }
                disabled={isLoading}
              >
                <Input
                  id="currency"
                  value={formData.currency}
                  readOnly
                />
              </Select>
              <p className="text-xs text-muted-foreground">
                支持 CNY、USD、JPY、EUR 等常见货币
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  创建中...
                </>
              ) : (
                '创建账本'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
