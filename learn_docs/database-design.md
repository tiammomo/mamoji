# Mamoji 数据库设计详解

## 一、数据库概览

### 1.1 技术选型

| 项目 | 选择 | 说明 |
|------|------|------|
| 数据库 | MySQL 8.0 | 主业务数据库 |
| 字符集 | utf8mb4 | 支持完整 Unicode，包括 Emoji |
| 排序规则 | utf8mb4_unicode_ci | 中文友好排序 |
| 存储引擎 | InnoDB | 支持事务和外键 |

### 1.2 数据库列表

| 数据库名 | 用途 | 端口 |
|----------|------|------|
| mamoji | 主业务数据库 | 3306 |
| mamoji_test | 测试数据库 | 3307 |

## 二、实体关系图（ER Diagram）

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              用户认证模块                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐      ┌──────────────────────┐                           │
│  │   sys_user   │──1:N──│    sys_preference   │                           │
│  │   (用户)     │      │    (用户偏好)        │                           │
│  └──────────────┘      └──────────────────────┘                           │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              账本模块（多用户共享）                          │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐      ┌─────────────────────┐      ┌──────────────────┐  │
│  │  fin_ledger  │──1:N──│ fin_ledger_member  │◄──N:N──│    sys_user      │  │
│  │   (账本)     │      │   (账本成员)        │      │    (用户)        │  │
│  └──────────────┘      └─────────────────────┘      └──────────────────┘  │
│         │                                                                │
│         ▼                                                                │
│  ┌────────────────────┐                                                   │
│  │  fin_invitation    │                                                   │
│  │    (邀请码)        │                                                   │
│  └────────────────────┘                                                   │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              业务数据模块                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│         │                      │                      │                    │
│         ▼                      ▼                      ▼                    │
│  ┌──────────────┐      ┌──────────────┐      ┌─────────────────────┐      │
│  │ fin_category │      │ fin_account  │      │   fin_transaction   │      │
│  │   (分类)     │      │   (账户)     │      │     (交易记录)       │      │
│  └──────────────┘      └──────────────┘      └─────────────────────┘      │
│                                                          │                  │
│                                                          ▼                  │
│                                                ┌──────────────────┐        │
│                                                │   fin_refund     │        │
│                                                │    (退款记录)     │        │
│                                                └──────────────────┘        │
│                                                          │                  │
│         ┌────────────────────────────────────────────────┘                  │
│         │                                                                │
│         ▼                                                                │
│  ┌──────────────┐                                                         │
│  │  fin_budget  │                                                         │
│  │   (预算)     │                                                         │
│  └──────────────┘                                                         │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 三、核心表结构详解

### 3.1 sys_user（用户表）

> 存储用户账户信息，用于身份认证

```sql
CREATE TABLE sys_user (
    user_id          BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '用户ID',
    username         VARCHAR(50) NOT NULL COMMENT '用户名',
    password         VARCHAR(100) NOT NULL COMMENT '加密后的密码',
    email            VARCHAR(100) COMMENT '邮箱',
    phone            VARCHAR(20) COMMENT '手机号',
    avatar           VARCHAR(500) COMMENT '头像URL',
    status           TINYINT DEFAULT 1 COMMENT '状态: 0=禁用, 1=正常',
    created_at       DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at       DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    UNIQUE KEY uk_username (username),
    UNIQUE KEY uk_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';
```

**字段说明：**

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| user_id | BIGINT | PK, AUTO_INCREMENT | 用户唯一标识 |
| username | VARCHAR(50) | NOT NULL, UNIQUE | 用户名，用于登录 |
| password | VARCHAR(100) | NOT NULL | BCrypt 加密后的密码 |
| email | VARCHAR(100) | UNIQUE | 邮箱，用于找回密码 |
| phone | VARCHAR(20) | - | 手机号 |
| avatar | VARCHAR(500) | - | 头像存储 URL |
| status | TINYINT | DEFAULT 1 | 账户状态控制登录 |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 自动记录创建时间 |
| updated_at | DATETIME | ON UPDATE | 自动记录更新时间 |

### 3.2 sys_preference（用户偏好表）

> 存储用户的个性化设置

```sql
CREATE TABLE sys_preference (
    preference_id    BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '偏好ID',
    user_id          BIGINT NOT NULL COMMENT '用户ID',
    preference_key   VARCHAR(100) NOT NULL COMMENT '偏好键',
    preference_value TEXT COMMENT '偏好值（JSON格式）',
    created_at       DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at       DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    UNIQUE KEY uk_user_key (user_id, preference_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户偏好表';
```

