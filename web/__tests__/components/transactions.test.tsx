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

// Mock lucide-react icons used in transactions page - use wildcard to catch all icons
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
  __esModule: true,
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

jest.mock('@/components/ui/input', () => ({
  Input: ({ ...props }: any) => <input data-testid="input" {...props} />,
}));

jest.mock('@/components/ui/select', () => ({
  Select: ({ children, onValueChange, value, ...props }: any) => <div data-testid="select" data-value={value} {...props}>{children}</div>,
  SelectTrigger: ({ children, ...props }: any) => <div data-testid="select-trigger" {...props}>{children}</div>,
  SelectValue: () => <span data-testid="select-value">SelectValue</span>,
  SelectContent: ({ children, ...props }: any) => <div data-testid="select-content" {...props}>{children}</div>,
  SelectItem: ({ children, value, ...props }: any) => <div data-testid="select-item" data-value={value} {...props}>{children}</div>,
}));

jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, ...props }: any) => <div data-testid="dialog" {...props}>{children}</div>,
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

import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import TransactionsPage from '@/app/(dashboard)/transactions/page';
import { transactionApi, accountApi, categoryApi } from '@/api';

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

    const { container } = render(<TransactionsPage />);
    await waitFor(() => {
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  it('handles API error gracefully', async () => {
    (transactionApi.list as jest.Mock).mockRejectedValue(new Error('API Error'));
    (accountApi.list as jest.Mock).mockResolvedValue({ code: 200, data: [] });
    (categoryApi.list as jest.Mock).mockResolvedValue({ code: 200, data: [] });

    const { container } = render(<TransactionsPage />);
    await waitFor(() => {
      expect(container.firstChild).toBeInTheDocument();
    });
  });
});
