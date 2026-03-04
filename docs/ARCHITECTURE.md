# 系统架构设计

## 1. MVP 架构概述

> MVP 阶段采用简化架构，后续平滑升级。

### 1.1 MVP 系统架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                         前端 (Next.js)                          │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  /login  /register  /  /transactions  /reports  /settings │ │
│  └──────────────────────────────────────────────────────────┘ │
└─────────────────────────────┬───────────────────────────────────┘
                              │ HTTP + JSON
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       后端 (Spring Boot)                         │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  Controller 层                                           │ │
│  │  AuthController / TransactionController / StatsController│ │
│  ├──────────────────────────────────────────────────────────┤ │
│  │  Service 层                                              │ │
│  │  AuthService / TransactionService / StatsService        │ │
│  ├──────────────────────────────────────────────────────────┤ │
│  │  Repository 层                                           │ │
│  │  JPA Repository                                         │ │
│  └──────────────────────────────────────────────────────────┘ │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      数据层 (SQLite/MySQL)                       │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  users / categories / transactions                      │ │
│  └──────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 MVP 技术栈

| 层级 | MVP 技术 | 后期升级 |
|------|----------|----------|
| 前端 | Next.js 16.x | + React Query 状态管理 |
| 后端 | Spring Boot 3.5.x | 微服务拆分 |
| 数据库 | SQLite | → MySQL 8.0 |
| 部署 | Docker Compose | → K8s |

### 1.3 生产环境架构（V1.0+）

> MVP 完成后可升级到生产架构：

```
┌────────────────────────────────────────────────────────────────────────┐
│                              客户端层                                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                   │
│  │   Web 浏览器  │  │  PWA 应用   │  │  移动端 H5  │                   │
└─────────┼────────────────┼────────────────┼────────────────────────────┘
          │                │                │
          ▼                ▼                ▼
┌────────────────────────────────────────────────────────────────────────┐
│                           负载均衡层 (Nginx)                            │
└────────────────────────────────────────────────────────────────────────┘
          │
          ▼
┌────────────────────────────────────────────────────────────────────────┐
│                           应用服务层                                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                   │
│  │  用户服务     │  │  交易服务    │  │  统计服务    │                   │
│  │   Auth      │  │ Transaction  │  │  Statistics │                   │
│  └─────────────┘  └─────────────┘  └─────────────┘                   │
└─────────────────────────────┬───────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────────────┐
│                           数据层                                        │
│  ┌─────────────┐  ┌─────────────┐                                      │
│  │    MySQL    │  │    Redis    │                                      │
│  └─────────────┘  └─────────────┘                                      │
└────────────────────────────────────────────────────────────────────────┘
```
│  │  • 配置：Spring Cloud Config / Nacos                           │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────┘
          │
          ▼
┌────────────────────────────────────────────────────────────────────────┐
│                            数据层                                       │
│                                                                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │
│  │    MySQL    │  │    Redis    │  │    文件存储   │  │   Elasticsearch │ │
│  │   主数据库   │  │  缓存/Session │  │  头像/导出   │  │   日志分析   │  │
│  │             │  │             │  │              │  │              │  │
│  │ • 主从复制  │  │ • 数据缓存  │  │ • MinIO     │  │ • 日志聚合   │  │
│  │ • 读写分离  │  │ • Token 存储│  │ • CDN 分发  │  │ • 慢查询分析 │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘  │
│                                                                          │
└────────────────────────────────────────────────────────────────────────┘
          │
          ▼
