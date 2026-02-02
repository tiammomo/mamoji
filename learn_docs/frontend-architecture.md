# Mamoji 前端架构详解

## 一、技术栈概览

| 技术 | 版本 | 用途 |
|------|------|------|
| Next.js | 16 | React 框架 |
| TypeScript | 5.x | 类型安全 |
| React | 19 | UI 库 |
| shadcn/ui | - | UI 组件库 |
| TailwindCSS | 3.x | 原子化 CSS |
| Zustand | - | 状态管理 |
| Axios | - | HTTP 客户端 |
| Recharts | - | 图表库 |
| Jest | 29 | 单元测试 |
| React Testing Library | - | React 测试 |

## 二、项目结构详解

```
web/
├── app/                                    # ========== Next.js App Router ==========
│   ├── layout.tsx                          # 根布局（全局样式、字体）
│   ├── page.tsx                            # 首页（重定向到 /dashboard）
│   ├── globals.css                         # 全局样式
│   ├── login/                              # 登录页
│   │   └── page.tsx
│   ├── register/                           # 注册页
│   │   └── page.tsx
│   └── (dashboard)/                        # 带侧边栏的页面组（路由组）
│       ├── layout.tsx                      # 仪表盘布局
│       │   ├── sidebar.tsx                 # 侧边栏导航
│       │   └── header.tsx                  # 顶部栏（包含账本选择器）
│       ├── dashboard/                      # 首页仪表盘
│       │   └── page.tsx
│       ├── accounts/                       # 账户管理
│       │   └── page.tsx
│       ├── transactions/                   # 交易记录
│       │   └── page.tsx
│       ├── budgets/                        # 预算管理
│       │   └── page.tsx
│       ├── reports/                        # 报表统计
│       │   └── page.tsx
│       ├── categories/                     # 分类管理
│       │   └── page.tsx
│       ├── settings/                       # 设置
│       │   └── page.tsx
│       └── ledgers/                        # 账本管理（多用户共享）
│           ├── page.tsx                    # 账本列表
│           ├── create/                     # 创建账本
│           │   └── page.tsx
│           └── [id]/                       # 账本详情/设置
│               └── page.tsx
│
├── (auth)/                                 # ========== 认证相关页面 ==========
│   └── join/
│       └── [code]/                         # 通过邀请码加入账本
│           └── page.tsx
│
├── components/                             # ========== 组件层 ==========
│   ├── ui/                                 # shadcn/ui 基础组件
│   │   ├── index.ts                        # 导出入口
│   │   ├── button.tsx                      # 按钮
│   │   ├── input.tsx                       # 输入框
│   │   ├── label.tsx                       # 标签
│   │   ├── card.tsx                        # 卡片容器
│   │x                      # 对   ├── dialog.ts话框/模态框
│   │   ├── select.tsx                      # 下拉选择框
│   │   ├── tabs.tsx                        # 标签页
│   │   ├── badge.tsx                       # 徽章/标签
│   │   ├── progress.tsx                    # 进度条
│   │   ├── separator.tsx                   # 分隔线
│   │   ├── toast.tsx                       # 提示消息
│   │   ├── avatar.tsx                      # 头像
│   │   ├── dropdown-menu.tsx               # 下拉菜单
│   │   ├── theme-toggle.tsx                # 主题切换
│   │   ├── form-dialog.tsx                 # 表单对话框
│   │   └── table.tsx                       # 数据表格
│   │
│   ├── charts/                             # 图表组件
│   │   ├── category-pie-chart.tsx          # 分类饼图（收入/支出分布）
│   │   ├── trend-chart.tsx                 # 趋势折线图
│   │   ├── budget-bar-chart.tsx            # 预算柱状图
│   │   └── chart-config.ts                 # 图表配置
│   │
│   ├── ledger/                             # 账本相关组件
│   │   ├── ledger-selector.tsx             # 账本选择器（下拉菜单）
│   │   ├── role-badge.tsx                  # 角色徽章
│   │   ├── invite-modal.tsx                # 邀请码模态框
│   │   └── member-list.tsx                 # 成员列表
│   │
│   ├── layout/                             # 布局组件
│   │   ├── dashboard-layout.tsx            # 仪表盘容器
│   │   └── header.tsx                      # 顶部栏
│   │
│   └── transactions/                       # 交易相关组件
│       ├── transaction-form.tsx            # 交易表单
│       └── transaction-list.tsx            # 交易列表
│
├── hooks/                                  # ========== 自定义 Hooks ==========
│   ├── useAuth.ts                          # 认证状态管理 ⭐核心
│   │   ├── login(credentials)              # 登录
│   │   ├── register(userInfo)              # 注册
│   │   ├── logout()                        # 登出
│   │   └── isAuthenticated                 # 认证状态
│   │
│   ├── useTheme.tsx                        # 主题模式管理
│   │   ├── theme                           # 当前主题
│   │   ├── setTheme(theme)                 # 设置主题
│   │   └── toggleTheme()                   # 切换主题
│   │
│   ├── useCRUD.ts                          # 通用 CRUD Hook
│   │   ├── fetchList()                     # 获取列表
│   │   ├── fetchItem(id)                   # 获取单项
│   │   ├── create(data)                    # 创建
│   │   ├── update(id, data)                # 更新
│   │   └── remove(id)                      # 删除
│   │
│   └── useDataFetch.ts                     # 数据获取 Hook
│       ├── loading                         # 加载状态
│       ├── data                            # 数据
│       ├── error                           # 错误
│       └── refetch()                       # 重新获取
│
├── lib/                                    # ========== 工具库 ==========
│   ├── api.ts                              # Axios 实例封装 ⭐核心
│   │   ├── interceptors.request            # 请求拦截器（添加 Token/账本 ID）
│   │   ├── interceptors.response           # 响应拦截器（错误处理）
│   │   ├── get/post/put/del                # HTTP 方法封装
│   │   └── getApiBaseUrl()                 # API 基础 URL 获取
│   │
│   ├── utils.ts                            # 工具函数
│   │   ├── formatCurrency(amount)          # 格式化货币
│   │   ├── formatDate(date)                # 格式化日期
│   │   └── cnMoney(amount)                 # 中文金额大写
│   │
│   ├── icons.ts                            # 图标导出
│   ├── constants.ts                        # 常量定义
│   │   ├── LEDGER_ROLES                    # 账本角色常量
│   │   ├── ROLE_PERMISSIONS                # 角色权限映射
│   │   └── LEDGER_ROLE_OPTIONS             # 角色选项
│   │
│   └── ledger-api.ts                       # 账本相关 API
│       ├── getLedgers()                    # 获取账本列表
│       ├── createLedger(data)              # 创建账本
│       ├── getMembers(ledgerId)            # 获取成员
│       └── createInvitation(ledgerId, data) # 创建邀请
│
├── store/                                  # ========== 状态管理 ==========
│   ├── ledgerStore.ts                      # 账本状态管理 ⭐核心
│   │   ├── currentLedgerId                 # 当前账本 ID
│   │   ├── currentLedger                   # 当前账本信息
│   │   ├── ledgers                         # 账本列表
│   │   ├── setLedgers(ledgers, defaultId)  # 设置账本列表
│   │   ├── switchLedger(ledgerId)          # 切换账本
│   │   └── clear()                         # 清空状态
│   │
│   └── index.ts                            # Store 导出
│
├── types/                                  # ========== 类型定义 ==========
│   ├── index.ts                            # 全局类型导出
│   ├── auth.ts                             # 认证相关类型
│   ├── transaction.ts                      # 交易类型
│   ├── account.ts                          # 账户类型
│   ├── budget.ts                           # 预算类型
│   ├── category.ts                         # 分类类型
│   ├── report.ts                           # 报表类型
│   └── ledger.ts                           # 账本类型（多用户共享）
│       ├── Ledger                          # 账本
│       ├── LedgerMember                    # 账本成员
│       └── Invitation                      # 邀请码
│
├── __tests__/                              # ========== 测试 ==========
│   ├── setup.ts                            # Jest 测试配置
│   ├── components/                         # 组件测试
│   │   ├── login.test.tsx                  # 登录组件测试
│   │   ├── transactions.test.tsx           # 交易组件测试
│   │   ├── budgets.test.tsx                # 预算组件测试
│   │   ├── reports.test.tsx                # 报表组件测试
│   │   ├── accounts.test.tsx               # 账户组件测试
│   │   ├── categories.test.tsx             # 分类组件测试
│   │   ├── dashboard.test.tsx              # 仪表盘测试
│   │   ├── settings.test.tsx               # 设置组件测试
│   │   ├── avatar.test.tsx                 # 头像组件测试
│   │   ├── button.test.tsx                 # 按钮组件测试
│   │   ├── input.test.tsx                  # 输入框组件测试
│   │   └── progress.test.tsx               # 进度条组件测试
│   │
│   └── unit/                               # 单元测试
│       └── utils.test.ts                   # 工具函数测试
│
├── public/                                 # ========== 静态资源 ==========
│   └── favicon.ico                         # 网站图标
│
├── package.json                            # 依赖配置
├── next.config.ts                          # Next.js 配置
├── tailwind.config.ts                      # TailwindCSS 配置
├── tsconfig.json                           # TypeScript 配置
├── jest.config.js                          # Jest 配置
├── .env.local                              # 本地环境变量
└── .eslintrc.json                          # ESLint 配置
```

