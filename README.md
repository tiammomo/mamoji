# Mamoji 记账系统

个人/家庭记账系统，支持多账户管理、预算控制、收支分析、多用户共享账本。

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
./mvnw spring-boot:run  # 运行在 http://localhost:48080
```

**4. 启动前端**
```bash
cd web
npm install
npm run dev  # 运行在 http://localhost:43000
```

**5. 登录使用**
- 访问 http://localhost:43000/register 注册账号

---

## 项目文档

### 开发者学习文档

| 文档 | 说明 | 目标读者 |
|------|------|----------|
| [learn_docs/getting-started.md](learn_docs/getting-started.md) | 用户快速上手指南 | 新用户 |
| [learn_docs/features.md](learn_docs/features.md) | 功能详解 | 新用户 |
| [learn_docs/backend-architecture.md](learn_docs/backend-architecture.md) | **后端架构详解** | 后端开发者 |
| [learn_docs/frontend-architecture.md](learn_docs/frontend-architecture.md) | **前端架构详解** | 前端开发者 |
| [learn_docs/database-design.md](learn_docs/database-design.md) | **数据库设计详解** | 全栈开发者 |
| [docs/CODE_COMMENT_STANDARD.md](docs/CODE_COMMENT_STANDARD.md) | 代码注释规范 | 全体开发者 |

### 技术栈

| 层级 | 技术选型 |
|------|----------|
| 后端 | Java 21 + Spring Boot 3.5.3 + MyBatis-Plus 3.5.5 |
| 数据库 | MySQL 8.0 + Redis 7.x (Redisson) |
| 前端 | Next.js 16 + TypeScript + React 19 |
| UI | shadcn/ui + TailwindCSS |
| 认证 | JWT (Bearer Token) |
| 测试 | JUnit + Jest + React Testing Library |

### 快速启动命令

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

## 核心功能

### 模块功能

| 模块 | 功能 |
|------|------|
| 账户管理 | 账户 CRUD、余额更新、账户汇总 |
| 交易记录 | 收支记录、分类管理、流水查询、退款功能 |
| 预算管理 | 预算创建、进度跟踪、超支提醒 |
| 报表统计 | 日/月/年报表、收支分析、资产负债表 |
| 账本共享 | 多用户共享账本、邀请码分享、角色权限 |
| 用户认证 | 登录注册、JWT 认证、权限管理 |

### 数据库表

| 表名 | 用途 |
|------|------|
| `sys_user` | 用户账户 |
| `sys_preference` | 用户偏好 |
| `fin_ledger` | 账本（多用户共享） |
| `fin_ledger_member` | 账本成员 |
| `fin_invitation` | 邀请码 |
| `fin_category` | 收支分类 |
| `fin_account` | 账户 |
| `fin_transaction` | 交易记录 |
| `fin_refund` | 退款记录 |
| `fin_budget` | 预算 |

---

## 项目结构

```
mamoji/
├── api/                  # 后端 (Spring Boot 3.5.3, Java 21)
│   └── src/main/java/com/mamoji/
│       ├── config/       # 配置类 (Security, Redis, CORS)
│       ├── common/       # 公共模块 (Result, Exception, Utils)
│       ├── security/     # 安全模块 (JWT, 认证过滤器)
│       ├── module/       # 业务模块
│       │   ├── auth/     # 认证模块
│       │   ├── account/  # 账户模块
│       │   ├── transaction/ # 交易模块
│       │   ├── budget/   # 预算模块
│       │   ├── category/ # 分类模块
│       │   ├── report/   # 报表模块
│       │   └── ledger/   # 账本模块（多用户共享）
│       └── MamojiApplication.java
│
├── web/                  # 前端 (Next.js 16, TypeScript)
│   ├── app/              # Next.js App Router 页面
│   ├── components/       # React 组件
│   │   ├── ui/           # shadcn/ui 基础组件
│   │   ├── charts/       # Recharts 图表
│   │   └── ledger/       # 账本相关组件
│   ├── hooks/            # 自定义 Hooks
│   ├── lib/              # 工具库 (API, Utils)
│   ├── store/            # Zustand 状态管理
│   ├── types/            # TypeScript 类型
│   └── __tests__/        # 测试
│
├── learn_docs/           # 学习文档 ⭐
│   ├── getting-started.md
│   ├── features.md
│   ├── backend-architecture.md    # 后端架构
│   ├── frontend-architecture.md   # 前端架构
│   └── database-design.md         # 数据库设计
│
├── docs/                 # 技术文档
│   ├── CODE_COMMENT_STANDARD.md   # 代码注释规范
│   ├── api.md            # API 文档
│   ├── prd.md            # 产品需求文档
│   └── db.md             # 数据库设计
│
├── db/                   # 数据库脚本
│   └── init/             # 初始化脚本
│
└── docker-compose.yml    # Docker 编排配置
```

---

## API 文档

### 模块 Base URL

| 模块 | Base URL |
|------|----------|
| 认证 | `/api/v1/auth` |
| 账户 | `/api/v1/accounts` |
| 交易 | `/api/v1/transactions` |
| 预算 | `/api/v1/budgets` |
| 分类 | `/api/v1/categories` |
| 报表 | `/api/v1/reports` |
| 账本 | `/api/v1/ledgers` |
| 邀请 | `/api/v1/invitations` |

### 统一响应格式

```json
{
  "code": 200,
  "message": "操作成功",
  "data": {...},
  "success": true
}
```

详细 API 文档: [docs/api.md](docs/api.md)

---

## 开发者指南

### 学习路径

1. **新手入门**
   - 阅读本 README 了解项目
   - 使用 Docker 启动完整环境
   - 注册账号，体验核心功能

2. **后端开发**
   - 阅读 [backend-architecture.md](learn_docs/backend-architecture.md)
   - 了解项目结构和核心类
   - 参考 [CODE_COMMENT_STANDARD.md](docs/CODE_COMMENT_STANDARD.md) 编写注释

3. **前端开发**
   - 阅读 [frontend-architecture.md](learn_docs/frontend-architecture.md)
   - 了解组件结构和状态管理
   - 熟悉 Next.js App Router 用法

4. **数据库开发**
   - 阅读 [database-design.md](learn_docs/database-design.md)
   - 了解表结构和索引设计
   - 掌握常用查询示例

### 代码规范

- **后端**: 遵循 [CODE_COMMENT_STANDARD.md](docs/CODE_COMMENT_STANDARD.md)
- **前端**: ESLint + Prettier + TypeScript 严格模式
- **提交**: 使用 `git commit -m "feat: 新增xxx功能"`

### 测试

```bash
# 后端测试（需要 Docker MySQL）
cd api && ./mvnw test

# 前端测试
cd web && npm test

# 测试覆盖率报告
open target/site/jacoco/index.html  # 后端
npm run test:coverage               # 前端
```

---

## 贡献指南

1. Fork 本仓库
2. 创建特性分支 `git checkout -b feature/xxx`
3. 提交代码 `git commit -m "feat: xxx"`
4. 推送到分支 `git push origin feature/xxx`
5. 创建 Pull Request

---

## License

MIT License

---

## 联系方式

- 项目地址: https://github.com/tiammomo/mamoji
- 问题反馈: https://github.com/tiammomo/mamoji/issues
- 邮箱: tiammomo@outlook.com