┌────────────────────────────────────────────────────────────────────────┐
│                          监控运维层                                      │
│                                                                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │
│  │  Prometheus │  │   Grafana   │  │    ELK      │  │   Docker    │  │
│  │   指标采集  │  │   可视化    │  │   日志聚合  │  │   容器编排  │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘  │
│                                                                          │
└────────────────────────────────────────────────────────────────────────┘
```

### 1.2 技术栈总览

| 层级 | 技术选型 | 版本 |
|------|----------|------|
| 前端框架 | Next.js | 16.x |
| 前端 UI | React + Tailwind CSS | React 18+ |
| 后端框架 | Spring Boot | 3.5.x |
| 后端语言 | Java | 21 |
| API 风格 | RESTful | - |
| 数据库 | MySQL | 8.0 |
| 缓存 | Redis | 7.x |
| 消息队列 | RabbitMQ (可选) | 3.x |
| 搜索引擎 | Elasticsearch (可选) | 8.x |
| 容器化 | Docker | 24.x |
| 编排 | Docker Compose | 2.x |
| CI/CD | GitHub Actions | - |
| 监控 | Prometheus + Grafana | - |

---

## 2. 前端架构

### 2.1 Next.js App Router 结构

```
frontend/
├── app/                          # App Router 根目录
│   ├── (auth)/                   # 认证路由组（无需登录）
│   │   ├── login/
│   │   │   ├── page.tsx         # 登录页面
│   │   │   └── components/
│   │   └── register/
│   │       └── page.tsx
│   │
│   ├── (dashboard)/              # 仪表盘路由组（需登录）
│   │   ├── layout.tsx           # 仪表盘布局（侧边栏 + Header）
│   │   ├── page.tsx             # 首页/仪表盘
│   │   ├── transactions/
│   │   │   ├── page.tsx         # 交易列表
│   │   │   ├── new/page.tsx    # 新增交易
│   │   │   └── [id]/edit/page.tsx
│   │   ├── reports/
│   │   │   └── page.tsx
│   │   ├── accounts/
│   │   │   └── page.tsx
│   │   ├── categories/
│   │   │   └── page.tsx
│   │   └── settings/
│   │       ├── profile/page.tsx
│   │       ├── family/page.tsx
│   │       └── security/page.tsx
│   │
│   ├── api/                      # API 路由（SSR/BFF）
│   │   ├── auth/[...nextauth].ts
│   │   └── proxy/
│   │
│   ├── globals.css               # 全局样式
│   ├── layout.tsx               # 根布局
│   └── loading.tsx              # 全局加载态
│
├── components/                   # 公共组件
│   ├── ui/                      # 基础 UI 组件
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   └── Card.tsx
│   ├── forms/                   # 表单组件
│   │   ├── TransactionForm.tsx
│   │   └── LoginForm.tsx
│   └── charts/                  # 图表组件
│       ├── TrendChart.tsx
│       └── CategoryPieChart.tsx
│
├── lib/                         # 工具库
│   ├── api.ts                   # API 请求封装
│   ├── auth.ts                  # 认证逻辑
│   ├── utils.ts                 # 工具函数
│   └── constants.ts             # 常量定义
│
├── hooks/                       # 自定义 Hooks
│   ├── useAuth.ts
│   ├── useTransactions.ts
│   └── useStats.ts
│
├── types/                       # TypeScript 类型
│   ├── api.ts
│   └── models.ts
│
├── public/                      # 静态资源
│   └── images/
│
├── package.json
├── next.config.js
├── tailwind.config.ts
└── tsconfig.json
```

### 2.2 状态管理

| 方案 | 使用场景 | 实现方式 |
|------|----------|----------|
| URL 状态 | 筛选条件、分页 | useSearchParams |
| Server Component | 初始数据 | async/await |
| React Query | 客户端数据同步 | @tanstack/react-query |
| Context | 全局 UI 状态 | React.createContext |
| Zustand | 复杂全局状态 | zustand store |

### 2.3 API 请求封装

```typescript
// lib/api.ts
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '/api/v1';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = await this.getToken();

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new ApiError(error.code, error.message);
    }

    return response.json();
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // ... put, delete
}

