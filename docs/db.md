# Mamoji 数据库设计文档

## 1. 数据库信息

| 项目 | 值 |
|------|-----|
| 数据库 | MySQL 8.0 |
| 字符集 | utf8mb4 |
| 排序规则 | utf8mb4_unicode_ci |
| 数据库名 | mamoji |
| 测试数据库 | mamoji_test |

---

## 2. ER 关系图

```
┌─────────────┐       ┌─────────────┐
│  sys_user   │       │sys_preference│
└──────┬──────┘       └──────┬──────┘
       │                     │
       ├─────────────────────┤
       │                     │
       ▼                     ▼
┌─────────────┐       ┌─────────────┐
│fin_category │       │ fin_account │
└─────────────┘       └─────────────┘
       │                     │
       │                     │
       ▼                     ▼
┌─────────────┐       ┌─────────────┐
│  fin_budget │       │fin_transaction
└─────────────┘       └──────┬──────┘
                             │
                             ▼
                        ┌─────────────┐
                        │  fin_refund │
                        └─────────────┘
```

---

## 3. 数据表详情

### 3.1 用户表 (sys_user)

存储用户账户信息。

```sql
CREATE TABLE sys_user (
    user_id BIGINT PRIMARY KEY COMMENT '用户ID',
    username VARCHAR(50) NOT NULL COMMENT '用户名',
    email VARCHAR(100) NOT NULL COMMENT '邮箱',
    password VARCHAR(100) NOT NULL COMMENT '密码(BCrypt加密)',
    phone VARCHAR(20) COMMENT '手机号',
    status TINYINT DEFAULT 1 COMMENT '状态: 1=正常, 0=禁用',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    UNIQUE KEY uk_email (email),
    UNIQUE KEY uk_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';
```

**字段说明：**

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| user_id | BIGINT | - | 主键，雪花ID |
| username | VARCHAR(50) | - | 用户名，唯一 |
| email | VARCHAR(100) | - | 邮箱，唯一 |
| password | VARCHAR(100) | - | BCrypt加密后的密码 |
| phone | VARCHAR(20) | NULL | 手机号 |
| status | TINYINT | 1 | 1=正常，0=禁用 |
| created_at | DATETIME | CURRENT_TIMESTAMP | 创建时间 |
| updated_at | DATETIME | 自动更新 | 更新时间 |

---

### 3.2 用户偏好表 (sys_preference)

存储用户个性化设置。

```sql
CREATE TABLE sys_preference (
    preference_id BIGINT PRIMARY KEY COMMENT '偏好ID',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    preference_key VARCHAR(50) NOT NULL COMMENT '偏好键',
    preference_value TEXT COMMENT '偏好值(JSON格式)',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    UNIQUE KEY uk_user_key (user_id, preference_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户偏好表';
```

---

### 3.3 分类表 (fin_category)

收支分类表，系统预置基础分类。

```sql
CREATE TABLE fin_category (
    category_id BIGINT PRIMARY KEY COMMENT '分类ID',
    user_id BIGINT NOT NULL DEFAULT 0 COMMENT '用户ID(0=系统预置)',
    name VARCHAR(50) NOT NULL COMMENT '分类名称',
    type VARCHAR(20) NOT NULL COMMENT '类型: INCOME/EXPENSE',
    icon VARCHAR(10) COMMENT '图标(Emoji)',
    sort_order INT DEFAULT 0 COMMENT '排序',
    status TINYINT DEFAULT 1 COMMENT '状态: 1=正常, 0=禁用',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_type (type),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='收支分类表';
```

**分类类型：**

| type | 说明 | 示例 |
|------|------|------|
| INCOME | 收入分类 | 工资、奖金、投资 |
| EXPENSE | 支出分类 | 餐饮、交通、购物 |

**系统预置分类：**

