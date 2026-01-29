/**
 * ReportsPage Tests
 */

jest.mock('next/navigation', () => ({
  usePathname: () => '/reports',
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

jest.mock('@/api', () => ({
  reportApi: {
    getSummary: jest.fn(),
    getIncomeExpense: jest.fn(),
    getMonthly: jest.fn(),
    getBalanceSheet: jest.fn(),
    getTrend: jest.fn(),
  },
}));

jest.mock('@/hooks/useAuth', () => ({
  useAuthStore: jest.fn(() => ({
    isAuthenticated: true,
    user: { userId: 1, username: 'testuser', role: 'normal' },
    token: 'test-token',
  })),
}));

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));

// Mock lucide-react icons used in reports page
jest.mock('lucide-react', () => ({
  TrendingUp: () => 'TrendingUp',
  TrendingDown: () => 'TrendingDown',
  Wallet: () => 'Wallet',
  DollarSign: () => 'DollarSign',
  TrendingUpIcon: () => 'TrendingUpIcon',
  TrendingDownIcon: () => 'TrendingDownIcon',
  BarChart3: () => 'BarChart3',
  PieChart: () => 'PieChart',
  Activity: () => 'Activity',
}));

// Mock recharts
jest.mock('recharts', () => ({
  PieChart: () => 'PieChart',
  Pie: () => 'Pie',
  Cell: () => 'Cell',
  BarChart: () => 'BarChart',
  Bar: () => 'Bar',
  LineChart: () => 'LineChart',
  Line: () => 'Line',
  XAxis: () => 'XAxis',
  YAxis: () => 'YAxis',
  CartesianGrid: () => 'CartesianGrid',
  Tooltip: () => 'Tooltip',
  Legend: () => 'Legend',
  ResponsiveContainer: ({ children }: any) => children,
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, variant, size, ...props }: any) => (
    <button data-testid="button" data-variant={variant} data-size={size} {...props}>{children}</button>
  ),
}));

jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className, ...props }: any) => <div data-testid="card" className={className} {...props}>{children}</div>,
  CardHeader: ({ children, ...props }: any) => <div data-testid="card-header" {...props}>{children}</div>,
  CardTitle: ({ children, ...props }: any) => <div data-testid="card-title" {...props}>{children}</div>,
  CardDescription: ({ children, ...props }: any) => <div data-testid="card-description" {...props}>{children}</div>,
  CardContent: ({ children, ...props }: any) => <div data-testid="card-content" {...props}>{children}</div>,
}));

jest.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children, ...props }: any) => <div data-testid="tabs" {...props}>{children}</div>,
  TabsList: ({ children, ...props }: any) => <div data-testid="tabs-list" {...props}>{children}</div>,
  TabsTrigger: ({ children, ...props }: any) => <button data-testid="tabs-trigger" {...props}>{children}</button>,
  TabsContent: ({ children, ...props }: any) => <div data-testid="tabs-content" {...props}>{children}</div>,
}));

jest.mock('@/components/ui/select', () => ({
  Select: ({ children, onValueChange, value, ...props }: any) => <div data-testid="select" data-value={value} {...props}>{children}</div>,
  SelectTrigger: ({ children, ...props }: any) => <div data-testid="select-trigger" {...props}>{children}</div>,
  SelectValue: () => <span data-testid="select-value">SelectValue</span>,
  SelectContent: ({ children, ...props }: any) => <div data-testid="select-content" {...props}>{children}</div>,
  SelectItem: ({ children, value, ...props }: any) => <div data-testid="select-item" data-value={value} {...props}>{children}</div>,
}));

jest.mock('@/components/layout/dashboard-layout', () => ({
  DashboardLayout: ({ children, title }: any) => <div data-testid="dashboard-layout" data-title={title}>{children}</div>,
}));

import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ReportsPage from '@/app/(dashboard)/reports/page';
import { reportApi } from '@/api';

describe('ReportsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', async () => {
    (reportApi.getSummary as jest.Mock).mockResolvedValue({ code: 200, data: { totalIncome: 0, totalExpense: 0, netIncome: 0 } });

    const { container } = render(<ReportsPage />);
    await waitFor(() => {
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  it('has proper page structure', async () => {
    (reportApi.getSummary as jest.Mock).mockResolvedValue({ code: 200, data: { totalIncome: 0, totalExpense: 0, netIncome: 0 } });

    render(<ReportsPage />);

    await waitFor(() => {
      expect(screen.getByTestId('dashboard-layout')).toBeInTheDocument();
      expect(screen.getByTestId('tabs')).toBeInTheDocument();
    });
  });

  it('displays report tabs', async () => {
    (reportApi.getSummary as jest.Mock).mockResolvedValue({ code: 200, data: { totalIncome: 0, totalExpense: 0, netIncome: 0 } });

    render(<ReportsPage />);

    await waitFor(() => {
      expect(screen.getByTestId('tabs')).toBeInTheDocument();
    });
  });

  it('handles API error gracefully', async () => {
    (reportApi.getSummary as jest.Mock).mockRejectedValue(new Error('API Error'));

    const { container } = render(<ReportsPage />);
    await waitFor(() => {
      expect(container.firstChild).toBeInTheDocument();
    });
  });
});
