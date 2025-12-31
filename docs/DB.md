# 企业级财务记账系统 - 数据库设计

## 一、数据库概述

### 1.1 技术选型

| 项目 | 说明 |
|------|------|
| 数据库 | MySQL 8.0+ |
| 存储引擎 | InnoDB |
| 字符集 | utf8mb4 |
| 时区 | Asia/Shanghai (+08:00) |

### 1.2 命名规范

- 表名：`{模块}_{实体}`，如 `sys_user`、`acc_account`
- 字段名：下划线命名，如 `user_id`、`created_at`
- 主键字段：`{表名}_id`，如 `user_id`
- 外键字段：与主表保持一致
- 索引命名：`idx_{表名}_{字段名}`

---

## 二、ER 图

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              用户模块                                    │
│  ┌──────────────┐                                                       │
│  │    sys_user  │◄──┐                                                   │
│  │──────────────│   │                                                   │
│  │ user_id (PK) │   │                                                   │
│  │ username     │   │                                                   │
│  │ password     │   │                                                   │
│  │ phone        │   │                                                   │
│  │ email        │   │                                                   │
│  │ avatar       │   │                                                   │
│  │ status       │   │                                                   │
│  │ created_at   │   │                                                   │
│  └──────────────┘   │                                                   │
└─────────────────────┼────────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                              企业模块                                    │
│  ┌────────────────┐     ┌────────────────────┐                          │
│  │ biz_enterprise │     │ biz_enterprise_member│                         │
│  │────────────────│     │────────────────────│                          │
│  │ enterprise_id  │────►│ enterprise_id (FK) │                          │
│  │ name           │     │ user_id (FK) ──────┼──┐                       │
│  │ credit_code    │     │ role               │  │                       │
│  │ contact_person │     │ joined_at          │  │                       │
│  │ contact_phone  │     └────────────────────┘  │                       │
│  │ address        │                            │                       │
│  │ license_image  │                            │                       │
│  │ status         │                            │                       │
│  │ created_at     │                            │                       │
│  └────────────────┘                            │                       │
└────────────────────────────────────────────────┼────────────────────────┘
                                                 │
                                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                            记账单元模块                                  │
│  ┌─────────────────────┐                                                │
│  │ biz_accounting_unit │                                                │
│  │─────────────────────│                                                │
│  │ unit_id (PK)        │◄──────────────────────────────────────────┐   │
│  │ enterprise_id (FK)  │                                              │   │
│  │ parent_unit_id (FK) │────┐                                         │   │
│  │ name                │    │                                         │   │
│  │ type                │    │                                         │   │
│  │ level               │    │                                         │   │
│  │ status              │    │                                         │   │
│  │ created_at          │    │                                         │   │
│  └─────────────────────┘    │                                         │   │
└─────────────────────────────┼─────────────────────────────────────────┼──┘
                              │                                         │
                              ▼                                         │
