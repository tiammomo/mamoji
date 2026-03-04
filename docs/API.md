# API 设计

## 1. 概述

- 基础路径：`/api/v1`
- 认证方式：JWT Token
- 数据格式：JSON
- 协议：RESTful
- 版本控制：URL Path (`/api/v1/`)

### 1.1 API 设计原则

| 原则 | 说明 | 实践 |
|------|------|------|
| 资源导向 | 使用名词而非动词 | `/transactions` 而非 `/getTransactions` |
| 层次化 | 嵌套资源表示关系 | `/families/{id}/members` |
| HTTP 动词 | 正确使用 REST 方法 | GET/POST/PUT/DELETE |
| 幂等性 | 多次请求结果一致 | PUT 替换，POST 创建 |
| 分页 | 列表资源分页返回 | `?page=1&page_size=20` |

### 1.2 请求头规范

```http
Content-Type: application/json
Accept: application/json
Authorization: Bearer <token>
X-Request-ID: uuid-for-tracing
X-Timezone: Asia/Shanghai
```

---

## 1.6 MVP API 清单

> MVP 阶段只需实现以下核心接口：

| 模块 | 接口 | 方法 | 说明 |
|------|------|------|------|
| 认证 | /auth/register | POST | 用户注册 |
| 认证 | /auth/login | POST | 用户登录 |
| 认证 | /auth/me | GET | 获取当前用户 |
| 交易 | /transactions | GET | 获取交易列表 |
| 交易 | /transactions | POST | 创建交易 |
| 交易 | /transactions/{id} | PUT | 更新交易 |
| 交易 | /transactions/{id} | DELETE | 删除交易 |
| 统计 | /stats/overview | GET | 收支概览 |
| 统计 | /stats/trend | GET | 收支趋势 |

> V1.0 版本增加：家庭、账户、分类管理接口

---

## 2. 通用响应

### 2.1 成功响应
```json
{
  "code": 0,
  "message": "success",
  "data": {}
}
```

### 2.2 错误响应
```json
{
  "code": 1,
  "message": "错误信息",
  "data": null
}
```

### 2.3 分页响应
```json
{
  "code": 0,
  "data": {
    "list": [],
    "pagination": {
      "page": 1,
      "page_size": 20,
      "total": 100,
      "total_pages": 5
    }
  }
}
```

---

## 3. 认证接口

### 3.1 用户注册
```
POST /auth/register
```

**请求体：**
```json
{
  "email": "user@example.com",
  "password": "123456",
  "nickname": "张三"
}
```

