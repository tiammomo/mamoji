// Lucide React mock for Jest tests
// This mock provides proper React components for testing purposes

const React = require('react');

// Create a proper icon mock component
const createIconMock = (name) => {
  const MockComponent = React.forwardRef(({ className, ...props }, ref) => {
    return React.createElement(
      'svg',
      {
        'data-testid': name,
        className,
        ...props,
        ref,
        xmlns: 'http://www.w3.org/2000/svg',
        width: 24,
        height: 24,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: 2,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
      },
      React.createElement('circle', { cx: 12, cy: 12, r: 10 })
    );
  });
  MockComponent.displayName = name;
  return MockComponent;
};

const icons = {
  // Navigation icons
  LayoutDashboard: createIconMock('LayoutDashboard'),
  Wallet: createIconMock('Wallet'),
  Receipt: createIconMock('Receipt'),
  PieChart: createIconMock('PieChart'),
  Target: createIconMock('Target'),
  Tags: createIconMock('Tags'),
  Settings: createIconMock('Settings'),
  LogOut: createIconMock('LogOut'),

  // Action icons
  Plus: createIconMock('Plus'),
  Edit: createIconMock('Edit'),
  Trash2: createIconMock('Trash2'),
  Bell: createIconMock('Bell'),
  Search: createIconMock('Search'),
  ArrowUpCircle: createIconMock('ArrowUpCircle'),
  ArrowDownCircle: createIconMock('ArrowDownCircle'),
  ArrowRight: createIconMock('ArrowRight'),
  X: createIconMock('X'),
  ChevronDown: createIconMock('ChevronDown'),
  ChevronUp: createIconMock('ChevronUp'),
  MoreHorizontal: createIconMock('MoreHorizontal'),
  Check: createIconMock('Check'),

  // Financial icons
  TrendingUp: createIconMock('TrendingUp'),
  TrendingDown: createIconMock('TrendingDown'),
  CreditCard: createIconMock('CreditCard'),
  Banknote: createIconMock('Banknote'),
  PiggyBank: createIconMock('PiggyBank'),
  DollarSign: createIconMock('DollarSign'),

  // Status icons
  AlertTriangle: createIconMock('AlertTriangle'),
  CheckCircle: createIconMock('CheckCircle'),
  Clock: createIconMock('Clock'),
  Tag: createIconMock('Tag'),
  AlertCircle: createIconMock('AlertCircle'),
  Info: createIconMock('Info'),

  // Misc icons
  Menu: createIconMock('Menu'),
  Sun: createIconMock('Sun'),
  Moon: createIconMock('Moon'),
  Download: createIconMock('Download'),
  Upload: createIconMock('Upload'),
  Filter: createIconMock('Filter'),
  RefreshCw: createIconMock('RefreshCw'),
  Calendar: createIconMock('Calendar'),
  FileText: createIconMock('FileText'),
  Printer: createIconMock('Printer'),
};

module.exports = icons;
