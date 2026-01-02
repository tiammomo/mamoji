/**
 * 资产大类分类
 * fund - 资金账户
 * credit - 信用卡账户
 * topup - 充值账户
 * investment - 投资理财账户
 * debt - 债务
 */
export const ASSET_CATEGORY = {
  FUND: 'fund',         // 资金账户
  CREDIT: 'credit',     // 信用卡账户
  TOPUP: 'topup',       // 充值账户
  INVESTMENT: 'investment', // 投资理财账户
  DEBT: 'debt',         // 债务
} as const;

export type AssetCategory = typeof ASSET_CATEGORY[keyof typeof ASSET_CATEGORY];

export const ASSET_CATEGORY_LABELS: Record<AssetCategory, string> = {
  [ASSET_CATEGORY.FUND]: '资金账户',
  [ASSET_CATEGORY.CREDIT]: '信用卡',
  [ASSET_CATEGORY.TOPUP]: '充值账户',
  [ASSET_CATEGORY.INVESTMENT]: '投资理财',
  [ASSET_CATEGORY.DEBT]: '债务',
};

/**
 * 资产子类型 - 资金账户
 */
export const FUND_SUB_TYPE = {
  CASH: 'cash',           // 现金
  WECHAT: 'wechat',       // 微信
  ALIPAY: 'alipay',       // 支付宝
  BANK: 'bank',           // 银行卡
  HOUSING_FUND: 'housing_fund', // 公积金
  MEDICAL_FUND: 'medical_fund', // 医保
  OTHER: 'other',         // 其他
} as const;

export type FundSubType = typeof FUND_SUB_TYPE[keyof typeof FUND_SUB_TYPE];

export const FUND_SUB_TYPE_LABELS: Record<FundSubType, string> = {
  [FUND_SUB_TYPE.CASH]: '现金',
  [FUND_SUB_TYPE.WECHAT]: '微信钱包',
  [FUND_SUB_TYPE.ALIPAY]: '支付宝',
  [FUND_SUB_TYPE.BANK]: '储蓄卡',
  [FUND_SUB_TYPE.HOUSING_FUND]: '公积金',
  [FUND_SUB_TYPE.MEDICAL_FUND]: '医保',
  [FUND_SUB_TYPE.OTHER]: '其他',
};

/**
 * 资产子类型 - 信用卡账户
 */
export const CREDIT_SUB_TYPE = {
  BANK_CARD: 'bank_card',   // 银行信用卡
  HUABEI: 'huabei',         // 花呗
  OTHER: 'other',           // 其他
} as const;

export type CreditSubType = typeof CREDIT_SUB_TYPE[keyof typeof CREDIT_SUB_TYPE];

export const CREDIT_SUB_TYPE_LABELS: Record<CreditSubType, string> = {
  [CREDIT_SUB_TYPE.BANK_CARD]: '银行信用卡',
  [CREDIT_SUB_TYPE.HUABEI]: '花呗',
  [CREDIT_SUB_TYPE.OTHER]: '其他',
};

/**
 * 银行列表
 */
export const BANK_LIST = [
  { value: 'icbc', label: '中国工商银行' },
  { value: 'abc', label: '中国农业银行' },
  { value: 'boc', label: '中国银行' },
  { value: 'ccb', label: '中国建设银行' },
  { value: 'cmb', label: '招商银行' },
  { value: 'psbc', label: '中国邮政储蓄银行' },
  { value: 'citic', label: '中信银行' },
  { value: 'cib', label: '兴业银行' },
  { value: 'cmbc', label: '民生银行' },
  { value: 'spdb', label: '浦发银行' },
  { value: 'gdb', label: '广发银行' },
  { value: 'pab', label: '平安银行' },
  { value: 'bofc', label: '中国光大银行' },
  { value: 'hxb', label: '华夏银行' },
  { value: 'bob', label: '北京银行' },
  { value: 'shbank', label: '上海银行' },
  { value: 'other', label: '其他银行' },
] as const;

export type BankCode = typeof BANK_LIST[number]['value'];

/**
 * 资产子类型 - 充值账户
 */
