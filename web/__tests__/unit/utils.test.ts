import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { getAccountTypeLabel, getTransactionTypeLabel } from '@/lib/icons';

describe('Utils', () => {
  describe('cn', () => {
    it('should merge class names', () => {
      expect(cn('foo', 'bar')).toBe('foo bar');
    });

    it('should handle conditional classes', () => {
      expect(cn('base', true && 'conditional')).toBe('base conditional');
      expect(cn('base', false && 'conditional')).toBe('base');
    });

    it('should handle tailwind merge', () => {
      expect(cn('px-2 p-4')).toBe('p-4');
    });
  });

  describe('formatCurrency', () => {
    it('should format CNY currency correctly', () => {
      expect(formatCurrency(1000, 'CNY', 'zh-CN')).toContain('1,000');
    });

    it('should format zero correctly', () => {
      expect(formatCurrency(0, 'CNY', 'zh-CN')).toContain('0');
    });

    it('should format negative numbers', () => {
      expect(formatCurrency(-100, 'CNY', 'zh-CN')).toContain('100');
    });
  });

  describe('formatDate', () => {
    it('should format date with default format', () => {
      const date = new Date('2024-01-15');
      const result = formatDate(date);
      expect(result).toContain('2024');
      expect(result).toContain('01');
      expect(result).toContain('15');
    });

    it('should handle string date input', () => {
      const result = formatDate('2024-01-15');
      expect(result).toContain('2024');
    });
  });

  describe('getAccountTypeLabel', () => {
    it('should return correct label for bank', () => {
      expect(getAccountTypeLabel('bank')).toBe('银行账户');
    });

    it('should return correct label for credit', () => {
      expect(getAccountTypeLabel('credit')).toBe('信用卡');
    });

    it('should return original type for unknown type', () => {
      expect(getAccountTypeLabel('unknown')).toBe('unknown');
    });
  });

  describe('getTransactionTypeLabel', () => {
    it('should return correct label for income', () => {
      expect(getTransactionTypeLabel('income')).toBe('收入');
    });

    it('should return correct label for expense', () => {
      expect(getTransactionTypeLabel('expense')).toBe('支出');
    });
  });
});
