# 账本功能前端实现指南

## 1. 新增文件结构

```
web/
├── app/
│   ├── (auth)/
│   │   └── join/
│   │       └── [code]/
│   │           └── page.tsx          # 加入账本页面
│   └── (dashboard)/
│       └── ledgers/
│           ├── page.tsx              # 账本列表页
│           ├── create/
│           │   └── page.tsx          # 创建账本页
│           └── [id]/
│               ├── page.tsx          # 账本设置页
│               └── members/
│                   └── page.tsx      # 成员管理页
├── components/
│   └── ledger/
│       ├── ledger-selector.tsx       # 账本切换器
│       ├── ledger-list.tsx           # 账本列表
│       ├── member-list.tsx           # 成员列表
│       ├── member-item.tsx           # 成员项
│       ├── invite-modal.tsx          # 邀请模态框
│       ├── invite-item.tsx           # 邀请项
│       ├── join-form.tsx             # 加入账本表单
│       ├── role-badge.tsx            # 角色徽章
│       ├── create-ledger-form.tsx    # 创建账本表单
│       └── ledger-settings-form.tsx  # 账本设置表单
├── context/
│   └── LedgerContext.tsx             # 账本上下文
├── hooks/
│   └── useLedger.ts                  # 账本 Hook
├── lib/
│   └── constants.ts                  # 新增角色常量
├── types/
│   └── ledger.ts                     # 账本类型定义
└── store/
    └── ledgerStore.ts                # 账本状态管理 (Zustand)
```

## 2. 类型定义

### 2.1 types/ledger.ts
```typescript
// 角色类型
export type LedgerRole = 'owner' | 'admin' | 'editor' | 'viewer';

// 账本
export interface Ledger {
  ledgerId: number;
  name: string;
  description?: string;
  ownerId: number;
  isDefault: boolean;
  currency: string;
  role: LedgerRole;
  memberCount: number;
}

// 账本成员
export interface LedgerMember {
  memberId: number;
  userId: number;
  username: string;
  role: LedgerRole;
  joinedAt: string;
  invitedBy?: number;
}

// 邀请
export interface Invitation {
  inviteCode: string;
  inviteUrl: string;
  role: LedgerRole;
  maxUses: number;
  usedCount: number;
  expiresAt?: string;
}

// 创建账本请求
export interface CreateLedgerRequest {
  name: string;
  description?: string;
  currency?: string;
}

// 创建邀请请求
export interface CreateInvitationRequest {
  role: LedgerRole;
  maxUses?: number;
  expiresAt?: string;
}

// 账本列表响应
export interface LedgerListResponse {
  ledgers: Ledger[];
  defaultLedgerId: number;
}

// 更新角色请求
export interface UpdateMemberRoleRequest {
  role: LedgerRole;
}
```

### 2.2 lib/constants.ts (新增)
```typescript
// 账本角色
export const LEDGER_ROLES = {
  owner: { label: '所有者', color: 'bg-yellow-100 text-yellow-800' },
  admin: { label: '管理员', color: 'bg-blue-100 text-blue-800' },
  editor: { label: '编辑者', color: 'bg-green-100 text-green-800' },
  viewer: { label: '查看者', color: 'bg-gray-100 text-gray-800' },
} as const;

export type LedgerRole = keyof typeof LEDGER_ROLES;

// 权限映射
export const ROLE_PERMISSIONS = {
  canManageMembers: ['owner', 'admin'],
  canInvite: ['owner', 'admin'],
  canEditData: ['owner', 'admin', 'editor'],
  canDeleteData: ['owner', 'admin'],
  canDeleteLedger: ['owner'],
} as const;
```

## 3. 状态管理