export const TOPUP_SUB_TYPE = {
  MEAL_CARD: 'meal_card',     // 饭卡
  DEPOSIT: 'deposit',         // 押金
  BUS_CARD: 'bus_card',       // 公交卡
  MEMBER_CARD: 'member_card', // 会员卡
  GAS_CARD: 'gas_card',       // 加油卡
  PHONE_CARD: 'phone_card',   // 话费
  OTHER: 'other',             // 其他
} as const;

export type TopupSubType = typeof TOPUP_SUB_TYPE[keyof typeof TOPUP_SUB_TYPE];

export const TOPUP_SUB_TYPE_LABELS: Record<TopupSubType, string> = {
  [TOPUP_SUB_TYPE.MEAL_CARD]: '饭卡',
  [TOPUP_SUB_TYPE.DEPOSIT]: '押金',
  [TOPUP_SUB_TYPE.BUS_CARD]: '公交卡',
  [TOPUP_SUB_TYPE.MEMBER_CARD]: '会员卡',
  [TOPUP_SUB_TYPE.GAS_CARD]: '加油卡',
  [TOPUP_SUB_TYPE.PHONE_CARD]: '话费',
  [TOPUP_SUB_TYPE.OTHER]: '其他',
};

/**
 * 资产子类型 - 投资理财账户
 */
export const INVESTMENT_SUB_TYPE = {
  STOCK: 'stock',           // 股票
  FUND: 'fund',             // 基金
  GOLD: 'gold',             // 黄金
  FOREX: 'forex',           // 外汇
  FUTURES: 'futures',       // 期货
  BOND: 'bond',             // 债券
  REGULAR: 'regular',       // 固定收益
  CRYPTO: 'crypto',         // 加密货币
  OTHER: 'other',           // 其他理财
} as const;

export type InvestmentSubType = typeof INVESTMENT_SUB_TYPE[keyof typeof INVESTMENT_SUB_TYPE];

export const INVESTMENT_SUB_TYPE_LABELS: Record<InvestmentSubType, string> = {
  [INVESTMENT_SUB_TYPE.STOCK]: '股票',
  [INVESTMENT_SUB_TYPE.FUND]: '基金',
  [INVESTMENT_SUB_TYPE.GOLD]: '黄金',
  [INVESTMENT_SUB_TYPE.FOREX]: '外汇',
  [INVESTMENT_SUB_TYPE.FUTURES]: '期货',
  [INVESTMENT_SUB_TYPE.BOND]: '债券',
  [INVESTMENT_SUB_TYPE.REGULAR]: '固定收益',
  [INVESTMENT_SUB_TYPE.CRYPTO]: '加密货币',
  [INVESTMENT_SUB_TYPE.OTHER]: '其他理财',
};

/**
 * 资产子类型 - 债务
 */
export const DEBT_SUB_TYPE = {
  LEND: 'lend',   // 借出
  BORROW: 'borrow', // 借入
} as const;

export type DebtSubType = typeof DEBT_SUB_TYPE[keyof typeof DEBT_SUB_TYPE];

export const DEBT_SUB_TYPE_LABELS: Record<DebtSubType, string> = {
  [DEBT_SUB_TYPE.LEND]: '借出',
  [DEBT_SUB_TYPE.BORROW]: '借入',
};

/**
 * 获取所有子类型选项
 */
export function getSubTypeOptions(category: AssetCategory): Record<string, string> {
  switch (category) {
    case ASSET_CATEGORY.FUND:
      return FUND_SUB_TYPE_LABELS as Record<string, string>;
    case ASSET_CATEGORY.CREDIT:
      return CREDIT_SUB_TYPE_LABELS as Record<string, string>;
    case ASSET_CATEGORY.TOPUP:
      return TOPUP_SUB_TYPE_LABELS as Record<string, string>;
    case ASSET_CATEGORY.INVESTMENT:
      return INVESTMENT_SUB_TYPE_LABELS as Record<string, string>;
    case ASSET_CATEGORY.DEBT:
      return DEBT_SUB_TYPE_LABELS as Record<string, string>;
    default:
      return {};
  }
}

/**
 * 账户类型（旧版，保留兼容）
 * @deprecated 请使用 ASSET_CATEGORY 和子类型
 */
