'use client';

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell } from 'recharts';
import { chartColors, formatCurrency } from './chart-config';

interface BudgetBarChartProps {
  data: Array<{
    name: string;
    budget: number;
    spent: number;
    remaining: number;
    progress: number;
    status: number;
  }>;
  title?: string;
}

const STATUS_COLORS = {
  1: chartColors.success, // 进行中 - 绿色
  2: chartColors.primary, // 已完成 - 蓝色
  3: chartColors.danger,  // 超支 - 红色
  0: chartColors.neutral, // 已取消 - 灰色
};

export function BudgetBarChart({ data, title }: BudgetBarChartProps) {
  return (
    <div className="w-full h-80">
      {title && <h3 className="text-lg font-semibold mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          layout="vertical"
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={true} vertical={false} />
          <XAxis
            type="number"
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: '#e5e7eb' }}
            tickFormatter={(value) => `¥${value / 1000}k`}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            width={100}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            }}
            formatter={(value: number, name: string) => {
              if (name === '预算') return [formatCurrency(value), '预算'];
              if (name === '已花费') return [formatCurrency(value), '已花费'];
              return [value, name];
            }}
          />
          <Legend />
          <Bar
            dataKey="budget"
            name="预算"
            fill={chartColors.primary}
            radius={[0, 4, 4, 0]}
          />
          <Bar
            dataKey="spent"
            name="已花费"
            radius={[0, 4, 4, 0]}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status as keyof typeof STATUS_COLORS] || chartColors.success} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
