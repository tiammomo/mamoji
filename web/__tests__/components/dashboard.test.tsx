/**
 * DashboardPage Tests
 */

// Mock next/navigation first before any imports
jest.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

// Mock API calls
jest.mock('@/api', () => ({
  accountApi: {
    getSummary: jest.fn(),
  },
  transactionApi: {
    getRecent: jest.fn(),
  },
  budgetApi: {
    listActive: jest.fn(),
  },
  reportApi: {
    getSummary: jest.fn(),
  },
}));

// Mock useAuthStore
jest.mock('@/hooks/useAuth', () => ({
  useAuthStore: jest.fn(() => ({
    isAuthenticated: true,
    user: { userId: 1, username: 'testuser', role: 'normal' },
    token: 'test-token',
  })),
}));

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));

// Mock UI components that use radix primitives - BEFORE imports
jest.mock('@/components/ui/progress', () => ({
  Progress: ({ value, className, ...props }: any) => (
    <div className={className} data-testid="progress" {...props}>
      <div style={{ width: `${value || 0}%` }} data-testid="progress-indicator" />
    </div>
  ),
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant, ...props }: any) => <span data-testid="badge" data-variant={variant} {...props}>{children}</span>,
}));

jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className, ...props }: any) => <div data-testid="card" className={className} {...props}>{children}</div>,
  CardHeader: ({ children, ...props }: any) => <div data-testid="card-header" {...props}>{children}</div>,
  CardTitle: ({ children, ...props }: any) => <div data-testid="card-title" {...props}>{children}</div>,
  CardDescription: ({ children, ...props }: any) => <div data-testid="card-description" {...props}>{children}</div>,
  CardContent: ({ children, ...props }: any) => <div data-testid="card-content" {...props}>{children}</div>,
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, variant, size, ...props }: any) => (
    <button data-testid="button" data-variant={variant} data-size={size} {...props}>{children}</button>
  ),
}));

jest.mock('@/components/ui/avatar', () => ({
  Avatar: ({ children, ...props }: any) => <div data-testid="avatar" {...props}>{children}</div>,
  AvatarImage: ({ src, ...props }: any) => <img src={src} data-testid="avatar-image" {...props} />,
  AvatarFallback: ({ children, ...props }: any) => <div data-testid="avatar-fallback" {...props}>{children}</div>,
}));

// Mock layout components
jest.mock('@/components/layout/dashboard-layout', () => ({
  DashboardLayout: ({ children, title }: any) => <div data-testid="dashboard-layout" data-title={title}>{children}</div>,
}));

jest.mock('@/components/layout/sidebar', () => ({
  Sidebar: () => <div data-testid="sidebar" />,
}));

jest.mock('@/components/layout/header', () => ({
  Header: ({ title }: any) => <div data-testid="header" data-title={title} />,
}));

// Mock chart components
jest.mock('@/components/charts/category-pie-chart', () => ({
  CategoryPieChart: ({ ...props }: any) => <div data-testid="category-pie-chart" {...props} />,
}));

jest.mock('@/components/charts/trend-chart', () => ({
  TrendChart: ({ ...props }: any) => <div data-testid="trend-chart" {...props} />,
}));

jest.mock('@/components/charts/budget-bar-chart', () => ({
  BudgetBarChart: ({ ...props }: any) => <div data-testid="budget-bar-chart" {...props} />,
}));

// Now import after all mocks
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import DashboardPage from '@/app/(dashboard)/dashboard/page';
import { accountApi, transactionApi, budgetApi, reportApi } from '@/api';