**示例数据：**

```json
// preference_key: "dashboard_layout"
// preference_value: {"widgets": ["balance", "recent", "chart"]}

// preference_key: "notification_settings"
// preference_value: {"budgetAlert": true, "emailDigest": "weekly"}
```

### 3.3 fin_ledger（账本表）

> 支持多用户共享的核心表，每个账本可以有多个成员

```sql
CREATE TABLE fin_ledger (
    ledger_id        BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '账本ID',
    name             VARCHAR(100) NOT NULL COMMENT '账本名称',
    description      VARCHAR(500) COMMENT '账本描述',
    owner_id         BIGINT NOT NULL COMMENT '所有者用户ID',
    is_default       TINYINT DEFAULT 0 COMMENT '是否默认账本: 0=否, 1=是',
    currency         VARCHAR(10) DEFAULT 'CNY' COMMENT '默认货币',
    status           TINYINT DEFAULT 1 COMMENT '状态: 0=停用, 1=正常',
    created_at       DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at       DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_owner (owner_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='账本表';
```

### 3.4 fin_ledger_member（账本成员表）

> 记录用户与账本的关联关系及角色

```sql
CREATE TABLE fin_ledger_member (
    member_id        BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '成员ID',
    ledger_id        BIGINT NOT NULL COMMENT '账本ID',
    user_id          BIGINT NOT NULL COMMENT '用户ID',
    role             VARCHAR(20) NOT NULL COMMENT '角色: owner/admin/editor/viewer',
    invited_by       BIGINT COMMENT '邀请人用户ID',
    joined_at        DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '加入时间',
    UNIQUE KEY uk_ledger_user (ledger_id, user_id),
    INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='账本成员表';
```

**角色权限说明：**

| 角色 | 说明 | 权限 |
|------|------|------|
| owner | 所有者 | 全部权限，包括删除账本、转让所有权 |
| admin | 管理员 | 除转让/删除账本外的全部权限 |
| editor | 编辑者 | 可编辑数据、创建邀请码 |
| viewer | 查看者 | 只读权限 |

### 3.5 fin_invitation（邀请码表）

> 管理账本邀请码，支持分享给其他用户加入

```sql
CREATE TABLE fin_invitation (
    invitation_id    BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '邀请ID',
    ledger_id        BIGINT NOT NULL COMMENT '账本ID',
    invite_code      VARCHAR(20) NOT NULL COMMENT '邀请码（唯一）',
    role             VARCHAR(20) NOT NULL COMMENT '加入后的角色',
    max_uses         INT DEFAULT 0 COMMENT '最大使用次数: 0=无限',
    used_count       INT DEFAULT 0 COMMENT '已使用次数',
    expires_at       DATETIME COMMENT '过期时间: NULL=永不过期',
    status           TINYINT DEFAULT 1 COMMENT '状态: 0=已撤销, 1=有效',
    created_by       BIGINT NOT NULL COMMENT '创建人用户ID',
    created_at       DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    UNIQUE KEY uk_code (invite_code),
    INDEX idx_ledger (ledger_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='邀请码表';
```

### 3.6 fin_category（分类表）

> 收支分类，支持系统预设和用户自定义

```sql
CREATE TABLE fin_category (
    category_id      BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '分类ID',
    user_id          BIGINT DEFAULT 0 COMMENT '用户ID: 0=系统预设',
    ledger_id        BIGINT DEFAULT 0 COMMENT '账本ID: 0=系统预设',
    name             VARCHAR(50) NOT NULL COMMENT '分类名称',
    type             VARCHAR(20) NOT NULL COMMENT '类型: income/expense',
    icon             VARCHAR(50) COMMENT '图标标识',
    color            VARCHAR(20) COMMENT '颜色代码',
    parent_id        BIGINT DEFAULT 0 COMMENT '父分类ID: 0=一级分类',
    sort_order       INT DEFAULT 0 COMMENT '排序顺序',
    status           TINYINT DEFAULT 1 COMMENT '状态: 0=禁用, 1=正常',
    created_at       DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at       DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_user_type (user_id, type),
    INDEX idx_ledger (ledger_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='分类表';
```

**系统预设分类：**

