import api from './api';
import {
  Ledger,
  LedgerListResponse,
  LedgerMember,
  Invitation,
  CreateLedgerRequest,
  CreateInvitationRequest,
  JoinLedgerResponse,
} from '@/types/ledger';

// 账本 API
export const ledgerApi = {
  // 获取账本列表
  list: () =>
    api.get<{ code: number; message: string; data: LedgerListResponse }>(
      '/ledgers'
    ),

  // 获取账本详情
  get: (id: number) =>
    api.get<{ code: number; message: string; data: Ledger }>(
      `/ledgers/${id}`
    ),

  // 创建账本
  create: (data: CreateLedgerRequest) =>
    api.post<{ code: number; message: string; data: { ledgerId: number } }>(
      '/ledgers',
      data
    ),

  // 更新账本
  update: (id: number, data: Partial<CreateLedgerRequest>) =>
    api.put<{ code: number; message: string }>(`/ledgers/${id}`, data),

  // 删除账本
  delete: (id: number) =>
    api.delete<{ code: number; message: string }>(`/ledgers/${id}`),

  // 设置默认账本
  setDefault: (id: number) =>
    api.put<{ code: number; message: string }>(`/ledgers/${id}/default`),

  // 成员管理
  listMembers: (id: number) =>
    api.get<{ code: number; message: string; data: LedgerMember[] }>(
      `/ledgers/${id}/members`
    ),

  updateMemberRole: (id: number, userId: number, role: string) =>
    api.put<{ code: number; message: string }>(
      `/ledgers/${id}/members/${userId}/role`,
      { role }
    ),

  removeMember: (id: number, userId: number) =>
    api.delete<{ code: number; message: string }>(
      `/ledgers/${id}/members/${userId}`
    ),

  quit: (id: number) =>
    api.delete<{ code: number; message: string }>(
      `/ledgers/${id}/members/me`
    ),

  // 邀请管理
  createInvitation: (id: number, data: CreateInvitationRequest) =>
    api.post<{ code: number; message: string; data: Invitation }>(
      `/ledgers/${id}/invitations`,
      data
    ),

  listInvitations: (id: number) =>
    api.get<{ code: number; message: string; data: Invitation[] }>(
      `/ledgers/${id}/invitations`
    ),

  revokeInvitation: (id: number, code: string) =>
    api.delete<{ code: number; message: string }>(
      `/ledgers/${id}/invitations/${code}`
    ),

  // 使用邀请码加入账本
  joinByInvitation: (code: string) =>
    api.post<{ code: number; message: string; data: JoinLedgerResponse }>(
      `/invitations/${code}/join`
    ),
};