```sql
-- 收入分类
INSERT INTO fin_category (category_id, user_id, name, type, icon) VALUES
(1, 0, '工资', 'INCOME', '💰'),
(2, 0, '奖金', 'INCOME', '🎁'),
(3, 0, '投资', 'INCOME', '📈'),
(4, 0, '其他收入', 'INCOME', '💵');

-- 支出分类
INSERT INTO fin_category (category_id, user_id, name, type, icon) VALUES
(5, 0, '餐饮', 'EXPENSE', '🍔'),
(6, 0, '交通', 'EXPENSE', '🚗'),
(7, 0, '购物', 'EXPENSE', '🛍️'),
(8, 0, '娱乐', 'EXPENSE', '🎬'),
(9, 0, '居住', 'EXPENSE', '🏠'),
(10, 0, '生活', 'EXPENSE', '🛒'),
(11, 0, '医疗', 'EXPENSE', '💊'),
(12, 0, '教育', 'EXPENSE', '📚'),
(13, 0, '人情', 'EXPENSE', '🎊'),
(14, 0, '其他支出', 'EXPENSE', '💳');
```

---

### 3.4 账户表 (fin_account)

用户账户信息。

```sql
CREATE TABLE fin_account (
    account_id BIGINT PRIMARY KEY COMMENT '账户ID',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    name VARCHAR(50) NOT NULL COMMENT '账户名称',
    account_type VARCHAR(20) NOT NULL COMMENT '账户类型',
    account_sub_type VARCHAR(50) COMMENT '子类型',
    balance DECIMAL(15,2) DEFAULT 0.00 COMMENT '余额',
    include_in_total TINYINT DEFAULT 1 COMMENT '是否计入净资产: 1=是, 0=否',
    sort_order INT DEFAULT 0 COMMENT '排序',
    status TINYINT DEFAULT 1 COMMENT '状态: 1=正常, 0=已删除',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_user (user_id),
    INDEX idx_type (account_type),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='账户表';
```

**账户类型：**

| account_type | 说明 | 计入净资产 |
|--------------|------|------------|
| bank | 银行卡 | ✅ |
| credit | 信用卡 | ❌ |
| cash | 现金 | ✅ |
| digital | 数字钱包(支付宝/微信) | ✅ |
| investment | 投资(股票/基金) | ✅ |
| debt | 负债(借款) | ❌ |

---

### 3.5 预算表 (fin_budget)

预算信息。

```sql
CREATE TABLE fin_budget (
    budget_id BIGINT PRIMARY KEY COMMENT '预算ID',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    name VARCHAR(50) NOT NULL COMMENT '预算名称',
    amount DECIMAL(15,2) NOT NULL COMMENT '预算金额',
    spent DECIMAL(15,2) DEFAULT 0.00 COMMENT '已花费金额',
    start_date DATE NOT NULL COMMENT '开始日期',
    end_date DATE NOT NULL COMMENT '结束日期',
    alert_threshold INT DEFAULT 80 COMMENT '预警阈值(百分比)',
    status TINYINT DEFAULT 1 COMMENT '状态: 0=已取消, 1=进行中, 2=已完成, 3=超支',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_user (user_id),
    INDEX idx_status (status),
    INDEX idx_date (start_date, end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='预算表';
```

**预算状态：**

| status | 说明 | 触发条件 |
|--------|------|----------|
| 0 | 已取消 | 手动取消 |
| 1 | 进行中 | 当前日期在预算期间内 |
| 2 | 已完成 | 预算期间结束且未超支 |
| 3 | 超支 | 已花费 > 预算金额 |

---

### 3.6 交易表 (fin_transaction)

交易记录表。

```sql
CREATE TABLE fin_transaction (
    transaction_id BIGINT PRIMARY KEY COMMENT '交易ID',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    type VARCHAR(20) NOT NULL COMMENT '类型: INCOME/EXPENSE',
    amount DECIMAL(15,2) NOT NULL COMMENT '金额',
    account_id BIGINT NOT NULL COMMENT '账户ID',
    category_id BIGINT NOT NULL COMMENT '分类ID',
    budget_id BIGINT COMMENT '预算ID(支出必填)',
    occurred_at DATETIME NOT NULL COMMENT '交易时间',
    note VARCHAR(255) COMMENT '备注',
    status TINYINT DEFAULT 1 COMMENT '状态: 1=正常, 0=已删除',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_user (user_id),
    INDEX idx_type (type),
    INDEX idx_account (account_id),
    INDEX idx_category (category_id),
    INDEX idx_budget (budget_id),
    INDEX idx_occurred (occurred_at),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='交易记录表';
```