```sql
-- 收入分类
INSERT INTO fin_category (name, type, icon, color) VALUES
('工资', 'income', '💰', '#4CAF50'),
('奖金', 'income', '🎁', '#8BC34A'),
('投资', 'income', '📈', '#009688'),
('其他收入', 'income', '💵', '#607D8B');

-- 支出分类
INSERT INTO fin_category (name, type, icon, color) VALUES
('餐饮', 'expense', '🍔', '#FF9800'),
('交通', 'expense', '🚗', '#2196F3'),
('购物', 'expense', '🛍️', '#E91E63'),
('娱乐', 'expense', '🎬', '#9C27B0'),
('居住', 'expense', '🏠', '#795548'),
('生活', 'expense', '🛒', '#00BCD4'),
('医疗', 'expense', '💊', '#F44336'),
('教育', 'expense', '📚', '#3F51B5'),
('人情', 'expense', '🎊', '#FF5722'),
('其他支出', 'expense', '💳', '#9E9E9E');
```

### 3.7 fin_account（账户表）

> 管理用户的各类账户

```sql
CREATE TABLE fin_account (
    account_id       BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '账户ID',
    user_id          BIGINT NOT NULL COMMENT '用户ID',
    ledger_id        BIGINT NOT NULL COMMENT '账本ID',
    name             VARCHAR(100) NOT NULL COMMENT '账户名称',
    account_type     VARCHAR(50) NOT NULL COMMENT '账户类型',
    account_sub_type VARCHAR(50) COMMENT '子类型',
    currency         VARCHAR(10) DEFAULT 'CNY' COMMENT '货币',
    balance          DECIMAL(15,2) DEFAULT 0.00 COMMENT '余额',
    initial_balance  DECIMAL(15,2) DEFAULT 0.00 COMMENT '初始余额',
    include_in_total TINYINT DEFAULT 1 COMMENT '计入净资产: 0=否, 1=是',
    sort_order       INT DEFAULT 0 COMMENT '排序顺序',
    status           TINYINT DEFAULT 1 COMMENT '状态: 0=禁用, 1=正常',
    created_at       DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at       DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_user (user_id),
    INDEX idx_ledger (ledger_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='账户表';
```

**账户类型：**

| 类型 | 说明 | 计入净资产 |
|------|------|------------|
| bank | 银行卡、储蓄卡 | 是 |
| credit | 信用卡、贷记卡 | 否（显示为负数） |
| cash | 现金 | 是 |
| alipay | 支付宝 | 是 |
| wechat | 微信钱包 | 是 |
| gold | 黄金 | 是 |
| fund_accumulation | 公积金 | 是 |
| fund | 基金 | 是 |
| stock | 股票 | 是 |
| topup | 充值卡 | 是 |
| debt | 负债、贷款 | 否 |

### 3.8 fin_transaction（交易记录表）

> 核心业务表，记录每笔收支

```sql
CREATE TABLE fin_transaction (
    transaction_id   BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '交易ID',
    user_id          BIGINT NOT NULL COMMENT '用户ID',
    ledger_id        BIGINT NOT NULL COMMENT '账本ID',
    account_id       BIGINT NOT NULL COMMENT '账户ID',
    category_id      BIGINT NOT NULL COMMENT '分类ID',
    budget_id        BIGINT COMMENT '关联预算ID',
    refund_id        BIGINT COMMENT '关联退款ID（退款交易专用）',
    type             VARCHAR(20) NOT NULL COMMENT '类型: income/expense/refund',
    amount           DECIMAL(15,2) NOT NULL COMMENT '金额',
    currency         VARCHAR(10) DEFAULT 'CNY' COMMENT '货币',
    occurred_at      DATETIME NOT NULL COMMENT '发生时间',
    note             VARCHAR(500) COMMENT '备注',
    status           TINYINT DEFAULT 1 COMMENT '状态: 0=已删除, 1=正常',
    created_at       DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at       DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_user (user_id),
    INDEX idx_ledger (ledger_id),
    INDEX idx_account (account_id),
    INDEX idx_category (category_id),
    INDEX idx_occurred (occurred_at),
    INDEX idx_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='交易记录表';
```

### 3.9 fin_refund（退款记录表）

> 记录退款的详细信息

```sql
CREATE TABLE fin_refund (
    refund_id        BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '退款ID',
    user_id          BIGINT NOT NULL COMMENT '用户ID',
    ledger_id        BIGINT NOT NULL COMMENT '账本ID',
    transaction_id   BIGINT NOT NULL COMMENT '原交易ID',
    amount           DECIMAL(15,2) NOT NULL COMMENT '退款金额',
    reason           VARCHAR(500) COMMENT '退款原因',
    status           TINYINT DEFAULT 1 COMMENT '状态: 0=已取消, 1=有效',
    created_at       DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at       DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_transaction (transaction_id),
    INDEX idx_user (user_id),
    INDEX idx_ledger (ledger_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='退款记录表';
```