**响应：**
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": 1,
      "email": "user@example.com",
      "nickname": "张三"
    }
  }
}
```

### 3.2 用户登录
```
POST /auth/login
```

**请求体：**
```json
{
  "email": "user@example.com",
  "password": "123456"
}
```

### 3.3 获取当前用户信息
```
GET /auth/me
```

**响应：**
```json
{
  "code": 0,
  "data": {
    "id": 1,
    "email": "user@example.com",
    "nickname": "张三",
    "family_id": 1,
    "role": 1,
    "avatar_url": "https://..."
  }
}
```

### 3.4 更新用户信息
```
PUT /auth/me
```

**请求体：**
```json
{
  "nickname": "新昵称",
  "avatar_url": "https://..."
}
```

---

## 4. 家庭接口

### 4.1 创建家庭
```
POST /families
```

**请求体：**
```json
{
  "name": "我的家庭"
}
```

**响应：**
```json
{
  "code": 0,
  "data": {
    "id": 1,
    "name": "我的家庭",
    "invite_code": "ABC12345",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

### 4.2 加入家庭
```
POST /families/join
```

**请求体：**
```json
{
  "invite_code": "ABC12345"
}
```

### 4.3 获取家庭信息
```
GET /families/:id
```

### 4.4 获取家庭成员列表
```
GET /families/:id/members
```

**响应：**
```json
{
  "code": 0,
  "data": [
    {
      "id": 1,
      "nickname": "张三",
      "email": "zhangsan@example.com",
      "role": 1,
      "avatar_url": "https://..."
    },
    {
      "id": 2,
      "nickname": "李四",
      "email": "lisi@example.com",
      "role": 2,
      "avatar_url": "https://..."
    }
  ]
}
```

### 4.5 移除家庭成员（仅管理员）
```
DELETE /families/:id/members/:userId
```

### 4.6 退出家庭
```
POST /families/leave
```

---

## 5. 账户接口

### 5.1 获取账户列表
```
GET /accounts
```

**响应：**
```json
{
  "code": 0,
  "data": [
    {
      "id": 1,
      "name": "现金",
      "type": 1,
      "balance": 5000.00,
      "color": "#27AE60",
      "is_default": 1
    }
  ]
}
```

### 5.2 创建账户
```
POST /accounts
```

**请求体：**
```json
{
  "name": "信用卡",
  "type": 2,
  "balance": 10000,
  "color": "#E74C3C"
}
```

### 5.3 更新账户
```
PUT /accounts/:id
```

### 5.4 删除账户
```
DELETE /accounts/:id
```

---

## 6. 分类接口

### 6.1 获取分类列表
```
GET /categories
```

**响应：**
```json
{
  "code": 0,
  "data": {
    "income": [
      {
        "id": 1,
        "name": "工资",
        "icon": "work",
        "color": "#27AE60"
      }
    ],
    "expense": [
      {
        "id": 2,
        "name": "餐饮",
        "icon": "restaurant",
        "color": "#FF6B6B"
      }
    ]
  }
}
```

### 6.2 创建分类
```
POST /categories
```

**请求体：**
```json
{
  "name": "房租",
  "type": 2,
  "icon": "home",
  "color": "#8E44AD"
}
```

### 6.3 更新分类
```
PUT /categories/:id
```

### 6.4 删除分类
```
DELETE /categories/:id
```

---

## 7. 交易接口

### 7.1 获取交易列表
```
GET /transactions
```

**查询参数：**
| 参数 | 类型 | 说明 |
|------|------|------|
| page | int | 页码，默认1 |
| page_size | int | 每页数量，默认20 |
| type | int | 类型：1-收入 2-支出 |
| category_id | int | 分类ID |
| account_id | int | 账户ID |
| user_id | int | 成员ID |
| start_date | string | 开始日期 YYYY-MM-DD |
| end_date | string | 结束日期 YYYY-MM-DD |

**响应：**
```json
{
  "code": 0,
  "data": {
    "list": [
      {
        "id": 1,
        "type": 2,
        "amount": 50.00,
        "category": {
          "id": 2,
          "name": "餐饮",
          "icon": "restaurant"
        },
        "account": {
          "id": 1,
          "name": "现金"
        },
        "user": {
          "id": 1,
          "nickname": "张三"
        },
        "date": "2024-01-15",
        "remark": "午餐",
        "created_at": "2024-01-15T12:00:00Z"
      }
    ],
    "total": 100,
    "page": 1,
    "page_size": 20
  }
}
```

### 7.2 创建交易
```
POST /transactions
```

**请求体：**
```json
{
  "type": 2,
  "amount": 50.00,
  "category_id": 2,
  "account_id": 1,
  "date": "2024-01-15",
  "remark": "午餐"
}
```

### 7.3 更新交易
```
PUT /transactions/:id
```

### 7.4 删除交易
```
DELETE /transactions/:id
```

---

## 8. 统计接口

### 8.1 收支概览
```
GET /stats/overview
```

**查询参数：**
| 参数 | 说明 |
|------|------|
| month | 月份 YYYY-MM，默认当月 |

**响应：**
```json
{
  "code": 0,
  "data": {
    "income": 15000.00,
    "expense": 8000.00,
    "balance": 7000.00,
    "income_count": 5,
    "expense_count": 20
  }
}
```

### 8.2 收支趋势
```
GET /stats/trend
```

**查询参数：**
| 参数 | 说明 |
|------|------|
| start_date | 开始月份 YYYY-MM |
| end_date | 结束月份 YYYY-MM |

**响应：**
```json
{
  "code": 0,
  "data": [
    {
      "month": "2024-01",
      "income": 15000.00,
      "expense": 8000.00
    },
    {
      "month": "2024-02",
      "income": 12000.00,
      "expense": 9000.00
    }
  ]
}
```

### 8.3 分类统计
```
GET /stats/categories
```

**查询参数：**
| 参数 | 说明 |
|------|------|
| type | 类型：1-收入 2-支出 |
| month | 月份 YYYY-MM，默认当月 |

**响应：**
```json
{
  "code": 0,
  "data": [
    {
      "category_id": 2,
      "category_name": "餐饮",
      "category_icon": "restaurant",
      "amount": 2000.00,
      "percentage": 25.0
    },
    {
      "category_id": 3,
      "category_name": "交通",
      "category_icon": "directions_car",
      "amount": 800.00,
      "percentage": 10.0
    }
  ]
}
```

### 8.4 成员统计
```
GET /stats/members
```

**查询参数：**
| 参数 | 说明 |
|------|------|
| month | 月份 YYYY-MM，默认当月 |

**响应：**
```json
{
  "code": 0,
  "data": [
    {
      "user_id": 1,
      "user_nickname": "张三",
      "income": 10000.00,
      "expense": 5000.00
    },
    {
      "user_id": 2,
      "user_nickname": "李四",
      "income": 5000.00,
      "expense": 3000.00
    }
  ]
}
```

### 8.5 账户余额
```
GET /stats/accounts
```

**响应：**
```json
{
  "code": 0,
  "data": [
    {
      "account_id": 1,
      "account_name": "现金",
      "balance": 5000.00
    },
    {
      "account_id": 2,
      "account_name": "银行卡",
      "balance": 20000.00
    }
  ]
}
```

---

## 9. 错误码

| 错误码 | 说明 |
|--------|------|
| 0 | 成功 |
| 1 | 通用错误 |
| 1001 | 参数错误 |
| 1002 | 认证失败 |
| 1003 | 权限不足 |
| 2001 | 用户不存在 |
| 2002 | 邮箱已被注册 |
| 3001 | 家庭不存在 |
| 3002 | 邀请码无效 |
| 3003 | 已是家庭成员 |
| 4001 | 账户不存在 |
| 4002 | 分类不存在 |
| 4003 | 交易不存在 |

---

## 10. 安全性设计

> 以下为生产环境建议功能，MVP 阶段可先跳过或简化实现。

### 10.1 JWT Token 设计

```java
// Token 结构
{
  "header": {
    "alg": "RS256",
    "typ": "JWT"
  },
  "payload": {
    "sub": "user_id",
    "family_id": 1,
    "role": 1,
    "iat": 1704067200,
    "exp": 1704153600
  },
  "signature": "..."
}

// Token 配置
spring:
  jwt:
    secret: ${JWT_SECRET}
    expiration: 86400          # 24 小时（秒）
    refresh-expiration: 604800 # 7 天
```

### 10.2 认证过滤器

```java
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) {
        String token = extractToken(request);

        if (token != null && jwtService.validateToken(token)) {
            UserDetails userDetails = jwtService.getUserDetails(token);
            UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken(
                    userDetails, null, userDetails.getAuthorities());
            SecurityContextHolder.getContext().setAuthentication(auth);
        }

        filterChain.doFilter(request, response);
    }

    private String extractToken(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}
```

### 10.3 权限控制

```java
// 基于角色的权限控制
@RestController
@RequestMapping("/api/v1/families")
public class FamilyController {

    @GetMapping("/{id}/members")
    @PreAuthorize("@familyService.isMember(#familyId, authentication)")
    public ResponseEntity<List<MemberDTO>> getMembers(@PathVariable Long familyId) {
        // 仅家庭成员可访问
    }

    @DeleteMapping("/{id}/members/{userId}")
    @PreAuthorize("@familyService.isAdmin(#familyId, authentication)")
    public ResponseEntity<Void> removeMember(@PathVariable Long familyId,
                                               @PathVariable Long userId) {
        // 仅管理员可删除成员
    }
}
```

---

## 11. 限流设计

### 11.1 接口限流

```java
@Configuration
public class RateLimitConfig {

    @Bean
    public FilterRegistrationBean<RateLimitFilter> rateLimitFilter() {
        FilterRegistrationBean<RateLimitFilter> registration = new FilterRegistrationBean<>();
        registration.setFilter(new RateLimitFilter());
        registration.addUrlPatterns("/api/*");
        registration.setOrder(1);
        return registration;
    }
}

@Component
public class RateLimitFilter implements Filter {

    private final Map<String, RateLimiter> limiters = new ConcurrentHashMap<>();

    @Override
    public void doFilter(HttpServletRequest request, HttpServletResponse response,
                         FilterChain chain) throws IOException, ServletException {
        String clientId = getClientId(request);
        RateLimiter limiter = limiters.computeIfAbsent(clientId,
            k -> RateLimiter.create(100.0)); // 100 requests/second

        if (limiter.tryAcquire()) {
            chain.doFilter(request, response);
        } else {
            response.setStatus(429);
            response.getWriter().write("{\"code\":429,\"message\":\"Too Many Requests\"}");
        }
    }
}
```

### 11.2 限流策略

| 接口类型 | 限流策略 | 限制 |
|----------|----------|------|
| 登录/注册 | IP 限流 | 5次/分钟 |
| 交易创建 | 用户限流 | 30次/分钟 |
| 查询接口 | 用户限流 | 100次/分钟 |
| 统计接口 | 用户限流 | 10次/分钟 |

---

## 12. API 版本控制

### 12.1 版本策略

```
/api/v1/transactions    # 当前版本
/api/v2/transactions    # v2 版本（平滑迁移）
```

### 12.2 版本迁移策略

```java
// 版本判断与兼容
@RestController
@RequestMapping("/api/v{version}/transactions")
public class TransactionControllerV1 {
    // v1 逻辑
}

@RestController
@RequestMapping("/api/v{version}/transactions")
public class TransactionControllerV2 {
    // v2 逻辑，新增字段兼容处理
}
```

---

## 13. 日志与监控

### 13.1 请求日志

```java
@Slf4j
@Component
public class RequestLoggingFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) {
        long startTime = System.currentTimeMillis();

        try {
            filterChain.doFilter(request, response);
        } finally {
            long duration = System.currentTimeMillis() - startTime;
            log.info("method={} uri={} status={} duration={}ms",
                request.getMethod(),
                request.getRequestURI(),
                response.getStatus(),
                duration);
        }
    }
}
```

### 13.2 审计日志

```java
// 记录敏感操作
@Audited
public class TransactionService {

    @Transactional
    public Transaction createTransaction(CreateTransactionDTO dto) {
        Transaction transaction = transactionRepository.save(dtoToEntity(dto));

        // 审计日志
        auditLogService.log(AuditType.TRANSACTION_CREATE,
            dto.getUserId(),
            dto.getFamilyId(),
            "创建交易: " + dto.getAmount());

        return transaction;
    }
}
```

---

## 14. 错误处理

### 14.1 全局异常处理

```java
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ApiResponse<Void>> handleBusinessException(BusinessException e) {
        return ResponseEntity
            .status(e.getHttpStatus())
            .body(ApiResponse.error(e.getCode(), e.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handleValidationException(
            MethodArgumentNotValidException e) {
        String message = e.getBindingResult().getFieldErrors().stream()
            .map(FieldError::getDefaultMessage)
            .collect(Collectors.joining(", "));
        return ResponseEntity
            .badRequest()
            .body(ApiResponse.error(1001, message));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleException(Exception e) {
        log.error("系统异常", e);
        return ResponseEntity
            .status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(ApiResponse.error(1, "系统错误，请稍后重试"));
    }
}
```

### 14.2 错误码扩展

| 错误码 | 说明 | HTTP 状态码 |
|--------|------|-------------|
| 1001 | 参数错误 | 400 |
| 1002 | 认证失败 | 401 |
| 1003 | 权限不足 | 403 |
| 1004 | 资源不存在 | 404 |
| 1005 | 请求方法不支持 | 405 |
| 429 | 请求过于频繁 | 429 |
| 500 | 系统错误 | 500 |
