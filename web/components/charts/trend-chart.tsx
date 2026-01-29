'use client';

import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { chartColors, formatCurrency, formatDate } from './chart-config';

interface TrendChartProps {
  data: Array<{
    period: string;
    income: number;
    expense: number;
    netIncome: number;
  }>;
  title?: string;
  period?: 'daily' | 'weekly' | 'monthly';
}

export function TrendChart({ data, title, period = 'monthly' }: TrendChartProps) {
  return (
    <div className="w-full h-80">
      {title && <h3 className="text-lg font-semibold mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={chartColors.income} stopOpacity={0.3} />
              <stop offset="95%" stopColor={chartColors.income} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={chartColors.expense} stopOpacity={0.3} />
              <stop offset="95%" stopColor={chartColors.expense} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="period"
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: '#e5e7eb' }}
          />
          <YAxis
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `¥${value / 1000}k`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            }}
            formatter={(value: number) => formatCurrency(value)}
            labelFormatter={(label) => `期间: ${label}`}
          />
          <Legend />
          <Area
            type="monotone"
            dataKey="income"
            name="收入"
            stroke={chartColors.income}
            strokeWidth={2}
            fill="url(#incomeGradient)"
          />
          <Area
            type="monotone"
            dataKey="expense"
            name="支出"
            stroke={chartColors.expense}
            strokeWidth={2}
            fill="url(#expenseGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
