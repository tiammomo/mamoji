import {
  formatCurrency,
  formatPercent,
  formatNumber,
  formatDate,
  formatRelativeTime,
  generateId,
  deepClone,
  amountToChinese,
  calculateReturnRate,
  calculateAnnualizedReturn,
  cn,
} from '@/lib/utils';

describe('Utils', () => {
  describe('cn', () => {
    it('should merge class names', () => {
      const result = cn('base-class', 'another-class');
      expect(result).toContain('base-class');
      expect(result).toContain('another-class');
    });

    it('should handle conditional classes', () => {
      const result = cn('base-class', true && 'conditional-class', false && 'not-included');
      expect(result).toContain('base-class');
      expect(result).toContain('conditional-class');
      expect(result).not.toContain('not-included');
    });

    it('should handle tailwind classes', () => {
      const result = cn('bg-red-500', 'bg-blue-500');
      // twMerge should handle conflicting tailwind classes
      expect(result).toBeTruthy();
    });
  });

  describe('formatCurrency', () => {
    it('should format currency correctly', () => {
      expect(formatCurrency(1000)).toContain('1,000');
    });

    it('should format with different currencies', () => {
      const cny = formatCurrency(1000, 'CNY');
      const usd = formatCurrency(1000, 'USD');
      expect(cny).toContain('¥');
      expect(usd).toContain('$');
    });

    it('should format negative amounts', () => {
      const result = formatCurrency(-1000);
      expect(result).toContain('1,000');
    });
  });

  describe('formatPercent', () => {
    it('should format positive percentage', () => {
      expect(formatPercent(10.5)).toBe('+10.50%');
    });

    it('should format negative percentage', () => {
      expect(formatPercent(-5.25)).toBe('-5.25%');
    });

    it('should format zero', () => {
      expect(formatPercent(0)).toBe('+0.00%');
    });

    it('should respect decimal places', () => {
      expect(formatPercent(10.555, 1)).toBe('+10.6%');
    });
  });

  describe('formatNumber', () => {
    it('should format with thousands separator', () => {
      expect(formatNumber(1000)).toBe('1,000');
    });

    it('should format large numbers', () => {
      expect(formatNumber(1000000)).toBe('1,000,000');
    });

    it('should format with decimals', () => {
      expect(formatNumber(1000.5, 1)).toBe('1,000.5');
    });

    it('should handle zero', () => {
      expect(formatNumber(0)).toBe('0');
    });
  });

  describe('formatDate', () => {
    it('should format YYYY-MM-DD', () => {
      expect(formatDate('2024-01-15', 'YYYY-MM-DD')).toBe('2024-01-15');
    });

    it('should format YYYY/MM/DD', () => {
      expect(formatDate('2024-01-15', 'YYYY/MM/DD')).toBe('2024/01/15');
    });

    it('should format MM-DD', () => {
      expect(formatDate('2024-01-15', 'MM-DD')).toBe('01-15');
    });

    it('should format HH:mm', () => {
      expect(formatDate('2024-01-15T14:30:00', 'HH:mm')).toBe('14:30');
    });

    it('should format full date', () => {
      const result = formatDate('2024-01-15T14:30:00', '完整');
      expect(result).toContain('2024年');
      expect(result).toContain('14:30');
    });

    it('should handle Date objects', () => {
      const date = new Date('2024-01-15');
      expect(formatDate(date, 'YYYY-MM-DD')).toBe('2024-01-15');
    });
  });

  describe('formatRelativeTime', () => {
    it('should return "刚刚" for recent dates', () => {
      const now = new Date();
      expect(formatRelativeTime(now)).toBe('刚刚');
    });

    it('should return minutes ago', () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      expect(formatRelativeTime(fiveMinutesAgo)).toBe('5分钟前');
    });

    it('should return hours ago', () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      expect(formatRelativeTime(twoHoursAgo)).toBe('2小时前');
    });

    it('should return days ago', () => {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      expect(formatRelativeTime(threeDaysAgo)).toBe('3天前');
    });
  });

  describe('generateId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateId();
      const id2 = generateId();
      expect(id1).not.toBe(id2);
    });

    it('should contain timestamp', () => {
      const before = Date.now();
      const id = generateId();
      const after = Date.now();
      const timestamp = parseInt(id.split('_')[0]);
      expect(timestamp).toBeGreaterThanOrEqual(before);
      expect(timestamp).toBeLessThanOrEqual(after);
    });
  });

  describe('deepClone', () => {
    it('should clone objects deeply', () => {
      const original = { a: 1, b: { c: 2 } };
      const cloned = deepClone(original);
      expect(cloned).toEqual(original);
      expect(cloned.b).not.toBe(original.b);
    });

    it('should clone arrays', () => {
      const original = [1, 2, 3];
      const cloned = deepClone(original);
      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
    });
  });

  describe('amountToChinese', () => {
    it('should convert integer amounts', () => {
      expect(amountToChinese(100)).toBe('壹佰元整');
    });

    it('should convert decimal amounts', () => {
      expect(amountToChinese(123.45)).toContain('壹佰贰拾叁元肆角伍分');
    });

    it('should convert zero', () => {
      expect(amountToChinese(0)).toBe('零元整');
    });

    it('should handle large amounts', () => {
      expect(amountToChinese(10000)).toContain('万');
    });
  });

  describe('calculateReturnRate', () => {
    it('should calculate positive return', () => {
      expect(calculateReturnRate(1200, 1000)).toBe(20);
    });

    it('should calculate negative return', () => {
      expect(calculateReturnRate(800, 1000)).toBe(-20);
    });

    it('should handle zero principal', () => {
      expect(calculateReturnRate(100, 0)).toBe(0);
    });

    it('should handle zero current value', () => {
      expect(calculateReturnRate(0, 1000)).toBe(-100);
    });
  });

  describe('calculateAnnualizedReturn', () => {
    it('should calculate annualized return', () => {
      const result = calculateAnnualizedReturn(1100, 1000, 365);
      expect(result).toBeCloseTo(10, 0);
    });

    it('should handle zero principal', () => {
      expect(calculateAnnualizedReturn(100, 0, 365)).toBe(0);
    });

    it('should handle zero days', () => {
      expect(calculateAnnualizedReturn(1100, 1000, 0)).toBe(0);
    });
  });
});