export const ACCOUNT_TYPE = {
  WECHAT: 'wechat',
  ALIPAY: 'alipay',
  BANK: 'bank',
  CREDIT_CARD: 'credit_card',
  CASH: 'cash',
  OTHER: 'other',
} as const;

export type AccountType = typeof ACCOUNT_TYPE[keyof typeof ACCOUNT_TYPE];

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  [ACCOUNT_TYPE.WECHAT]: '微信钱包',
  [ACCOUNT_TYPE.ALIPAY]: '支付宝',
  [ACCOUNT_TYPE.BANK]: '银行卡',
  [ACCOUNT_TYPE.CREDIT_CARD]: '信用卡',
  [ACCOUNT_TYPE.CASH]: '现金',
  [ACCOUNT_TYPE.OTHER]: '其他账户',
};

/**
 * 银行卡类型
 */
export const BANK_CARD_TYPE = {
  TYPE1: 'type1',
  TYPE2: 'type2',
} as const;

export type BankCardType = typeof BANK_CARD_TYPE[keyof typeof BANK_CARD_TYPE];

export const BANK_CARD_TYPE_LABELS: Record<BankCardType, string> = {
  [BANK_CARD_TYPE.TYPE1]: '一类卡',
  [BANK_CARD_TYPE.TYPE2]: '二类卡',
};

/**
 * 交易类型
 */
export const TRANSACTION_TYPE = {
  INCOME: 'income',
  EXPENSE: 'expense',
} as const;

export type TransactionType = typeof TRANSACTION_TYPE[keyof typeof TRANSACTION_TYPE];

/**
 * 收入分类
 */
export const INCOME_CATEGORY = {
  MAIN_BUSINESS: 'main_business', // 主营业务收入
  SIDE_BUSINESS: 'side_business', // 副业收入
  ECOMMERCE: 'ecommerce',         // 电商销售收入
  INVESTMENT: 'investment',       // 投资收益
  OTHER: 'other',                 // 其他收入
} as const;

export type IncomeCategory = typeof INCOME_CATEGORY[keyof typeof INCOME_CATEGORY];

export const INCOME_CATEGORY_LABELS: Record<IncomeCategory, string> = {
  [INCOME_CATEGORY.MAIN_BUSINESS]: '主营业务收入',
  [INCOME_CATEGORY.SIDE_BUSINESS]: '副业收入',
  [INCOME_CATEGORY.ECOMMERCE]: '电商销售收入',
  [INCOME_CATEGORY.INVESTMENT]: '投资收益',
  [INCOME_CATEGORY.OTHER]: '其他收入',
};

/**
 * 支出分类
 */
export const EXPENSE_CATEGORY = {
  OPERATING_COST: 'operating_cost', // 经营成本
  PURCHASE_COST: 'purchase_cost',   // 进货成本
  PLATFORM_FEE: 'platform_fee',     // 平台抽佣
  ADVERTISING: 'advertising',       // 投流费用
  PARTNER_SHARE: 'partner_share',   // 合作分成
  SALARY: 'salary',                 // 人员薪酬
  OFFICE: 'office',                 // 办公费用
  OTHER: 'other',                   // 其他支出
} as const;

export type ExpenseCategory = typeof EXPENSE_CATEGORY[keyof typeof EXPENSE_CATEGORY];

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  [EXPENSE_CATEGORY.OPERATING_COST]: '经营成本',
  [EXPENSE_CATEGORY.PURCHASE_COST]: '进货成本',
  [EXPENSE_CATEGORY.PLATFORM_FEE]: '平台抽佣',
  [EXPENSE_CATEGORY.ADVERTISING]: '投流费用',
  [EXPENSE_CATEGORY.PARTNER_SHARE]: '合作分成',
  [EXPENSE_CATEGORY.SALARY]: '人员薪酬',
  [EXPENSE_CATEGORY.OFFICE]: '办公费用',
  [EXPENSE_CATEGORY.OTHER]: '其他支出',
};

/**
 * 记账单元类型
 */
export const ACCOUNTING_UNIT_TYPE = {
  BUSINESS: 'business',           // 纯业务
  DOMESTIC_ECOMMERCE: 'domestic_ecommerce', // 国内电商
  CROSS_BORDER_ECOMMERCE: 'cross_border_ecommerce', // 跨境电商
  ASSET: 'asset',                 // 公司资产
  INVESTMENT: 'investment',       // 投资项目
} as const;