describe('DashboardPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', async () => {
    (accountApi.getSummary as jest.Mock).mockResolvedValue({ code: 200, data: { totalAssets: 50000, totalLiabilities: 5000, netAssets: 45000, accountsCount: 3 } });
    (transactionApi.getRecent as jest.Mock).mockResolvedValue({ code: 200, data: [] });
    (budgetApi.listActive as jest.Mock).mockResolvedValue({ code: 200, data: [] });
    (reportApi.getSummary as jest.Mock).mockResolvedValue({ code: 200, data: { totalIncome: 0, totalExpense: 0, netIncome: 0 } });

    const { container } = render(<DashboardPage />);
    await waitFor(() => {
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  it('renders page title when API succeeds', async () => {
    (accountApi.getSummary as jest.Mock).mockResolvedValue({ code: 200, data: { totalAssets: 50000, totalLiabilities: 5000, netAssets: 45000, accountsCount: 3 } });
    (transactionApi.getRecent as jest.Mock).mockResolvedValue({ code: 200, data: [] });
    (budgetApi.listActive as jest.Mock).mockResolvedValue({ code: 200, data: [] });
    (reportApi.getSummary as jest.Mock).mockResolvedValue({ code: 200, data: { totalIncome: 0, totalExpense: 0, netIncome: 0 } });

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: '仪表盘' })).toBeInTheDocument();
    });
  });

  it('displays summary cards when data loads', async () => {
    (accountApi.getSummary as jest.Mock).mockResolvedValue({
      code: 200,
      data: { totalAssets: 50000, totalLiabilities: 5000, netAssets: 45000, accountsCount: 3 },
    });
    (transactionApi.getRecent as jest.Mock).mockResolvedValue({ code: 200, data: [] });
    (budgetApi.listActive as jest.Mock).mockResolvedValue({ code: 200, data: [] });
    (reportApi.getSummary as jest.Mock).mockResolvedValue({ code: 200, data: { totalIncome: 0, totalExpense: 0, netIncome: 0 } });

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('总资产')).toBeInTheDocument();
      expect(screen.getByText('总负债')).toBeInTheDocument();
      expect(screen.getByText('净资产')).toBeInTheDocument();
    });
  });

  it('displays recent transactions section', async () => {
    (accountApi.getSummary as jest.Mock).mockResolvedValue({
      code: 200,
      data: { totalAssets: 50000, totalLiabilities: 5000, netAssets: 45000, accountsCount: 3 },
    });
    (transactionApi.getRecent as jest.Mock).mockResolvedValue({ code: 200, data: [] });
    (budgetApi.listActive as jest.Mock).mockResolvedValue({ code: 200, data: [] });
    (reportApi.getSummary as jest.Mock).mockResolvedValue({ code: 200, data: { totalIncome: 0, totalExpense: 0, netIncome: 0 } });

    render(<DashboardPage />);

    // Check that the recent transactions section title is rendered
    await waitFor(() => {
      expect(screen.getByText('最近交易')).toBeInTheDocument();
    });
  });

  it('displays empty state when no transactions', async () => {
    (accountApi.getSummary as jest.Mock).mockResolvedValue({
      code: 200,
      data: { totalAssets: 0, totalLiabilities: 0, netAssets: 0, accountsCount: 0 },
    });
    (transactionApi.getRecent as jest.Mock).mockResolvedValue({ code: 200, data: [] });
    (budgetApi.listActive as jest.Mock).mockResolvedValue({ code: 200, data: [] });
    (reportApi.getSummary as jest.Mock).mockResolvedValue({ code: 200, data: { totalIncome: 0, totalExpense: 0, netIncome: 0 } });

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('暂无交易记录')).toBeInTheDocument();
    });
  });

  it('displays budget section', async () => {
    (accountApi.getSummary as jest.Mock).mockResolvedValue({
      code: 200,
      data: { totalAssets: 50000, totalLiabilities: 5000, netAssets: 45000, accountsCount: 3 },
    });
    (transactionApi.getRecent as jest.Mock).mockResolvedValue({ code: 200, data: [] });
    (budgetApi.listActive as jest.Mock).mockResolvedValue({ code: 200, data: [] });
    (reportApi.getSummary as jest.Mock).mockResolvedValue({ code: 200, data: { totalIncome: 0, totalExpense: 0, netIncome: 0 } });

    render(<DashboardPage />);

    // Check that the budget section title is rendered
    await waitFor(() => {
      expect(screen.getByText('预算进度')).toBeInTheDocument();
    });
  });

  it('displays dashboard title', async () => {
    (accountApi.getSummary as jest.Mock).mockResolvedValue({
      code: 200,
      data: { totalAssets: 50000, totalLiabilities: 5000, netAssets: 45000, accountsCount: 3 },
    });
    (transactionApi.getRecent as jest.Mock).mockResolvedValue({ code: 200, data: [] });
    (budgetApi.listActive as jest.Mock).mockResolvedValue({ code: 200, data: [] });
    (reportApi.getSummary as jest.Mock).mockResolvedValue({ code: 200, data: { totalIncome: 0, totalExpense: 0, netIncome: 0 } });

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: '仪表盘' })).toBeInTheDocument();
    });
  });
});