## 三、状态管理架构

### 3.1 Zustand Store 结构

```typescript
// 使用 Zustand 进行轻量级状态管理

// 认证状态 (useAuthStore)
interface AuthState {
  token: string | null;           // JWT Token
  user: User | null;              // 当前用户信息
  isAuthenticated: boolean;       // 是否已登录
  error: string | null;           // 错误信息

  // 方法
  login(credentials): Promise<void>;
  register(userInfo): Promise<void>;
  logout(): void;
}

// 账本状态 (ledgerStore)
interface LedgerState {
  currentLedgerId: number | null; // 当前账本 ID
  currentLedger: Ledger | null;   // 当前账本信息
  ledgers: Ledger[];              // 账本列表

  // 方法
  setLedgers(ledgers, defaultId): void;
  switchLedger(ledgerId): void;
  clear(): void;
}
```

### 3.2 状态流

```
┌─────────────────────────────────────────────────────────────┐
│                        用户操作                              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     React 组件                               │
│  useAuthStore / useLedgerStore / useState                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     API 调用层                               │
│  lib/api.ts - Axios 拦截器自动添加 Token 和 X-Ledger-Id     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     后端 API                                 │
│  返回统一格式: { code, message, data, success }             │
└─────────────────────────────────────────────────────────────┘
```

