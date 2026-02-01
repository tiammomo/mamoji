// ==================== Account Type Icons ====================

export const ACCOUNT_TYPE_ICONS: Record<string, string> = {
  bank: 'Building2',
  credit: 'CreditCard',
  cash: 'Banknote',
  alipay: 'Wallet',
  wechat: 'Smartphone',
  gold: 'Gem',
  fund_accumulation: 'PiggyBank',
  fund: 'TrendingUp',
  stock: 'LineChart',
  topup: 'Gift',
  debt: 'AlertCircle',
};

export const ACCOUNT_TYPE_COLORS: Record<string, string> = {
  bank: '#3b82f6',
  credit: '#ef4444',
  cash: '#22c55e',
  alipay: '#06b6d4',
  wechat: '#07c160',
  gold: '#f59e0b',
  fund_accumulation: '#8b5cf6',
  fund: '#10b981',
  stock: '#6366f1',
  topup: '#ec4899',
  debt: '#ef4444',
};

export const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  bank: '银行账户',
  credit: '信用卡',
  cash: '现金',
  alipay: '支付宝',
  wechat: '微信钱包',
  gold: '黄金',
  fund_accumulation: '公积金',
  fund: '基金',
  stock: '股票',
  topup: '储值卡',
  debt: '负债',
};

// ==================== Transaction Type Icons ====================

export const TRANSACTION_TYPE_ICONS: Record<string, string> = {
  income: 'ArrowUpCircle',
  expense: 'ArrowDownCircle',
  refund: 'RotateCcw',
  transfer: 'SwapHorizontal',
};

export const TRANSACTION_TYPE_COLORS: Record<string, string> = {
  income: '#22c55e',
  expense: '#ef4444',
  refund: '#3b82f6',
  transfer: '#8b5cf6',
};

export const TRANSACTION_TYPE_LABELS: Record<string, string> = {
  income: '收入',
  expense: '支出',
  refund: '退款',
  transfer: '转账',
};

// ==================== Category Icons ====================

export const CATEGORY_ICONS: Record<string, string> = {
  salary: 'Briefcase',
  bonus: 'Gift',
  investment: 'TrendingUp',
  parttime: 'Clock',
  gift: 'Heart',
  other_income: 'PlusCircle',
  food: 'Utensils',
  transport: 'Bus',
  shopping: 'ShoppingBag',
  entertainment: 'Film',
  housing: 'Home',
  communication: 'Phone',
  medical: 'Stethoscope',
  education: 'GraduationCap',
  travel: 'Plane',
  social: 'Users',
  investment_expense: 'PieChart',
  other_expense: 'MoreHorizontal',
  default: 'Tag',
};

export const CATEGORY_COLORS: Record<string, string> = {
  salary: '#22c55e',
  bonus: '#84cc16',
  investment: '#10b981',
  parttime: '#14b8a6',
  gift: '#06b6d4',
  other_income: '#0ea5e9',
  food: '#f97316',
  transport: '#3b82f6',
  shopping: '#ec4899',
  entertainment: '#8b5cf6',
  housing: '#f59e0b',
  communication: '#06b6d4',
  medical: '#ef4444',
  education: '#6366f1',
  travel: '#14b8a6',
  social: '#f43f5e',
  investment_expense: '#a855f7',
  other_expense: '#6b7280',
};

export const CATEGORY_LABELS: Record<string, string> = {
  salary: '工资',
  bonus: '奖金',
  investment: '投资收入',
  parttime: '兼职收入',
  gift: '礼金',
  other_income: '其他收入',
  food: '餐饮',
  transport: '交通',
  shopping: '购物',
  entertainment: '娱乐',
  housing: '居住',
  communication: '通讯',
  medical: '医疗',
  education: '教育',
  travel: '旅游',
  social: '人情',
  investment_expense: '理财',
  other_expense: '其他支出',
};

// ==================== Budget Status ====================

export const BUDGET_STATUS_COLORS: Record<number, string> = {
  0: '#6b7280',
  1: '#3b82f6',
  2: '#22c55e',
  3: '#ef4444',
};

export const BUDGET_STATUS_LABELS: Record<number, string> = {
  0: '已取消',
  1: '进行中',
  2: '已完成',
  3: '已超支',
};

// ==================== Utility Functions ====================

export function getAccountTypeIcon(type: string): string {
  return ACCOUNT_TYPE_ICONS[type] || 'Building2';
}

export function getAccountTypeColor(type: string): string {
  return ACCOUNT_TYPE_COLORS[type] || '#6b7280';
}

export function getAccountTypeLabel(type: string): string {
  return ACCOUNT_TYPE_LABELS[type] || type;
}

export function getTransactionTypeIcon(type: string): string {
  return TRANSACTION_TYPE_ICONS[type] || 'Circle';
}

export function getTransactionTypeColor(type: string): string {
  return TRANSACTION_TYPE_COLORS[type] || '#6b7280';
}

export function getTransactionTypeLabel(type: string): string {
  return TRANSACTION_TYPE_LABELS[type] || type;
}

export function getCategoryIcon(categoryKey: string): string {
  return CATEGORY_ICONS[categoryKey] || CATEGORY_LABELS[categoryKey] || 'Tag';
}

export function getCategoryColor(categoryKey: string): string {
  return CATEGORY_COLORS[categoryKey] || '#6b7280';
}

export function getCategoryLabel(categoryKey: string): string {
  return CATEGORY_LABELS[categoryKey] || categoryKey;
}

export function getBudgetStatusLabel(status: number): string {
  return BUDGET_STATUS_LABELS[status] || '未知';
}

export function getBudgetStatusColor(status: number): string {
  return BUDGET_STATUS_COLORS[status] || '#6b7280';
}

export function getTypeColorClass(type: 'income' | 'expense' | 'refund'): string {
  switch (type) {
    case 'income':
      return 'text-green-600 bg-green-50';
    case 'expense':
      return 'text-red-600 bg-red-50';
    case 'refund':
      return 'text-blue-600 bg-blue-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
}

export function getStatusColorClass(status: number): string {
  switch (status) {
    case 0:
      return 'text-gray-500 bg-gray-50';
    case 1:
      return 'text-blue-500 bg-blue-50';
    case 2:
      return 'text-green-500 bg-green-50';
    case 3:
      return 'text-red-500 bg-red-50';
    default:
      return 'text-gray-500 bg-gray-50';
  }
}
