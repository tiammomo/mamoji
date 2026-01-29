# Mamoji 项目 Skills 维护指南

> 本文档记录项目维护所需的技能要求、每次开发需要完成的任务、以及常见问题解决方案。

## 0. Skills 配置

项目技能配置保存在两个位置：

| 文件 | 位置 | 说明 |
|------|------|------|
| **机器配置** | `~/.claude/skills.json` | 用户级别的 AI 技能配置 |
| **项目配置** | `.claude/skills.json` | 项目级别的技术栈配置 |

### 0.1 项目 Skills 配置

**文件**: [`.claude/skills.json`](../.claude/skills.json)

```json
{
  "skills": {
    "java": { "enabled": true, "version": "21", "frameworks": ["Spring Boot 3.5.3"] },
    "typescript": { "enabled": true, "version": "20", "frameworks": ["Next.js 16", "React 19"] },
    "database": { "enabled": true, "types": ["MySQL 8.0", "Redis 7.x"] }
  },
  "maintenance": {
    "checklist": ["拉取最新代码", "检查 Docker 服务", "运行测试"],
    "update_frequency": "每次开发前"
  }
}
```

### 0.2 维护方式

- **技术栈变更**: 更新 `.claude/skills.json`
- **版本兼容性**: 更新 `docs/skills.md` 的版本矩阵
- **开发流程**: 遵循 `docs/STARTUP.md` 的启动指南

---

## 1. 开发环境技能要求

### 1.1 必备技能

| 技能领域 | 技术栈 | 学习资源 |
|----------|--------|----------|
| **后端开发** | Java 17+, Spring Boot 3.5.3, MyBatis-Plus 3.5.5 | Spring 官方文档 |
| **前端开发** | TypeScript, Next.js 16, React 19 | Next.js 官方文档 |
| **数据库** | MySQL 8.0, Redis 7.x | MySQL 官方文档 |
| **容器化** | Docker, Docker Compose | Docker 官方文档 |
| **认证安全** | JWT (JJWT 0.12.x) | JJWT GitHub |

### 1.2 辅助技能

| 技能 | 用途 |
|------|------|
| RESTful API 设计 | 接口开发与文档 |
| shadcn/ui | 前端组件开发 |
| Recharts | 数据可视化图表 |
| JUnit 5 | 后端单元测试 |
| Jest + Testing Library | 前端测试 |
| Git | 版本控制 |

---

## 2. 版本兼容性矩阵

> 每次更新依赖版本后，请在此处更新

| 组件 | 当前版本 | 最低要求 | 备注 |
|------|----------|----------|------|
| Java | 21 | 17 | 后端运行环境 |
| Spring Boot | 3.5.3 | 3.0 | |
| MyBatis-Plus | 3.5.5 | 3.5 | |
| Node.js | 20.x | 18 | 前端运行环境 |
| Next.js | 16.x | 14 | |
| MySQL | 8.0 | 8.0 | |
| Redis | 7.x | 6.x | |
| npm | 10.x | 8.x | |
| Maven | 3.9.x | 3.6 | |

---

## 3. 每次开发需要维护的 Checklist

### 3.1 开始开发前

- [ ] **拉取最新代码**
  ```bash
  git fetch origin
  git pull origin master
  ```

- [ ] **检查 Docker 服务**
  ```bash
  docker-compose ps
  # 确保 mysql, redis 状态为 Up
  ```

- [ ] **检查数据库变更**
  ```bash
  # 查看 db/init 目录下的新 SQL 文件
  ls -la db/init/
  ```

- [ ] **运行数据库迁移（如有）**
  ```bash
  docker-compose exec mysql mysql -u root -prootpassword mamoji < db/init/new_script.sql
  ```

- [ ] **更新依赖**
  ```bash
  # 后端
  cd api
  mvn dependency:update

  # 前端
  cd web
  npm update
  ```

### 3.2 开发过程中

- [ ] **API 变更记录**
  - 新增接口: _______________
  - 修改接口: _______________
  - 删除接口: _______________

- [ ] **数据库变更记录**
  - 新增表: _______________
  - 修改表: _______________
  - 新增字段: _______________

- [ ] **测试数据更新**
  - 更新测试数据脚本: _______________
  - 新增测试用例: _______________

### 3.3 提交代码前

- [ ] **运行后端测试**
  ```bash
  cd api
  mvn test -Dspring.profiles.active=test
  ```

