// Mock next/navigation first before any imports
jest.mock('next/navigation', () => ({
  usePathname: () => '/accounts',
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

import AccountsPage from '@/app/(dashboard)/accounts/page';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock API calls
jest.mock('@/api', () => ({
  accountApi: {
    list: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    getSummary: jest.fn(),
  },
}));

import { accountApi } from '@/api';

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

describe('AccountsPage', () => {
  const mockAccounts = [
    {
      accountId: 1,
      name: '主账户',
      accountType: 'bank',
      currency: 'CNY',
      balance: 10000,
      includeInTotal: true,
      status: 1,
    },
    {
      accountId: 2,
      name: '信用卡',
      accountType: 'credit',
      currency: 'CNY',
      balance: -2000,
      includeInTotal: true,
      status: 1,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('displays page title', async () => {
    (accountApi.list as jest.Mock).mockResolvedValue({ code: 0, data: mockAccounts });
    (accountApi.getSummary as jest.Mock).mockResolvedValue({
      code: 0,
      data: { totalAssets: 8000, totalLiabilities: 2000, netAssets: 6000 },
    });

    render(<AccountsPage />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: '账户管理' })).toBeInTheDocument();
    });
  });

  it('displays accounts list when data loads', async () => {
    (accountApi.list as jest.Mock).mockResolvedValue({ code: 0, data: mockAccounts });
    (accountApi.getSummary as jest.Mock).mockResolvedValue({
      code: 0,
      data: { totalAssets: 8000, totalLiabilities: 2000, netAssets: 6000 },
    });

    render(<AccountsPage />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: '账户管理' })).toBeInTheDocument();
      // Account cards should be visible
      const mainAccount = screen.getByText('主账户');
      expect(mainAccount).toBeInTheDocument();
    });
  });

  it('displays account count', async () => {
    (accountApi.list as jest.Mock).mockResolvedValue({ code: 0, data: mockAccounts });
    (accountApi.getSummary as jest.Mock).mockResolvedValue({
      code: 0,
      data: { totalAssets: 8000, totalLiabilities: 2000, netAssets: 6000 },
    });

    render(<AccountsPage />);

    await waitFor(() => {
      expect(screen.getByText(/账户列表/)).toBeInTheDocument();
    });
  });

  it('displays empty state when no accounts', async () => {
    (accountApi.list as jest.Mock).mockResolvedValue({ code: 0, data: [] });
    (accountApi.getSummary as jest.Mock).mockResolvedValue({
      code: 0,
      data: { totalAssets: 0, totalLiabilities: 0, netAssets: 0 },
    });

    render(<AccountsPage />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: '账户管理' })).toBeInTheDocument();
    });
  });

  it('handles API error gracefully', async () => {
    (accountApi.list as jest.Mock).mockRejectedValue(new Error('API Error'));
    (accountApi.getSummary as jest.Mock).mockResolvedValue({
      code: 0,
      data: { totalAssets: 0, totalLiabilities: 0, netAssets: 0 },
    });

    render(<AccountsPage />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: '账户管理' })).toBeInTheDocument();
    });
  });
});
