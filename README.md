# Mamoji - 家庭记账工具

一款面向家庭的 Web 端记账工具，支持多成员独立账号使用，提供基础记账功能和统计报表分析。

## 功能特性

- **用户认证** - 注册/登录，JWT 令牌认证
- **记账功能** - 收入/支出记录，支持退款
- **账户管理** - 现金、银行卡、信用卡、数字钱包、投资账户（显示当前余额）
- **分类管理** - 系统预置分类，支持自定义
- **预算管理** - 月度预算设置，支出预警
- **统计报表** - 收支趋势、分类统计
- **搜索功能** - 支持按关键词搜索交易、账户、预算
- **日期筛选** - 支持自定义日期范围筛选（交易、报表、预算）
- **用户管理** - 管理员可管理普通用户权限

## 技术栈

| 层级 | 技术 |
|------|------|
| 后端 | Spring Boot 3.5.x + Java 21 |
| 前端 | Next.js 16.x + React 18 |
| UI | Tailwind CSS 3.4 |
| 图表 | Recharts |
| 数据库 | H2 (开发) / MySQL (生产) |
| 认证 | JWT |

## 项目结构

```
mamoji/
├── backend/              # Spring Boot 后端
│   ├── src/main/java/   # Java 源码
│   └── pom.xml          # Maven 配置
├── frontend/            # Next.js 前端
│   ├── src/app/         # App Router 页面
│   ├── src/components/  # React 组件
│   └── package.json     # NPM 配置
├── docs/                # 项目文档
│   ├── PRD.md           # 产品需求
│   ├── DB.md            # 数据库设计
│   └── API.md           # API 文档
├── tools/               # 工具脚本
└── .claude/             # Claude Code 配置
```

## 快速开始

### 环境要求

- Java 21+
- Node.js 18+
- Maven 3.8+

### 1. 克隆项目

```bash
git clone https://github.com/tiammomo/mamoji.git
cd mamoji
```

### 2. 启动后端

```bash
cd backend

# 方式一：使用 Maven
mvn spring-boot:run

# 方式二：构建后运行
mvn package
java -jar target/mamoji-0.0.1-SNAPSHOT.jar
```

后端启动后访问 http://localhost:38080

### 3. 启动前端

```bash
cd frontend
npm install
npm run dev
```

前端启动后访问 http://localhost:33000

### 4. 测试账号

| 邮箱 | 密码 |
|------|------|
| test@mamoji.com | 123456 |

## 环境配置

### 前端配置

编辑 `mamoji.config.json` 后运行：

```bash
node tools/sync-config.js
```

### 后端配置

复制环境变量模板：

```bash
cp .env.back.example backend/.env
```

常用配置项：
- `SERVER_PORT` - 服务端口 (默认 38080)
- `JWT_SECRET` - JWT 密钥 (生产环境必须修改)
- `SPRING_DATASOURCE_URL` - 数据库连接

## API 文档

详见 [docs/API.md](docs/API.md)

主要接口：
- `/api/v1/auth/*` - 认证相关
- `/api/v1/transactions` - 交易记录
- `/api/v1/accounts` - 账户管理
- `/api/v1/budgets` - 预算管理
- `/api/v1/categories` - 分类管理
- `/api/v1/stats` - 统计报表

## 开发指南

### 添加测试数据

通过 API 添加：
```bash
# 登录获取 token
TOKEN=$(curl -s -X POST http://localhost:38080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@mamoji.com","password":"123456"}' | jq -r '.data.token')

# 添加账户
curl -X POST http://localhost:38080/api/v1/accounts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"测试账户","type":"cash","balance":1000}'

# 添加交易
curl -X POST http://localhost:38080/api/v1/transactions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type":1,"amount":5000,"categoryId":1,"accountId":1,"date":"2026-03-01","note":"工资"}'
```

## 文档

- [产品需求文档](docs/PRD.md)
- [数据库设计](docs/DB.md)
- [API 文档](docs/API.md)
- [部署指南](docs/DEPLOY.md)

## License

MIT
