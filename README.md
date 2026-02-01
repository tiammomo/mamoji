# Mamoji 记账系统

个人/家庭记账系统，支持多账户管理、预算控制、收支分析。

## 核心功能

- **账户管理** - 银行卡、信用卡、现金、数字钱包等多类型账户
- **收支记录** - 快速记收入/支出，支持分类和退款
- **预算控制** - 设置预算，跟踪进度，超支提醒
- **报表统计** - 日/月报表、收支趋势、资产负债表

## 快速开始

### 方式一：Docker 启动（推荐）

```bash
# 1. 启动所有服务
docker-compose up -d

# 2. 验证服务状态
docker-compose ps

# 3. 访问应用
# 前端: http://localhost:43000
# 后端 API: http://localhost:48080
```

### 方式二：本地启动

**前置要求**
- Java 17+ | Node.js 18+ | MySQL 8.0 | Redis 7.x

**1. 启动数据库**
```bash
# 使用 Docker 启动 MySQL 和 Redis
docker run -d --name mysql-dev \
  -p 3306:3306 -e MYSQL_ROOT_PASSWORD=rootpassword \
  mysql:8.0 --character-set-server=utf8mb4

docker run -d --name redis-dev \
  -p 6379:6379 redis:7-alpine
```

**2. 初始化数据库**
```bash
mysql -h localhost -P 3306 -u root -prootpassword \
  -e "CREATE DATABASE mamoji DEFAULT CHARACTER SET utf8mb4"
mysql -h localhost -P 3306 -u root -prootpassword mamoji < db/init/*.sql
```

**3. 启动后端**
```bash
cd api
./mvnw spring-boot:run
# 运行在 http://localhost:48080
```

**4. 启动前端**
```bash
cd web
npm install
npm run dev
# 运行在 http://localhost:43000
```

**5. 登录使用**
- 首次访问 http://localhost:43000/register 注册账号
- 或使用预设测试账号

---

## 技术栈

| 层级 | 技术选型 |
|------|----------|
| 后端 | Java 21 + Spring Boot 3.5.3 + MyBatis-Plus 3.5.5 |
| 数据库 | MySQL 8.0 + Redis 7.x (Redisson) |
| 前端 | Next.js 16 + TypeScript + React 19 |
| UI | shadcn/ui + TailwindCSS |
| 认证 | JWT (Bearer Token) |
| 构建 | Maven / npm |

## 项目结构

```
mamoji/
├── api/                  # 后端 (Spring Boot 3.5.3, Java 21)
├── web/                  # 前端 (Next.js 16, TypeScript)
├── docs/                 # 文档
├── db/                   # 数据库脚本
├── scripts/              # 工具脚本
├── deploy/               # 部署配置
└── docker-compose.yml    # Docker 编排
```

## 默认账号

首次运行，系统会自动初始化一些测试数据：

| 类型 | 账号 | 密码 |
|------|------|------|
| 测试用户 | test@example.com | 123456 |

---

## 数据库配置

### Docker 方式
```bash
# MySQL
docker run -d --name mamoji-mysql \
  -p 3306:3306 \
  -e MYSQL_ROOT_PASSWORD=rootpassword \
  -e MYSQL_DATABASE=mamoji \
  --character-set-server=utf8mb4 \
  --collation-server=utf8mb4_unicode_ci \
  mysql:8.0

# Redis
docker run -d --name mamoji-redis \
  -p 6379:6379 redis:7-alpine
```

### 连接验证
```bash
# MySQL
mysql -h localhost -P 3306 -u root -prootpassword -e "SELECT 1"

# Redis
redis-cli -h localhost -p 6379 ping
```

---

## 快速启动命令

```bash
# 后端 (端口 48080)
cd api && ./mvnw spring-boot:run

# 前端 (端口 43000)
cd web && npm run dev

# 运行测试
cd api && ./mvnw test
cd web && npm test
```

---

## 项目结构

