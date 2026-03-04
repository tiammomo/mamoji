# 数据库设计

 概述

开发## 1.阶段使用 H2 内存数据库，生产环境使用 MySQL。

### 1.1 数据库选型

| 阶段 | 数据库 | 说明 |
|------|--------|------|
| 开发 | H2 (内存/SQLite兼容) | 无需配置，开箱即用，适合开发调试 |
| 生产 | MySQL 8.0 | 高并发，支持事务，成熟稳定 |

### 1.2 开发环境配置（H2）

```yaml
# application.yml (开发环境)
spring:
  datasource:
    url: jdbc:h2:mem:mamoji
    driver-class-name: org.h2.Driver
    username: sa
    password:
  jpa:
    database-platform: org.hibernate.dialect.H2Dialect
    hibernate:
      ddl-auto: update  # 开发时自动建表
    show-sql: false
  h2:
    console:
      enabled: true
      path: /h2-console
```

### 1.3 生产配置（MySQL）

```yaml
# application-prod.yml (生产环境)
spring:
  datasource:
    url: jdbc:mysql://${DB_HOST}:3306/mamoji?useSSL=false&serverTimezone=Asia/Shanghai
    username: ${DB_USER}
    password: ${DB_PASSWORD}
    driver-class-name: com.mysql.cj.jdbc.Driver
  jpa:
    database-platform: org.hibernate.dialect.MySQLDialect
```

---

## 2. MVP 数据表设计

> MVP 阶段保留核心表，家庭组功能可后期添加。

### 2.1 users - 用户表

| 字段 | 类型 | 说明 | MVP |
|------|------|------|-----|
| id | BIGINT | 主键，自增 | ✓ |
| email | VARCHAR(255) | 邮箱，唯一 | ✓ |
| password_hash | VARCHAR(255) | 密码哈希 | ✓ |
| nickname | VARCHAR(50) | 昵称 | ✓ |
| avatar_url | VARCHAR(500) | 头像URL | P1 |
| family_id | BIGINT | 所属家庭ID | V1.0 |
| role | TINYINT | 角色：1-管理员 2-成员 | V1.0 |
| created_at | DATETIME | 创建时间 | ✓ |
| updated_at | DATETIME | 更新时间 | ✓ |

### 2.2 families - 家庭表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT | 主键，自增 |
| name | VARCHAR(100) | 家庭名称 |
| invite_code | VARCHAR(32) | 邀请码 |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

### 2.3 accounts - 账户表 (MVP P1)

| 字段 | 类型 | 说明 | MVP |
|------|------|------|-----|
| id | BIGINT | 主键，自增 | ✓ |
| family_id | BIGINT | 家庭ID | V1.0 |
| name | VARCHAR(50) | 账户名称 | ✓ |
| type | TINYINT | 类型：1-现金 2-银行卡 3-支付宝 4-微信 5-其他 | ✓ |
| balance | DECIMAL(12,2) | 余额 | ✓ |
| color | VARCHAR(7) | 颜色（十六进制） | P1 |
| is_default | TINYINT | 是否默认：0-否 1-是 | P1 |
| created_at | DATETIME | 创建时间 | ✓ |
| updated_at | DATETIME | 更新时间 | ✓ |

> MVP 阶段：使用系统默认账户（现金、银行卡、支付宝、微信），暂不开放自定义账户

### 2.4 categories - 分类表 (MVP)

| 字段 | 类型 | 说明 | MVP |
|------|------|------|-----|
| id | BIGINT | 主键，自增 | ✓ |
| family_id | BIGINT | 家庭ID | V1.0 |
| name | VARCHAR(50) | 分类名称 | ✓ |
| type | TINYINT | 类型：1-收入 2-支出 | ✓ |
| icon | VARCHAR(50) | 图标名称 | ✓ |
| color | VARCHAR(7) | 颜色 | ✓ |
| is_system | TINYINT | 是否系统分类：0-否 1-是 | ✓ |
| created_at | DATETIME | 创建时间 | ✓ |
| updated_at | DATETIME | 更新时间 | ✓ |

> MVP 阶段：使用内置默认分类，不开放自定义分类（V1.0）

### 2.5 transactions - 交易记录表 (MVP)

