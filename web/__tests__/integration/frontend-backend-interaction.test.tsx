/**
 * 前端后端交互测试
 * 测试用户操作触发后端 API 调用的完整流程
 */

// Mock next/navigation first
jest.mock('next/navigation', () => ({
  usePathname: () => '/accounts',
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock API calls - keep mocks at top level
jest.mock('@/api', () => ({
  accountApi: {
    list: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    getSummary: jest.fn(),
  },
  transactionApi: {
    list: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
    getRecent: jest.fn(),
  },
  categoryApi: {
    list: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  budgetApi: {
    list: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
    listActive: jest.fn(),
  },
  authApi: {
    login: jest.fn(),
    logout: jest.fn(),
    profile: jest.fn(),
  },
}));

// Import after mocking
import { accountApi, transactionApi, categoryApi, budgetApi } from '@/api';

// Mock useAuthStore
jest.mock('@/hooks/useAuth', () => ({
  useAuthStore: jest.fn(() => ({
    isAuthenticated: true,
    user: { userId: 1, username: 'admin', role: 'super_admin', status: 1 },
    token: 'test-jwt-token',
    login: jest.fn(),
    logout: jest.fn(),
    checkAuth: jest.fn(),
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

// Import pages for testing
import AccountsPage from '@/app/(dashboard)/accounts/page';
import TransactionsPage from '@/app/(dashboard)/transactions/page';
import BudgetsPage from '@/app/(dashboard)/budgets/page';
import CategoriesPage from '@/app/(dashboard)/categories/page';

describe('前端后端交互测试', () => {
  // 模拟数据
  const mockAccounts = [
    { accountId: 1, name: '工商银行', accountType: 'bank', currency: 'CNY', balance: 10000, includeInTotal: true, status: 1 },
    { accountId: 2, name: '招商银行', accountType: 'bank', currency: 'CNY', balance: 5000, includeInTotal: true, status: 1 },
  ];

  const mockTransactions = [
    { transactionId: 1, accountId: 1, categoryId: 1, type: 'income', amount: 5000, occurredAt: '2026-01-20', note: '工资' },
    { transactionId: 2, accountId: 1, categoryId: 2, type: 'expense', amount: 100, occurredAt: '2026-01-20', note: '午餐' },
  ];

  const mockCategories = [
    { categoryId: 1, name: '工资', type: 'income', status: 1 },
    { categoryId: 2, name: '餐饮', type: 'expense', status: 1 },
    { categoryId: 3, name: '购物', type: 'expense', status: 1 },
  ];

  const mockBudgets = [
    { budgetId: 1, name: '月度餐饮预算', amount: 2000, spent: 500, startDate: '2026-01-01', endDate: '2026-01-31', status: 1, alertThreshold: 80 },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    // Set default mock implementations
    (accountApi.list as jest.Mock).mockResolvedValue({ code: 200, data: mockAccounts });
    (accountApi.getSummary as jest.Mock).mockResolvedValue({ code: 200, data: { totalAssets: 15000, totalLiabilities: 0, netAssets: 15000, accountsCount: 2 } });
    (transactionApi.list as jest.Mock).mockResolvedValue({ code: 200, data: { list: mockTransactions, total: 2, page: 1, pageSize: 100 } });
    (categoryApi.list as jest.Mock).mockResolvedValue({ code: 200, data: mockCategories });
    (budgetApi.list as jest.Mock).mockResolvedValue({ code: 200, data: mockBudgets });
  });

  describe('账户管理模块交互测试', () => {
    it('页面加载时渲染账户管理页面', async () => {
      render(<AccountsPage />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: '账户管理' })).toBeInTheDocument();
      });
    });

    it('页面渲染账户卡片', async () => {
      render(<AccountsPage />);

      await waitFor(() => {
        expect(screen.getByText('工商银行')).toBeInTheDocument();
        expect(screen.getByText('招商银行')).toBeInTheDocument();
      });
    });

    it('显示账户汇总信息', async () => {
      render(<AccountsPage />);

      await waitFor(() => {
        expect(screen.getByText('总资产')).toBeInTheDocument();
        // Use queryAllByText since there are multiple matching elements
        expect(screen.queryAllByText('¥15,000.00')).toHaveLength(2);
      });
    });

    it('显示添加账户按钮', async () => {
      render(<AccountsPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: '添加账户' })).toBeInTheDocument();
      });
    });
  });

  describe('交易记录模块交互测试', () => {
    it('页面加载时渲染交易记录页面', async () => {
      render(<TransactionsPage />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: '交易记录' })).toBeInTheDocument();
      });
    });

    it('页面渲染交易记录', async () => {
      render(<TransactionsPage />);

      await waitFor(() => {
        expect(screen.getByText('工资')).toBeInTheDocument();
        expect(screen.getByText('午餐')).toBeInTheDocument();
      });
    });

    it('显示添加交易按钮', async () => {
      render(<TransactionsPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: '添加交易' })).toBeInTheDocument();
      });
    });
  });

  describe('预算管理模块交互测试', () => {
    it('页面加载时渲染预算管理页面', async () => {
      render(<BudgetsPage />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: '预算管理' })).toBeInTheDocument();
      });
    });

    it('页面渲染预算卡片', async () => {
      render(<BudgetsPage />);

      await waitFor(() => {
        expect(screen.getByText('月度餐饮预算')).toBeInTheDocument();
      });
    });

    it('显示预算金额信息', async () => {
      render(<BudgetsPage />);

      await waitFor(() => {
        expect(screen.getByText(/已花费/)).toBeInTheDocument();
      });
    });

    it('显示添加预算按钮', async () => {
      render(<BudgetsPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: '添加预算' })).toBeInTheDocument();
      });
    });
  });

  describe('分类管理模块交互测试', () => {
    it('页面加载时渲染分类管理页面', async () => {
      render(<CategoriesPage />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: '分类管理' })).toBeInTheDocument();
      });
    });

    it('页面渲染分类列表', async () => {
      render(<CategoriesPage />);

      await waitFor(() => {
        expect(screen.getByText('工资')).toBeInTheDocument();
        expect(screen.getByText('餐饮')).toBeInTheDocument();
      });
    });

    it('分类按类型分组显示', async () => {
      render(<CategoriesPage />);

      // Use regex to match text that contains the category type label
      // The text is broken up by icon elements, so we use a regex matcher
      await waitFor(() => {
        expect(screen.getByText(/收入分类/)).toBeInTheDocument();
      });
      expect(screen.getByText(/支出分类/)).toBeInTheDocument();
    });

    it('显示添加分类按钮', async () => {
      render(<CategoriesPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: '添加分类' })).toBeInTheDocument();
      });
    });
  });

  describe('错误处理测试', () => {
    it('后端返回错误时页面仍可渲染', async () => {
      (accountApi.list as jest.Mock).mockRejectedValue(new Error('Network Error'));

      render(<AccountsPage />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: '账户管理' })).toBeInTheDocument();
      });
    });

    it('后端返回业务错误码时页面仍可渲染', async () => {
      (accountApi.list as jest.Mock).mockResolvedValue({ code: 500, message: '服务器错误' });

      render(<AccountsPage />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: '账户管理' })).toBeInTheDocument();
      });
    });

    it('网络错误时交易页面仍可渲染', async () => {
      (transactionApi.list as jest.Mock).mockRejectedValue(new Error('Network Error'));

      render(<TransactionsPage />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: '交易记录' })).toBeInTheDocument();
      });
    });
  });

  describe('API 响应格式测试', () => {
    it('正确处理分页数据格式', async () => {
      render(<TransactionsPage />);

      await waitFor(() => {
        expect(transactionApi.list).toHaveBeenCalled();
      });
    });

    it('正确处理列表数据格式', async () => {
      render(<CategoriesPage />);

      await waitFor(() => {
        expect(categoryApi.list).toHaveBeenCalled();
      });
    });

    it('正确处理空数据响应', async () => {
      (categoryApi.list as jest.Mock).mockResolvedValue({ code: 200, data: [] });

      render(<CategoriesPage />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: '分类管理' })).toBeInTheDocument();
      });
    });
  });
});