```
api/
├── src/main/java/com/mamoji/
│   ├── MamojiApplication.java              # 启动类
│   │
│   ├── config/                             # 配置类
│   │   ├── SecurityConfig.java             # Spring Security 配置 (JWT, CORS)
│   │   ├── RedisConfig.java                # Redis 配置 (Redisson)
│   │   ├── MybatisPlusConfig.java          # MyBatis-Plus 配置
│   │   ├── CorsConfig.java                 # 跨域配置
│   │   └── JacksonConfig.java              # JSON 序列化配置
│   │
│   ├── common/                             # 公共模块
│   │   ├── constant/                       # 常量定义
│   │   │   ├── Constants.java
│   │   │   └── RedisKeys.java
│   │   ├── exception/                      # 异常处理
│   │   │   ├── BusinessException.java      # 业务异常
│   │   │   └── GlobalExceptionHandler.java # 全局异常处理器
│   │   ├── result/                         # 统一响应
│   │   │   ├── ApiResponse.java            # 统一响应类
│   │   │   └── ResultCode.java             # 响应码枚举
│   │   └── utils/                          # 工具类
│   │       ├── JwtUtil.java                # JWT 工具
│   │       ├── SnowflakeIdUtil.java        # 雪花 ID 生成
│   │       └── DateUtil.java               # 日期工具
│   │
│   ├── module/                             # 业务模块
│   │   ├── auth/                           # 认证模块
│   │   │   ├── controller/
│   │   │   │   └── AuthController.java     # 登录/注册/登出
│   │   │   ├── service/
│   │   │   │   ├── AuthService.java
│   │   │   │   └── AuthServiceImpl.java
│   │   │   ├── entity/
│   │   │   │   └── SysUser.java
│   │   │   ├── mapper/
│   │   │   │   └── SysUserMapper.java
│   │   │   └── dto/
│   │   │       ├── LoginRequest.java
│   │   │       └── LoginResponse.java
│   │   │
│   │   ├── account/                        # 账户模块
│   │   │   ├── controller/
│   │   │   │   └── AccountController.java  # 账户 CRUD
│   │   │   ├── service/
│   │   │   │   ├── AccountService.java
│   │   │   │   └── AccountServiceImpl.java
│   │   │   ├── entity/
│   │   │   │   └── FinAccount.java
│   │   │   ├── mapper/
│   │   │   │   └── FinAccountMapper.java
│   │   │   └── vo/
│   │   │       └── AccountVO.java
│   │   │
│   │   ├── transaction/                    # 交易模块
│   │   │   ├── controller/
│   │   │   │   └── TransactionController.java
│   │   │   ├── service/
│   │   │   │   ├── TransactionService.java
│   │   │   │   └── TransactionServiceImpl.java
│   │   │   ├── entity/
│   │   │   │   └── FinTransaction.java
│   │   │   ├── mapper/
│   │   │   │   └── FinTransactionMapper.java
│   │   │   ├── dto/
│   │   │   │   └── TransactionRequest.java
│   │   │   └── vo/
│   │   │       └── TransactionVO.java
│   │   │
│   │   ├── budget/                         # 预算模块
│   │   │   ├── controller/
│   │   │   │   └── BudgetController.java
│   │   │   ├── service/
│   │   │   │   ├── BudgetService.java
│   │   │   │   └── BudgetServiceImpl.java
│   │   │   ├── entity/
│   │   │   │   └── FinBudget.java
│   │   │   ├── mapper/
│   │   │   │   └── FinBudgetMapper.java
│   │   │   └── vo/
│   │   │       └── BudgetProgressVO.java
│   │   │
│   │   ├── category/                       # 分类模块
│   │   │   ├── controller/
│   │   │   │   └── CategoryController.java
│   │   │   ├── service/
│   │   │   │   ├── CategoryService.java
│   │   │   │   └── CategoryServiceImpl.java
│   │   │   ├── entity/
│   │   │   │   └── FinCategory.java
│   │   │   ├── mapper/
│   │   │   │   └── FinCategoryMapper.java
│   │   │   └── vo/
│   │   │       └── CategoryVO.java
│   │   │
│   │   └── report/                         # 报表模块
│   │       ├── controller/
│   │       │   └── ReportController.java
│   │       ├── service/
│   │       │   ├── ReportService.java
│   │       │   └── ReportServiceImpl.java
│   │       └── vo/
│   │           ├── ReportsSummaryVO.java
│   │           └── CategoryReportVO.java
│   │
│   └── security/                           # 安全模块
│       ├── JwtAuthenticationFilter.java    # JWT 过滤器
│       ├── JwtTokenProvider.java           # Token 提供者
│       └── UserPrincipal.java              # 用户主体
│
├── src/main/resources/
│   ├── application.yml                     # 主配置
│   ├── application-dev.yml                 # 开发环境 (端口 48080)
│   ├── application-test.yml                # 测试环境
│   ├── application-prod.yml                # 生产环境
│   ├── mapper/                             # MyBatis XML 映射
│   │   ├── SysUserMapper.xml
│   │   ├── FinAccountMapper.xml
│   │   ├── FinTransactionMapper.xml
│   │   ├── FinBudgetMapper.xml
│   │   └── FinCategoryMapper.xml
│   └── db/init/                            # 数据库初始化脚本
│       └── *.sql
│
├── src/test/java/                          # 测试代码
│   └── com/mamoji/
│       ├── AccountMapperTest.java
│       ├── CategoryMapperTest.java
│       └── MySqlIntegrationTestBase.java
│
└── pom.xml                                 # Maven 配置
```

