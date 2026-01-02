import { useState, useEffect, useCallback, useMemo } from 'react';
import { get, post, put, del } from '@/lib/api';
import { useUser } from '@/stores/auth';
import { useToast } from '@/components/ui/use-toast';

export interface Budget {
  budgetId: number;
  name: string;
  type: string;
  category: string;
  totalAmount: number;
  usedAmount: number;
  periodStart: string;
  periodEnd: string;
  status: string;
  enterpriseId?: number;
}

// 时间范围类型
export interface DateRange {
  start: string;
  end: string;
}

// 快速选择时间范围选项
export const QUICK_RANGES = [
  { label: '今日', value: 'today' },
  { label: '本周', value: 'week' },
  { label: '本月', value: 'month' },
  { label: '本季', value: 'quarter' },
  { label: '本年', value: 'year' },
] as const;

// 获取北京时间
const getBeijingDate = () => new Date(new Date().getTime() + 8 * 60 * 60 * 1000);

// 格式化日期为 YYYY-MM-DD
const formatDateToString = (date: Date) => {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// 获取当月最后一天
const getMonthLastDay = (year: number, month: number) => new Date(Date.UTC(year, month + 1, 0));

// 计算时间范围
export const calculateDateRange = (type: string): DateRange => {
  const beijingNow = getBeijingDate();
  const year = beijingNow.getUTCFullYear();
  const month = beijingNow.getUTCMonth();
  const day = beijingNow.getUTCDate();

  switch (type) {
    case 'today':
      return { start: formatDateToString(beijingNow), end: formatDateToString(beijingNow) };
    case 'week': {
      const dayOfWeek = beijingNow.getUTCDay();
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const weekStart = new Date(Date.UTC(year, month, day + mondayOffset));
      const weekEnd = new Date(Date.UTC(year, month, day + mondayOffset + 6));
      return { start: formatDateToString(weekStart), end: formatDateToString(weekEnd) };
    }
    case 'month': {
      const monthStart = new Date(Date.UTC(year, month, 1));
      const monthEnd = getMonthLastDay(year, month);
      return { start: formatDateToString(monthStart), end: formatDateToString(monthEnd) };
    }
    case 'quarter': {
      const quarterMonth = Math.floor(month / 3) * 3;
      const quarterStart = new Date(Date.UTC(year, quarterMonth, 1));
      const quarterEnd = getMonthLastDay(year, quarterMonth + 2);
      return { start: formatDateToString(quarterStart), end: formatDateToString(quarterEnd) };
    }
    case 'year':
      return { start: `${year}-01-01`, end: `${year}-12-31` };
    default:
      return { start: formatDateToString(beijingNow), end: formatDateToString(beijingNow) };
  }
};

// 获取默认预算周期
export const getDefaultPeriod = (type: string): { periodStart: string; periodEnd: string } => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  switch (type) {
    case 'monthly': {
      const firstDayOfMonth = new Date(Date.UTC(year, month, 1, 0, 0, 0));
      const lastDayOfMonth = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59));
      return { periodStart: firstDayOfMonth.toISOString().split('T')[0], periodEnd: lastDayOfMonth.toISOString().split('T')[0] };
    }
    case 'yearly':
      return { periodStart: `${year}-01-01`, periodEnd: `${year}-12-31` };
    default: {
      const today = new Date(Date.UTC(year, now.getMonth(), now.getDate()));
      return { periodStart: today.toISOString().split('T')[0], periodEnd: today.toISOString().split('T')[0] };
    }
  }
};

// 预算时间状态类型
export type BudgetTimeStatus = 'ended' | 'in_progress' | 'not_started';

// 检查预算周期是否与时间范围重叠
export const isBudgetInRange = (budget: Budget, range: DateRange): boolean => {
  const budgetStart = new Date(budget.periodStart);
  const budgetEnd = new Date(budget.periodEnd);
  const filterStart = new Date(range.start);
  const filterEnd = new Date(range.end);
  return budgetStart <= filterEnd && budgetEnd >= filterStart;
};

interface UseBudgetsReturn {
  // 状态
  budgets: Budget[];
  isLoading: boolean;
  isInitialLoading: boolean;
  dateRange: DateRange;
  // 计算属性
  budgetsInRange: Budget[];
  totalBudget: number;
  totalUsed: number;
  exceededCount: number;
  lastMonthStats: { totalBudget: number; totalUsed: number; exceededCount: number };
  momChange: { budget: { value: number; isPositive: boolean }; used: { value: number; isPositive: boolean }; exceeded: { value: number; isPositive: boolean } };
  // 操作
  setDateRange: (range: DateRange) => void;
  fetchBudgets: () => Promise<void>;
  createBudget: (data: Partial<Budget>) => Promise<boolean>;
  updateBudget: (budgetId: number, data: Partial<Budget>) => Promise<boolean>;
  deleteBudget: (budgetId: number) => Promise<boolean>;
}