export const api = new ApiClient(API_BASE);
```

---

## 3. 后端架构

### 3.1 Spring Boot 项目结构

```
backend/
├── src/main/java/com/mamoji/
│   ├── MamojiApplication.java
│   │
│   ├── config/                     # 配置类
│   │   ├── SecurityConfig.java
│   │   ├── RedisConfig.java
│   │   ├── CorsConfig.java
│   │   └── SwaggerConfig.java
│   │
│   ├── controller/                  # 控制器层
│   │   ├── AuthController.java
│   │   ├── FamilyController.java
│   │   ├── TransactionController.java
│   │   ├── AccountController.java
│   │   ├── CategoryController.java
│   │   └── StatsController.java
│   │
│   ├── service/                    # 服务层
│   │   ├── impl/
│   │   │   ├── AuthServiceImpl.java
│   │   │   ├── FamilyServiceImpl.java
│   │   │   └── TransactionServiceImpl.java
│   │   └── interface/
│   │       ├── AuthService.java
│   │       └── FamilyService.java
│   │
│   ├── repository/                 # 数据访问层
│   │   ├── UserRepository.java
│   │   ├── TransactionRepository.java
│   │   └── specification/
│   │       └── TransactionSpecification.java
│   │
│   ├── domain/                     # 领域模型
│   │   ├── entity/
│   │   │   ├── User.java
│   │   │   ├── Family.java
│   │   │   └── Transaction.java
│   │   ├── dto/
│   │   │   ├── request/
│   │   │   └── response/
│   │   └── enums/
│   │       ├── TransactionType.java
│   │       └── RoleType.java
│   │
│   ├── security/                   # 安全模块
│   │   ├── JwtService.java
│   │   ├── JwtAuthenticationFilter.java
│   │   └── SecurityUtils.java
│   │
│   ├── exception/                  # 异常处理
│   │   ├── BusinessException.java
│   │   ├── GlobalExceptionHandler.java
│   │   └── ErrorCode.java
│   │
│   └── common/                     # 公共组件
│       ├── Result.java
│       ├── PageRequest.java
│       └── BaseEntity.java
│
├── src/main/resources/
│   ├── application.yml
│   ├── application-dev.yml
│   └── application-prod.yml
│
├── src/test/java/com/mamoji/       # 测试
│   ├── controller/
│   ├── service/
│   └── repository/
│
├── pom.xml
└── Dockerfile
```

### 3.2 分层架构

```
┌────────────────────────────────────────────┐
│            Controller 层                   │
│  • 请求接收                                 │
│  • 参数校验                                 │
│  • 响应封装                                │
│  • 路由到 Service                         │
└──────────────────┬───────────────────────┘
                   │
┌──────────────────▼───────────────────────┐
│            Service 层                    │
│  • 业务逻辑                                │
│  • 事务管理                                │
│  • 缓存处理                                │
│  • 调用 Repository                        │
└──────────────────┬───────────────────────┘
                   │
┌──────────────────▼───────────────────────┐
│          Repository 层                   │
│  • 数据访问                                │
│  • JPA Query                              │
│  • 缓存操作                                │
└──────────────────┬───────────────────────┘
                   │
┌──────────────────▼───────────────────────┐
│            Domain 层                      │
│  • 实体定义                                │
│  • 业务规则                                │
│  • 领域事件                                │
└────────────────────────────────────────────┘
```

### 3.3 核心服务设计

#### 3.3.1 认证服务 (Auth Service)

```java
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
            .orElseThrow(() -> new BusinessException(1002, "用户名或密码错误"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new BusinessException(1002, "用户名或密码错误");
        }

        String token = jwtService.generateToken(user);
        return LoginResponse.builder()
            .token(token)
            .user(UserDTO.from(user))
            .build();
    }
}
```

#### 3.3.2 交易服务 (Transaction Service)

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final AccountRepository accountRepository;
    private final CacheManager cacheManager;

    @Transactional(isolation = Isolation.READ_COMMITTED)
    public TransactionDTO create(CreateTransactionRequest request) {
        // 1. 验证账户
        Account account = accountRepository.findById(request.getAccountId())
            .orElseThrow(() -> new BusinessException(4001, "账户不存在"));

        // 2. 创建交易
        Transaction transaction = Transaction.builder()
            .familyId(request.getFamilyId())
            .userId(request.getUserId())
            .type(request.getType())
            .amount(request.getAmount())
            .categoryId(request.getCategoryId())
            .accountId(request.getAccountId())
            .date(request.getDate())
            .remark(request.getRemark())
            .build();

        transaction = transactionRepository.save(transaction);

        // 3. 更新账户余额
        BigDecimal newBalance = request.getType() == TransactionType.INCOME
            ? account.getBalance().add(request.getAmount())
            : account.getBalance().subtract(request.getAmount());
        account.setBalance(newBalance);
        accountRepository.save(account);

        // 4. 清除缓存
        cacheManager.getCache("stats").clear();

        log.info("创建交易成功: userId={}, amount={}", request.getUserId(), request.getAmount());

        return TransactionDTO.from(transaction);
    }
}
```

---

## 4. 部署架构

### 4.1 Docker Compose 本地开发