---

## 前端目录 (web/)

```
web/
├── app/                                    # Next.js App Router
│   ├── layout.tsx                          # 根布局 (全局样式、字体)
│   ├── page.tsx                            # 首页 (重定向到 /dashboard)
│   ├── login/                              # 登录页
│   │   └── page.tsx
│   ├── globals.css                         # 全局样式
│   └── (dashboard)/                        # 带侧边栏的页面组
│       ├── layout.tsx                      # 仪表盘布局
│       │                                   # (包含 Sidebar + Header)
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
│       └── settings/                       # 设置
│           └── page.tsx
│
├── components/                             # React 组件
│   ├── ui/                                 # shadcn/ui 基础组件
│   │   ├── index.ts                        # 导出入口
│   │   ├── button.tsx                      # 按钮
│   │   ├── input.tsx                       # 输入框
│   │   ├── label.tsx                       # 标签
│   │   ├── card.tsx                        # 卡片
│   │   ├── dialog.tsx                      # 对话框
│   │   ├── select.tsx                      # 下拉选择
│   │   ├── tabs.tsx                        # 标签页
│   │   ├── badge.tsx                       # 徽章
│   │   ├── progress.tsx                    # 进度条
│   │   ├── separator.tsx                   # 分隔线
│   │   ├── toast.tsx                       # 提示
│   │   ├── avatar.tsx                      # 头像
│   │   ├── dropdown-menu.tsx               # 下拉菜单
│   │   └── theme-toggle.tsx                # 主题切换
│   │
│   ├── charts/                             # Recharts 图表
│   │   ├── chart-config.ts                 # 图表配置
│   │   ├── category-pie-chart.tsx          # 分类饼图
│   │   ├── trend-chart.tsx                 # 趋势折线图
│   │   └── budget-bar-chart.tsx            # 预算柱状图
│   │
│   └── layout/                             # 布局组件
│       ├── dashboard-layout.tsx            # 仪表盘容器
│       ├── header.tsx                      # 顶部栏
│       └── sidebar.tsx                     # 侧边栏导航
│
├── hooks/                                  # React Hooks
│   ├── useAuth.ts                          # 认证状态 (登录/登出/Token)
│   └── useTheme.tsx                        # 主题模式 (深色/浅色)
│
├── api/                                    # API 调用封装
│   └── index.ts                            # 所有 API 方法
│                                           # (authApi, accountApi, transactionApi...)
│
├── lib/                                    # 工具函数
│   ├── api.ts                              # Axios 实例 (拦截器、BaseURL)
│   └── utils.ts                            # 工具函数 (格式化、日期等)
│
├── types/                                  # TypeScript 类型定义
│   └── index.ts                            # 所有类型定义
│                                           # (Category, Transaction, Budget...)
│
├── __tests__/                              # Jest 单元测试
│   ├── setup.ts
│   └── components/
│       ├── login.test.tsx
│       ├── transactions.test.tsx
│       ├── budgets.test.tsx
│       ├── reports.test.tsx
│       └── ...
│
├── e2e/                                    # Playwright E2E 测试
│   ├── login.spec.ts
│   ├── dashboard.spec.ts
│   ├── transactions.spec.ts
│   └── accounts.spec.ts
│
├── public/                                 # 静态资源
│   └── favicon.ico
│
├── package.json                            # 依赖和脚本
├── next.config.ts                          # Next.js 配置
├── tailwind.config.ts                      # TailwindCSS 配置
├── tsconfig.json                           # TypeScript 配置
├── jest.config.js                          # Jest 配置
├── playwright.config.ts                    # Playwright 配置
└── .env.local                              # 环境变量 (NEXT_PUBLIC_API_URL)
```

