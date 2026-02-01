import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ==================== Formatting Functions ====================

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

export function formatDate(
  date: string | Date,
  format: string = 'YYYY-MM-DD',
  locale: string = 'zh-CN'
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');

  return format
    .replace('YYYY', String(year))
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
}

// ==================== Date Range Functions ====================

export function getMonthRange(date: Date = new Date()) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);
  return { start, end };
}

export function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

// Date range preset type
export type DateRangePreset = 'today' | 'week' | 'month' | 'year' | 'last7days' | 'last30days' | 'last90days' | 'all';

// Date range preset configuration
export const DATE_PRESETS: { key: DateRangePreset; label: string; shortLabel: string }[] = [
  { key: 'today', label: '今天', shortLabel: '今天' },
  { key: 'week', label: '本周', shortLabel: '本周' },
  { key: 'month', label: '本月', shortLabel: '本月' },
  { key: 'year', label: '本年', shortLabel: '本年' },
  { key: 'last7days', label: '最近7天', shortLabel: '7天' },
  { key: 'last30days', label: '最近30天', shortLabel: '30天' },
  { key: 'last90days', label: '最近90天', shortLabel: '90天' },
  { key: 'all', label: '全部', shortLabel: '全部' },
];

// Get date range from preset
export function getDateRangeFromPreset(preset: DateRangePreset): { startDate: string; endDate: string } | null {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (preset) {
    case 'today':
      return {
        startDate: formatDate(today, 'YYYY-MM-DD'),
        endDate: formatDate(today, 'YYYY-MM-DD'),
      };
    case 'week': {
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());
      return {
        startDate: formatDate(weekStart, 'YYYY-MM-DD'),
        endDate: formatDate(today, 'YYYY-MM-DD'),
      };
    }
    case 'month': {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      return {
        startDate: formatDate(monthStart, 'YYYY-MM-DD'),
        endDate: formatDate(today, 'YYYY-MM-DD'),
      };
    }
    case 'year': {
      const yearStart = new Date(now.getFullYear(), 0, 1);
      return {
        startDate: formatDate(yearStart, 'YYYY-MM-DD'),
        endDate: formatDate(today, 'YYYY-MM-DD'),
      };
    }
    case 'last7days': {
      const last7 = new Date(today);
      last7.setDate(today.getDate() - 6);
      return {
        startDate: formatDate(last7, 'YYYY-MM-DD'),
        endDate: formatDate(today, 'YYYY-MM-DD'),
      };
    }
    case 'last30days': {
      const last30 = new Date(today);
      last30.setDate(today.getDate() - 29);
      return {
        startDate: formatDate(last30, 'YYYY-MM-DD'),
        endDate: formatDate(today, 'YYYY-MM-DD'),
      };
    }
    case 'last90days': {
      const last90 = new Date(today);
      last90.setDate(today.getDate() - 89);
      return {
        startDate: formatDate(last90, 'YYYY-MM-DD'),
        endDate: formatDate(today, 'YYYY-MM-DD'),
      };
    }
    case 'all':
      return null;
    default:
      return null;
  }
}

// ==================== Utility Functions ====================

export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 100 * 100) / 100;
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
