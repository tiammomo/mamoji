/**
 * BudgetsPage Tests
 */

jest.mock('next/navigation', () => ({
  usePathname: () => '/budgets',
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

jest.mock('@/api', () => ({
  budgetApi: {
    list: jest.fn(),
    get: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    getProgress: jest.fn(),
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

// Mock lucide-react icons used in budgets page
jest.mock('lucide-react', () => ({
  Plus: () => 'Plus',
  Edit: () => 'Edit',
  Trash2: () => 'Trash2',
  AlertTriangle: () => 'AlertTriangle',
  CheckCircle: () => 'CheckCircle',
  Clock: () => 'Clock',
  Target: () => 'Target',
  TrendingUp: () => 'TrendingUp',
  DollarSign: () => 'DollarSign',
  PieChart: () => 'PieChart',
  Calendar: () => 'Calendar',
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

jest.mock('@/components/ui/progress', () => ({
  Progress: ({ value, className, ...props }: any) => (
    <div className={className} data-testid="progress" {...props}>
      <div style={{ width: `${value || 0}%` }} data-testid="progress-indicator" />
    </div>
  ),
}));

jest.mock('@/components/ui/input', () => ({
  Input: ({ ...props }: any) => <input data-testid="input" {...props} />,
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

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant, ...props }: any) => <span data-testid="badge" data-variant={variant} {...props}>{children}</span>,
}));

jest.mock('@/components/layout/dashboard-layout', () => ({
  DashboardLayout: ({ children, title }: any) => <div data-testid="dashboard-layout" data-title={title}>{children}</div>,
}));

import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import BudgetsPage from '@/app/(dashboard)/budgets/page';
import { budgetApi, categoryApi } from '@/api';

describe('BudgetsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', async () => {
    (budgetApi.list as jest.Mock).mockResolvedValue({ code: 200, data: [] });
    (categoryApi.list as jest.Mock).mockResolvedValue({ code: 200, data: [] });

    const { container } = render(<BudgetsPage />);
    await waitFor(() => {
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  it('handles API error gracefully', async () => {
    (budgetApi.list as jest.Mock).mockRejectedValue(new Error('API Error'));
    (categoryApi.list as jest.Mock).mockResolvedValue({ code: 200, data: [] });

    const { container } = render(<BudgetsPage />);
    await waitFor(() => {
      expect(container.firstChild).toBeInTheDocument();
    });
  });
});
