// Mock next/navigation first before any imports
jest.mock('next/navigation', () => ({
  usePathname: () => '/transactions',
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

import TransactionsPage from '@/app/(dashboard)/transactions/page';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock API calls
jest.mock('@/api', () => ({
  transactionApi: {
    list: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
    getRecent: jest.fn(),
  },
  accountApi: {
    list: jest.fn(),
    getSummary: jest.fn(),
  },
  categoryApi: {
    list: jest.fn(),
  },
}));

import { transactionApi, accountApi, categoryApi } from '@/api';

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
  },
}));

describe('TransactionsPage', () => {
  const mockAccounts = [
    { accountId: 1, name: '主账户', accountType: 'bank' },
    { accountId: 2, name: '信用卡', accountType: 'credit' },
  ];

  const mockCategories = [
    { categoryId: 1, name: '工资', type: 'income' },
    { categoryId: 2, name: '餐饮', type: 'expense' },
  ];

  const mockTransactions = [
    {
      transactionId: 1,
      accountId: 1,
      categoryId: 1,
      type: 'income',
      amount: 5000,
      note: '月薪',
      occurredAt: '2024-01-15T10:00:00',
      status: 1,
    },
    {
      transactionId: 2,
      accountId: 2,
      categoryId: 2,
      type: 'expense',
      amount: 100,
      note: '午餐',
      occurredAt: '2024-01-14T12:00:00',
      status: 1,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('displays page title', async () => {
    (transactionApi.list as jest.Mock).mockResolvedValue({
      code: 200,
      data: { list: mockTransactions, total: 2 },
    });
    (accountApi.list as jest.Mock).mockResolvedValue({ code: 200, data: mockAccounts });
    (categoryApi.list as jest.Mock).mockResolvedValue({ code: 200, data: mockCategories });
    (accountApi.getSummary as jest.Mock).mockResolvedValue({
      code: 200,
      data: { totalAssets: 8000, totalLiabilities: 2000, netAssets: 6000 },
    });

    render(<TransactionsPage />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: '交易记录' })).toBeInTheDocument();
    });
  });

  it('displays transactions list when data loads', async () => {
    (transactionApi.list as jest.Mock).mockResolvedValue({
      code: 200,
      data: { list: mockTransactions, total: 2 },
    });
    (accountApi.list as jest.Mock).mockResolvedValue({ code: 200, data: mockAccounts });
    (categoryApi.list as jest.Mock).mockResolvedValue({ code: 200, data: mockCategories });
    (accountApi.getSummary as jest.Mock).mockResolvedValue({
      code: 200,
      data: { totalAssets: 8000, totalLiabilities: 2000, netAssets: 6000 },
    });

    render(<TransactionsPage />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: '交易记录' })).toBeInTheDocument();
      // Transaction notes should appear
      expect(screen.getByText('月薪')).toBeInTheDocument();
    });
  });

  it('displays empty state when no transactions', async () => {
    (transactionApi.list as jest.Mock).mockResolvedValue({
      code: 200,
      data: { list: [], total: 0 },
    });
    (accountApi.list as jest.Mock).mockResolvedValue({ code: 200, data: [] });
    (categoryApi.list as jest.Mock).mockResolvedValue({ code: 200, data: [] });
    (accountApi.getSummary as jest.Mock).mockResolvedValue({
      code: 200,
      data: { totalAssets: 0, totalLiabilities: 0, netAssets: 0 },
    });

    render(<TransactionsPage />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: '交易记录' })).toBeInTheDocument();
    });
  });

  it('handles API error gracefully', async () => {
    (transactionApi.list as jest.Mock).mockRejectedValue(new Error('API Error'));
    (accountApi.list as jest.Mock).mockResolvedValue({ code: 200, data: [] });
    (categoryApi.list as jest.Mock).mockResolvedValue({ code: 200, data: [] });
    (accountApi.getSummary as jest.Mock).mockResolvedValue({
      code: 200,
      data: { totalAssets: 0, totalLiabilities: 0, netAssets: 0 },
    });

    render(<TransactionsPage />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: '交易记录' })).toBeInTheDocument();
    });
  });
});
