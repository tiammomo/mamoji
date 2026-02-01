'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ledgerApi } from '@/lib/ledger-api';
import { CreateInvitationRequest, Invitation } from '@/types/ledger';
import { Copy, Link, Clock, Users } from 'lucide-react';
import { toast } from 'sonner';
import { LEDGER_ROLE_OPTIONS } from '@/lib/constants';

interface InviteModalProps {
  children: React.ReactNode;
  ledgerId: number;
  onSuccess?: () => void;
}

export function InviteModal({ children, ledgerId, onSuccess }: InviteModalProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [formData, setFormData] = useState<CreateInvitationRequest>({
    role: 'editor',
    maxUses: 10,
  });

  const handleCreate = async () => {
    setIsLoading(true);
    try {
      const response = await ledgerApi.createInvitation(ledgerId, formData);
      if (response.code === 0) {
        setInvitation(response.data);
        toast.success('邀请链接已创建');
      } else {
        toast.error(response.message || '创建邀请失败');
      }
    } catch (error: any) {
      toast.error(error.message || '创建邀请失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!invitation) return;
    await navigator.clipboard.writeText(invitation.inviteUrl);
    toast.success('链接已复制到剪贴板');
  };

  const handleClose = () => {
    setOpen(false);
    setInvitation(null);
    onSuccess?.();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>邀请成员</DialogTitle>
          <DialogDescription>
            创建一个邀请链接，分享给家人或朋友一起记账
          </DialogDescription>
        </DialogHeader>

        {!invitation ? (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>默认角色</Label>
              <Select
                value={formData.role}
                onValueChange={(value) =>
                  setFormData({ ...formData, role: value as any })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LEDGER_ROLE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                被邀请人加入账本后的默认角色
              </p>
            </div>

            <div className="space-y-2">
              <Label>使用次数限制</Label>
              <Input
                type="number"
                value={formData.maxUses}
                onChange={(e) =>
                  setFormData({ ...formData, maxUses: parseInt(e.target.value) || 0 })
                }
                min={0}
                placeholder="0 表示无限"
              />
              <p className="text-xs text-muted-foreground">
                0 = 无限次数，设置为具体数字后超过次数链接失效
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="rounded-lg bg-muted p-4">
              <div className="flex items-center gap-2 mb-2">
                <Link className="h-4 w-4" />
                <span className="font-medium">邀请链接</span>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={invitation.inviteUrl}
                  className="flex-1"
                />
                <Button variant="outline" size="icon" onClick={handleCopy}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>
                  已使用 {invitation.usedCount}/{invitation.maxUses || '∞'}
                </span>
              </div>
              {invitation.expiresAt && (
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>
                    过期于 {new Date(invitation.expiresAt).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {invitation ? '完成' : '取消'}
          </Button>
          {!invitation && (
            <Button onClick={handleCreate} disabled={isLoading}>
              {isLoading ? '创建中...' : '创建邀请链接'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
