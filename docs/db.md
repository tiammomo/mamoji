# Mamoji 数据库设计

## 数据库信息

| 项目 | 值 |
|------|-----|
| 数据库 | MySQL 8.0 |
| 字符集 | utf8mb4 |
| 排序规则 | utf8mb4_unicode_ci |
| 表前缀 | 无 |

## ER 图

```
                                    ┌─────────────────┐
                                    │   sys_user      │
                                    └─────────────────┘
                                              │
          ┌───────────────────────────────────┼───────────────────────────────────┐
          │                                   │                                   │
          ▼                                   ▼                                   ▼
    ┌─────────────┐                   ┌─────────────┐                   ┌─────────────┐
    │fin_category │                   │fin_account  │                   │fin_budget   │
    └─────────────┘                   └─────────────┘                   └─────────────┘
          ▲                                   │                                   │
          │                                   │                                   │
          │                                   ▼                                   │
          │                           ┌─────────────┐                             │
          └───────────────────────────│fin_transaction│◀──────────────────────────┘
                                    └─────────────┘
```

## 表结构

### 1. sys_user 用户表

```sql
CREATE TABLE `sys_user` (
  `user_id` BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT COMMENT '用户ID',
  `username` VARCHAR(50) NOT NULL COMMENT '用户名',
  `password` VARCHAR(255) NOT NULL COMMENT '密码(BCRYPT加密)',
  `phone` VARCHAR(20) COMMENT '手机号',
  `email` VARCHAR(100) COMMENT '邮箱',
  `role` VARCHAR(20) DEFAULT 'normal' COMMENT '角色: super_admin, admin, normal',
  `status` TINYINT DEFAULT 1 COMMENT '状态: 0禁用, 1正常',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';
```

---

### 2. fin_category 分类表

```sql
CREATE TABLE `fin_category` (
  `category_id` BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT COMMENT '分类ID',
  `user_id` BIGINT UNSIGNED DEFAULT 0 COMMENT '用户ID, 0为系统默认',
  `name` VARCHAR(50) NOT NULL COMMENT '分类名称',
  `type` VARCHAR(20) NOT NULL COMMENT '类型: income(收入), expense(支出)',
  `status` TINYINT DEFAULT 1 COMMENT '状态: 0禁用, 1正常',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='收支分类表';
```

**系统默认分类：**

| 分类名称 | 类型 | 说明 |
|----------|------|------|
| 工资 | income | 薪资收入 |
| 奖金 | income | 奖金收入 |
| 投资收入 | income | 理财收益 |
| 其他收入 | income | 其他收入 |
| 餐饮 | expense | 日常餐饮 |
| 交通 | expense | 出行费用 |
| 购物 | expense | 日常购物 |
| 居住 | expense | 房租/房贷/水电 |
| 娱乐 | expense | 休闲娱乐 |
| 医疗 | expense | 医疗健康 |
| 教育 | expense | 学习培训 |
| 其他支出 | expense | 其他支出 |

---

### 3. fin_account 账户表

```sql
CREATE TABLE `fin_account` (
  `account_id` BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT COMMENT '账户ID',
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  `name` VARCHAR(100) NOT NULL COMMENT '账户名称',
  `account_type` VARCHAR(30) NOT NULL COMMENT '账户类型',
  `account_sub_type` VARCHAR(30) COMMENT '子类型',
  `currency` VARCHAR(10) DEFAULT 'CNY' COMMENT '币种',
  `balance` DECIMAL(18,2) DEFAULT 0.00 COMMENT '余额(负债类为负数)',
  `include_in_total` TINYINT DEFAULT 1 COMMENT '是否计入总资产: 1是, 0否',
  `status` TINYINT DEFAULT 1 COMMENT '状态: 0禁用, 1正常',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='账户表';
```

**账户类型 (account_type) 说明：**

| account_type | account_sub_type | 说明 |
|--------------|------------------|------|
| bank | bank_primary | 一类银行卡 |
| bank | bank_secondary | 二类银行卡 |
| credit | credit_card | 信用卡 |
| cash | - | 现金 |
| alipay | - | 支付宝 |
| wechat | - | 微信 |
| gold | - | 黄金 |
| fund_accumulation | - | 公积金 |
| fund | - | 基金 |
| stock | - | 股票 |
| topup | - | 充值卡 |
| debt | - | 借款 |

**余额规则：**
- 资产类（bank/credit/cash/alipay/wechat/gold/fund_accumulation/fund/stock/topup）：余额为正数
- 负债类（credit/debt）：余额为负数

**计入总资产：**
- 默认计入（include_in_total = 1），可手动关闭

---

### 4. fin_transaction 交易表