- [ ] **运行前端测试**
  ```bash
  cd web
  npm test
  ```

- [ ] **代码格式化**
  ```bash
  # 后端
  cd api
  mvn spotless:apply

  # 前端
  cd web
  npm run format
  ```

- [ ] **静态代码分析**
  ```bash
  # 后端
  cd api
  mvn checkstyle:check
  ```

### 3.4 提交代码后

- [ ] **更新本文档**
  - [ ] 记录本次开发的关键变更
  - [ ] 更新版本兼容性（如有变更）
  - [ ] 添加新的问题解决方案

---

## 4. 项目结构速查

```
mamoji/
├── api/                          # 后端项目
│   ├── src/main/java/com/mamoji/
│   │   ├── common/               # 公共模块
│   │   │   ├── result/           # 响应封装
│   │   │   ├── exception/        # 异常处理
│   │   │   └── utils/            # 工具类
│   │   ├── config/               # 配置类
│   │   ├── security/             # 安全模块
│   │   └── module/               # 业务模块
│   │       ├── auth/             # 认证模块
│   │       ├── account/          # 账户模块
│   │       ├── transaction/      # 交易模块
│   │       ├── budget/           # 预算模块
│   │       ├── category/         # 分类模块
│   │       └── report/           # 报表模块
│   └── src/test/                 # 测试代码
│
├── web/                          # 前端项目
│   ├── app/                      # Next.js App Router
│   │   ├── (auth)/               # 认证页面
│   │   ├── (dashboard)/          # 仪表盘页面
│   │   └── api/                  # API 路由
│   ├── components/               # 组件
│   │   ├── ui/                   # 基础组件
│   │   ├── charts/               # 图表组件
│   │   └── layout/               # 布局组件
│   ├── hooks/                    # 自定义 Hooks
│   ├── api/                      # API 调用
│   └── types/                    # 类型定义
│
├── db/                           # 数据库脚本
│   ├── init/                     # 初始化脚本
│   └── codes/                    # 数据操作脚本
│
├── docs/                         # 文档
│   ├── local-config.md           # 本地配置
│   ├── skills.md                 # Skills 维护
│   ├── api.md                    # API 文档
│   ├── db.md                     # 数据库设计
│   └── prd.md                    # 产品文档
│
└── docker-compose.yml            # Docker 编排
```

---

## 5. 常用命令速查

### 5.1 Docker 命令

```bash
# 启动所有服务
docker-compose up -d

# 停止所有服务
docker-compose down

# 查看日志
docker-compose logs -f

# 重启特定服务
docker-compose restart <service_name>

# 进入容器
docker-compose exec <service_name> /bin/bash
```

### 5.2 后端命令

```bash
# 启动应用
mvn spring-boot:run

# 运行测试
mvn test

# 构建打包
mvn package -DskipTests

# 代码格式化
mvn spotless:apply

# 检查依赖版本
mvn versions:display-dependency-updates
```

### 5.3 前端命令

```bash
# 启动开发服务器
npm run dev

# 运行测试
npm test

# 构建生产版本
npm run build

# 代码格式化
npm run format

# 代码检查
npm run lint
```

---

## 6. 常见问题与解决方案

### 6.1 Docker 相关

| 问题 | 解决方案 |
|------|----------|
| Docker 服务启动失败 | `docker-compose down && docker-compose up -d` |
| 端口被占用 | `lsof -i :<port>` 检查并停止占用进程 |
| 数据卷权限错误 | `docker-compose down -v && docker-compose up -d` |
| 容器无法连接 | 检查防火墙设置或 `docker-compose logs` |

### 6.2 MySQL 相关

| 问题 | 解决方案 |
|------|----------|
| 连接被拒绝 | 确认容器正在运行: `docker-compose ps mysql` |
| 字符集问题 | 检查表和字段的字符集设置 |
| 连接数过多 | 重启容器或增加 max_connections |

### 6.3 Redis 相关

| 问题 | 解决方案 |
|------|----------|
| 连接超时 | 确认 Redis 容器正在运行 |
| 内存不足 | 修改 maxmemory 配置 |
| 数据丢失 | 检查 AOF 持久化配置 |

### 6.4 后端相关

| 问题 | 解决方案 |
|------|----------|
| JWT 认证失败 | 检查 JWT_SECRET 配置 |
| 缓存未更新 | 清除 Redis 缓存: `docker-compose exec redis redis-cli FLUSHALL` |
| 热部署不生效 | 重启应用或检查 devtools 配置 |

