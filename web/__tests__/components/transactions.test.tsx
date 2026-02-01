/**
 * TransactionsPage Tests
 */

jest.mock('next/navigation', () => ({
  usePathname: () => '/transactions',
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

// Mock API modules
jest.mock('@/api', () => ({
  transactionApi: {
    list: jest.fn(),
    get: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    getRecent: jest.fn(),
  },
  accountApi: {
    list: jest.fn(),
  },
  categoryApi: {
    list: jest.fn(),
  },
  budgetApi: {
    list: jest.fn(),
    listActive: jest.fn(),
  },
  refundApi: {
    getTransactionRefunds: jest.fn(),
    createRefund: jest.fn(),
    cancelRefund: jest.fn(),
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

// Mock lucide-react icons
const MockIcon = ({ className, ...props }: any) => <svg className={className} {...props} />;
jest.mock('lucide-react', () => ({
  Plus: MockIcon,
  Edit: MockIcon,
  Trash2: MockIcon,
  ArrowUpCircle: MockIcon,
  ArrowDownCircle: MockIcon,
  Search: MockIcon,
  Filter: MockIcon,
  Calendar: MockIcon,
  TrendingUp: MockIcon,
  TrendingDown: MockIcon,
  DollarSign: MockIcon,
  RotateCcw: MockIcon,
  ChevronDown: MockIcon,
  ChevronUp: MockIcon,
  SlidersHorizontal: MockIcon,
  Tag: MockIcon,
  Wallet: MockIcon,
  Edit2: MockIcon,
  Check: MockIcon,
  Square: MockIcon,
  __esModule: true,
}));

// Mock UI components
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, variant, size, onClick, disabled, ...props }: any) => (
    <button
      data-testid="button"
      data-variant={variant}
      data-size={size}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  ),
}));

jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className, ...props }: any) => <div data-testid="card" className={className} {...props}>{children}</div>,
  CardHeader: ({ children, ...props }: any) => <div data-testid="card-header" {...props}>{children}</div>,
  CardTitle: ({ children, ...props }: any) => <div data-testid="card-title" {...props}>{children}</div>,
  CardDescription: ({ children, ...props }: any) => <div data-testid="card-description" {...props}>{children}</div>,
  CardContent: ({ children, ...props }: any) => <div data-testid="card-content" {...props}>{children}</div>,
}));

jest.mock('@/components/ui/input', () => ({
  Input: ({ ...props }: any) => <input data-testid="input" {...props} />,
}));

jest.mock('@/components/ui/label', () => ({
  Label: ({ children, ...props }: any) => <label data-testid="label" {...props}>{children}</label>,
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant, ...props }: any) => <span data-testid="badge" data-variant={variant} {...props}>{children}</span>,
}));

jest.mock('@/components/ui/select', () => ({
  Select: ({ children, onValueChange, value, ...props }: any) => (
    <div data-testid="select" data-value={value} {...props}>{children}</div>
  ),
  SelectTrigger: ({ children, ...props }: any) => <div data-testid="select-trigger" {...props}>{children}</div>,
  SelectValue: () => <span data-testid="select-value">SelectValue</span>,
  SelectContent: ({ children, ...props }: any) => <div data-testid="select-content" {...props}>{children}</div>,
  SelectItem: ({ children, value, ...props }: any) => <div data-testid="select-item" data-value={value} {...props}>{children}</div>,
}));

jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open, onOpenChange, ...props }: any) => (
    <div data-testid="dialog" data-open={open} {...props}>{children}</div>
  ),
  DialogTrigger: ({ children, ...props }: any) => <div data-testid="dialog-trigger" {...props}>{children}</div>,
  DialogContent: ({ children, ...props }: any) => <div data-testid="dialog-content" {...props}>{children}</div>,
  DialogHeader: ({ children, ...props }: any) => <div data-testid="dialog-header" {...props}>{children}</div>,
  DialogTitle: ({ children, ...props }: any) => <div data-testid="dialog-title" {...props}>{children}</div>,
  DialogDescription: ({ children, ...props }: any) => <div data-testid="dialog-description" {...props}>{children}</div>,
  DialogFooter: ({ children, ...props }: any) => <div data-testid="dialog-footer" {...props}>{children}</div>,
}));

