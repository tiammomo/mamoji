# Mamoji 后端架构详解

## 一、技术栈概览

| 技术 | 版本 | 用途 |
|------|------|------|
| Java | 21 | 后端开发语言 |
| Spring Boot | 3.5.3 | 应用框架 |
| MyBatis-Plus | 3.5.5 | ORM 框架 |
| MySQL | 8.0 | 主数据库 |
| Redis | 7.x + Redisson | 缓存和分布式锁 |
| JWT | 0.12.6 | Token 认证 |

## 二、项目结构详解

```
api/src/main/java/com/mamoji/
├── MamojiApplication.java              # 应用启动入口
│
├── config/                             # ========== 配置层 ==========
│   ├── SecurityConfig.java             # Spring Security + JWT 配置
│   ├── CorsConfig.java                 # 跨域配置
│   ├── RedisConfig.java                # Redis + Redisson 配置
│   ├── MybatisPlusConfig.java          # MyBatis-Plus 配置
│   ├── JwtConfig.java                  # JWT 配置
│   └── SwaggerConfig.java              # API 文档配置
│
├── common/                             # ========== 公共模块 ==========
│   ├── constant/                       # 常量定义
│   │   └── AccountTypeConstants.java   # 账户类型常量
│   │
│   ├── result/                         # 统一响应
│   │   ├── Result.java                 # 统一响应封装类 ⭐核心
│   │   ├── PageResult.java             # 分页响应封装
│   │   └── ResultCode.java             # 响应码枚举
│   │
│   ├── exception/                      # 异常处理
│   │   ├── BusinessException.java      # 业务异常基类
│   │   └── GlobalExceptionHandler.java # 全局异常处理器 ⭐核心
│   │
│   ├── utils/                          # 工具类
│   │   └── DateRangeUtils.java         # 日期范围工具
│   │
│   ├── validator/                      # 校验器
│   │   └── EntityValidator.java        # 实体校验工具
│   │
│   ├── service/                        # 公共服务
│   │   ├── CacheService.java           # 缓存服务封装
│   │   └── BatchService.java           # 批量操作服务
│   │
│   ├── aggregator/                     # 数据聚合
│   │   └── TransactionAggregator.java  # 交易数据聚合器
│   │
│   ├── context/                        # 上下文
│   │   └── LedgerContextHolder.java    # 账本上下文持有者
│   │
│   └── factory/                        # 工厂模式
│       ├── ObjectBuilder.java          # 对象构建器
│       └── DtoConverter.java           # DTO 转换器
│
├── security/                           # ========== 安全模块 ==========
│   ├── JwtTokenProvider.java           # JWT Token 提供者 ⭐核心
│   ├── JwtAuthenticationFilter.java    # JWT 认证过滤器
│   └── UserPrincipal.java              # 用户主体类
│
└── module/                             # ========== 业务模块 ==========
    ├── auth/                           # 认证模块
    │   ├── controller/
    │   │   └── AuthController.java     # 登录/注册/登出接口
    │   ├── service/
    │   │   ├── AuthService.java        # 认证服务接口
    │   │   └── AuthServiceImpl.java    # 认证服务实现
    │   ├── entity/
    │   │   ├── SysUser.java            # 用户实体
    │   │   └── SysPreference.java      # 用户偏好实体
    │   ├── mapper/
    │   │   └── SysUserMapper.java      # 用户 Mapper
    │   └── dto/
    │       ├── LoginRequest.java       # 登录请求 DTO
    │       ├── LoginResponse.java      # 登录响应 DTO
    │       └── RegisterRequest.java    # 注册请求 DTO
    │
    ├── account/                        # 账户模块
    │   ├── controller/
    │   │   └── AccountController.java  # 账户 CRUD 接口
    │   ├── service/
    │   │   ├── AccountService.java     # 账户服务接口
    │   │   └── AccountServiceImpl.java # 账户服务实现
    │   ├── entity/
    │   │   └── FinAccount.java         # 账户实体
    │   ├── mapper/
    │   │   └── FinAccountMapper.java   # 账户 Mapper
    │   └── dto/
    │       ├── AccountDTO.java         # 账户请求 DTO
    │       └── AccountVO.java          # 账户响应 VO
    │
    ├── transaction/                    # 交易模块
    │   ├── controller/
    │   │   └── TransactionController.java  # 交易 CRUD + 退款接口
    │   ├── service/
    │   │   ├── TransactionService.java     # 交易服务接口
    │   │   ├── TransactionServiceImpl.java # 交易服务实现
    │   │   ├── RefundService.java          # 退款服务接口
    │   │   └── RefundServiceImpl.java      # 退款服务实现
    │   ├── entity/
    │   │   ├── FinTransaction.java     # 交易记录实体
    │   │   └── FinRefund.java          # 退款记录实体
    │   ├── mapper/
    │   │   ├── FinTransactionMapper.java   # 交易 Mapper
    │   │   └── FinRefundMapper.java        # 退款 Mapper
    │   ├── dto/
    │   │   ├── TransactionDTO.java     # 交易请求 DTO
    │   │   ├── TransactionVO.java      # 交易响应 VO
    │   │   ├── RefundDTO.java          # 退款请求 DTO
    │   │   └── RefundVO.java           # 退款响应 VO
    │   └── strategy/                   # 策略模式
    │       ├── TransactionStrategy.java        # 交易策略接口
    │       ├── IncomeTransactionStrategy.java  # 收入策略
    │       ├── ExpenseTransactionStrategy.java # 支出策略
    │       └── RefundTransactionStrategy.java  # 退款策略
    │
    ├── budget/                         # 预算模块
    │   ├── controller/
    │   │   └── BudgetController.java   # 预算 CRUD 接口
    │   ├── service/
    │   │   ├── BudgetService.java      # 预算服务接口
    │   │   └── BudgetServiceImpl.java  # 预算服务实现
    │   ├── entity/
    │   │   └── FinBudget.java          # 预算实体
    │   ├── mapper/
    │   │   └── FinBudgetMapper.java    # 预算 Mapper
    │   └── dto/
    │       ├── BudgetDTO.java          # 预算请求 DTO
    │       ├── BudgetVO.java           # 预算响应 VO
    │       └── BudgetProgressVO.java   # 预算进度 VO
    │
    ├── category/                       # 分类模块
    │   ├── controller/
    │   │   └── CategoryController.java # 分类 CRUD 接口
    │   ├── service/
    │   │   ├── CategoryService.java    # 分类服务接口
    │   │   └── CategoryServiceImpl.java # 分类服务实现
    │   ├── entity/
    │   │   └── FinCategory.java        # 分类实体
    │   ├── mapper/
    │   │   └── FinCategoryMapper.java  # 分类 Mapper
    │   └── dto/
    │       ├── CategoryDTO.java        # 分类请求 DTO
    │       └── CategoryVO.java         # 分类响应 VO
    │
    ├── report/                         # 报表模块
    │   ├── controller/
    │   │   └── ReportController.java   # 报表接口
    │   ├── service/
    │   │   ├── ReportService.java      # 报表服务接口
    │   │   └── ReportServiceImpl.java  # 报表服务实现
    │   └── dto/
    │       ├── ReportQueryDTO.java     # 报表查询 DTO
    │       ├── SummaryVO.java          # 汇总 VO
    │       ├── CategoryReportVO.java   # 分类报表 VO
    │       └── TrendVO.java            # 趋势 VO
    │
    └── ledger/                         # 账本模块（多用户共享）
        ├── controller/
        │   ├── LedgerController.java   # 账本管理接口
        │   └── InvitationController.java # 邀请码接口
        ├── service/
        │   ├── LedgerService.java      # 账本服务接口
        │   └── LedgerServiceImpl.java  # 账本服务实现
        ├── entity/
        │   ├── FinLedger.java          # 账本实体
        │   ├── FinLedgerMember.java    # 账本成员实体
        │   └── FinInvitation.java      # 邀请码实体
        ├── mapper/
        │   ├── FinLedgerMapper.java        # 账本 Mapper
        │   ├── FinLedgerMemberMapper.java  # 成员 Mapper
        │   └── FinInvitationMapper.java    # 邀请码 Mapper
        └── dto/
            ├── CreateLedgerRequest.java    # 创建账本请求
            ├── CreateInvitationRequest.java # 创建邀请请求
            ├── LedgerVO.java           # 账本响应 VO
            ├── MemberVO.java           # 成员响应 VO
            └── InvitationVO.java       # 邀请码响应 VO
```