| 字段 | 类型 | 说明 | MVP |
|------|------|------|-----|
| id | BIGINT | 主键，自增 | ✓ |
| family_id | BIGINT | 家庭ID | V1.0 |
| user_id | BIGINT | 记账人ID | ✓ |
| type | TINYINT | 类型：1-收入 2-支出 | ✓ |
| amount | DECIMAL(12,2) | 金额 | ✓ |
| category_id | BIGINT | 分类ID | ✓ |
| account_id | BIGINT | 账户ID | P1 |
| date | DATE | 交易日期 | ✓ |
| remark | VARCHAR(500) | 备注 | ✓ |
| created_at | DATETIME | 创建时间 | ✓ |
| updated_at | DATETIME | 更新时间 | ✓ |

> MVP 阶段：account_id 可选，暂不关联账户

### 2.6 member_stats - 成员统计表 (V1.0)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT | 主键，自增 |
| user_id | BIGINT | 用户ID |
| month | VARCHAR(7) | 年月（YYYY-MM） |
| income | DECIMAL(12,2) | 月收入 |
| expense | DECIMAL(12,2) | 月支出 |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

---

## 3. 索引设计

```sql
-- users 表
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_family_id ON users(family_id);

-- accounts 表
CREATE INDEX idx_accounts_family_id ON accounts(family_id);

-- categories 表
CREATE INDEX idx_categories_family_id ON categories(family_id);
CREATE INDEX idx_categories_type ON categories(type);

-- transactions 表
CREATE INDEX idx_transactions_family_id ON transactions(family_id);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_category_id ON transactions(category_id);
CREATE INDEX idx_transactions_account_id ON transactions(account_id);

-- member_stats 表
CREATE INDEX idx_member_stats_user_month ON member_stats(user_id, month);
```

---

## 4. ER 关系图

```
┌─────────────┐       ┌─────────────┐
│  families   │       │    users    │
├─────────────┤       ├─────────────┤
│ id          │◄──────│ family_id   │
│ name        │       │ id          │────┐
│ invite_code │       │ email       │    │
└─────────────┘       └─────────────┘    │
                                    ┌─────┴────┐
                                    │          │
                              ┌─────▼────┐ ┌──▼──────────┐
                              │ accounts │ │ categories  │
                              ├──────────┤ ├─────────────┤
                              │ family_id│ │ family_id   │
                              │ id       │◄│ id          │
                              └──────────┘ └─────────────┘
                                    │
                              ┌─────▼────────┐
                              │ transactions   │
                              ├────────────────┤
                              │ family_id      │
                              │ user_id        │
                              │ category_id    │
                              │ account_id     │
                              │ id             │
                              └────────────────┘
```

---

## 5. 默认数据

### 5.1 默认支出分类
| 名称 | 图标 | 颜色 |
|------|------|------|
| 餐饮 | restaurant | #FF6B6B |
| 交通 | directions_car | #4ECDC4 |
| 购物 | shopping_bag | #45B7D1 |
| 医疗 | local_hospital | #F7DC6F |
| 教育 | school | #BB8FCE |
| 娱乐 | movie | #85C1E9 |
| 生活费 | home | #58D68D |
| 其他 | more_horiz | #ABB2B9 |

### 5.2 默认收入分类
| 名称 | 图标 | 颜色 |
|------|------|------|
| 工资 | work | #27AE60 |
| 奖金 | card_giftcard | #E74C3C |
| 投资 | trending_up | #3498DB |
| 其他 | more_horiz | #ABB2B9 |

### 5.3 默认账户
| 名称 | 类型 | 颜色 |
|------|------|------|
| 现金 | 1 | #27AE60 |
| 银行卡 | 2 | #3498DB |
| 支付宝 | 3 | #1890FF |
| 微信 | 4 | #07C160 |

---

## 6. 快速开始

### 6.1 自动建表

MVP 阶段使用 JPA 自动建表，无需手动执行 SQL：

```yaml
# JPA 配置
spring:
  jpa:
    hibernate:
      ddl-auto: update  # 开发时自动创建/更新表结构
    show-sql: true      # 显示建表 SQL
```

### 6.2 初始化数据

首次启动时自动插入默认分类：

```java
@PostConstruct
public void initDefaultCategories() {
    // 收入分类
    List<Category> incomeCategories = List.of(
        Category.builder().name("工资").type(1).icon("work").color("#27AE60").build(),
        Category.builder().name("奖金").type(1).icon("card_giftcard").color("#E74C3C").build(),
        Category.builder().name("投资").type(1).icon("trending_up").color("#3498DB").build()
    );
    // 支出分类
    List<Category> expenseCategories = List.of(
        Category.builder().name("餐饮").type(2).icon("restaurant").color("#FF6B6B").build(),
        Category.builder().name("交通").type(2).icon("directions_car").color("#4ECDC4").build(),
        Category.builder().name("购物").type(2).icon("shopping_bag").color("#45B7D1").build()
    );
    // ...
}
```