### 6.5 前端相关

| 问题 | 解决方案 |
|------|----------|
| 构建失败 | 检查依赖版本或删除 node_modules 重新安装 |
| 类型错误 | 运行 `npm run type-check` 检查 |
| API 404 | 确认后端服务正在运行且端口正确 |

---

## 7. 性能优化技巧

### 7.1 数据库优化
- 使用索引优化查询
- 避免 N+1 查询问题
- 使用连接池（HikariCP）

### 7.2 缓存优化
- 合理设置缓存过期时间
- 使用 Redis Pipeline 批量操作
- 避免缓存穿透和雪崩

### 7.3 前端优化
- 使用 React.memo 避免不必要的重渲染
- 使用 dynamic import 动态加载组件
- 优化图片资源

---

## 8. 安全最佳实践

### 8.1 敏感信息管理
- 敏感信息使用环境变量
- 永远不要将密码提交到代码仓库
- 使用 `.env.local` 本地配置

### 8.2 API 安全
- 使用 HTTPS
- 实现请求频率限制
- 验证所有输入数据

### 8.3 认证授权
- JWT Token 设置合理的过期时间
- 实现权限控制
- 记录审计日志

---

## 10. 代码简洁性规范

> 保持代码简洁、高效是项目长期可维护的关键。以下规范与 `.claude/skills.json` 中的 `code_style` 配置保持一致。

### 10.1 Java 后端规范

| 规范 | 限制 | 说明 |
|------|------|------|
| **方法行数** | ≤ 50 行 | 超出时应拆分为多个方法 |
| **类行数** | ≤ 500 行 | 超出时应拆分为多个类 |
| **参数数量** | ≤ 4 个 | 超出时应使用 DTO 封装 |
| **方法参数** | 优先使用对象 | 避免过长参数列表 |
| **链式调用** | 适当换行 | 每行一个方法调用 |
| **嵌套层级** | ≤ 3 层 | 超出时应提前返回或提取方法 |

#### 示例：方法拆分

```java
// ❌ 不推荐：方法过长
public void processTransaction(TransactionRequest request) {
    validateRequest(request);
    Transaction transaction = convertToEntity(request);
    if (transaction.getAmount() > 0) {
        transaction.setType(TransactionType.INCOME);
    } else {
        transaction.setType(TransactionType.EXPENSE);
    }
    transactionRepository.save(transaction);
    cacheService.invalidate(transaction.getUserId());
    log.info("Transaction saved: {}", transaction.getId());
}

// ✅ 推荐：拆分为多个职责明确的方法
public void processTransaction(TransactionRequest request) {
    Transaction transaction = buildTransaction(request);
    saveTransaction(transaction);
    clearUserCache(transaction.getUserId());
    logTransaction(transaction);
}

private Transaction buildTransaction(TransactionRequest request) {
    validateRequest(request);
    Transaction transaction = convertToEntity(request);
    setTransactionType(transaction);
    return transaction;
}

private void setTransactionType(Transaction transaction) {
    transaction.setType(
        transaction.getAmount() > 0
            ? TransactionType.INCOME
            : TransactionType.EXPENSE
    );
}
```

### 10.2 TypeScript 前端规范

| 规范 | 限制 | 说明 |
|------|------|------|
| **组件行数** | ≤ 150 行 | 超出时应拆分为子组件 |
| **Hooks 顺序** | 固定顺序 | useState → useEffect → 其他 |
| **类型定义** | 优先 interface | 保持一致性 |
| **导入顺序** | 固定顺序 | React → 第三方 → 本地 |
| **条件渲染** | 提前 return | 减少嵌套层级 |
| **回调函数** | 适当抽离 | 复杂逻辑提取为独立函数 |

#### 示例：React Hooks 顺序

```typescript
// ❌ 不推荐：Hooks 顺序混乱
export function TransactionList() {
    const { data } = useTransactionQuery();
    const [filter, setFilter] = useState('');
    const theme = useTheme();
    const [selectedId, setSelectedId] = useState(null);

    useEffect(() => {
        fetchData();
    }, [filter]);

    return <div>{/* ... */}</div>;
}

// ✅ 推荐：Hooks 按顺序声明
export function TransactionList() {
    // 1. State hooks
    const [filter, setFilter] = useState('');
    const [selectedId, setSelectedId] = useState(null);

    // 2. Query/Data hooks
    const { data } = useTransactionQuery();

    // 3. Context hooks
    const theme = useTheme();

    // 4. Effect hooks
    useEffect(() => {
        fetchData();
    }, [filter]);

    // 5. Event handlers
    const handleSelect = (id: string) => setSelectedId(id);

    // 6. Render
    return <div>{/* ... */}</div>;
}
```