## 三、核心设计模式

### 3.1 统一响应模式

```java
// Result.java - 统一 API 响应格式
Result.success(data);      // 成功响应（带数据）
Result.fail("错误信息");    // 失败响应（仅消息）
Result.fail(ResultCode.NOT_FOUND); // 失败响应（预设错误码）
```

**响应格式：**
```json
{
  "code": 200,
  "message": "操作成功",
  "data": {...},
  "success": true
}
```

### 3.2 策略模式（交易类型处理）

```java
// 交易模块使用策略模式处理不同类型的交易
interface TransactionStrategy {
    void validate(TransactionDTO dto);
    void execute(FinTransaction transaction);
}

//IncomeTransactionStrategy - 处理收入交易
//ExpenseTransactionStrategy - 处理支出交易（更新预算）
//RefundTransactionStrategy - 处理退款交易（反向操作）
```

### 3.3 模板方法模式（服务基类）

```java
// AbstractCrudService.java - 提供 CRUD 模板方法
public abstract class AbstractCrudService<T> {
    public T create(T entity) { /* 模板逻辑 */ }
    public void update(T entity) { /* 模板逻辑 */ }
    public void delete(Long id) { /* 模板逻辑 */ }
    protected abstract void validate(T entity);      // 子类实现
    protected abstract void beforeCreate(T entity);  // 子类实现
}
```