```sql
CREATE TABLE `fin_transaction` (
  `transaction_id` BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT COMMENT '交易ID',
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  `account_id` BIGINT UNSIGNED NOT NULL COMMENT '账户ID',
  `category_id` BIGINT UNSIGNED NOT NULL COMMENT '分类ID',
  `budget_id` BIGINT UNSIGNED COMMENT '预算ID(可选)',
  `type` VARCHAR(20) NOT NULL COMMENT '类型: income, expense',
  `amount` DECIMAL(18,2) NOT NULL COMMENT '金额',
  `currency` VARCHAR(10) DEFAULT 'CNY' COMMENT '币种',
  `occurred_at` DATETIME NOT NULL COMMENT '发生时间',
  `note` VARCHAR(500) COMMENT '备注',
  `status` TINYINT DEFAULT 1 COMMENT '状态: 0删除, 1正常',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='交易记录表';
```

**字段说明：**
- `category_id`：必填，记录交易的收支分类
- `budget_id`：可选，关联预算便于统计

---

### 5. fin_budget 预算表

```sql
CREATE TABLE `fin_budget` (
  `budget_id` BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT COMMENT '预算ID',
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  `name` VARCHAR(100) NOT NULL COMMENT '预算名称',
  `amount` DECIMAL(18,2) NOT NULL COMMENT '预算金额',
  `spent` DECIMAL(18,2) DEFAULT 0.00 COMMENT '已花费(实时更新)',
  `start_date` DATE NOT NULL COMMENT '开始日期',
  `end_date` DATE NOT NULL COMMENT '结束日期',
  `status` TINYINT DEFAULT 1 COMMENT '状态: 0取消, 1进行中, 2已完成, 3超支',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='预算表';
```

**说明：**
- 周期由 `start_date` 和 `end_date` 定义，支持任意时长（周、月、季度、年等）

**预算状态：**

| 状态 | 说明 | 触发条件 |
|------|------|----------|
| 0 | 已取消 | 用户手动取消 |
| 1 | 进行中 | 正常进行中 |
| 2 | 已完成 | 正常结束，未超支 |
| 3 | 超支 | spent > amount |

---

### 6. sys_preference 用户偏好表

```sql
CREATE TABLE `sys_preference` (
  `pref_id` BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT COMMENT '偏好ID',
  `user_id` BIGINT UNSIGNED NOT NULL UNIQUE COMMENT '用户ID',
  `currency` VARCHAR(10) DEFAULT 'CNY' COMMENT '默认货币',
  `timezone` VARCHAR(50) DEFAULT 'Asia/Shanghai' COMMENT '时区',
  `date_format` VARCHAR(20) DEFAULT 'YYYY-MM-DD' COMMENT '日期格式',
  `month_start` INT DEFAULT 1 COMMENT '月度开始日期',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户偏好表';
```

---

## 索引设计

| 表名 | 索引字段 | 类型 | 说明 |
|------|----------|------|------|
| sys_user | username | UNIQUE | 唯一索引 (登录用) |
| sys_user | phone | INDEX | 手机号索引 |
| sys_user | email | INDEX | 邮箱索引 |
| fin_category | user_id | INDEX | 用户索引 |
| fin_category | type | INDEX | 类型索引 |
| fin_category | user_id, type | INDEX | 用户+类型复合索引 |
| fin_account | user_id | INDEX | 用户索引 |
| fin_account | status | INDEX | 状态索引 |
| fin_account | user_id, status | INDEX | 用户+状态复合索引 |
| fin_account | account_type | INDEX | 账户类型索引 |
| fin_transaction | user_id | INDEX | 用户索引 |
| fin_transaction | account_id | INDEX | 账户索引 |
| fin_transaction | category_id | INDEX | 分类索引 |
| fin_transaction | user_id, type | INDEX | 用户+类型复合索引 |
| fin_transaction | user_id, occurred_at | INDEX | 用户+时间复合索引 |
| fin_transaction | user_id, type, occurred_at | INDEX | 用户+类型+时间复合索引 (常用) |
| fin_budget | user_id | INDEX | 用户索引 |
| fin_budget | status | INDEX | 状态索引 |
| fin_budget | user_id, status | INDEX | 用户+状态复合索引 |
| fin_budget | user_id, start_date, end_date | INDEX | 周期查询复合索引 |
| sys_preference | user_id | UNIQUE | 用户唯一索引 |

---

## 软删除策略

系统采用**软删除**策略，通过 `status` 字段控制数据的有效性：

| 表名 | status=0 含义 | status=1 含义 |
|------|---------------|---------------|
| sys_user | 禁用 | 正常 |
| fin_category | 禁用 | 正常 |
| fin_account | 禁用 | 正常 |
| fin_transaction | 已删除 | 正常 |
| fin_budget | 已取消 | 进行中/已完成/超支 |

**查询数据时需过滤** `status = 1`（或 `status != 0`）：

```sql
-- 查询有效数据
SELECT * FROM fin_transaction WHERE user_id = ? AND status = 1;
```

