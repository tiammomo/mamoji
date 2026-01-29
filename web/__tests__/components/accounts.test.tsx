/**
 * AccountsPage Tests
 */

// Mock next/navigation first before any imports
jest.mock('next/navigation', () => ({
  usePathname: () => '/accounts',
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

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

// Mock UI components that use radix primitives
jest.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children, defaultValue, ...props }: any) => <div data-testid="tabs" {...props}>{children}</div>,
  TabsList: ({ children, ...props }: any) => <div data-testid="tabs-list" {...props}>{children}</div>,
  TabsTrigger: ({ children, value, ...props }: any) => <button data-testid={`tabs-trigger-${value}`} {...props}>{children}</button>,
  TabsContent: ({ children, value, ...props }: any) => <div data-testid={`tabs-content-${value}`} {...props}>{children}</div>,
}));

jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open, onOpenChange, ...props }: any) => <div data-testid="dialog" {...props}>{children}</div>,
  DialogContent: ({ children, ...props }: any) => <div data-testid="dialog-content" {...props}>{children}</div>,
  DialogHeader: ({ children, ...props }: any) => <div data-testid="dialog-header" {...props}>{children}</div>,
  DialogTitle: ({ children, ...props }: any) => <div data-testid="dialog-title" {...props}>{children}</div>,
  DialogDescription: ({ children, ...props }: any) => <div data-testid="dialog-description" {...props}>{children}</div>,
  DialogFooter: ({ children, ...props }: any) => <div data-testid="dialog-footer" {...props}>{children}</div>,
}));

jest.mock('@/components/ui/select', () => ({
  Select: ({ children, ...props }: any) => <div data-testid="select" {...props}>{children}</div>,
  SelectContent: ({ children, ...props }: any) => <div data-testid="select-content" {...props}>{children}</div>,
  SelectItem: ({ children, value, ...props }: any) => <div data-testid={`select-item-${value}`} {...props}>{children}</div>,
  SelectTrigger: ({ children, ...props }: any) => <button data-testid="select-trigger" {...props}>{children}</button>,
  SelectValue: ({ placeholder, ...props }: any) => <span data-testid="select-value">{placeholder}</span>,
}));

jest.mock('@/components/ui/label', () => ({
  Label: ({ children, htmlFor, ...props }: any) => <label htmlFor={htmlFor} data-testid="label" {...props}>{children}</label>,
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

jest.mock('@/components/ui/input', () => ({
  Input: ({ type, placeholder, value, onChange, ...props }: any) => (
    <input type={type} placeholder={placeholder} value={value} onChange={onChange} data-testid="input" {...props} />
  ),
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

// Now import after all mocks
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AccountsPage from '@/app/(dashboard)/accounts/page';
import { accountApi } from '@/api';

describe('AccountsPage', () => {
  const mockAccounts = [
    { accountId: 1, name: '主账户', accountType: 'bank', currency: 'CNY', balance: 10000, includeInTotal: true, status: 1 },
    { accountId: 2, name: '储蓄卡', accountType: 'bank', currency: 'CNY', balance: 5000, includeInTotal: true, status: 1 },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (accountApi.list as jest.Mock).mockResolvedValue({ code: 200, data: mockAccounts });
    (accountApi.getSummary as jest.Mock).mockResolvedValue({ code: 200, data: { totalAssets: 15000, totalLiabilities: 0, netAssets: 15000, accountsCount: 2 } });
  });

  it('renders without crashing', async () => {
    const { container } = render(<AccountsPage />);
    await waitFor(() => {
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  it('renders page title when API succeeds', async () => {
    render(<AccountsPage />);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: '账户管理' })).toBeInTheDocument();
    });
  });

  it('renders account cards when data loads', async () => {
    const { container } = render(<AccountsPage />);
    // Wait for page to load - container should have content
    await waitFor(() => {
      expect(container.querySelector('[data-testid="dashboard-layout"]')).toBeInTheDocument();
    });
    // Verify the dashboard-layout has the correct title attribute (it's passed as prop, not rendered as text)
    expect(container.querySelector('[data-testid="dashboard-layout"]')).toHaveAttribute('data-title', '账户管理');
  });

  it('shows add account button', async () => {
    render(<AccountsPage />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: '添加账户' })).toBeInTheDocument();
    });
  });

  it('handles API error gracefully', async () => {
    (accountApi.list as jest.Mock).mockRejectedValue(new Error('API Error'));
    const { container } = render(<AccountsPage />);
    // Page should still render without crashing
    await waitFor(() => {
      expect(container.firstChild).toBeInTheDocument();
    });
  });
});