#### 示例：组件拆分

```typescript
// ❌ 不推荐：单文件超过 150 行
export function TransactionPage() {
    // State hooks (10+)
    const [filter, setFilter] = useState('');
    const [dateRange, setDateRange] = useState<DateRange>({...});
    const [category, setCategory] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    // ... more state

    // Effect hooks (5+)
    useEffect(() => {
        loadTransactions();
    }, [filter, dateRange]);

    // ... more effects

    // Event handlers (10+)
    const handleFilterChange = (value: string) => {...};
    const handleDateChange = (range: DateRange) => {...};
    const handleCategoryChange = (cat: string) => {...};
    const handleEdit = (id: string) => {...};
    const handleDelete = (id: string) => {...};
    const handleCreate = () => {...};
    const handleSave = (transaction: Transaction) => {...};
    // ... more handlers

    // Render (100+ lines)
    return (
        <PageLayout>
            <FilterBar onFilterChange={handleFilterChange} />
            <TransactionChart data={transactions} />
            <TransactionTable
                transactions={transactions}
                onEdit={handleEdit}
                onDelete={handleDelete}
            />
            <TransactionModal
                isOpen={!!editingId}
                onClose={() => setEditingId(null)}
            />
        </PageLayout>
    );
}

// ✅ 推荐：拆分为多个职责明确的组件
export function TransactionPage() {
    return (
        <PageLayout>
            <TransactionFilters />
            <TransactionChart />
            <TransactionTable />
        </PageLayout>
    );
}

function TransactionFilters() {
    const [filter, setFilter] = useState('');
    const [dateRange, setDateRange] = useState<DateRange>({...});

    useEffect(() => {
        applyFilters();
    }, [filter, dateRange]);

    return <FilterBar onFilterChange={setFilter} />;
}
```

### 10.3 代码简洁性检查清单

每次提交代码前，请检查以下项目：

- [ ] **无冗余代码**
  - 重复逻辑已提取为公共方法/组件
  - 无用的 import 已删除
  - 注释掉的代码已删除

- [ ] **命名清晰**
  - 类名使用 PascalCase (如 `TransactionService`)
  - 方法/变量名使用 camelCase (如 `getTransactionById`)
  - 常量名使用 UPPER_SNAKE_CASE (如 `MAX_RETRY_COUNT`)
  - 文件名与导出类名一致

- [ ] **注释精炼**
  - 只解释"为什么"，不解释"是什么"
  - 复杂业务逻辑添加注释说明
  - 无意义的注释已删除

- [ ] **无硬编码**
  - 配置信息外移到 `application.yml` 或环境变量
  - 常量提取为 `static final` 或 `const`

- [ ] **代码格式化**
  - 已运行 `mvn spotless:apply` (后端)
  - 已运行 `npm run format` (前端)

### 10.4 自动化检查

项目已配置以下自动化检查工具：

| 工具 | 用途 | 命令 |
|------|------|------|
| Spotless | Java 代码格式化 | `mvn spotless:apply` |
| Prettier | TypeScript 代码格式化 | `npm run format` |
| ESLint | 前端代码检查 | `npm run lint` |
| Checkstyle | 后端代码规范检查 | `mvn checkstyle:check` |

### 10.5 重构时机

当发现以下情况时，应考虑重构：

| 情况 | 行动 |
|------|------|
| 方法超过 50 行 | 拆分为多个职责单一的方法 |
| 类超过 500 行 | 拆分为多个相关类 |
| 组件超过 150 行 | 拆分为多个子组件 |
| 重复代码出现 3 次 | 提取为公共方法/组件 |
| 嵌套层级超过 3 层 | 提前返回或提取方法 |

---

## 11. 更新日志

### 2026-01-27
- 初始版本
- 添加本地配置和 skills 维护文档
- 完善 Docker MySQL 测试配置
- 添加代码简洁性规范章节

---

## 10. 相关文档

- [local-config.md](local-config.md) - 本地配置信息
- [README.md](../README.md) - 项目主文档
- [api.md](api.md) - API 接口文档
- [db.md](db.md) - 数据库设计