export type AccountingUnitType = typeof ACCOUNTING_UNIT_TYPE[keyof typeof ACCOUNTING_UNIT_TYPE];

export const ACCOUNTING_UNIT_TYPE_LABELS: Record<AccountingUnitType, string> = {
  [ACCOUNTING_UNIT_TYPE.BUSINESS]: '纯业务单元',
  [ACCOUNTING_UNIT_TYPE.DOMESTIC_ECOMMERCE]: '国内电商',
  [ACCOUNTING_UNIT_TYPE.CROSS_BORDER_ECOMMERCE]: '跨境电商',
  [ACCOUNTING_UNIT_TYPE.ASSET]: '公司资产',
  [ACCOUNTING_UNIT_TYPE.INVESTMENT]: '投资项目',
};

/**
 * 企业角色
 */
export const ENTERPRISE_ROLE = {
  SUPER_ADMIN: 'super_admin',
  FINANCE_ADMIN: 'finance_admin',
  NORMAL: 'normal',
  READONLY: 'readonly',
} as const;

export type EnterpriseRole = typeof ENTERPRISE_ROLE[keyof typeof ENTERPRISE_ROLE];

export const ENTERPRISE_ROLE_LABELS: Record<EnterpriseRole, string> = {
  [ENTERPRISE_ROLE.SUPER_ADMIN]: '超级管理员',
  [ENTERPRISE_ROLE.FINANCE_ADMIN]: '财务管理员',
  [ENTERPRISE_ROLE.NORMAL]: '普通成员',
  [ENTERPRISE_ROLE.READONLY]: '只读成员',
};

/**
 * 单元权限级别
 */
export const PERMISSION_LEVEL = {
  VIEW: 'view',
  EDIT: 'edit',
  MANAGE: 'manage',
} as const;

export type PermissionLevel = typeof PERMISSION_LEVEL[keyof typeof PERMISSION_LEVEL];

export const PERMISSION_LEVEL_LABELS: Record<PermissionLevel, string> = {
  [PERMISSION_LEVEL.VIEW]: '查看',
  [PERMISSION_LEVEL.EDIT]: '编辑',
  [PERMISSION_LEVEL.MANAGE]: '管理',
};

/**
 * 预算类型
 */
export const BUDGET_TYPE = {
  MONTHLY: 'monthly',
  YEARLY: 'yearly',
  PROJECT: 'project',
} as const;

export type BudgetType = typeof BUDGET_TYPE[keyof typeof BUDGET_TYPE];

export const BUDGET_TYPE_LABELS: Record<BudgetType, string> = {
  [BUDGET_TYPE.MONTHLY]: '月度预算',
  [BUDGET_TYPE.YEARLY]: '年度预算',
  [BUDGET_TYPE.PROJECT]: '项目预算',
};

/**
 * 预算状态
 */
export const BUDGET_STATUS = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  EXCEEDED: 'exceeded',
  ENDED: 'ended',
} as const;

export type BudgetStatus = typeof BUDGET_STATUS[keyof typeof BUDGET_STATUS];

export const BUDGET_STATUS_LABELS: Record<BudgetStatus, string> = {
  [BUDGET_STATUS.DRAFT]: '草稿',
  [BUDGET_STATUS.ACTIVE]: '生效中',
  [BUDGET_STATUS.EXCEEDED]: '已超支',
  [BUDGET_STATUS.ENDED]: '已结束',
};

/**
 * 审批状态
 */
export const APPROVAL_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

export type ApprovalStatus = typeof APPROVAL_STATUS[keyof typeof APPROVAL_STATUS];

export const APPROVAL_STATUS_LABELS: Record<ApprovalStatus, string> = {
  [APPROVAL_STATUS.PENDING]: '待审批',
  [APPROVAL_STATUS.APPROVED]: '已通过',
  [APPROVAL_STATUS.REJECTED]: '已拒绝',
};

/**
 * 投资产品类型
 */