### 3.1 store/ledgerStore.ts (Zustand)
```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Ledger } from '@/types/ledger';

interface LedgerState {
  // 当前选中的账本
  currentLedgerId: number | null;
  currentLedger: Ledger | null;
  // 账本列表
  ledgers: Ledger[];
  // 是否加载中
  isLoading: boolean;

  // Actions
  setLedgers: (ledgers: Ledger[], defaultId?: number) => void;
  setCurrentLedger: (ledgerId: number) => void;
  switchLedger: (ledgerId: number) => void;
  addLedger: (ledger: Ledger) => void;
  updateLedger: (ledgerId: number, data: Partial<Ledger>) => void;
  removeLedger: (ledgerId: number) => void;
  setLoading: (loading: boolean) => void;
}

export const useLedgerStore = create<LedgerState>()(
  persist(
    (set, get) => ({
      currentLedgerId: null,
      currentLedger: null,
      ledgers: [],
      isLoading: false,

      setLedgers: (ledgers, defaultId) => {
        const defaultLedger = defaultId
          ? ledgers.find(l => l.ledgerId === defaultId)
          : ledgers.find(l => l.isDefault) || ledgers[0];

        set({
          ledgers,
          currentLedgerId: defaultLedger?.ledgerId || null,
          currentLedger: defaultLedger || null,
        });
      },

      setCurrentLedger: (ledgerId) => {
        const ledger = get().ledgers.find(l => l.ledgerId === ledgerId);
        set({
          currentLedgerId: ledgerId,
          currentLedger: ledger || null,
        });
      },

      switchLedger: (ledgerId) => {
        const { ledgers } = get();
        const ledger = ledgers.find(l => l.ledgerId === ledgerId);
        if (ledger) {
          set({
            currentLedgerId: ledgerId,
            currentLedger: ledger,
          });
        }
      },

      addLedger: (ledger) => {
        set((state) => ({
          ledgers: [...state.ledgers, ledger],
        }));
      },

      updateLedger: (ledgerId, data) => {
        set((state) => ({
          ledgers: state.ledgers.map(l =>
            l.ledgerId === ledgerId ? { ...l, ...data } : l
          ),
          currentLedger: state.currentLedgerId === ledgerId
            ? { ...state.currentLedger, ...data }
            : state.currentLedger,
        }));
      },

      removeLedger: (ledgerId) => {
        set((state) => ({
          ledgers: state.ledgers.filter(l => l.ledgerId !== ledgerId),
          currentLedgerId: state.currentLedgerId === ledgerId
            ? state.ledgers[0]?.ledgerId || null
            : state.currentLedgerId,
          currentLedger: state.currentLedgerId === ledgerId
            ? state.ledgers[0] || null
            : state.currentLedger,
        }));
      },

      setLoading: (loading) => set({ isLoading: loading }),
    }),
    {
      name: 'ledger-storage',
      partialize: (state) => ({
        currentLedgerId: state.currentLedgerId,
      }),
    }
  )
);
```

## 4. API 层修改

### 4.1 lib/api.ts (修改)
```typescript
import axios from 'axios';
import { useLedgerStore } from '@/store/ledgerStore';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

// 请求拦截器：自动添加当前账本ID
api.interceptors.request.use((config) => {
  // 从 Zustand store 获取当前账本ID
  // 注意: 在客户端组件中使用，需要在组件层面处理
  const ledgerId = useLedgerStore.getState().currentLedgerId;
  if (ledgerId) {
    config.headers['X-Ledger-Id'] = ledgerId.toString();
  }
  return config;
});

export default api;

// 新增账本相关 API
export const ledgerApi = {
  list: () => api.get<LedgerListResponse>('/ledgers'),

  get: (id: number) => api.get<Ledger>(`/ledgers/${id}`),

  create: (data: CreateLedgerRequest) =>
    api.post<{ ledgerId: number }>('/ledgers', data),

  update: (id: number, data: Partial<CreateLedgerRequest>) =>
    api.put(`/ledgers/${id}`, data),

  delete: (id: number) => api.delete(`/ledgers/${id}`),

  setDefault: (id: number) => api.put(`/ledgers/${id}/default`),

  // 成员管理
  listMembers: (id: number) =>
    api.get<LedgerMember[]>(`/ledgers/${id}/members`),

  updateMemberRole: (id: number, userId: number, role: LedgerRole) =>
    api.put(`/ledgers/${id}/members/${userId}/role`, { role }),

  removeMember: (id: number, userId: number) =>
    api.delete(`/ledgers/${id}/members/${userId}`),

  quit: (id: number) => api.delete(`/ledgers/${id}/members/me`),

  // 邀请管理
  createInvitation: (id: number, data: CreateInvitationRequest) =>
    api.post<Invitation>(`/ledgers/${id}/invitations`, data),

  listInvitations: (id: number) =>
    api.get<Invitation[]>(`/ledgers/${id}/invitations`),

  revokeInvitation: (id: number, code: string) =>
    api.delete(`/ledgers/${id}/invitations/${code}`),

  joinByInvitation: (code: string) =>
    api.post<{ ledgerId: number }>(`/invitations/${code}/join`),
};
```