---

## 核心功能

### 模块功能

| 模块 | 功能 |
|------|------|
| 账户管理 | 账户 CRUD、余额更新、账户汇总 |
| 交易记录 | 收支记录、分类管理、流水查询 |
| 预算管理 | 预算创建、进度跟踪、超支提醒 |
| 报表统计 | 日/月/年报表、收支分析、资产负债表 |
| 用户认证 | 登录注册、JWT 认证、权限管理 |

### 数据库表

| 表名 | 用途 |
|------|------|
| `sys_user` | 用户账户 |
| `sys_preference` | 用户偏好 |
| `fin_category` | 收支分类 |
| `fin_account` | 账户 |
| `fin_transaction` | 交易记录 |
| `fin_budget` | 预算 |
| `fin_refund` | 退款记录 |

---

## 快速开始

### 环境要求

- Java 17+
- Node.js 18+
- MySQL 8.0
- Redis 7.x

### 后端启动

```bash
cd api

# 安装依赖
./mvnw install

# 开发模式运行 (端口 48080)
./mvnw spring-boot:run

# 运行测试
./mvnw test
```

### 前端启动

```bash
cd web

# 安装依赖
npm install

# 开发模式运行 (端口 43000)
npm run dev

# 构建
npm run build
```

---

## API 文档

| 模块 | Base URL |
|------|----------|
| 认证 | `/api/v1/auth` |
| 账户 | `/api/v1/accounts` |
| 交易 | `/api/v1/transactions` |
| 预算 | `/api/v1/budgets` |
| 分类 | `/api/v1/categories` |
| 报表 | `/api/v1/reports` |

详细 API 文档: [docs/api.md](docs/api.md)

## 测试

### 后端测试

**注意**: 测试需要先启动 Docker MySQL 服务：

```bash
# 启动测试数据库
docker run -d --name mamoji-mysql-test \
  -p 3307:3306 \
  -e MYSQL_ROOT_PASSWORD=rootpassword \
  -e MYSQL_DATABASE=mamoji_test \
  mysql:8.0

# 初始化测试数据库
mysql -h localhost -P 3307 -u root -prootpassword mamoji_test < db/init/*.sql

# 运行测试
cd api && ./mvnw test
```

**测试报告**: `open target/site/jacoco/index.html`

### 前端测试

```bash
cd web

# 单元测试 (Jest + React Testing Library)
npm test

# 运行特定测试
npm test -- --testPathPattern=login.test.tsx

# 测试覆盖率
npm run test:coverage
```

### 集成测试 (Playwright)

```bash
cd web

# 运行所有 e2e 测试
npm run test:e2e

# 有头模式运行 (可以看到浏览器)
npm run test:e2e:headed

# UI 模式 (交互式选择测试)
npm run test:e2e:ui

# 生成测试报告
npx playwright show-report
```

**测试位置**: `web/e2e/` 目录

| 测试文件 | 测试内容 |
|----------|----------|
| `e2e/login.spec.ts` | 登录页面元素、表单输入 |
| `e2e/dashboard.spec.ts` | 认证保护、重定向测试 |
| `e2e/accounts.spec.ts` | 受保护页面重定向 |
| `e2e/transactions.spec.ts` | 多页面认证测试 |

---

## 文档说明

| 文档 | 说明 |
|------|------|
| [PRD](docs/prd.md) | 产品需求文档 |
| [API](docs/api.md) | API 接口文档 |
| [DB](docs/db.md) | 数据库设计 |

## License

MIT
