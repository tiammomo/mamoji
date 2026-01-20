# Mamoji 记账系统

个人/家庭记账系统，支持多账户管理、预算控制、收支分析。

## 技术栈

| 层级 | 技术选型 |
|------|----------|
| 后端 | Java + Spring Boot 3.5.x + MyBatis-Plus |
| 数据库 | MySQL 8.0 |
| 缓存 | Redis 7.x + Redisson |
| 前端 | Next.js 16 + TypeScript |
| UI 组件 | shadcn/ui + Tailwind CSS |
| 认证 | JWT (Bearer Token) |
| 构建工具 | Maven / npm |

## 项目结构

```
mamoji/
├── api/                  # 后端 (Java + Spring Boot)
│   ├── src/main/java/
│   │   └── com/mamoji/
│   │       ├── MamojiApplication.java    # 启动类
│   │       ├── config/                    # 配置类
│   │       ├── common/                    # 公共模块
│   │       │   ├── constant/              # 常量定义
│   │       │   ├── exception/             # 异常处理
│   │       │   ├── result/                # 统一响应
│   │       │   └── utils/                 # 工具类
│   │       ├── module/                    # 业务模块
│   │       │   ├── auth/                  # 认证模块
│   │       │   ├── account/               # 账户模块
│   │       │   ├── transaction/           # 交易模块
│   │       │   ├── budget/                # 预算模块
│   │       │   ├── category/              # 分类模块
│   │       │   └── report/                # 报表模块
│   │       └── security/                  # 安全模块
│   └── src/main/resources/
│       ├── application.yml                # 主配置
│       ├── application-dev.yml            # 开发环境
│       └── application-test.yml           # 测试环境
│
├── web/                   # 前端 (Next.js)
│   ├── app/               # App Router
│   ├── components/        # 组件
│   ├── api/               # API 调用
│   └── types/             # 类型定义
│
├── docs/                  # 文档
│   ├── prd.md             # 产品需求文档
│   ├── api.md             # API 接口文档
│   └── db.md              # 数据库设计
│
├── db/                    # 数据库脚本
│   └── codes/             # 数据库操作脚本
│
├── scripts/               # 工具脚本
│   └── setup_env.sh       # 环境变量配置
│
└── deploy/                # 部署配置
```

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

# 开发模式运行
./mvnw spring-boot:run

# 运行测试
./mvnw test
```

### 前端启动

```bash
cd web

# 安装依赖
npm install

# 开发模式运行
npm run dev

# 构建
npm run build
```

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

```bash
# 后端测试
cd api
./mvnw test

# 测试报告
open target/site/jacoco/index.html
```

## 文档说明

| 文档 | 说明 |
|------|------|
| [PRD](docs/prd.md) | 产品需求文档 |
| [API](docs/api.md) | API 接口文档 |
| [DB](docs/db.md) | 数据库设计 |

## License

MIT