## 5. 核心组件

### 5.1 components/ledger/ledger-selector.tsx
```tsx
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
import { ledgerApi } from '@/lib/api';
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
    fetchLedgers();
  }, []);

  const fetchLedgers = async () => {
    setLoading(true);
    try {
      const response = await ledgerApi.list();
      setLedgers(response.data.ledgers, response.data.defaultLedgerId);
    } catch (error) {
      console.error('Failed to fetch ledgers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSwitch = (ledgerId: string) => {
    const id = parseInt(ledgerId);
    switchLedger(id);
    // 刷新当前页面数据
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
        <SelectItem value="create" className="text-primary">
          <div className="flex items-center gap-2">
            <span>+ 创建账本</span>
          </div>
        </SelectItem>
      </SelectContent>
    </Select>
  );
}
```

### 5.2 components/ledger/ledger-list.tsx
```tsx
'use client';

import { useRouter } from 'next/navigation';
import { useLedgerStore } from '@/store/ledgerStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Users } from 'lucide-react';
import { LedgerBadge } from './ledger-badge';

export function LedgerList() {
  const router = useRouter();
  const { ledgers, currentLedgerId, switchLedger } = useLedgerStore();

  const handleSelect = (ledgerId: number) => {
    switchLedger(ledgerId);
    router.push('/dashboard');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">我的账本</h2>
        <Button onClick={() => router.push('/ledgers/create')}>
          <Plus className="mr-2 h-4 w-4" />
          创建账本
        </Button>
      </div>

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
              <LedgerBadge role={ledger.role} />
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
    </div>
  );
}
```

### 5.3 components/ledger/member-list.tsx
```tsx
'use client';

import { useState } from 'react';
import { useLedgerStore } from '@/store/ledgerStore';
import { ledgerApi } from '@/lib/api';
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

const ROLE_ICONS = {
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
    ROLE_PERMISSIONS.canManageMembers.includes(currentLedger.role);

  const handleUpdateRole = async (userId: number, newRole: LedgerRole) => {
    setIsLoading(true);
    try {
      await ledgerApi.updateMemberRole(ledgerId, userId, newRole);
      toast.success('角色更新成功');
      onRefresh();
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
      await ledgerApi.removeMember(ledgerId, removingMember.userId);
      toast.success('成员已移除');
      onRefresh();
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
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            成员列表
          </CardTitle>
          {canManage && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/ledgers/${ledgerId}/invite`)}
            >
              邀请成员
            </Button>
          )}
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
```

### 5.4 components/ledger/invite-modal.tsx
```tsx
'use client';

