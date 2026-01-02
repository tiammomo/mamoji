'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from 'lucide-react';
import { QUICK_RANGES, calculateDateRange, DateRange } from '@/hooks/useBudgets';

interface BudgetFiltersProps {
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
}

export function BudgetFilters({ dateRange, onDateRangeChange }: BudgetFiltersProps) {
  const formatDateRange = (start: string, end: string) => `${start} 至 ${end}`;

  const isRangeActive = (value: string) => {
    const range = calculateDateRange(value);
    return dateRange.start === range.start && dateRange.end === range.end;
  };

  return (
    <div className="flex items-center justify-between bg-muted/30 p-3 rounded-lg border">
      <div className="flex items-center gap-2">
        <Calendar className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium">时间范围：</span>
        <span className="text-sm text-primary font-semibold">
          {formatDateRange(dateRange.start, dateRange.end)}
        </span>
      </div>
      <div className="flex items-center gap-1">
        {QUICK_RANGES.map((range) => (
          <Button
            key={range.value}
            variant={isRangeActive(range.value) ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onDateRangeChange(calculateDateRange(range.value))}
          >
            {range.label}
          </Button>
        ))}
        <div className="flex items-center gap-1 ml-2 border-l pl-2">
          <Input
            type="date"
            value={dateRange.start}
            onChange={(e) => onDateRangeChange({ ...dateRange, start: e.target.value })}
            className="w-32 h-8 text-xs"
          />
          <span className="text-muted-foreground text-xs">至</span>
          <Input
            type="date"
            value={dateRange.end}
            onChange={(e) => onDateRangeChange({ ...dateRange, end: e.target.value })}
            className="w-32 h-8 text-xs"
          />
        </div>
      </div>
    </div>
  );
}
