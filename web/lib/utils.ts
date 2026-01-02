import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * 合并Tailwind CSS类名
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 格式化金额
 */
export function formatCurrency(
  amount: number,
  currency: string = 'CNY',
  locale: string = 'zh-CN'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * 格式化百分比
 */
export function formatPercent(value: number, decimals: number = 2): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`;
}

/**
 * 格式化数字（千分位）
 */
export function formatNumber(
  value: number,
  decimals: number = 0
): string {
  return new Intl.NumberFormat('zh-CN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * 格式化日期
 */
export function formatDate(
  date: Date | string,
  format: 'YYYY-MM-DD' | 'YYYY/MM/DD' | 'MM-DD' | 'HH:mm' | '完整' = 'YYYY-MM-DD'
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');

  switch (format) {
    case 'YYYY-MM-DD':
      return `${year}-${month}-${day}`;
    case 'YYYY/MM/DD':
      return `${year}/${month}/${day}`;
    case 'MM-DD':
      return `${month}-${day}`;
    case 'HH:mm':
      return `${hours}:${minutes}`;
    case '完整':
      return `${year}年${month}月${day}日 ${hours}:${minutes}`;
    default:
      return `${year}-${month}-${day}`;
  }
}

/**
 * 相对时间（如：3分钟前）
 */
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diff = now.getTime() - d.getTime();

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}天前`;
  if (hours > 0) return `${hours}小时前`;
  if (minutes > 0) return `${minutes}分钟前`;
  return '刚刚';
}

/**
 * 生成唯一ID
 */
export function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 深度克隆对象
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * 金额大写
 */
export function amountToChinese(amount: number): string {
  const units = ['', '拾', '佰', '仟', '万', '拾', '佰', '仟', '亿', '拾', '佰', '仟'];
  const nums = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖'];

  const integerPart = Math.floor(amount);
  const decimalPart = Math.round((amount - integerPart) * 100);

  let result = '';
  let integerStr = String(integerPart);
  let length = integerStr.length;

  for (let i = 0; i < length; i++) {
    const digit = parseInt(integerStr[i]);
    if (digit === 0) {
      if (i < length - 1 && parseInt(integerStr[i + 1]) !== 0) {
        result += '零';
      }
    } else {
      result += nums[digit] + units[length - i - 1];
    }
  }

  if (decimalPart > 0) {
    result += '元';
    const decimalStr = String(decimalPart).padStart(2, '0');
    result += nums[parseInt(decimalStr[0])] + '角' + nums[parseInt(decimalStr[1])] + '分';
  } else {
    result += '元整';
  }

  // 如果整数部分全为零，添加"零"前缀
  if (result === '元整') {
    return '零元整';
  }

  return result || '零元整';
}

/**
 * 计算收益率
 */
export function calculateReturnRate(
  currentValue: number,
  principal: number
): number {
  if (principal === 0) return 0;
  return ((currentValue - principal) / principal) * 100;
}

/**
 * 计算年化收益率
 */
export function calculateAnnualizedReturn(
  currentValue: number,
  principal: number,
  days: number
): number {
  if (principal === 0 || days === 0) return 0;
  const totalReturn = (currentValue - principal) / principal;
  const annualizedReturn = Math.pow(1 + totalReturn, 365 / days) - 1;
  return annualizedReturn * 100;
}

/**
 * 导出数据为CSV格式
 */
export function downloadCSV(data: Record<string, unknown>[]): string {
  if (data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(','),
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = row[header];
          const stringValue = String(value ?? '');
          // 如果包含逗号、引号或换行符，需要用引号包裹并转义
          if (
            stringValue.includes(',') ||
            stringValue.includes('"') ||
            stringValue.includes('\n')
          ) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        })
        .join(',')
    ),
  ];

  return csvRows.join('\n');
}

/**
 * 触发文件下载
 */
export function triggerDownload(
  content: string,
  filename: string,
  mimeType: string = 'text/csv;charset=utf-8;'
): void {
  const blob = new Blob([content], { type: mimeType });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}
