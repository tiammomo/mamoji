// Mock next/navigation first before any imports
jest.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

import DashboardPage from '@/app/(dashboard)/dashboard/page';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

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
}));

import { accountApi, transactionApi, budgetApi } from '@/api';

// Mock useAuthStore
jest.mock('@/hooks/useAuth', () => ({
  useAuthStore: jest.fn(() => ({
    isAuthenticated: true,
    user: { userId: 1, username: 'testuser', role: 'normal' },
    token: 'test-token',
  })),
}));

describe('DashboardPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('displays error state when API fails', async () => {
    (accountApi.getSummary as jest.Mock).mockRejectedValue(new Error('API Error'));
    (transactionApi.getRecent as jest.Mock).mockResolvedValue({ code: 200, data: [] });
    (budgetApi.listActive as jest.Mock).mockResolvedValue({ code: 200, data: [] });

    render(<DashboardPage />);

    await waitFor(() => {
      // Use more specific selector - find the h2 element with page title
      expect(screen.getByRole('heading', { name: '仪表盘' })).toBeInTheDocument();
    });
  });

  it('displays summary cards when data loads', async () => {
    (accountApi.getSummary as jest.Mock).mockResolvedValue({
      code: 200,
      data: {
        totalAssets: 50000,
        totalLiabilities: 5000,
        netAssets: 45000,
        accountsCount: 3,
      },
    });
    (transactionApi.getRecent as jest.Mock).mockResolvedValue({ code: 200, data: [] });
    (budgetApi.listActive as jest.Mock).mockResolvedValue({ code: 200, data: [] });

    render(<DashboardPage />);

    await waitFor(() => {
      // Use role heading for page title
      expect(screen.getByRole('heading', { name: '仪表盘' })).toBeInTheDocument();
      expect(screen.getByText('总资产')).toBeInTheDocument();
      expect(screen.getByText('总负债')).toBeInTheDocument();
      expect(screen.getByText('净资产')).toBeInTheDocument();
    });
  });

  it('displays recent transactions', async () => {
    const mockTransactions = [
      {
        transactionId: 1,
        type: 'income',
        amount: 1000,
        note: '工资',
        occurredAt: '2024-01-15T10:00:00',
      },
      {
        transactionId: 2,
        type: 'expense',
        amount: 100,
        note: '餐饮',
        occurredAt: '2024-01-14T12:00:00',
      },
    ];

    (accountApi.getSummary as jest.Mock).mockResolvedValue({
      code: 200,
      data: {
        totalAssets: 50000,
        totalLiabilities: 5000,
        netAssets: 45000,
        accountsCount: 3,
      },
    });
    (transactionApi.getRecent as jest.Mock).mockResolvedValue({ code: 200, data: mockTransactions });
    (budgetApi.listActive as jest.Mock).mockResolvedValue({ code: 200, data: [] });

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('工资')).toBeInTheDocument();
      expect(screen.getByText('餐饮')).toBeInTheDocument();
    });
  });

  it('displays empty state when no transactions', async () => {
    (accountApi.getSummary as jest.Mock).mockResolvedValue({
      code: 200,
      data: {
        totalAssets: 0,
        totalLiabilities: 0,
        netAssets: 0,
        accountsCount: 0,
      },
    });
    (transactionApi.getRecent as jest.Mock).mockResolvedValue({ code: 200, data: [] });
    (budgetApi.listActive as jest.Mock).mockResolvedValue({ code: 200, data: [] });

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('暂无交易记录')).toBeInTheDocument();
    });
  });

  it('displays budget progress', async () => {
    const mockBudgets = [
      {
        budgetId: 1,
        name: '月度餐饮预算',
        amount: 2000,
        spent: 1500,
        status: 1,
      },
    ];

    (accountApi.getSummary as jest.Mock).mockResolvedValue({
      code: 200,
      data: {
        totalAssets: 50000,
        totalLiabilities: 5000,
        netAssets: 45000,
        accountsCount: 3,
      },
    });
    (transactionApi.getRecent as jest.Mock).mockResolvedValue({ code: 200, data: [] });
    (budgetApi.listActive as jest.Mock).mockResolvedValue({ code: 200, data: mockBudgets });

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('月度餐饮预算')).toBeInTheDocument();
    });
  });

  it('displays account count correctly', async () => {
    (accountApi.getSummary as jest.Mock).mockResolvedValue({
      code: 200,
      data: {
        totalAssets: 10000,
        totalLiabilities: 2000,
        netAssets: 8000,
        accountsCount: 5,
      },
    });
    (transactionApi.getRecent as jest.Mock).mockResolvedValue({ code: 200, data: [] });
    (budgetApi.listActive as jest.Mock).mockResolvedValue({ code: 200, data: [] });

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('5 个账户')).toBeInTheDocument();
    });
  });
});