### 3.4 责任链模式（权限校验）

```java
// LedgerPermissionChecker.java - 账本权限校验链
public class LedgerPermissionChecker {
    public void checkPermission(Long ledgerId, Long userId, String action) {
        // 按顺序检查：
        // 1. 用户是否属于该账本
        // 2. 用户角色是否有此操作权限
        // 3. 账本状态是否允许此操作
    }
}
```

## 四、请求处理流程

```
客户端请求
    │
    ▼
┌─────────────────┐
│  JwtAuthenticationFilter │ ← JWT Token 解析和认证
└─────────────────┘
    │
    ▼
┌─────────────────┐
│  LedgerContextInterceptor │ ← 账本上下文提取
└─────────────────┘
    │
    ▼
┌─────────────────┐
│  Spring MVC     │ ← 路由到对应 Controller
└─────────────────┘
    │
    ▼
┌─────────────────┐
│  @Valid 校验    │ ← 参数校验
└─────────────────┘
    │
    ▼
┌─────────────────┐
│  Service 层     │ ← 业务逻辑处理
└─────────────────┘
    │
    ▼
┌─────────────────┐
│  Mapper 层      │ ← 数据库操作
└─────────────────┘
    │
    ▼
┌─────────────────┐
│  GlobalExceptionHandler │ ← 异常统一处理
└─────────────────┘
    │
    ▼
┌─────────────────┐
│  Result 封装    │ ← 统一响应格式
└─────────────────┘
    │
    ▼
返回客户端
```

## 五、关键配置说明

### 5.1 JWT 配置

```yaml
# application.yml
jwt:
  secret: "mamoji-secret-key-for-jwt-token-generation-min-256-bits-required"
  expiration: 86400000  # 24小时
```

### 5.2 Redis 配置

```java
// 使用 Redisson 实现分布式锁
RLock lock = redissonClient.getLock("mamoji:transaction:lock:" + userId);
lock.lock();
try {
    // 业务逻辑
} finally {
    lock.unlock();
}
```

### 5.3 跨域配置

```java
// 允许前端域名 + 认证头 + 账本头
corsConfig.addAllowedOriginPattern("http://localhost:*");
corsConfig.addAllowedHeader("*");
corsConfig.addExposedHeader("X-Ledger-Id");
```

## 六、扩展指南

### 6.1 新增业务模块

1. **创建实体** - `entity/UserModule.java`
2. **创建 Mapper** - `mapper/UserModuleMapper.java`
3. **创建 Service** - `service/UserModuleService.java` + `Impl`
4. **创建 Controller** - `controller/UserModuleController.java`
5. **创建 DTO/VO** - `dto/UserModuleDTO.java`
6. **注册 Mapper** - `MamojiApplication.java` 的 `@MapperScan`

### 6.2 新增 API 接口

1. 在 Controller 添加方法
2. 使用 `@GetMapping` / `@PostMapping` 等注解
3. 添加方法注释（Javadoc）
4. 在 ResultCode 枚举添加响应码（如果需要）

### 6.3 添加缓存

```java
// 使用 @Cacheable 注解
@Cacheable(value = "accounts", key = "#userId")
public List<AccountVO> getAccounts(Long userId) {
    // ...
}

// 使用 CacheService 手动操作
cacheService.get("key");
cacheService.set("key", value, ttl);
```

## 七、最佳实践

1. **异常处理** - 使用 `BusinessException` 抛出业务异常
2. **参数校验** - 使用 `@Valid` + Jakarta Validation 注解
3. **日志记录** - 使用 `@Slf4j` + log.warn/error
4. **事务管理** - 使用 `@Transactional` 保证数据一致性
5. **代码注释** - 参考 [CODE_COMMENT_STANDARD.md](../../docs/CODE_COMMENT_STANDARD.md)
