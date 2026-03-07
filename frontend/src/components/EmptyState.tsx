import { FolderOpen, FileText, Users, CreditCard, Wallet, BarChart3 } from 'lucide-react';

interface EmptyStateProps {
  type?: 'default' | 'transactions' | 'accounts' | 'budgets' | 'categories' | 'reports';
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const icons = {
  default: FolderOpen,
  transactions: FileText,
  accounts: CreditCard,
  budgets: Wallet,
  categories: FolderOpen,
  reports: BarChart3,
};

const defaultContent = {
  default: {
    title: '暂无数据',
    description: '暂无相关内容，请尝试其他操作',
  },
  transactions: {
    title: '暂无交易记录',
    description: '点击下方按钮添加您的第一笔交易',
  },
  accounts: {
    title: '暂无账户',
    description: '创建您的第一个账户来开始记账',
  },
  budgets: {
    title: '暂无预算',
    description: '设置预算帮助您合理消费',
  },
  categories: {
    title: '暂无分类',
    description: '创建分类来更好地管理您的收支',
  },
  reports: {
    title: '暂无报表数据',
    description: '添加一些交易记录后即可查看报表',
  },
};

export default function EmptyState({
  type = 'default',
  title,
  description,
  action,
}: EmptyStateProps) {
  const Icon = icons[type];
  const content = defaultContent[type];

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-1">
        {title || content.title}
      </h3>
      <p className="text-gray-500 text-center max-w-sm mb-6">
        {description || content.description}
      </p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