```yaml
# docker-compose.yml
version: '3.8'

services:
  # MySQL 数据库
  mysql:
    image: mysql:8.0
    container_name: mamoji-mysql
    environment:
      MYSQL_ROOT_PASSWORD: root_password
      MYSQL_DATABASE: mamoji
      MYSQL_USER: mamoji_user
      MYSQL_PASSWORD: mamoji_password
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]

  # Redis 缓存
  redis:
    image: redis:7-alpine
    container_name: mamoji-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes

  # 后端服务
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: mamoji-backend
    ports:
      - "8080:8080"
    environment:
      - SPRING_PROFILES_ACTIVE=dev
      - SPRING_DATASOURCE_URL=jdbc:mysql://mysql:3306/mamoji
      - SPRING_REDIS_HOST=redis
    depends_on:
      mysql:
        condition: service_healthy
      redis:
        condition: service_started

  # 前端服务
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: mamoji-frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_BASE=http://backend:8080/api/v1
    depends_on:
      - backend

  # Nginx 反向代理
  nginx:
    image: nginx:alpine
    container_name: mamoji-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - frontend
      - backend

volumes:
  mysql_data:
  redis_data:
```

### 4.2 生产环境部署

```
┌─────────────────────────────────────────────────────────────┐
│                        Kubernetes 集群                      │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                   Ingress Controller                  │  │
│  │                   (Nginx Ingress)                     │  │
│  └──────────────────────────────────────────────────────┘  │
│                           │                                 │
│         ┌─────────────────┼─────────────────┐            │
│         ▼                 ▼                 ▼              │
│  ┌────────────┐    ┌────────────┐    ┌────────────┐       │
│  │ Frontend   │    │  Backend   │    │  Backend   │       │
│  │  Pod (x3)  │    │  Pod (x3)  │    │  Pod (x3)  │       │
│  └────────────┘    └────────────┘    └────────────┘       │
│                           │                                 │
└───────────────────────────┼─────────────────────────────────┘
                            │
         ┌──────────────────┼──────────────────┐
         ▼                  ▼                  ▼
  ┌────────────┐     ┌────────────┐     ┌────────────┐
  │   MySQL    │     │   Redis    │     │   MinIO    │
│  │  主从集群  │     │   集群     │     │   文件存储  │
  └────────────┘     └────────────┘     └────────────┘
```

---

## 5. 安全架构

### 5.1 安全分层

| 层级 | 安全措施 |
|------|----------|
| 网络层 | VPC 隔离、安全组、DDos 防护 |
| 传输层 | HTTPS (TLS 1.3)、HSTS |
| 应用层 | JWT 认证、CSRF 防护、输入验证 |
| 数据层 | 数据加密、敏感字段脱敏 |

### 5.2 认证授权流程

```
用户登录
    │
    ▼
┌─────────────┐
│  提交凭证   │ email + password
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  验证凭证   │ BCrypt 密码比对
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  生成 JWT   │ RS256 + 私钥
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  返回 Token │ access_token + refresh_token
└──────────┬──┘
          │
          ▼
   后续请求携带 Token
          │
          ▼
┌─────────────────────┐
│  JwtAuthenticationFilter │
│  • 解析 Token       │
│  • 验证签名         │
│  • 加载用户权限     │
│  • 设置 SecurityContext │
└──────────┬──────────┘
           │
           ▼
    ┌─────────────┐
    │  权限校验   │ @PreAuthorize
    └─────────────┘
```

---

## 6. 监控与日志

### 6.1 监控指标

| 指标类型 | 监控项 | 告警阈值 |
|----------|--------|----------|
| 基础设施 | CPU > 80% | 持续 5 分钟 |
| 基础设施 | 内存 > 85% | 持续 5 分钟 |
| 应用 | API 响应时间 P99 > 2s | 持续 3 分钟 |
| 应用 | 错误率 > 1% | 立即告警 |
| 业务 | 连续创建失败 | 立即告警 |

### 6.2 日志规范

```java
// 统一日志格式
log.info("method={} uri={} userId={} duration={}ms status={}",
    request.getMethod(),
    request.getRequestURI(),
    userId,
    duration,
    response.getStatus());
```

---

## 7. 扩展性设计

### 7.1 水平扩展

- 前端：CDN + 多实例部署
- 后端：无状态设计，支持多实例
- 数据库：读写分离 + 分库分表

### 7.2 垂直扩展

- 缓存：Redis 集群
- 消息队列：RabbitMQ 集群
- 搜索：Elasticsearch 集群
