// 账本角色常量
export const LEDGER_ROLES = {
  owner: { label: '所有者', color: 'bg-yellow-100 text-yellow-800' },
  admin: { label: '管理员', color: 'bg-blue-100 text-blue-800' },
  editor: { label: '编辑者', color: 'bg-green-100 text-green-800' },
  viewer: { label: '查看者', color: 'bg-gray-100 text-gray-800' },
} as const;

export type LedgerRole = keyof typeof LEDGER_ROLES;

// 权限映射
export const ROLE_PERMISSIONS = {
  canManageMembers: ['owner', 'admin'] as const,
  canInvite: ['owner', 'admin'] as const,
  canEditData: ['owner', 'admin', 'editor'] as const,
  canDeleteData: ['owner', 'admin'] as const,
  canDeleteLedger: ['owner'] as const,
} as const;

// 账本角色选项
export const LEDGER_ROLE_OPTIONS = [
  { value: 'admin', label: '管理员' },
  { value: 'editor', label: '编辑者' },
  { value: 'viewer', label: '查看者' },
] as const;

// 交易类型
export const TRANSACTION_TYPES = {
  INCOME: { label: '收入', value: 'income' },
  EXPENSE: { label: '支出', value: 'expense' },
} as const;

// 日期格式
export const DATE_FORMATS = {
  DISPLAY: 'YYYY年M月D日',
  API: 'YYYY-MM-DD',
  MONTH: 'YYYY-MM',
} as const;

// 分页默认配置
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_SIZE: 10,
  MAX_SIZE: 100,
} as const;