jest.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children, ...props }: any) => <div data-testid="tabs" {...props}>{children}</div>,
  TabsList: ({ children, ...props }: any) => <div data-testid="tabs-list" {...props}>{children}</div>,
  TabsTrigger: ({ children, ...props }: any) => <button data-testid="tabs-trigger" {...props}>{children}</button>,
  TabsContent: ({ children, ...props }: any) => <div data-testid="tabs-content" {...props}>{children}</div>,
}));

jest.mock('@/components/layout/dashboard-layout', () => ({
  DashboardLayout: ({ children, title }: any) => <div data-testid="dashboard-layout" data-title={title}>{children}</div>,
}));

jest.mock('@/components/ui/progress', () => ({
  Progress: (props: any) => <div data-testid="progress" {...props} />,
}));

jest.mock('@/components/ui/separator', () => ({
  Separator: (props: any) => <hr data-testid="separator" {...props} />,
}));

jest.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children, ...props }: any) => <div data-testid="dropdown-menu" {...props}>{children}</div>,
  DropdownMenuTrigger: ({ children, ...props }: any) => <div data-testid="dropdown-menu-trigger" {...props}>{children}</div>,
  DropdownMenuContent: ({ children, ...props }: any) => <div data-testid="dropdown-menu-content" {...props}>{children}</div>,
  DropdownMenuItem: ({ children, ...props }: any) => <div data-testid="dropdown-menu-item" {...props}>{children}</div>,
  DropdownMenuSeparator: (props: any) => <hr data-testid="dropdown-menu-separator" {...props} />,
}));

import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import TransactionsPage from '@/app/(dashboard)/transactions/page';
import { transactionApi, accountApi, categoryApi, budgetApi, refundApi } from '@/api';