**交易类型：**

| type | 说明 |
|------|------|
| INCOME | 收入 |
| EXPENSE | 支出 |

---

### 3.7 退款表 (fin_refund)

退款记录表。

```sql
CREATE TABLE fin_refund (
    refund_id BIGINT PRIMARY KEY COMMENT '退款ID',
    transaction_id BIGINT NOT NULL COMMENT '原交易ID',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    amount DECIMAL(15,2) NOT NULL COMMENT '退款金额',
    note VARCHAR(255) COMMENT '退款备注',
    occurred_at DATETIME NOT NULL COMMENT '退款时间',
    status TINYINT DEFAULT 1 COMMENT '状态: 1=有效, 0=已取消',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_transaction (transaction_id),
    INDEX idx_user (user_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='退款记录表';
```

---

## 4. 索引优化

### 4.1 常用查询索引

| 表 | 查询场景 | 索引字段 |
|---|----------|----------|
| fin_transaction | 按用户查询 | user_id, status |
| fin_transaction | 按时间范围查询 | user_id, occurred_at, status |
| fin_transaction | 按账户查询 | account_id, status |
| fin_budget | 按用户状态查询 | user_id, status |
| fin_budget | 按日期查询 | start_date, end_date |

### 4.2 复合索引建议

```sql
-- 交易列表查询
INDEX idx_user_type_date (user_id, type, occurred_at)

-- 预算列表查询
INDEX idx_user_status_date (user_id, status, start_date)
```

---

## 5. 软删除机制

### 5.1 实现方式

所有业务表使用 `status` 字段实现软删除：

| status | 说明 |
|--------|------|
| 1 | 正常/启用 |
| 0 | 已删除/禁用 |

### 5.2 查询规范

```sql
-- 所有查询必须添加 status = 1 条件
SELECT * FROM fin_account WHERE user_id = 1 AND status = 1;

-- 物理删除前先软删除
UPDATE fin_account SET status = 0 WHERE account_id = 1;
```

---

## 6. 数据初始化

### 6.1 执行顺序

```bash
# 1. 创建数据库
mysql -h localhost -P 3306 -u root -prootpassword \
  -e "CREATE DATABASE mamoji DEFAULT CHARACTER SET utf8mb4"

# 2. 执行初始化脚本
mysql -h localhost -P 3306 -u root -prootpassword mamoji < db/init/*.sql

# 或按顺序执行
mysql -h localhost -P 3306 -u root -prootpassword mamoji < db/init/01_schema.sql
mysql -h localhost -P 3306 -u root -prootpassword mamoji < db/init/02_*.sql
```

### 6.2 初始化文件

| 文件 | 说明 |
|------|------|
| db/init/01_schema.sql | 数据库表结构 |
| db/init/02_categories.sql | 预置分类数据 |
| db/init/03_sample_data.sql | 示例数据(可选) |

---

## 7. 备份与恢复

### 7.1 备份命令

```bash
# 完整备份
mysqldump -h localhost -P 3306 -u root -prootpassword \
  --single-transaction --routines --triggers \
  mamoji > mamoji_backup_$(date +%Y%m%d).sql

# 仅结构备份
mysqldump -h localhost -P 3306 -u root -prootpassword \
  --no-data mamoji > mamoji_schema.sql

# 仅数据备份
mysqldump -h localhost -P 3306 -u root -prootpassword \
  --no-create-info mamoji > mamoji_data.sql
```

### 7.2 恢复命令

```bash
mysql -h localhost -P 3306 -u root -prootpassword mamoji < mamoji_backup_20260202.sql
```

---

## 8. 常见问题

### Q1: 如何添加新账户类型？
A: 在应用层枚举中添加，数据库使用 VARCHAR 存储。

### Q2: 预算状态如何自动更新？
A: 通过定时任务每日检查，或在交易创建/退款时实时更新。

### Q3: 如何处理大表分页？
A: 使用延迟关联优化深分页查询。

---

**文档版本**: v1.0
**最后更新**: 2026-02-02