import { useState } from 'react';
import { useLedgerStore } from '@/store/ledgerStore';
import { ledgerApi } from '@/lib/api';
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
import { Copy, Link, Clock, Users } from 'lucide-react';
import { toast } from 'sonner';
import { CreateInvitationRequest, Invitation } from '@/types/ledger';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
    expiresAt: '',
  });

  const handleCreate = async () => {
    setIsLoading(true);
    try {
      const response = await ledgerApi.createInvitation(ledgerId, formData);
      setInvitation(response.data);
      toast.success('邀请链接已创建');
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
                onValueChange={(value) => setFormData({ ...formData, role: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="editor">编辑者</SelectItem>
                  <SelectItem value="viewer">查看者</SelectItem>
                  <SelectItem value="admin">管理员</SelectItem>
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
                onChange={(e) => setFormData({ ...formData, maxUses: parseInt(e.target.value) })}
                min={0}
                placeholder="0 表示无限"
              />
              <p className="text-xs text-muted-foreground">
                0 = 无限次数，设置为具体数字后超过次数链接失效
              </p>
            </div>

            <div className="space-y-2">
              <Label>过期时间（可选）</Label>
              <Input
                type="datetime-local"
                value={formData.expiresAt}
                onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                不设置则永不过期
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
```

## 6. 页面实现

### 6.1 app/(dashboard)/ledgers/page.tsx
```tsx
'use client';

import { useEffect, useState } from 'react';
import { useLedgerStore } from '@/store/ledgerStore';
import { ledgerApi } from '@/lib/api';
import { Loader2 } from 'lucide-react';
import { LedgerList } from '@/components/ledger/ledger-list';

export default function LedgersPage() {
  const { ledgers, setLoading, isLoading } = useLedgerStore();

  useEffect(() => {
    if (ledgers.length === 0) {
      setLoading(true);
      ledgerApi.list()
        .then((res) => setLedgers(res.data.ledgers, res.data.defaultLedgerId))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return <LedgerList />;
}
```

### 6.2 app/(auth)/join/[code]/page.tsx
```tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ledgerApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function JoinPage({ params }: { params: { code: string } }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [invitation, setInvitation] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    validateInvitation();
  }, []);

  const validateInvitation = async () => {
    try {
      // 先获取邀请信息
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/invitations/${params.code}/preview`
      );
      const data = await response.json();

      if (data.code === 0) {
        setInvitation(data.data);
      } else {
        setError(data.message || '邀请链接无效');
      }
    } catch (err) {
      setError('验证邀请失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoin = async () => {
    setIsLoading(true);
    try {
      await ledgerApi.joinByInvitation(params.code);
      toast.success('加入成功');
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.message || '加入失败');
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

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Card className="w-[400px]">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <AlertCircle className="h-12 w-12 text-destructive mb-4" />
              <h2 className="text-xl font-semibold mb-2">邀请链接无效</h2>
              <p className="text-muted-foreground">{error}</p>
              <Button className="mt-6" onClick={() => router.push('/login')}>
                返回登录
              </Button>
            </div>
          </CardContent>
        </Card>
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
          <div className="flex flex-col items-center text-center mb-6">
            <CheckCircle className="h-16 w-16 text-primary mb-4" />
            <h3 className="text-lg font-medium">{invitation?.ledgerName}</h3>
            <p className="text-muted-foreground">
              你被邀请加入这个账本，成为「{invitation?.roleText}」
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
        </CardContent>
      </Card>
    </div>
  );
}
```

## 7. 侧边栏集成

### 7.1 app/(dashboard)/layout.tsx 修改
```tsx
'use client';

import { Sidebar } from '@/components/sidebar';
import { Header } from '@/components/header';
import { LedgerSelector } from '@/components/ledger/ledger-selector';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header>
          {/* 在 Header 右侧添加账本切换器 */}
          <div className="flex items-center gap-4">
            <LedgerSelector />
          </div>
        </Header>
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
```

## 8. 迁移指南

### 8.1 登录后初始化账本
```typescript
// app/login/page.tsx 修改
const handleLogin = async (data: LoginRequest) => {
  try {
    const response = await login(data);
    setToken(response.data.token);

    // 获取账本列表并设置默认账本
    const ledgerResponse = await ledgerApi.list();
    if (ledgerResponse.data.ledgers.length > 0) {
      useLedgerStore.getState().setLedgers(
        ledgerResponse.data.ledgers,
        ledgerResponse.data.defaultLedgerId
      );
    }

    router.push('/dashboard');
  } catch (error) {
    // 处理错误
  }
};
```

### 8.2 所有页面数据请求添加账本ID
```typescript
// 在各页面的 useEffect 中
const { currentLedgerId } = useLedgerStore();

useEffect(() => {
  if (!currentLedgerId) return;

  fetchTransactions(currentLedgerId);
  // ...
}, [currentLedgerId]);
```