### 3.10 fin_budget（预算表）

> 管理用户预算，跟踪支出进度

```sql
CREATE TABLE fin_budget (
    budget_id        BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '预算ID',
    user_id          BIGINT NOT NULL COMMENT '用户ID',
    ledger_id        BIGINT NOT NULL COMMENT '账本ID',
    category_id      BIGINT COMMENT '关联分类ID: NULL=总预算',
    name             VARCHAR(100) NOT NULL COMMENT '预算名称',
    amount           DECIMAL(15,2) NOT NULL COMMENT '预算金额',
    spent            DECIMAL(15,2) DEFAULT 0.00 COMMENT '已花费金额',
    start_date       DATE NOT NULL COMMENT '开始日期',
    end_date         DATE NOT NULL COMMENT '结束日期',
    status           TINYINT DEFAULT 1 COMMENT '状态: 0=已取消, 1=进行中, 2=已完成, 3=超支',
    created_at       DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at       DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_user (user_id),
    INDEX idx_ledger (ledger_id),
    INDEX idx_dates (start_date, end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='预算表';
```

**预算状态：**

| 状态值 | 状态名 | 说明 |
|--------|--------|------|
| 0 | 已取消 | 用户主动停用 |
| 1 | 进行中 | 预算在有效期内 |
| 2 | 已完成 | 预算期结束，未超支 |
| 3 | 超支 | 已花费超过预算金额 |

## 四、索引优化建议

### 4.1 常用查询索引

```sql
-- 用户查询自己的交易（高频）
CREATE INDEX idx_tx_user_occurred ON fin_transaction(user_id, occurred_at DESC);

-- 账本查询（多用户共享场景）
CREATE INDEX idx_tx_ledger_occurred ON fin_transaction(ledger_id, occurred_at DESC);

-- 按分类统计
CREATE INDEX idx_tx_category_type ON fin_transaction(category_id, type, occurred_at);

-- 账户余额查询
CREATE INDEX idx_acc_user_type ON fin_account(user_id, account_type);
```

### 4.2 分区建议

对于大表（交易记录 > 100万条），建议按月分区：

```sql
ALTER TABLE fin_transaction
PARTITION BY RANGE (TO_DAYS(occurred_at)) (
    PARTITION p202401 VALUES LESS THAN (TO_DAYS('2024-02-01')),
    PARTITION p202402 VALUES LESS THAN (TO_DAYS('2024-03-01')),
    PARTITION p202403 VALUES LESS THAN (TO_DAYS('2024-04-01')),
    -- 更多分区...
    PARTITION pmax VALUES LESS THAN MAXVALUE
);
```

## 五、常用查询示例

### 5.1 查询用户某月收支汇总

```sql
SELECT
    type,
    COUNT(*) as count,
    SUM(amount) as total
FROM fin_transaction
WHERE user_id = 1
  AND DATE_FORMAT(occurred_at, '%Y-%m') = '2024-01'
  AND status = 1
GROUP BY type;
```

### 5.2 查询账本余额汇总

```sql
SELECT
    account_type,
    SUM(balance) as total_balance
FROM fin_account
WHERE ledger_id = 1
  AND status = 1
GROUP BY account_type;
```

### 5.3 查询预算执行进度

```sql
SELECT
    b.budget_id,
    b.name,
    b.amount as budget_amount,
    COALESCE(SUM(t.amount), 0) as spent_amount,
    b.amount - COALESCE(SUM(t.amount), 0) as remaining,
    CASE
        WHEN COALESCE(SUM(t.amount), 0) > b.amount THEN '超支'
        WHEN COALESCE(SUM(t.amount), 0) / b.amount >= 0.8 THEN '警告'
        ELSE '正常'
    END as status
FROM fin_budget b
LEFT JOIN fin_transaction t ON t.budget_id = b.budget_id
  AND t.type = 'expense'
  AND t.status = 1
WHERE b.ledger_id = 1
  AND b.status = 1
GROUP BY b.budget_id;
```

## 六、数据迁移脚本

初始化数据库脚本位于 `db/init/` 目录：

| 脚本 | 说明 |
|------|------|
| 01_schema.sql | 创建所有表结构 |
| 02_data.sql | 插入系统预设数据 |
| 03_ledger_tables.sql | 账本相关表（多用户共享） |

运行顺序：
```bash
mysql -h localhost -P 3306 -u root -prootpassword mamoji < db/init/*.sql
```