---

## 数据初始化

### 默认分类数据

```sql
-- 收入分类
INSERT INTO fin_category (name, type) VALUES
('工资', 'income'),
('奖金', 'income'),
('投资收入', 'income'),
('其他收入', 'income');

-- 支出分类
INSERT INTO fin_category (name, type) VALUES
('餐饮', 'expense'),
('交通', 'expense'),
('购物', 'expense'),
('居住', 'expense'),
('娱乐', 'expense'),
('医疗', 'expense'),
('教育', 'expense'),
('其他支出', 'expense');
```

---

## 字段枚举值

### status 状态码 (通用)

| 值 | 说明 | 适用表 |
|----|------|--------|
| 0 | 禁用/删除/取消 | sys_user, fin_category, fin_account, fin_transaction, fin_budget |
| 1 | 正常/进行中 | sys_user, fin_category, fin_account, fin_transaction, fin_budget |

### role 用户角色

| 值 | 说明 |
|----|------|
| normal | 普通用户 |
| admin | 管理员 |
| super_admin | 超级管理员 |

### type 类型

| 值 | 说明 | 适用表 |
|----|------|--------|
| income | 收入 | fin_category, fin_transaction |
| expense | 支出 | fin_category, fin_transaction |

### account_type 账户类型

| 值 | account_sub_type | 说明 |
|----|------------------|------|
| bank | bank_primary / bank_secondary | 银行卡 |
| credit | credit_card | 信用卡 |
| cash | - | 现金 |
| alipay | - | 支付宝 |
| wechat | - | 微信 |
| gold | - | 黄金 |
| fund_accumulation | - | 公积金 |
| fund | - | 基金 |
| stock | - | 股票 |
| topup | - | 充值卡 |
| debt | - | 借款 |

### budget_status 预算状态

| 值 | 说明 | 触发条件 |
|----|------|----------|
| 0 | 已取消 | 用户手动取消 |
| 1 | 进行中 | 正常进行中 |
| 2 | 已完成 | 正常结束，未超支 |
| 3 | 超支 | spent > amount |

### include_in_total 是否计入总资产

| 值 | 说明 |
|----|------|
| 0 | 不计入 |
| 1 | 计入 |

### 用户角色权限

| 角色 | 权限范围 |
|------|----------|
| normal | 仅能操作自己的数据 |
| admin | 仅能操作自己的数据（预留管理功能） |
| super_admin | 仅能操作自己的数据（预留系统管理功能） |

> 当前版本所有用户均为 normal 角色，角色权限功能待后续扩展。

---

## Redis 数据结构设计

> Redis 客户端使用 Redisson，支持分布式锁和更多高级特性。
> 本地缓存使用 Caffeine，与 Redis 配合实现多级缓存。

### Key 命名规范

```
mamoji:{module}:{submodule}:{identifier}
```

### 缓存场景

| Key | 类型 | 说明 | 过期时间 |
|-----|------|------|----------|
| `mamoji:token:blacklist:{token}` | String | Token 黑名单 | 同 Token 剩余有效期 |
| `mamoji:login:fail:{username}` | String | 登录失败次数 | 15 分钟 |
| `mamoji:account:locked:{username}` | String | 账户锁定状态 | 15 分钟 |
| `mamoji:captcha:{type}:{target}` | String | 验证码 | 5 分钟 |
| `mamoji:cache:category:{userId}` | Hash | 用户分类缓存 | 30 分钟 |
| `mamoji:cache:account:summary:{userId}` | String | 账户汇总缓存 | 30 分钟 |

### 详细说明

#### 1. Token 黑名单

```redis
# 登出或修改密码时，将 Token 加入黑名单
SET mamoji:token:blacklist:{token} 1 EX {剩余秒数}

# 检查 Token 是否在黑名单
EXISTS mamoji:token:blacklist:{token}
```

#### 2. 登录失败计数

```redis
# 登录失败时，递增计数
INCR mamoji:login:fail:{username}
EXPIRE mamoji:login:fail:{username} 900  # 15分钟

# 当计数 >= 5 时，锁定账户
SET mamoji:account:locked:{username} 1 EX 900
```

#### 3. 验证码缓存

```redis
# 发送验证码
SET mamoji:captcha:phone:{phone} {code} EX 300  # 5分钟
SET mamoji:captcha:email:{email} {code} EX 300

# 验证验证码
GET mamoji:captcha:phone:{phone}
DEL mamoji:captcha:phone:{phone}
```

#### 4. 热点数据缓存

```redis
# 用户分类缓存
HSET mamoji:cache:category:{userId} categoryId name type
EXPIRE mamoji:cache:category:{userId} 1800  # 30分钟

# 账户汇总缓存
SET mamoji:cache:account:summary:{userId} {json} EX 1800
```