export function useBudgets(): UseBudgetsReturn {
  const user = useUser();
  const { toast } = useToast();

  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const beijingNow = getBeijingDate();
    const year = beijingNow.getUTCFullYear();
    const month = beijingNow.getUTCMonth();
    const firstDay = new Date(Date.UTC(year, month, 1));
    const lastDay = new Date(Date.UTC(year, month + 1, 0));
    return { start: formatDateToString(firstDay), end: formatDateToString(lastDay) };
  });

  // 获取预算列表
  const fetchBudgets = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      params.append('startDate', dateRange.start);
      params.append('endDate', dateRange.end);
      const data = await get<Budget[]>(`/api/v1/budgets?${params.toString()}`);
      setBudgets(data || []);
    } catch (error) {
      console.error('获取预算列表失败:', error);
      toast({ title: '错误', description: '获取预算列表失败', variant: 'destructive' });
    } finally {
      setIsInitialLoading(false);
    }
  }, [dateRange.start, dateRange.end, toast]);

  // 初始加载
  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  // 计算当前时间范围内的预算
  const budgetsInRange = useMemo(() => budgets.filter(b => isBudgetInRange(b, dateRange)), [budgets, dateRange]);
  const totalBudget = useMemo(() => budgetsInRange.reduce((sum, b) => sum + b.totalAmount, 0), [budgetsInRange]);
  const totalUsed = useMemo(() => budgetsInRange.reduce((sum, b) => sum + b.usedAmount, 0), [budgetsInRange]);
  const exceededCount = useMemo(() => budgetsInRange.filter(b => b.usedAmount > b.totalAmount).length, [budgetsInRange]);

  // 计算上月统计
  const lastMonthStats = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    let lastYear = currentYear;
    let lastMonth = currentMonth - 1;
    if (lastMonth < 0) { lastMonth = 11; lastYear--; }
    const start = new Date(lastYear, lastMonth, 1);
    const end = new Date(lastYear, lastMonth + 1, 0);
    const range: DateRange = { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] };
    const lastMonthBudgets = budgets.filter(b => isBudgetInRange(b, range));
    return {
      totalBudget: lastMonthBudgets.reduce((sum, b) => sum + b.totalAmount, 0),
      totalUsed: lastMonthBudgets.reduce((sum, b) => sum + b.usedAmount, 0),
      exceededCount: lastMonthBudgets.filter(b => b.usedAmount > b.totalAmount).length,
    };
  }, [budgets]);

  // 计算环比变化
  const calculateMoMChange = (current: number, last: number) => {
    if (last === 0) return { value: current > 0 ? 100 : 0, isPositive: current >= 0 };
    const change = ((current - last) / last) * 100;
    return { value: Math.abs(change), isPositive: change >= 0 };
  };

  const momChange = useMemo(() => ({
    budget: calculateMoMChange(totalBudget, lastMonthStats.totalBudget),
    used: calculateMoMChange(totalUsed, lastMonthStats.totalUsed),
    exceeded: calculateMoMChange(exceededCount, lastMonthStats.exceededCount),
  }), [totalBudget, totalUsed, exceededCount, lastMonthStats]);

  // 创建预算
  const createBudget = useCallback(async (data: Partial<Budget>): Promise<boolean> => {
    setIsLoading(true);
    try {
      const result = await post<Budget>('/api/v1/budgets', { ...data, enterpriseId: user?.enterpriseId });
      if (result) {
        setBudgets(prev => [...prev, result]);
        toast({ title: '成功', description: '预算创建成功' });
        return true;
      }
      return false;
    } catch (error) {
      console.error('创建预算失败:', error);
      toast({ title: '错误', description: '创建预算失败', variant: 'destructive' });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user?.enterpriseId, toast]);

  // 更新预算
  const updateBudget = useCallback(async (budgetId: number, data: Partial<Budget>): Promise<boolean> => {
    setIsLoading(true);
    try {
      await put(`/api/v1/budgets/${budgetId}`, data);
      setBudgets(prev => prev.map(b => b.budgetId === budgetId ? { ...b, ...data } : b));
      toast({ title: '成功', description: '预算更新成功' });
      return true;
    } catch (error) {
      console.error('更新预算失败:', error);
      toast({ title: '错误', description: '更新预算失败', variant: 'destructive' });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // 删除预算
  const deleteBudget = useCallback(async (budgetId: number): Promise<boolean> => {
    setIsLoading(true);
    try {
      await del(`/api/v1/budgets/${budgetId}`);
      setBudgets(prev => prev.filter(b => b.budgetId !== budgetId));
      toast({ title: '成功', description: '预算删除成功' });
      return true;
    } catch (error) {
      console.error('删除预算失败:', error);
      toast({ title: '错误', description: '删除预算失败', variant: 'destructive' });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  return {
    budgets,
    isLoading,
    isInitialLoading,
    dateRange,
    budgetsInRange,
    totalBudget,
    totalUsed,
    exceededCount,
    lastMonthStats,
    momChange,
    setDateRange,
    fetchBudgets,
    createBudget,
    updateBudget,
    deleteBudget,
  };
}