---

## 7. 事务管理

### 7.1 事务传播行为

| 传播行为 | 说明 | 使用场景 |
|----------|------|----------|
| REQUIRED | 如果当前有事务，加入该事务 | 默认，大多数操作 |
| REQUIRES_NEW | 始终开启新事务 | 独立业务逻辑 |
| SUPPORTS | 如果有事务则加入，否则非事务执行 | 查询操作 |
| NOT_SUPPORTED | 非事务执行 | 排除事务的操作 |

### 7.2 事务隔离级别

```java
@Transactional(isolation = Isolation.READ_COMMITTED)
public class TransactionService {
    // 读已提交，防止脏读
}
```

| 隔离级别 | 脏读 | 不可重复读 | 幻读 |
|----------|------|------------|------|
| READ_UNCOMMITTED | ✓ | ✓ | ✓ |
| READ_COMMITTED | ✗ | ✓ | ✓ |
| REPEATABLE_READ | ✗ | ✗ | ✓ |
| SERIALIZABLE | ✗ | ✗ | ✗ |

**推荐使用 READ_COMMITTED**，平衡性能与数据一致性。

### 7.3 交易记账事务示例

```java
@Transactional(isolation = Isolation.READ_COMMITTED)
public void createTransaction(CreateTransactionDTO dto) {
    // 1. 创建交易记录
    Transaction transaction = Transaction.builder()
        .familyId(dto.getFamilyId())
        .userId(dto.getUserId())
        .type(dto.getType())
        .amount(dto.getAmount())
        .categoryId(dto.getCategoryId())
        .accountId(dto.getAccountId())
        .date(dto.getDate())
        .remark(dto.getRemark())
        .build();
    transactionRepository.save(transaction);

    // 2. 更新账户余额（收入增加，支出减少）
    Account account = accountRepository.findById(dto.getAccountId())
        .orElseThrow(() -> new BusinessException("账户不存在"));
    BigDecimal newBalance = dto.getType() == TransactionType.INCOME
        ? account.getBalance().add(dto.getAmount())
        : account.getBalance().subtract(dto.getAmount());
    account.setBalance(newBalance);
    accountRepository.save(account);
}
```

---

## 8. 数据迁移

### 8.1 Flyway 配置

```yaml
spring:
  flyway:
    enabled: true
    baseline-on-migrate: true
    locations: classpath:db/migration
    baseline-version: 0
```

### 8.2 迁移文件命名规范

```
V1__initial_schema.sql
V2__add_family_invite_code.sql
V3__add_transaction_index.sql
```

### 8.3 数据初始化

```sql
-- 初始化默认分类（家庭ID为NULL表示系统级）
INSERT INTO categories (name, type, icon, color, is_system, created_at, updated_at)
SELECT name, type, icon, color, 1, NOW(), NOW()
FROM (
    SELECT '工资' as name, 1 as type, 'work' as icon, '#27AE60' as color UNION ALL
    SELECT '奖金', 1, 'card_giftcard', '#E74C3C' UNION ALL
    SELECT '投资', 1, 'trending_up', '#3498DB' UNION ALL
    SELECT '餐饮', 2, 'restaurant', '#FF6B6B' UNION ALL
    SELECT '交通', 2, 'directions_car', '#4ECDC4' UNION ALL
    SELECT '购物', 2, 'shopping_bag', '#45B7D1' UNION ALL
    SELECT '医疗', 2, 'local_hospital', '#F7DC6F' UNION ALL
    SELECT '教育', 2, 'school', '#BB8FCE' UNION ALL
    SELECT '娱乐', 2, 'movie', '#85C1E9' UNION ALL
    SELECT '生活费', 2, 'home', '#58D68D' UNION ALL
    SELECT '其他', 2, 'more_horiz', '#ABB2B9'
) AS defaults
WHERE NOT EXISTS (
    SELECT 1 FROM categories WHERE name = defaults.name AND type = defaults.type
);
```

---

## 9. 性能优化

### 9.1 查询优化