┌─────────────────────────────────────────────────────────────────────────┐
│                            权限模块                                      │
│  ┌─────────────────────┐                                                │
│  │ biz_unit_permission │                                                │
│  │─────────────────────│                                                │
│  │ permission_id (PK)  │                                                │
│  │ enterprise_id (FK)  │                                                │
│  │ user_id (FK)        │                                                │
│  │ unit_id (FK)        │───────────────────────────────────────────────┘
│  │ permission_level    │
│  │ created_at          │
│  └─────────────────────┘
│                              │
│                              ▼
│  ┌─────────────────────────────────────────────────────────────────────┐
│  │                         核心业务模块                                  │
│  │                                                                       │
│  │  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐         │
│  │  │ biz_account  │  │ biz_transaction│ │ biz_budget        │         │
│  │  │──────────────│  │──────────────│  │────────────────────│         │
│  │  │ account_id   │  │ transaction_id│  │ budget_id         │         │
│  │  │ enterprise_id│  │ enterprise_id│  │ enterprise_id     │         │
│  │  │ unit_id (FK) │  │ unit_id (FK) │  │ unit_id (FK)      │         │
│  │  │ type         │  │ user_id (FK) │  │ name              │         │
│  │  │ name         │  │ type         │  │ type              │         │
│  │  │ account_no   │  │ category     │  │ category          │         │
│  │  │ balance      │  │ amount       │  │ total_amount      │         │
│  │  │ ...          │  │ ...          │  │ ...               │         │
│  │  └──────────────┘  └──────────────┘  └────────────────────┘         │
│  │                                                                       │
│  └─────────────────────────────────────────────────────────────────────┘
│                              │
│                              ▼
│  ┌─────────────────────────────────────────────────────────────────────┐
│  │                         投资理财模块                                  │
│  │  ┌─────────────────────┐  ┌────────────────────┐                    │
│  │  │ biz_investment      │  │ biz_invest_record  │                    │
│  │  │─────────────────────│  │────────────────────│                    │
│  │  │ investment_id (PK)  │  │ record_id (PK)     │                    │
│  │  │ enterprise_id (FK)  │  │ investment_id (FK) │                    │
│  │  │ unit_id (FK)        │  │ type               │                    │
│  │  │ name                │  │ amount             │                    │
│  │  │ product_type        │  │ price              │                    │
│  │  │ principal           │  │ quantity           │                    │
│  │  │ current_value       │  │ recorded_at        │                    │
│  │  │ ...                 │  │ ...                │                    │
│  │  └─────────────────────┘  └────────────────────┘                    │
│  │                                                                       │
│  └─────────────────────────────────────────────────────────────────────┘
│                              │
│                              ▼
│  ┌─────────────────────────────────────────────────────────────────────┐
│  │                         消息通知模块                                  │
│  │  ┌─────────────────────┐  ┌────────────────────┐                    │
│  │  │ biz_notification    │  │ biz_push_config    │                    │
│  │  │─────────────────────│  │────────────────────│                    │
│  │  │ notification_id     │  │ config_id          │                    │
│  │  │ user_id (FK)        │  │ enterprise_id      │                    │
│  │  │ type                │  │ type               │                    │
│  │  │ title               │  │ target             │                    │
│  │  │ content             │  │ enabled            │                    │
│  │  │ is_read             │  │ push_time          │                    │
│  │  │ created_at          │  │ ...                │                    │
│  │  └─────────────────────┘  └────────────────────┘                    │
│  │                                                                       │
│  └─────────────────────────────────────────────────────────────────────┘
```

---

## 三、表结构设计

### 3.1 用户模块

#### sys_user 用户表

```sql
CREATE TABLE `sys_user` (
    `user_id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '用户ID',
    `username`         VARCHAR(50)     NOT NULL COMMENT '用户名',
    `password`         VARCHAR(255)    NOT NULL COMMENT '密码(bcrypt加密)',
    `phone`            VARCHAR(20)     DEFAULT NULL COMMENT '手机号',
    `email`            VARCHAR(100)    DEFAULT NULL COMMENT '邮箱',
    `avatar`           VARCHAR(500)    DEFAULT NULL COMMENT '头像URL',
    `status`           TINYINT         NOT NULL DEFAULT 1 COMMENT '状态: 0-禁用 1-正常',
    `created_at`       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at`       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`user_id`),
    UNIQUE KEY `uk_username` (`username`),
    UNIQUE KEY `uk_phone` (`phone`),
    UNIQUE KEY `uk_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

CREATE INDEX `idx_status` ON `sys_user` (`status`);
```

#### sys_user_token 用户Token表

```sql
CREATE TABLE `sys_user_token` (
    `token_id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID',
    `user_id`          BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
    `token`            VARCHAR(500)    NOT NULL COMMENT 'JWT Token',
    `expires_at`       DATETIME        NOT NULL COMMENT '过期时间',
    `created_at`       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (`token_id`),
    UNIQUE KEY `uk_user_id` (`user_id`),
    KEY `idx_token` (`token`(191))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户Token表';
