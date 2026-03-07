import { z } from 'zod';

// 交易验证 schema
export const transactionSchema = z.object({
  type: z.number().min(1).max(4),
  amount: z.number().positive('金额必须大于0'),
  categoryId: z.number().positive('请选择分类'),
  accountId: z.number().optional(),
  date: z.string().min(1, '请选择日期'),
  remark: z.string().max(500, '备注过长').optional(),
});

// 账户验证 schema
export const accountSchema = z.object({
  name: z.string().min(1, '名称不能为空').max(50, '名称过长'),
  type: z.string().min(1, '请选择账户类型'),
  balance: z.number().default(0),
  includeInNetWorth: z.boolean().default(true),
});

// 预算验证 schema
export const budgetSchema = z.object({
  name: z.string().min(1, '名称不能为空').max(100, '名称过长'),
  amount: z.number().positive('预算金额必须大于0'),
  startDate: z.string().min(1, '请选择开始日期'),
  endDate: z.string().min(1, '请选择结束日期'),
  categoryId: z.number().optional(),
  warningThreshold: z.number().min(50).max(100).default(80),
});

// 定期交易验证 schema
export const recurringTransactionSchema = z.object({
  name: z.string().min(1, '名称不能为空').max(100, '名称过长'),
  type: z.number().min(1).max(4),
  amount: z.number().positive('金额必须大于0'),
  recurrenceType: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']),
  dayOfMonth: z.number().min(1).max(31).optional(),
  dayOfWeek: z.number().min(1).max(7).optional(),
  startDate: z.string().min(1, '请选择开始日期'),
  endDate: z.string().optional(),
  remark: z.string().max(500, '备注过长').optional(),
});

// 登录验证 schema
export const loginSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(6, '密码至少6位'),
});

// 注册验证 schema
export const registerSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(6, '密码至少6位'),
  nickname: z.string().min(1, '请输入昵称').max(50, '昵称过长'),
});

// 分类验证 schema
export const categorySchema = z.object({
  name: z.string().min(1, '名称不能为空').max(50, '名称过长'),
  icon: z.string().max(50, '图标无效'),
  color: z.string().max(20, '颜色无效'),
  type: z.number().min(1).max(2),
});

// 收据验证 schema
export const receiptSchema = z.object({
  description: z.string().max(500, '描述过长').optional(),
  amount: z.number().positive().optional(),
  merchant: z.string().max(200, '商户名称过长').optional(),
  date: z.string().optional(),
});

// 导出具名 schema
export const exportSchema = z.object({
  format: z.enum(['json', 'excel']).default('json'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  includeTransactions: z.boolean().default(true),
  includeAccounts: z.boolean().default(true),
  includeBudgets: z.boolean().default(true),
  includeCategories: z.boolean().default(true),
});

// 类型导出
export type TransactionFormData = z.infer<typeof transactionSchema>;
export type AccountFormData = z.infer<typeof accountSchema>;
export type BudgetFormData = z.infer<typeof budgetSchema>;
export type RecurringTransactionFormData = z.infer<typeof recurringTransactionSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type CategoryFormData = z.infer<typeof categorySchema>;
export type ReceiptFormData = z.infer<typeof receiptSchema>;
export type ExportFormData = z.infer<typeof exportSchema>;

// 表单验证辅助函数
export function validateForm<T>(schema: z.ZodSchema<T>, data: unknown): {
  success: boolean;
  data?: T;
  errors?: Record<string, string>;
} {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors: Record<string, string> = {};
  result.error.issues.forEach((issue) => {
    const path = issue.path.join('.');
    errors[path] = issue.message;
  });

  return { success: false, errors };
}