```java
// 使用 N+1 查询优化 - JOIN FETCH
@Query("SELECT t FROM Transaction t " +
       "LEFT JOIN FETCH t.category " +
       "LEFT JOIN FETCH t.account " +
       "LEFT JOIN FETCH t.user " +
       "WHERE t.familyId = :familyId")
List<Transaction> findByFamilyIdWithDetails(@Param("familyId") Long familyId);

// 使用 Specification 动态查询
public Specification<Transaction> buildSpecification(TransactionQuery query) {
    return (root, cq, cb) -> {
        List<Predicate> predicates = new ArrayList<>();
        if (query.getFamilyId() != null) {
            predicates.add(cb.equal(root.get("familyId"), query.getFamilyId()));
        }
        if (query.getType() != null) {
            predicates.add(cb.equal(root.get("type"), query.getType()));
        }
        if (query.getStartDate() != null) {
            predicates.add(cb.greaterThanOrEqualTo(root.get("date"), query.getStartDate()));
        }
        if (query.getEndDate() != null) {
            predicates.add(cb.lessThanOrEqualTo(root.get("date"), query.getEndDate()));
        }
        return cb.and(predicates.toArray(new Predicate[0]));
    };
}
```

### 9.2 索引优化

```sql
-- 复合索引优化常见查询
CREATE INDEX idx_transactions_family_date ON transactions(family_id, date DESC);
CREATE INDEX idx_transactions_family_user_date ON transactions(family_id, user_id, date DESC);

-- 统计查询优化（物化视图或定时任务）
CREATE INDEX idx_transactions_category_month ON transactions(category_id, DATE_FORMAT(date, '%Y-%m'));
```

### 9.3 分表策略

当数据量超过 100 万条时考虑分表：

```java
// 按月份分表（适用于交易记录）
@TableName("transactions_${year}${month}")
public class Transaction {
    // 路由键：family_id + date
}
```

---

## 10. 缓存设计

### 10.1 缓存策略

| 数据类型 | 缓存策略 | TTL | 说明 |
|----------|----------|-----|------|
| 用户信息 | Cache-Aside | 30分钟 | 频繁访问 |
| 家庭成员列表 | Cache-Aside | 10分钟 | 成员变动时刷新 |
| 账户信息 | Write-Through | 实时 | 变动同步 |
| 分类列表 | Read-Through | 1小时 | 系统分类少变化 |
| 统计数据 | Scheduled Refresh | 5分钟 | 定时计算 |

### 10.2 Redis 缓存配置

```java
@Configuration
@EnableCaching
public class RedisConfig {

    @Bean
    public CacheManager cacheManager(RedisConnectionFactory connectionFactory) {
        RedisCacheConfiguration config = RedisCacheConfiguration.defaultCacheConfig()
            .entryTtl(Duration.ofMinutes(30))
            .serializeKeys(RedisSerializationContext.SerializationPair
                .fromSerializer(new StringRedisSerializer()))
            .serializeValues(RedisSerializationContext.SerializationPair
                .fromSerializer(new GenericJackson2JsonRedisSerializer()));

        return RedisCacheManager.builder(connectionFactory)
            .cacheDefaults(config)
            .withCacheConfiguration("user",
                RedisCacheConfiguration.defaultCacheConfig().entryTtl(Duration.ofMinutes(30)))
            .withCacheConfiguration("family",
                RedisCacheConfiguration.defaultCacheConfig().entryTtl(Duration.ofMinutes(10)))
            .withCacheConfiguration("stats",
                RedisCacheConfiguration.defaultCacheConfig().entryTtl(Duration.ofMinutes(5)))
            .build();
    }
}
```

---

## 11. 备份与恢复

### 11.1 自动备份

```bash
#!/bin/bash
# backup.sh - 每日凌晨 3 点执行

BACKUP_DIR="/backup/mysql"
DATE=$(date +%Y%m%d)

# 备份所有数据库
mysqldump -u root -p${MYSQL_ROOT_PASSWORD} \
    --single-transaction \
    --routines \
    --triggers \
    --events \
    mamoji > ${BACKUP_DIR}/mamoji_${DATE}.sql

# 删除 7 天前的备份
find ${BACKUP_DIR} -name "mamoji_*.sql" -mtime +7 -delete
```

### 11.2 恢复流程

```bash
# 恢复到指定时间点
mysql -u root -p mamoji < mamoji_20240301.sql

# Point-in-time recovery (需要 binlog)
mysqlbinlog --stop-datetime="2024-03-01 10:00:00" binlog.000001 | mysql -u root -p
```

---

## 12. 附录：高级功能（V1.0+）

> 以下为后续版本功能，MVP 阶段可先跳过。