## 四、请求处理流程

### 4.1 Axios 请求拦截器

```typescript
// lib/api.ts - 请求拦截器

// 1. 从 Store 获取认证信息
const token = useAuthStore.getState().token;
if (token) {
  config.headers.Authorization = `Bearer ${token}`;
}

// 2. 添加当前账本 ID（多账本支持）
const currentLedgerId = useLedgerStore.getState().currentLedgerId;
if (currentLedgerId) {
  config.headers['X-Ledger-Id'] = currentLedgerId.toString();
}
```

### 4.2 Axios 响应拦截器

```typescript
// 1. 认证错误处理（401/403）
if (error.response?.status === 401 || error.response?.status === 403) {
  // 清除登录状态
  useAuthStore.setState({ token: null, user: null, isAuthenticated: false });
  // 跳转登录页
  window.location.href = '/login';
}

// 2. 提取错误消息
const message = error.response?.data?.message || error.message;
return Promise.reject(new Error(message));
```

## 五、组件通信模式

### 5.1 Props 传递（父子组件）

```tsx
// 父组件
<TransactionForm
  onSuccess={handleSuccess}  // 回调函数
  defaultValues={{}}          // 默认值
  ledgerId={currentLedgerId}  // 账本 ID
/>

// 子组件
interface TransactionFormProps {
  onSuccess?: () => void;
  defaultValues?: TransactionDTO;
  ledgerId: number;
}
```

### 5.2 Context（跨层级通信）

```tsx
// 使用 React Context
const DashboardContext = createContext<DashboardContextType>({
  currentLedger: null,
  sidebarCollapsed: false,
  toggleSidebar: () => {},
});

// Provider 包裹仪表盘布局
<DashboardContext.Provider value={contextValue}>
  <Sidebar />
  <Header />
  <MainContent />
</DashboardContext.Provider>
```

### 5.3 Zustand（全局状态）

```tsx
// 任意组件访问账本状态
const { currentLedger, switchLedger } = useLedgerStore();

// 任意组件更新认证状态
const { login, logout } = useAuthStore();
```

## 六、页面路由结构

```
/                           # 首页 → 重定向到 /dashboard
├── login                   # 登录页
├── register                # 注册页
├── join/[code]             # 通过邀请码加入账本（无需登录）
│
└── (dashboard)/            # 仪表盘布局组（需要登录）
    ├── layout.tsx          # 仪表盘布局（侧边栏 + 头部）
    ├── dashboard/          # 首页仪表盘
    ├── accounts/           # 账户管理
    ├── transactions/       # 交易记录
    ├── budgets/            # 预算管理
    ├── reports/            # 报表统计
    ├── categories/         # 分类管理
    ├── settings/           # 设置
    └── ledgers/            # 账本管理
        ├── page.tsx        # 账本列表
        ├── create/         # 创建账本
        └── [id]/           # 账本详情/成员管理
```