export const INVESTMENT_PRODUCT_TYPE = {
  STOCK: 'stock',       // 股票
  FUND: 'fund',         // 基金
  GOLD: 'gold',         // 黄金
  SILVER: 'silver',     // 白银
  BOND: 'bond',         // 债券
  REGULAR: 'regular',   // 定期存款
  OTHER: 'other',       // 其他
} as const;

export type InvestmentProductType = typeof INVESTMENT_PRODUCT_TYPE[keyof typeof INVESTMENT_PRODUCT_TYPE];

export const INVESTMENT_PRODUCT_TYPE_LABELS: Record<InvestmentProductType, string> = {
  [INVESTMENT_PRODUCT_TYPE.STOCK]: '股票',
  [INVESTMENT_PRODUCT_TYPE.FUND]: '基金',
  [INVESTMENT_PRODUCT_TYPE.GOLD]: '黄金',
  [INVESTMENT_PRODUCT_TYPE.SILVER]: '白银',
  [INVESTMENT_PRODUCT_TYPE.BOND]: '债券',
  [INVESTMENT_PRODUCT_TYPE.REGULAR]: '定期存款',
  [INVESTMENT_PRODUCT_TYPE.OTHER]: '其他',
};

/**
 * 投资记录类型
 */
export const INVEST_RECORD_TYPE = {
  BUY: 'buy',         // 买入
  SELL: 'sell',       // 卖出
  PROFIT: 'profit',   // 收益更新
  DIVIDEND: 'dividend', // 分红
  INTEREST: 'interest', // 利息
} as const;

export type InvestRecordType = typeof INVEST_RECORD_TYPE[keyof typeof INVEST_RECORD_TYPE];

/**
 * 通知类型
 */
export const NOTIFICATION_TYPE = {
  BUDGET_APPLY: 'budget_apply',
  BUDGET_APPROVED: 'budget_approved',
  BUDGET_REJECTED: 'budget_rejected',
  BUDGET_WARNING: 'budget_warning',
  BUDGET_EXCEEDED: 'budget_exceeded',
  LARGE_EXPENSE: 'large_expense',
  INVEST_REMINDER: 'invest_reminder',
  REGULAR_DUE: 'regular_due',
  DAILY_REPORT: 'daily_report',
} as const;

export type NotificationType = typeof NOTIFICATION_TYPE[keyof typeof NOTIFICATION_TYPE];

/**
 * 推送类型
 */
export const PUSH_TYPE = {
  EMAIL: 'email',
  WECHAT: 'wechat',
  DINGTALK: 'dingtalk',
} as const;

export type PushType = typeof PUSH_TYPE[keyof typeof PUSH_TYPE];

/**
 * 资产类型
 */
export const ASSET_TYPE = {
  FIXED: 'fixed',           // 固定资产
  INTANGIBLE: 'intangible', // 无形资产
  LONG_TERM_INVEST: 'long_term_invest', // 长期投资
} as const;

export type AssetType = typeof ASSET_TYPE[keyof typeof ASSET_TYPE];

/**
 * 资产子类型
 */
export const ASSET_SUB_TYPE = {
  OFFICE_EQUIPMENT: 'office_equipment', // 办公设备
  VEHICLE: 'vehicle',                   // 交通工具
  BUILDING: 'building',                 // 厂房仓库
  TRADEMARK: 'trademark',               // 商标专利
  PATENT: 'patent',                     // 专利
  COPYRIGHT: 'copyright',               // 软件版权
} as const;

export type AssetSubType = typeof ASSET_SUB_TYPE[keyof typeof ASSET_SUB_TYPE];

/**
 * 折旧方法
 */
export const DEPRECIATION_METHOD = {
  STRAIGHT_LINE: 'straight_line',
  DECLINING_BALANCE: 'declining_balance',
} as const;

export type DepreciationMethod = typeof DEPRECIATION_METHOD[keyof typeof DEPRECIATION_METHOD];

/**
 * 分页默认值
 */
export const DEFAULT_PAGE_SIZE = 20;
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

/**
 * Token Key
 */
export const TOKEN_KEY = 'mamoji_token';
export const USER_INFO_KEY = 'mamoji_user_info';

/**
 * 默认头像
 */
export const DEFAULT_AVATAR = '/default-avatar.png';