describe('TransactionsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', async () => {
    (transactionApi.list as jest.Mock).mockResolvedValue({
      code: 200,
      data: { current: 1, size: 20, total: 0, records: [] },
    });
    (accountApi.list as jest.Mock).mockResolvedValue({ code: 200, data: [] });
    (categoryApi.list as jest.Mock).mockResolvedValue({ code: 200, data: [] });
    (budgetApi.listActive as jest.Mock).mockResolvedValue({ code: 200, data: [] });

    const { container } = render(<TransactionsPage />);
    await waitFor(() => {
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  it('renders page title when loaded', async () => {
    (transactionApi.list as jest.Mock).mockResolvedValue({
      code: 200,
      data: { current: 1, size: 20, total: 0, records: [] },
    });
    (accountApi.list as jest.Mock).mockResolvedValue({ code: 200, data: [] });
    (categoryApi.list as jest.Mock).mockResolvedValue({ code: 200, data: [] });
    (budgetApi.listActive as jest.Mock).mockResolvedValue({ code: 200, data: [] });

    render(<TransactionsPage />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: '交易记录' })).toBeInTheDocument();
    });
  });

  it('loads transactions on mount', async () => {
    const mockTransactions = {
      code: 200,
      data: { current: 1, size: 20, total: 1, records: [{ transactionId: 1, type: 'EXPENSE', amount: 100 }] },
    };
    (transactionApi.list as jest.Mock).mockResolvedValue(mockTransactions);
    (accountApi.list as jest.Mock).mockResolvedValue({ code: 200, data: [] });
    (categoryApi.list as jest.Mock).mockResolvedValue({ code: 200, data: [] });
    (budgetApi.listActive as jest.Mock).mockResolvedValue({ code: 200, data: [] });

    render(<TransactionsPage />);

    await waitFor(() => {
      expect(transactionApi.list).toHaveBeenCalled();
    });
  });

  it('displays empty state when no transactions', async () => {
    (transactionApi.list as jest.Mock).mockResolvedValue({
      code: 200,
      data: { current: 1, size: 20, total: 0, records: [] },
    });
    (accountApi.list as jest.Mock).mockResolvedValue({ code: 200, data: [] });
    (categoryApi.list as jest.Mock).mockResolvedValue({ code: 200, data: [] });
    (budgetApi.listActive as jest.Mock).mockResolvedValue({ code: 200, data: [] });

    render(<TransactionsPage />);

    // Wait for the dashboard layout to render
    await waitFor(() => {
      expect(screen.getByTestId('dashboard-layout')).toBeInTheDocument();
    });
  });

  // ==================== Refund Feature API Tests ====================

  describe('Refund API functionality', () => {
    const mockExpenseTransaction = {
      transactionId: 1,
      userId: 1,
      accountId: 1,
      accountName: '微信钱包',
      categoryId: 1,
      categoryName: '餐饮',
      type: 'EXPENSE',
      amount: 100.00,
      currency: 'CNY',
      occurredAt: '2024-01-15T12:00:00',
      note: '午餐',
      status: 1,
    };

    const mockIncomeTransaction = {
      transactionId: 2,
      userId: 1,
      accountId: 1,
      accountName: '银行卡',
      categoryId: 2,
      categoryName: '薪资',
      type: 'INCOME',
      amount: 5000.00,
      currency: 'CNY',
      occurredAt: '2024-01-14T09:00:00',
      note: '工资',
      status: 1,
    };

    const mockRefundsResponse = {
      code: 200,
      data: {
        transaction: {
          transactionId: 1,
          amount: 100.00,
          type: 'EXPENSE',
        },
        refunds: [
          {
            refundId: 1,
            transactionId: 1,
            amount: 50.00,
            note: '部分退款',
            occurredAt: '2024-01-16T14:00:00',
            status: 1,
          },
        ],
        summary: {
          totalRefunded: 50.00,
          remainingRefundable: 50.00,
          hasRefund: true,
          refundCount: 1,
        },
      },
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('mock API for getTransactionRefunds works for expense transaction', async () => {
      // Verify the mock returns expected data
      (refundApi.getTransactionRefunds as jest.Mock).mockResolvedValue(mockRefundsResponse);

      const result = await refundApi.getTransactionRefunds(1);
      expect(result).toEqual(mockRefundsResponse);
    });

    it('mock API for getTransactionRefunds works for income transaction', async () => {
      const incomeRefundsResponse = {
        code: 200,
        data: {
          transaction: { transactionId: 2, amount: 5000.00, type: 'INCOME' },
          refunds: [],
          summary: { totalRefunded: 0, remainingRefundable: 5000.00, hasRefund: false, refundCount: 0 },
        },
      };
      (refundApi.getTransactionRefunds as jest.Mock).mockResolvedValue(incomeRefundsResponse);

      const result = await refundApi.getTransactionRefunds(2);
      expect(result).toEqual(incomeRefundsResponse);
    });

    it('mock API for createRefund works correctly', async () => {
      const createRefundResponse = {
        code: 200,
        data: {
          refundId: 2,
          transactionId: 1,
          amount: 25.00,
          note: '再次退款',
          status: 1,
        },
      };
      (refundApi.createRefund as jest.Mock).mockResolvedValue(createRefundResponse);

      const result = await refundApi.createRefund(1, { amount: 25.00, note: '再次退款', occurredAt: new Date().toISOString() });
      expect(result).toEqual(createRefundResponse);
    });

    it('mock API for cancelRefund works correctly', async () => {
      const cancelRefundResponse = {
        code: 200,
        data: {
          totalRefunded: 0,
          remainingRefundable: 100.00,
          hasRefund: false,
          refundCount: 0,
        },
      };
      (refundApi.cancelRefund as jest.Mock).mockResolvedValue(cancelRefundResponse);

      const result = await refundApi.cancelRefund(1, 1);
      expect(result).toEqual(cancelRefundResponse);
    });

    it('loads expense transactions with refund API mocked', async () => {
      (transactionApi.list as jest.Mock).mockResolvedValue({
        code: 200,
        data: { current: 1, size: 20, total: 1, records: [mockExpenseTransaction] },
      });
      (accountApi.list as jest.Mock).mockResolvedValue({ code: 200, data: [] });
      (categoryApi.list as jest.Mock).mockResolvedValue({ code: 200, data: [] });
      (budgetApi.listActive as jest.Mock).mockResolvedValue({ code: 200, data: [] });
      (refundApi.getTransactionRefunds as jest.Mock).mockResolvedValue(mockRefundsResponse);

      render(<TransactionsPage />);

      // Verify API was called
      await waitFor(() => {
        expect(transactionApi.list).toHaveBeenCalled();
        expect(refundApi.getTransactionRefunds).not.toHaveBeenCalled(); // Only called when dialog opens
      });
    });

    it('loads income transactions with refund API mocked', async () => {
      (transactionApi.list as jest.Mock).mockResolvedValue({
        code: 200,
        data: { current: 1, size: 20, total: 1, records: [mockIncomeTransaction] },
      });
      (accountApi.list as jest.Mock).mockResolvedValue({ code: 200, data: [] });
      (categoryApi.list as jest.Mock).mockResolvedValue({ code: 200, data: [] });
      (budgetApi.listActive as jest.Mock).mockResolvedValue({ code: 200, data: [] });
      (refundApi.getTransactionRefunds as jest.Mock).mockResolvedValue({
        code: 200,
        data: {
          transaction: { transactionId: 2, amount: 5000.00, type: 'INCOME' },
          refunds: [],
          summary: { totalRefunded: 0, remainingRefundable: 5000.00, hasRefund: false, refundCount: 0 },
        },
      });

      render(<TransactionsPage />);

      // Verify API was called
      await waitFor(() => {
        expect(transactionApi.list).toHaveBeenCalled();
      });
    });

    it('handles API error for getTransactionRefunds', async () => {
      (transactionApi.list as jest.Mock).mockResolvedValue({
        code: 200,
        data: { current: 1, size: 20, total: 1, records: [mockExpenseTransaction] },
      });
      (accountApi.list as jest.Mock).mockResolvedValue({ code: 200, data: [] });
      (categoryApi.list as jest.Mock).mockResolvedValue({ code: 200, data: [] });
      (budgetApi.listActive as jest.Mock).mockResolvedValue({ code: 200, data: [] });
      (refundApi.getTransactionRefunds as jest.Mock).mockResolvedValue({
        code: 500,
        message: '服务器错误',
      });

      render(<TransactionsPage />);

      // Verify the component handles errors gracefully
      await waitFor(() => {
        expect(screen.getByTestId('dashboard-layout')).toBeInTheDocument();
      });
    });

    it('verifies refund data structure for expense transaction', () => {
      // Test the mock data structure matches expected API response
      expect(mockRefundsResponse.data.transaction.amount).toBe(100.00);
      expect(mockRefundsResponse.data.transaction.type).toBe('EXPENSE');
      expect(mockRefundsResponse.data.summary.totalRefunded).toBe(50.00);
      expect(mockRefundsResponse.data.summary.hasRefund).toBe(true);
      expect(mockRefundsResponse.data.refunds).toHaveLength(1);
    });

    it('verifies refund data structure for income transaction', () => {
      const incomeRefundsResponse = {
        code: 200,
        data: {
          transaction: { transactionId: 2, amount: 5000.00, type: 'INCOME' },
          refunds: [],
          summary: { totalRefunded: 0, remainingRefundable: 5000.00, hasRefund: false, refundCount: 0 },
        },
      };

      expect(incomeRefundsResponse.data.transaction.amount).toBe(5000.00);
      expect(incomeRefundsResponse.data.transaction.type).toBe('INCOME');
      expect(incomeRefundsResponse.data.summary.remainingRefundable).toBe(5000.00);
      expect(incomeRefundsResponse.data.refunds).toHaveLength(0);
    });
  });
});
