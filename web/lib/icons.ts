/**
 * 账户和交易类型标签映射
 * 提供账户类型和交易类型的中文标签转换
 */

/**
 * 获取账户类型的中文标签
 * @param type 账户类型 (bank, credit, cash, mobile, investment)
 * @return 中文标签
 */
export function getAccountTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    bank: '银行账户',
    credit: '信用卡',
    cash: '现金',
    mobile: '移动支付',
    investment: '投资账户',
  };
  return labels[type] || type;
}

/**
 * 获取交易类型的中文标签
 * @param type 交易类型 (income, expense)
 * @return 中文标签
 */
export function getTransactionTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    income: '收入',
    expense: '支出',
  };
  return labels[type] || type;
}
