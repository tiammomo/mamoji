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
  createdAt: string;
}

// 账本列表响应
export interface LedgerListResponse {
  ledgers: Ledger[];
  defaultLedgerId: number;
}

// 账本成员
export interface LedgerMember {
  memberId: number;
  userId: number;
  username: string;
  role: LedgerRole;
  joinedAt: string;
  invitedBy?: number;
  invitedByUsername?: string;
}

// 邀请
export interface Invitation {
  inviteCode: string;
  inviteUrl: string;
  role: LedgerRole;
  maxUses: number;
  usedCount: number;
  expiresAt?: string;
  createdAt: string;
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

// 更新角色请求
export interface UpdateMemberRoleRequest {
  role: LedgerRole;
}

// 加入账本响应
export interface JoinLedgerResponse {
  ledgerId: number;
}
