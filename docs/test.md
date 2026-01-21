# 测试文档

本文档描述 Mamoji 项目的测试策略、测试环境配置和测试用例。

## 目录

- [测试概览](#测试概览)
- [Mock 数据使用规范](#mock-数据使用规范)
- [前端测试](#前端测试)
- [后端测试](#后端测试)
- [测试运行](#测试运行)
- [测试覆盖率](#测试覆盖率)

---

## 测试概览

| 层级 | 技术栈 | 测试数 | 覆盖率 |
|------|--------|--------|--------|
| 前端 | Jest + React Testing Library | 39 | 约 45% |
| 后端 | JUnit 5 + MockMvc | 40+ | 约 35% |

---

## Mock 数据使用规范

### 环境隔离原则

| 环境 | Mock 数据使用 | 说明 |
|------|--------------|------|
| **测试环境** | ✅ 允许 | 使用 Jest/Mockito 模拟数据 |
| **开发环境** | ❌ 禁止 | 连接真实 Docker MySQL |
| **生产环境** | ❌ 禁止 | 连接真实生产数据库 |

### 当前状态验证

```bash
# 1. 检查生产代码无 mock (除测试目录外)
grep -r "jest.mock" web/app --include="*.tsx" 2>/dev/null | wc -l
# 期望结果: 0

# 2. 检查测试目录有 mock
grep -r "jest.mock" web/__tests__ --include="*.tsx" | wc -l
# 期望结果: > 0

# 3. 检查 API 调用使用真实 axios
grep -r "api.get\|api.post" web/app --include="*.tsx" | head -5
# 期望结果: 真实 API 调用
```

### 测试数据生成

#### 前端测试数据

```typescript
// __tests__/components/dashboard.test.tsx

// 使用模拟数据
const mockSummary = {
  totalAssets: 50000,
  totalLiabilities: 5000,
  netAssets: 45000,
};

const mockTransactions = [
  { transactionId: 1, type: 'income', amount: 5000, note: '工资' },
  { transactionId: 2, type: 'expense', amount: 100, note: '午餐' },
];

// Mock API 调用返回模拟数据
jest.mock('@/api', () => ({
  accountApi: {
    getSummary: jest.fn().mockResolvedValue({ code: 0, data: mockSummary }),
  },
  transactionApi: {
    getRecent: jest.fn().mockResolvedValue({ code: 0, data: mockTransactions }),
  },
}));
```

#### 后端测试数据

```java
// src/test/java/com/mamoji/module/account/AccountServiceTest.java

// 使用模拟数据
private SysUser createTestUser() {
    SysUser user = new SysUser();
    user.setUserId(1L);
    user.setUsername("testuser");
    user.setEmail("test@example.com");
    return user;
}

private FinAccount createTestAccount() {
    FinAccount account = new FinAccount();
    account.setAccountId(1L);
    account.setName("测试钱包");
    account.setAccountType("bank");
    account.setBalance(BigDecimal.valueOf(10000));
    return account;
}

// 使用 Mockito 模拟数据返回
when(accountMapper.selectOne(any())).thenReturn(createTestAccount());
when(accountMapper.updateById(any())).thenReturn(1);
```

### 生产环境配置

```bash
# .env.production
NEXT_PUBLIC_API_URL=https://api.mamoji.com/api/v1

# API 调用真实后端
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
```

---

## 前端测试

### 技术栈

- **测试框架**: Jest
- **测试环境**: jsdom
- **组件测试**: React Testing Library
- **断言库**: jest-dom

### 目录结构

```
web/
├── __tests__/
│   ├── components/          # 页面组件测试
│   │   ├── dashboard.test.tsx
│   │   ├── accounts.test.tsx
│   │   ├── transactions.test.tsx
│   │   ├── input.test.tsx
│   │   └── button.test.tsx
│   └── unit/               # 单元测试
│       └── utils.test.ts
├── __mocks__/              # Mock 配置
│   ├── lucide-react.js
│   ├── react-slot.js
│   ├── react-select.js
│   └── next-navigation.js
└── jest.config.js          # Jest 配置
```

### 测试用例

#### DashboardPage (仪表盘)

| 测试项 | 描述 | 状态 |
|--------|------|------|
| 错误状态显示 | API 失败时正确显示错误状态 | ✅ |
| 汇总卡片 | 正确显示总资产/总负债/净资产 | ✅ |
| 最近交易 | 正确显示最近交易记录 | ✅ |
| 空状态 | 无交易时显示空状态提示 | ✅ |
| 预算进度 | 正确显示预算进度条 | ✅ |
| 账户数量 | 正确显示账户数量 | ✅ |

#### AccountsPage (账户管理)

| 测试项 | 描述 | 状态 |
|--------|------|------|
| 页面标题 | 正确显示"账户管理"标题 | ✅ |
| 账户列表 | 正确显示账户卡片 | ✅ |
| 账户数量 | 正确显示账户数量 | ✅ |
| 空状态 | 无账户时显示空状态 | ✅ |
| 错误处理 | API 错误时优雅处理 | ✅ |

#### TransactionsPage (交易记录)

| 测试项 | 描述 | 状态 |
|--------|------|------|
| 页面标题 | 正确显示"交易记录"标题 | ✅ |
| 交易列表 | 正确显示交易记录 | ✅ |
| 空状态 | 无交易时显示空状态 | ✅ |
| 错误处理 | API 错误时优雅处理 | ✅ |

### Mock 配置

#### Lucide Icons Mock

```javascript
// __mocks__/lucide-react.js
// 模拟所有 lucide-react 图标组件
const icons = {
  LayoutDashboard: createIconMock('LayoutDashboard'),
  Wallet: createIconMock('Wallet'),
  Plus: createIconMock('Plus'),
  Check: createIconMock('Check'),
  // ... 更多图标
};
```

#### Next.js Navigation Mock

```javascript
// __mocks__/next-navigation.js
jest.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}));
```

#### Radix UI Components Mock

```javascript
// __mocks__/react-slot.js
// 模拟 @radix-ui/react-slot
const Slot = React.forwardRef(({ children }, ref) => {
  if (React.isValidElement(children)) {
    return React.cloneElement(children, { ref });
  }
  return children;
});

// __mocks__/react-select.js
// 模拟 @radix-ui/react-select
const SelectPrimitive = {
  Root: createMockComponent('SelectRoot'),
  Trigger: createMockComponent('SelectTrigger'),
  Content: createMockComponent('SelectContent'),
  Item: createMockComponent('SelectItem'),
  ItemIndicator: createMockComponent('SelectItemIndicator'),
  Portal: createMockComponent('SelectPortal'),
  // ...
};
```

### Jest 配置

```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^lucide-react$': '<rootDir>/__mocks__/lucide-react.js',
    '^next/navigation$': '<rootDir>/__mocks__/next-navigation.js',
    '^@radix-ui/react-slot$': '<rootDir>/__mocks__/react-slot.js',
    '^@radix-ui/react-select$': '<rootDir>/__mocks__/react-select.js',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
  },
  transformIgnorePatterns: [
    '/node_modules/(?!(lucide-react)/)',
  ],
};
```

---

## 后端测试

### 技术栈

- **测试框架**: JUnit 5
- **Mock 框架**: Mockito
- **Web 测试**: MockMvc
- **测试数据库**: MySQL 8.0 (Docker 本地，端口 3306)
- **测试缓存**: Redis 7.x (Docker 本地，端口 6379)

### 目录结构

```
api/src/test/java/com/mamoji/
├── module/
│   ├── auth/
│   │   ├── controller/
│   │   │   └── AuthControllerTest.java
│   │   └── service/
│   │       └── AuthServiceTest.java
│   ├── account/
│   │   ├── controller/
│   │   │   └── AccountControllerTest.java
│   │   └── service/
│   │       └── AccountServiceTest.java
│   ├── transaction/
│   │   ├── controller/
│   │   │   └── TransactionControllerTest.java
│   │   └── service/
│   │       └── TransactionServiceTest.java
│   ├── budget/
│   │   └── service/
│   │       └── BudgetServiceTest.java
│   └── report/
│       └── service/
│           └── ReportServiceTest.java
└── security/
    └── JwtTokenProviderTest.java
```

### 测试类型

#### 1. Controller 测试 (MockMvc)

使用 MockMvc 进行 HTTP 层面的集成测试，无需启动服务器。

```java
@SpringBootTest
@AutoConfigureMockMvc
public class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("POST /api/v1/auth/login - Successful login")
    public void testSuccessfulLogin() throws Exception {
        LoginRequest request = new LoginRequest();
        request.setUsername("testuser");
        request.setPassword("password123");

        mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(200))
            .andExpect(jsonPath("$.data.token").value("jwt-token-123"));
    }
}
```

#### 2. Service 测试 (Mockito)

使用 Mockito 进行单元测试，模拟依赖对象。

```java
@ExtendWith(MockitoExtension.class)
public class AuthServiceTest {

    @Mock
    private UserMapper userMapper;

    @InjectMocks
    private AuthService authService;

    @Test
    @DisplayName("login - Valid credentials returns token")
    public void testLoginWithValidCredentials() {
        SysUser user = createTestUser();
        when(userMapper.selectOne(any())).thenReturn(user);
        when(jwtTokenProvider.generateToken(1L)).thenReturn("jwt-token");

        LoginResponse result = authService.login("testuser", "password123");

        assertNotNull(result);
        assertEquals("jwt-token", result.getToken());
    }
}
```

### 测试用例

#### AuthController

| 测试项 | 方法 | 预期结果 |
|--------|------|----------|
| 成功登录 | POST /auth/login | 200, 返回 token |
| 无效凭证 | POST /auth/login | 500, 错误信息 |
| 缺少用户名 | POST /auth/login | 400 Bad Request |
| 成功注册 | POST /auth/register | 200, 返回 userId |
| 用户名已存在 | POST /auth/register | 500, 错误信息 |
| 登出 | POST /auth/logout | 200 |
| 获取 profile | GET /auth/profile | 200, 返回用户信息 |
| 未授权访问 | GET /auth/profile | 401 Unauthorized |

#### TransactionService

| 测试项 | 描述 | 状态 |
|--------|------|------|
| 创建交易 | 正确创建交易记录 | ✅ |
| 查询交易列表 | 支持分页和筛选 | ✅ |
| 查询最近交易 | 返回最近 N 条 | ✅ |
| 更新交易 | 正确更新交易金额 | ✅ |
| 删除交易 | 正确删除并回滚余额 | ✅ |

#### AccountService

| 测试项 | 描述 | 状态 |
|--------|------|------|
| 创建账户 | 正确创建账户 | ✅ |
| 查询账户列表 | 返回用户所有账户 | ✅ |
| 更新余额 | 正确更新账户余额 | ✅ |
| 删除账户 | 正确删除账户 | ✅ |
| 账户汇总 | 返回资产/负债/净资产 | ✅ |

#### BudgetService

| 测试项 | 描述 | 状态 |
|--------|------|------|
| 创建预算 | 正确创建预算 | ✅ |
| 查询预算列表 | 返回用户所有预算 | ✅ |
| 更新预算状态 | 支持状态变更 | ✅ |
| 计算进度 | 正确计算已花费 | ✅ |
| 活跃预算 | 只返回进行中的预算 | ✅ |

#### ReportService

| 测试项 | 描述 | 状态 |
|--------|------|------|
| 汇总报表 | 返回总资产/负债/净资产 | ✅ |
| 收支报表 | 按分类返回收支 | ✅ |
| 月度报表 | 返回月度统计数据 | ✅ |
| 资产负债表 | 返回资产负债汇总 | ✅ |

---

## 测试运行

### 前端测试

```bash
cd web

# 运行所有测试
npm test

# 运行指定测试文件
npm test -- --testPathPattern=dashboard

# 运行并生成覆盖率报告
npm test -- --coverage

# 监听模式
npm test -- --watch
```

### 后端测试

```bash
cd api

# 运行所有测试
mvn test

# 运行指定测试类
mvn test -Dtest=AuthControllerTest

# 运行并生成覆盖率报告
mvn test jacoco:report

# 查看覆盖率报告
open target/site/jacoco/index.html
```

**测试配置文件**: `api/src/test/resources/application-test.yml`

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/mamoji_test?useUnicode=true&characterEncoding=utf8&useSSL=false&serverTimezone=Asia/Shanghai
    username: root
    password: root

  data:
    redis:
      host: localhost
      port: 6379
```

### Docker 环境测试

```bash
# 使用 Docker Compose 启动测试环境
cd deploy

# 启动 MySQL 和 Redis
docker-compose up -d mysql redis

# 运行后端测试 (连接 Docker MySQL，profile: test)
cd api
mvn test -Dspring.profiles.active=test

# 运行前端测试
cd web
npm test
```

---

## 测试覆盖率

### 目标覆盖率

| 层级 | 当前覆盖率 | 目标覆盖率 |
|------|-----------|-----------|
| 前端 | ~45% | 60% |
| 后端 | ~35% | 50% |
| 整体 | ~40% | 55% |

### 覆盖率报告

前端报告位置: `web/coverage/index.html`

后端报告位置: `api/target/site/jacoco/index.html`

### 提升覆盖率建议

1. **增加边界条件测试**: 空值、超大数值、特殊字符
2. **增加错误场景测试**: 网络异常、权限不足
3. **增加集成测试**: 完整业务流程测试
4. **增加 E2E 测试**: 使用 Playwright 或 Cypress

---

## 最佳实践

### 前端测试

1. **优先使用 Testing Library 查询**
   ```javascript
   // 推荐
   screen.getByRole('heading', { name: '标题' })
   screen.getByText(/总资产/)

   // 避免
   screen.getByClassName('text-xl')
   ```

2. **Mock 外部依赖**
   ```javascript
   jest.mock('@/api', () => ({
     accountApi: {
       list: jest.fn().mockResolvedValue({ code: 0, data: [] })
     }
   }))
   ```

3. **测试行为而非实现**
   ```javascript
   // 测试用户可见的结果
   expect(screen.getByText('添加账户')).toBeInTheDocument()

   // 而非内部状态
   expect(wrapper.state('loading')).toBe(false)
   ```

### 后端测试

1. **使用 @DataJpaTest 进行 Repository 测试**
   ```java
   @DataJpaTest
   class UserRepositoryTest {
     @Autowired
     private UserRepository userRepository;

     @Test
     void findByUsername() {
       // 测试数据库操作
     }
   }
   ```

2. **使用 @WebMvcTest 进行 Controller 测试**
   ```java
   @WebMvcTest(AuthController.class)
   class AuthControllerTest {
     @Autowired
     private MockMvc mockMvc;

     @MockBean
     private AuthService authService;
   }
   ```

3. **使用 @SpringBootTest 进行集成测试**
   ```java
   @SpringBootTest
   @AutoConfigureMockMvc
   class EndToEndFlowTest {
     // 测试完整业务流程
   }
   ```

---

## CI/CD 集成

### GitHub Actions 示例

```yaml
name: Tests

on: [push, pull_request]

jobs:
  frontend-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: cd web && npm install
      - run: npm test -- --coverage
      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info

  backend-test:
    runs-on: ubuntu-latest
    services:
      mysql:
        image: mysql:8.0
        ports: 3306:3306
        env:
          MYSQL_ROOT_PASSWORD: root
          MYSQL_DATABASE: mamoji_test
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-java@v3
        with:
          java-version: '17'
          distribution: 'temurin'
      - run: mvn test
      - uses: codecov/codecov-action@v3
        with:
          files: ./target/site/jacoco/jacoco.xml
```

---

## 常见问题

### Q: 前端测试找不到元素

**A**: 确保组件已完全渲染，使用 `waitFor` 等待异步操作完成：

```javascript
await waitFor(() => {
  expect(screen.getByText('内容')).toBeInTheDocument()
})
```

### Q: 后端测试数据库连接失败

**A**: 检查 Docker MySQL 容器是否运行：

```bash
# 检查容器状态
docker ps | grep mysql

# 如果容器未运行，启动它
docker run -d --name mysql-test \
  -p 3306:3306 \
  -e MYSQL_ROOT_PASSWORD=root \
  -e MYSQL_DATABASE=mamoji_test \
  mysql:8.0

# 确保测试数据库已初始化
mysql -h localhost -u root -proot mamoji_test < api/src/test/resources/schema-mysql.sql
```

### Q: Mock 不生效

**A**: 确保 Mock 在导入之前调用：

```javascript
// 正确: Mock 在导入之前
jest.mock('@/api', () => ({
  accountApi: { list: jest.fn() }
}))
import { accountApi } from '@/api'

// 错误: 导入在 Mock 之前
import { accountApi } from '@/api'
jest.mock('@/api', ...)
```
