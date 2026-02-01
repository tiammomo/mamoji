'use client';

import { useState } from 'react';
import { useLedgerStore } from '@/store/ledgerStore';
import { ledgerApi } from '@/lib/ledger-api';
import { ROLE_PERMISSIONS } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { UserPlus, Trash2, Crown, Shield, Pen, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { LedgerMember, LedgerRole } from '@/types/ledger';
import { RoleBadge } from './role-badge';

interface MemberListProps {
  ledgerId: number;
  members: LedgerMember[];
  onRefresh: () => void;
}

const ROLE_ICONS: Record<LedgerRole, typeof Crown> = {
  owner: Crown,
  admin: Shield,
  editor: Pen,
  viewer: Eye,
};

export function MemberList({ ledgerId, members, onRefresh }: MemberListProps) {
  const { currentLedger } = useLedgerStore();
  const [editingMember, setEditingMember] = useState<LedgerMember | null>(null);
  const [removingMember, setRemovingMember] = useState<LedgerMember | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const canManage = currentLedger?.role &&
    ROLE_PERMISSIONS.canManageMembers.includes(currentLedger.role as any);

  const handleUpdateRole = async (userId: number, newRole: LedgerRole) => {
    setIsLoading(true);
    try {
      const response = await ledgerApi.updateMemberRole(ledgerId, userId, newRole);
      if (response.code === 0) {
        toast.success('角色更新成功');
        onRefresh();
      } else {
        toast.error(response.message || '角色更新失败');
      }
    } catch (error: any) {
      toast.error(error.message || '角色更新失败');
    } finally {
      setIsLoading(false);
      setEditingMember(null);
    }
  };

  const handleRemoveMember = async () => {
    if (!removingMember) return;

    setIsLoading(true);
    try {
      const response = await ledgerApi.removeMember(ledgerId, removingMember.userId);
      if (response.code === 0) {
        toast.success('成员已移除');
        onRefresh();
      } else {
        toast.error(response.message || '移除成员失败');
      }
    } catch (error: any) {
      toast.error(error.message || '移除成员失败');
    } finally {
      setIsLoading(false);
      setRemovingMember(null);
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            成员列表
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {members.map((member) => {
              const Icon = ROLE_ICONS[member.role];
              const isSelf = member.userId === currentLedger?.ledgerId;

              return (
                <div
                  key={member.memberId}
                  className="flex items-center justify-between py-3 border-b last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{member.username}</span>
                        {isSelf && (
                          <span className="text-xs text-muted-foreground">(我)</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <RoleBadge role={member.role} />
                        <span className="text-xs text-muted-foreground">
                          加入于 {new Date(member.joinedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {canManage && member.role !== 'owner' && (
                    <div className="flex items-center gap-2">
                      <Select
                        value={member.role}
                        onValueChange={(value) =>
                          handleUpdateRole(member.userId, value as LedgerRole)
                        }
                      >
                        <SelectTrigger className="w-28">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">管理员</SelectItem>
                          <SelectItem value="editor">编辑者</SelectItem>
                          <SelectItem value="viewer">查看者</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => setRemovingMember(member)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 移除成员确认对话框 */}
      <Dialog open={!!removingMember} onOpenChange={() => setRemovingMember(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认移除成员</DialogTitle>
            <DialogDescription>
              确定要移除成员 {removingMember?.username} 吗？移除后该成员将无法访问此账本的数据。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemovingMember(null)}>
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={handleRemoveMember}
              disabled={isLoading}
            >
              移除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