```

---

### 3.2 企业模块

#### biz_enterprise 企业表

```sql
CREATE TABLE `biz_enterprise` (
    `enterprise_id`    BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '企业ID',
    `name`             VARCHAR(100)    NOT NULL COMMENT '企业名称',
    `credit_code`      VARCHAR(50)     DEFAULT NULL COMMENT '统一社会信用代码',
    `contact_person`   VARCHAR(50)     DEFAULT NULL COMMENT '联系人',
    `contact_phone`    VARCHAR(20)     DEFAULT NULL COMMENT '联系电话',
    `address`          VARCHAR(255)    DEFAULT NULL COMMENT '企业地址',
    `license_image`    VARCHAR(500)    DEFAULT NULL COMMENT '营业执照图片URL',
    `status`           TINYINT         NOT NULL DEFAULT 1 COMMENT '状态: 0-停用 1-正常',
    `created_at`       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at`       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`enterprise_id`),
    UNIQUE KEY `uk_credit_code` (`credit_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='企业表';

CREATE INDEX `idx_status` ON `biz_enterprise` (`status`);
```

#### biz_enterprise_member 企业成员表

```sql
CREATE TABLE `biz_enterprise_member` (
    `id`               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID',
    `enterprise_id`    BIGINT UNSIGNED NOT NULL COMMENT '企业ID',
    `user_id`          BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
    `role`             VARCHAR(20)     NOT NULL COMMENT '角色: super_admin-超级管理员 finance_admin-财务管理员 normal-普通成员 readonly-只读成员',
    `joined_at`        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '加入时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_enterprise_user` (`enterprise_id`, `user_id`),
    KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='企业成员表';
```

---

### 3.3 记账单元模块

#### biz_accounting_unit 记账单元表

```sql
CREATE TABLE `biz_accounting_unit` (
    `unit_id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '单元ID',
    `enterprise_id`    BIGINT UNSIGNED NOT NULL COMMENT '企业ID',
    `parent_unit_id`   BIGINT UNSIGNED DEFAULT NULL COMMENT '父单元ID(NULL为顶级单元)',
    `name`             VARCHAR(50)     NOT NULL COMMENT '单元名称',
    `type`             VARCHAR(20)     NOT NULL COMMENT '单元类型: business-纯业务 domestic_ecommerce-国内电商 cross_border_ecommerce-跨境电商 asset-公司资产 investment-投资项目',
    `level`            TINYINT         NOT NULL DEFAULT 1 COMMENT '单元层级: 1-一级 2-二级',
    `status`           TINYINT         NOT NULL DEFAULT 1 COMMENT '状态: 0-停用 1-正常',
    `created_at`       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at`       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`unit_id`),
    KEY `idx_enterprise_id` (`enterprise_id`),
    KEY `idx_parent_unit_id` (`parent_unit_id`),
    KEY `idx_type` (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='记账单元表';

-- 外键约束
ALTER TABLE `biz_accounting_unit`
    ADD CONSTRAINT `fk_unit_parent` FOREIGN KEY (`parent_unit_id`) REFERENCES `biz_accounting_unit` (`unit_id`);
```

#### biz_unit_permission 单元权限表

```sql
CREATE TABLE `biz_unit_permission` (
    `permission_id`    BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '权限ID',
    `enterprise_id`    BIGINT UNSIGNED NOT NULL COMMENT '企业ID',
    `user_id`          BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
    `unit_id`          BIGINT UNSIGNED NOT NULL COMMENT '记账单元ID',
    `permission_level` VARCHAR(20)     NOT NULL COMMENT '权限级别: view-查看 edit-编辑 manage-管理',
    `created_at`       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (`permission_id`),
    KEY `idx_enterprise_user` (`enterprise_id`, `user_id`),
    KEY `idx_unit_id` (`unit_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='单元权限表';
```

---

### 3.4 账户模块

#### biz_account 账户表

```sql
CREATE TABLE `biz_account` (
    `account_id`       BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '账户ID',
    `enterprise_id`    BIGINT UNSIGNED NOT NULL COMMENT '企业ID',
    `unit_id`          BIGINT UNSIGNED NOT NULL COMMENT '记账单元ID',
    `type`             VARCHAR(20)     NOT NULL COMMENT '账户类型: wechat-微信 alipay-支付宝 bank-银行卡 cash-现金 other-其他',
    `name`             VARCHAR(50)     NOT NULL COMMENT '账户名称',
    `account_no`       VARCHAR(50)     DEFAULT NULL COMMENT '账号(银行卡后四位)',
    `bank_card_type`   VARCHAR(20)     DEFAULT NULL COMMENT '银行卡类型: type1-一类卡 type2-二类卡',
    `balance`          DECIMAL(18,2)   NOT NULL DEFAULT 0.00 COMMENT '当前余额',
    `status`           TINYINT         NOT NULL DEFAULT 1 COMMENT '状态: 0-停用 1-正常',
    `created_at`       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at`       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`account_id`),
    KEY `idx_enterprise_id` (`enterprise_id`),
    KEY `idx_unit_id` (`unit_id`),
    KEY `idx_type` (`type`),
    KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='账户表';

-- 外键约束
ALTER TABLE `biz_account`
    ADD CONSTRAINT `fk_account_unit` FOREIGN KEY (`unit_id`) REFERENCES `biz_accounting_unit` (`unit_id`);
```

#### biz_account_flow 账户流水表

```sql
CREATE TABLE `biz_account_flow` (
    `flow_id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '流水ID',
    `account_id`       BIGINT UNSIGNED NOT NULL COMMENT '账户ID',
    `transaction_id`   BIGINT UNSIGNED DEFAULT NULL COMMENT '关联账单ID',
    `type`             VARCHAR(10)     NOT NULL COMMENT '类型: income-收入 expense-支出 transfer-转账 adjust-调整',
    `amount`           DECIMAL(18,2)   NOT NULL COMMENT '金额(收入为正,支出为负)',
    `balance_before`   DECIMAL(18,2)   NOT NULL COMMENT '变动前余额',
    `balance_after`    DECIMAL(18,2)   NOT NULL COMMENT '变动后余额',
    `note`             VARCHAR(255)    DEFAULT NULL COMMENT '备注',
    `created_at`       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (`flow_id`),
    KEY `idx_account_id` (`account_id`),
    KEY `idx_transaction_id` (`transaction_id`),
    KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='账户流水表';
```

---

### 3.5 账单模块

#### biz_transaction 账单表

```sql
CREATE TABLE `biz_transaction` (
    `transaction_id`   BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '账单ID',
    `enterprise_id`    BIGINT UNSIGNED NOT NULL COMMENT '企业ID',
    `unit_id`          BIGINT UNSIGNED NOT NULL COMMENT '记账单元ID',
    `user_id`          BIGINT UNSIGNED NOT NULL COMMENT '记账用户ID',
    `type`             VARCHAR(10)     NOT NULL COMMENT '类型: income-收入 expense-支出',
    `category`         VARCHAR(30)     NOT NULL COMMENT '分类',
    `amount`           DECIMAL(18,2)   NOT NULL COMMENT '金额',
    `account_id`       BIGINT UNSIGNED NOT NULL COMMENT '账户ID',
    `budget_id`        BIGINT UNSIGNED DEFAULT NULL COMMENT '关联预算ID',
    `occurred_at`      DATETIME        NOT NULL COMMENT '发生时间',
    `tags`             JSON            DEFAULT NULL COMMENT '标签数组',
    `note`             VARCHAR(500)    DEFAULT NULL COMMENT '备注',
    `images`           JSON            DEFAULT NULL COMMENT '图片URL数组',
    `ecommerce_info`   JSON            DEFAULT NULL COMMENT '电商扩展信息',
    `status`           TINYINT         NOT NULL DEFAULT 1 COMMENT '状态: 0-删除 1-正常',
    `created_at`       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at`       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`transaction_id`),
    KEY `idx_enterprise_id` (`enterprise_id`),
    KEY `idx_unit_id` (`unit_id`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_type_category` (`type`, `category`),
    KEY `idx_occurred_at` (`occurred_at`),
    KEY `idx_account_id` (`account_id`),
    KEY `idx_budget_id` (`budget_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='账单表';

-- 外键约束
ALTER TABLE `biz_transaction`
    ADD CONSTRAINT `fk_transaction_account` FOREIGN KEY (`account_id`) REFERENCES `biz_account` (`account_id`);
```

---

### 3.6 预算模块

#### biz_budget 预算表

```sql
CREATE TABLE `biz_budget` (
    `budget_id`        BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '预算ID',
    `enterprise_id`    BIGINT UNSIGNED NOT NULL COMMENT '企业ID',
    `unit_id`          BIGINT UNSIGNED NOT NULL COMMENT '记账单元ID',
    `name`             VARCHAR(50)     NOT NULL COMMENT '预算名称',
    `type`             VARCHAR(20)     NOT NULL COMMENT '预算类型: monthly-月度 yearly-年度 project-项目',
    `category`         VARCHAR(30)     NOT NULL COMMENT '支出分类',
    `total_amount`     DECIMAL(18,2)   NOT NULL COMMENT '总金额',
    `used_amount`      DECIMAL(18,2)   NOT NULL DEFAULT 0.00 COMMENT '已用金额',
    `period_start`     DATE            NOT NULL COMMENT '周期开始日期',
    `period_end`       DATE            NOT NULL COMMENT '周期结束日期',
    `status`           VARCHAR(20)     NOT NULL DEFAULT 'active' COMMENT '状态: draft-草稿 active-生效中 exceeded-已超支 ended-已结束',
    `created_at`       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at`       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`budget_id`),
    KEY `idx_enterprise_id` (`enterprise_id`),
    KEY `idx_unit_id` (`unit_id`),
    KEY `idx_status` (`status`),
    KEY `idx_period` (`period_start`, `period_end`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='预算表';
```

#### biz_budget_approval 预算审批表

```sql
CREATE TABLE `biz_budget_approval` (
    `approval_id`      BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '审批ID',
    `budget_id`        BIGINT UNSIGNED NOT NULL COMMENT '预算ID',
    `applicant_id`     BIGINT UNSIGNED NOT NULL COMMENT '申请人ID',
    `approver_id`      BIGINT UNSIGNED DEFAULT NULL COMMENT '审批人ID',
    `apply_amount`     DECIMAL(18,2)   NOT NULL COMMENT '申请金额',
    `approved_amount`  DECIMAL(18,2)   DEFAULT NULL COMMENT '审批金额',
    `status`           VARCHAR(20)     NOT NULL DEFAULT 'pending' COMMENT '状态: pending-待审批 approved-已通过 rejected-已拒绝',
    `apply_reason`     VARCHAR(500)    DEFAULT NULL COMMENT '申请原因',
    `approve_comment`  VARCHAR(500)    DEFAULT NULL COMMENT '审批意见',
    `applied_at`       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '申请时间',
    `approved_at`      DATETIME        DEFAULT NULL COMMENT '审批时间',
    PRIMARY KEY (`approval_id`),
    KEY `idx_budget_id` (`budget_id`),
    KEY `idx_applicant_id` (`applicant_id`),
    KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='预算审批表';
```

---

### 3.7 投资理财模块

#### biz_investment 理财账户表

```sql
CREATE TABLE `biz_investment` (
    `investment_id`    BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '理财ID',
    `enterprise_id`    BIGINT UNSIGNED NOT NULL COMMENT '企业ID',
    `unit_id`          BIGINT UNSIGNED NOT NULL COMMENT '记账单元ID',
    `name`             VARCHAR(50)     NOT NULL COMMENT '账户名称',
    `product_type`     VARCHAR(20)     NOT NULL COMMENT '产品类型: stock-股票 fund-基金 gold-黄金 silver-白银 bond-债券 regular-定期 other-其他',
    `product_code`     VARCHAR(50)     DEFAULT NULL COMMENT '产品代码',
    `principal`        DECIMAL(18,2)   NOT NULL COMMENT '本金',
    `current_value`    DECIMAL(18,2)   NOT NULL DEFAULT 0.00 COMMENT '当前市值',
    `total_profit`     DECIMAL(18,2)   NOT NULL DEFAULT 0.00 COMMENT '总收益',
    `quantity`         DECIMAL(18,4)   DEFAULT NULL COMMENT '持仓数量/份额',
    `cost_price`       DECIMAL(18,4)   DEFAULT NULL COMMENT '成本价',
    `current_price`    DECIMAL(18,4)   DEFAULT NULL COMMENT '当前价',
    `platform`         VARCHAR(50)     DEFAULT NULL COMMENT '平台',
    `start_date`       DATE            DEFAULT NULL COMMENT '起息日',
    `end_date`         DATE            DEFAULT NULL COMMENT '到期日',
    `interest_rate`    DECIMAL(8,4)    DEFAULT NULL COMMENT '利率(%)',
    `last_updated_at`  DATETIME        DEFAULT NULL COMMENT '最后市值更新时间',
    `reminder_days`    INT             NOT NULL DEFAULT 7 COMMENT '更新提醒周期(天)',
    `status`           TINYINT         NOT NULL DEFAULT 1 COMMENT '状态: 0-关闭 1-正常',
    `note`             VARCHAR(500)    DEFAULT NULL COMMENT '备注',
    `created_at`       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at`       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`investment_id`),
    KEY `idx_enterprise_id` (`enterprise_id`),
    KEY `idx_unit_id` (`unit_id`),
    KEY `idx_product_type` (`product_type`),
    KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='理财账户表';
```

#### biz_invest_record 理财记录表

```sql
CREATE TABLE `biz_invest_record` (
    `record_id`        BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '记录ID',
    `investment_id`    BIGINT UNSIGNED NOT NULL COMMENT '理财ID',
    `type`             VARCHAR(20)     NOT NULL COMMENT '类型: buy-买入 sell-卖出 profit-收益更新 loss-亏损 dividend-分红 interest-利息',
    `amount`           DECIMAL(18,2)   NOT NULL COMMENT '金额',
    `price`            DECIMAL(18,4)   DEFAULT NULL COMMENT '单价/净值',
    `quantity`         DECIMAL(18,4)   DEFAULT NULL COMMENT '数量/份额',
    `recorded_at`      DATE            NOT NULL COMMENT '记录日期',
    `note`             VARCHAR(500)    DEFAULT NULL COMMENT '备注',
    `created_at`       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (`record_id`),
    KEY `idx_investment_id` (`investment_id`),
    KEY `idx_type` (`type`),
    KEY `idx_recorded_at` (`recorded_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='理财记录表';
```

---

### 3.8 资产模块 (公司资产)

#### biz_asset 资产表

```sql
CREATE TABLE `biz_asset` (
    `asset_id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '资产ID',
    `enterprise_id`    BIGINT UNSIGNED NOT NULL COMMENT '企业ID',
    `unit_id`          BIGINT UNSIGNED NOT NULL COMMENT '记账单元ID',
    `name`             VARCHAR(100)    NOT NULL COMMENT '资产名称',
    `type`             VARCHAR(20)     NOT NULL COMMENT '资产类型: fixed-固定资产 intangible-无形资产 long_term_invest-长期投资',
    `sub_type`         VARCHAR(30)     DEFAULT NULL COMMENT '子类型: office_equipment-办公设备 vehicle-交通工具 building-厂房仓库 trademark-商标专利 patent-专利 copyright-软件版权',
    `original_value`   DECIMAL(18,2)   NOT NULL COMMENT '原值',
    `current_value`    DECIMAL(18,2)   NOT NULL COMMENT '当前净值',
    `depreciation`     DECIMAL(18,2)   NOT NULL DEFAULT 0.00 COMMENT '累计折旧',
    `purchase_date`    DATE            NOT NULL COMMENT '购置日期',
    `useful_life`      INT             DEFAULT NULL COMMENT '使用年限(月)',
    `salvage_value`    DECIMAL(18,2)   DEFAULT NULL COMMENT '残值',
    `depreciation_method` VARCHAR(20)  DEFAULT 'straight_line' COMMENT '折旧方法: straight_line-直线法 declining_balance-年数总和法',
    `location`         VARCHAR(100)    DEFAULT NULL COMMENT '存放位置',
    `status`           TINYINT         NOT NULL DEFAULT 1 COMMENT '状态: 0-处置 1-使用中',
    `note`             VARCHAR(500)    DEFAULT NULL COMMENT '备注',
    `created_at`       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at`       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`asset_id`),
    KEY `idx_enterprise_id` (`enterprise_id`),
    KEY `idx_unit_id` (`unit_id`),
    KEY `idx_type` (`type`),
    KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='资产表';
```

#### biz_asset_depreciation 资产折旧表

```sql
CREATE TABLE `biz_asset_depreciation` (
    `depreciation_id`  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '折旧ID',
    `asset_id`         BIGINT UNSIGNED NOT NULL COMMENT '资产ID',
    `depreciation_amount` DECIMAL(18,2) NOT NULL COMMENT '折旧金额',
    `depreciation_date` DATE            NOT NULL COMMENT '折旧日期',
    `period_start`     DATE            NOT NULL COMMENT '折旧期间开始',
    `period_end`       DATE            NOT NULL COMMENT '折旧期间结束',
    `accumulated_depreciation` DECIMAL(18,2) NOT NULL COMMENT '累计折旧额',
    `book_value`       DECIMAL(18,2)   NOT NULL COMMENT '账面价值',
    `note`             VARCHAR(500)    DEFAULT NULL COMMENT '备注',
    `created_at`       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (`depreciation_id`),
    KEY `idx_asset_id` (`asset_id`),
    KEY `idx_depreciation_date` (`depreciation_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='资产折旧表';
```

---

### 3.9 消息通知模块

#### biz_notification 通知表

```sql
CREATE TABLE `biz_notification` (
    `notification_id`  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '通知ID',
    `user_id`          BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
    `type`             VARCHAR(50)     NOT NULL COMMENT '通知类型',
    `title`            VARCHAR(100)    NOT NULL COMMENT '标题',
    `content`          VARCHAR(500)    NOT NULL COMMENT '内容',
    `data`             JSON            DEFAULT NULL COMMENT '扩展数据',
    `is_read`          TINYINT         NOT NULL DEFAULT 0 COMMENT '是否已读: 0-未读 1-已读',
    `created_at`       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (`notification_id`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_type` (`type`),
    KEY `idx_is_read` (`is_read`),
    KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='通知表';
```

#### biz_push_config 推送配置表

```sql
CREATE TABLE `biz_push_config` (
    `config_id`        BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '配置ID',
    `enterprise_id`    BIGINT UNSIGNED NOT NULL COMMENT '企业ID',
    `type`             VARCHAR(20)     NOT NULL COMMENT '推送类型: email-邮件 wechat-微信 dingtalk-钉钉',
    `target`           VARCHAR(100)    NOT NULL COMMENT '推送目标(邮箱/微信号等)',
    `enabled`          TINYINT         NOT NULL DEFAULT 1 COMMENT '是否启用: 0-禁用 1-启用',
    `push_time`        VARCHAR(10)     DEFAULT '20:00' COMMENT '推送时间(HH:mm)',
    `frequency`        VARCHAR(20)     DEFAULT 'daily' COMMENT '频率: daily-每日 weekly-每周 monthly-每月',
    `daily_report_enabled` TINYINT    NOT NULL DEFAULT 1 COMMENT '是否启用每日报告: 0-禁用 1-启用',
    `created_at`       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at`       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`config_id`),
    KEY `idx_enterprise_id` (`enterprise_id`),
    KEY `idx_type` (`type`),
    KEY `idx_enabled` (`enabled`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='推送配置表';
```

#### biz_push_log 推送记录表

```sql
CREATE TABLE `biz_push_log` (
    `log_id`           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '记录ID',
    `enterprise_id`    BIGINT UNSIGNED NOT NULL COMMENT '企业ID',
    `config_id`        BIGINT UNSIGNED NOT NULL COMMENT '配置ID',
    `type`             VARCHAR(20)     NOT NULL COMMENT '推送类型',
    `content`          TEXT            DEFAULT NULL COMMENT '推送内容',
    `status`           VARCHAR(20)     NOT NULL COMMENT '状态: success-成功 failed-失败 pending-待推送',
    `error_message`    VARCHAR(500)    DEFAULT NULL COMMENT '失败原因',
    `sent_at`          DATETIME        DEFAULT NULL COMMENT '发送时间',
    `created_at`       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (`log_id`),
    KEY `idx_enterprise_id` (`enterprise_id`),
    KEY `idx_status` (`status`),
    KEY `idx_sent_at` (`sent_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='推送记录表';
```

---

## 四、索引设计

### 4.1 常用查询索引

| 表名 | 索引名称 | 索引字段 | 索引类型 | 说明 |
|------|----------|----------|----------|------|
| sys_user | idx_status | status | BTREE | 按状态查询用户 |
| biz_enterprise | idx_status | status | BTREE | 按状态查询企业 |
| biz_accounting_unit | idx_enterprise_type | enterprise_id, type | BTREE | 按企业+类型查询单元 |
| biz_account | idx_unit_type | unit_id, type | BTREE | 按单元+类型查询账户 |
| biz_transaction | idx_unit_date | unit_id, occurred_at | BTREE | 按单元+时间查询账单 |
| biz_budget | idx_unit_status | unit_id, status | BTREE | 按单元+状态查询预算 |
| biz_investment | idx_unit_type_status | unit_id, product_type, status | BTREE | 按单元+类型+状态查询理财 |

### 4.2 分区策略

- `biz_transaction`: 按 `enterprise_id` 分区或按月 `occurred_at` 分区
- `biz_account_flow`: 按月 `created_at` 分区
- `biz_notification`: 按 `user_id` 分区

---

## 五、数据归档策略

### 5.1 历史数据归档

| 表名 | 归档条件 | 归档周期 |
|------|----------|----------|
| biz_transaction | 超过3年 | 每年归档 |
| biz_account_flow | 超过3年 | 每年归档 |
| biz_push_log | 超过1年 | 每月归档 |
| biz_notification | 超过6个月 | 每月归档 |

### 5.2 归档表命名

```
biz_transaction_2024      -- 2024年账单归档表
biz_account_flow_2024     -- 2024年流水归档表
```

---

## 六、数据库迁移说明

### 6.1 版本历史

| 版本号 | 日期 | 变更说明 |
|--------|------|----------|
| v1.0.0 | 2024-01 | 初始版本，包含用户、企业、账户、账单等核心表 |
| v1.1.0 | 2024-12 | 添加预算模块，`biz_transaction` 表增加 `budget_id` 列 |

### 6.2 迁移脚本

#### v1.1.0 迁移脚本

```sql
-- 添加 budget_id 列到 biz_transaction 表
ALTER TABLE `biz_transaction`
ADD COLUMN `budget_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT '关联预算ID' AFTER `account_id`;

-- 创建索引
CREATE INDEX `idx_budget_id` ON `biz_transaction` (`budget_id`);
```

### 6.3 自动迁移机制

系统在启动时会自动执行数据库迁移：

1. **GORM AutoMigrate**：自动创建表结构和字段
2. **手动迁移**：对于GORM无法处理的遗留表字段，使用 `AddMissingColumns()` 函数添加
3. **外键处理**：使用 `DropForeignKeys()` 解决历史数据外键约束问题

### 6.4 手动执行迁移

如需手动执行迁移，可运行：

```bash
# 编译并运行服务器，迁移将在启动时自动执行
cd api && go build -o server.exe ./cmd/server && ./server.exe
```

或直接执行SQL：

```sql
-- 检查并添加 budget_id 列
SELECT COUNT(*) FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'biz_transaction' AND COLUMN_NAME = 'budget_id';

-- 如果不存在则添加
ALTER TABLE `biz_transaction`
ADD COLUMN `budget_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT '关联预算ID' AFTER `account_id`;

-- 创建索引
CREATE INDEX `idx_budget_id` ON `biz_transaction` (`budget_id`);
```