## 七、API 调用封装

### 7.1 封装方法

```typescript
// lib/api.ts

// GET 请求
export const get = <T>(url: string, params?: object) =>
  api.get<{ code: number; message: string; data: T }>(url, { params })
    .then((res) => res.data);

// POST 请求
export const post = <T>(url: string, data?: object) =>
  api.post<{ code: number; message: string; data: T }>(url, data)
    .then((res) => res.data);

// 业务 API
export const transactionApi = {
  list: (params: TransactionQuery) => get<PageResult<TransactionVO>>('/transactions', params),
  create: (data: TransactionDTO) => post<number>('/transactions', data),
  update: (id: number, data: TransactionDTO) => put<void>(`/transactions/${id}`, data),
  delete: (id: number) => del<void>(`/transactions/${id}`),
};
```

### 7.2 使用示例

```tsx
// 在组件中使用
import { transactionApi } from '@/lib/api';

function TransactionsPage() {
  const [transactions, setTransactions] = useState<TransactionVO[]>([]);

  useEffect(() => {
    // 调用 API
    transactionApi.list({ limit: 10 })
      .then((res) => {
        if (res.success) {
          setTransactions(res.data.list);
        }
      });
  }, []);

  return (
    <TransactionList data={transactions} />
  );
}
```

## 八、样式方案

### 8.1 TailwindCSS 原子化类

```tsx
// 使用 TailwindCSS 类名
<div className="flex items-center justify-between p-4 border-b">
  <h1 className="text-xl font-bold">标题</h1>
  <Button className="bg-primary text-white px-4 py-2 rounded">
    操作
  </Button>
</div>
```

### 8.2 shadcn/ui 组件

```tsx
// 使用 shadcn/ui 组件
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

<Card>
  <CardHeader>
    <CardTitle>账户余额</CardTitle>
  </CardHeader>
  <CardContent>
    <Input placeholder="请输入金额" />
    <Button>确认</Button>
  </CardContent>
</Card>
```

## 九、测试策略

### 9.1 Jest 单元测试

```tsx
// __tests__/components/login.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import LoginPage from '@/app/login/page';

test('登录表单渲染', () => {
  render(<LoginPage />);
  expect(screen.getByLabelText('用户名')).toBeInTheDocument();
  expect(screen.getByLabelText('密码')).toBeInTheDocument();
});

test('登录成功跳转', async () => {
  // Mock API
  jest.spyOn(api, 'post').mockResolvedValue({
    data: { code: 200, success: true, data: { token: 'xxx' } }
  });

  render(<LoginPage />);
  fireEvent.click(screen.getByRole('button', { name: /登录/i }));
  // 验证跳转
});
```

### 9.2 测试文件结构

```
__tests__/
├── setup.ts                    # 测试配置（Jest、Testing Library）
├── components/
│   ├── button.test.tsx         # 基础组件测试
│   ├── input.test.tsx
│   ├── avatar.test.tsx
│   ├── progress.test.tsx
│   ├── login.test.tsx          # 页面组件测试
│   ├── transactions.test.tsx
│   ├── budgets.test.tsx
│   ├── reports.test.tsx
│   ├── accounts.test.tsx
│   ├── categories.test.tsx
│   ├── dashboard.test.tsx
│   └── settings.test.tsx
└── unit/
    └── utils.test.ts           # 工具函数测试
```

## 十、扩展指南

### 10.1 新增页面

1. 在 `app/(dashboard)/` 下创建目录
2. 添加 `page.tsx` 页面组件
3. 在 Sidebar 添加导航入口（如需要）

### 10.2 新增组件

1. 在 `components/` 下创建目录
2. 编写组件代码和类型定义
3. 在 `components/ui/index.ts` 导出（如是基础组件）

### 10.3 新增 API

1. 在 `lib/` 下创建 API 文件或扩展现有文件
2. 使用封装的 `get/post/put/del` 方法
3. 统一错误处理

### 10.4 新增类型

1. 在 `types/` 下添加类型定义
2. 导出到 `types/index.ts`

## 十一、最佳实践

1. **类型优先** - 先定义 TypeScript 类型，再实现组件
2. **组件拆分** - 保持组件小巧，职责单一
3. **状态管理** - 局部状态用 useState，跨组件用 Zustand
4. **API 封装** - 统一封装，错误处理集中
5. **代码注释** - 参考 [CODE_COMMENT_STANDARD.md](../../docs/CODE_COMMENT_STANDARD.md)
6. **测试覆盖** - 核心组件和工具函数编写测试
