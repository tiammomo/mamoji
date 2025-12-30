-- 企业级财务记账系统 - 数据库初始化脚本
-- 数据库: MySQL 8.0+
-- 字符集: utf8mb4

-- =====================================================
-- 1. 创建数据库
-- =====================================================
CREATE DATABASE IF NOT EXISTS mamoji DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE mamoji;

-- =====================================================
-- 2. 用户模块表
-- =====================================================

-- 用户表
CREATE TABLE IF NOT EXISTS `sys_user` (
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

-- 用户Token表
CREATE TABLE IF NOT EXISTS `sys_user_token` (
    `token_id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID',
    `user_id`          BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
    `token`            VARCHAR(500)    NOT NULL COMMENT 'JWT Token',
    `expires_at`       DATETIME        NOT NULL COMMENT '过期时间',
    `created_at`       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (`token_id`),
    UNIQUE KEY `uk_user_id` (`user_id`),
    KEY `idx_token` (`token`(191))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户Token表';

-- =====================================================
-- 3. 企业模块表
-- =====================================================

-- 企业表
CREATE TABLE IF NOT EXISTS `biz_enterprise` (
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

-- 企业成员表
CREATE TABLE IF NOT EXISTS `biz_enterprise_member` (
    `id`               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID',
    `enterprise_id`    BIGINT UNSIGNED NOT NULL COMMENT '企业ID',
    `user_id`          BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
    `role`             VARCHAR(20)     NOT NULL COMMENT '角色: super_admin-超级管理员 finance_admin-财务管理员 normal-普通成员 readonly-只读成员',
    `joined_at`        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '加入时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_enterprise_user` (`enterprise_id`, `user_id`),
    KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='企业成员表';

-- =====================================================
-- 4. 记账单元模块表
-- =====================================================

-- 记账单元表
CREATE TABLE IF NOT EXISTS `biz_accounting_unit` (
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

-- 单元权限表
CREATE TABLE IF NOT EXISTS `biz_unit_permission` (
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

-- =====================================================
-- 5. 账户模块表
-- =====================================================

-- 账户表
CREATE TABLE IF NOT EXISTS `biz_account` (
    `account_id`       BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '账户ID',
    `enterprise_id`    BIGINT UNSIGNED NOT NULL COMMENT '企业ID',
    `unit_id`          BIGINT UNSIGNED NOT NULL COMMENT '记账单元ID',
    `type`             VARCHAR(20)     NOT NULL COMMENT '账户类型: wechat-微信 alipay-支付宝 bank-银行卡 credit_card-信用卡 cash-现金 other-其他',
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

-- 账户流水表
CREATE TABLE IF NOT EXISTS `biz_account_flow` (
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

-- =====================================================
-- 6. 账单模块表
-- =====================================================

-- 账单表
CREATE TABLE IF NOT EXISTS `biz_transaction` (
    `transaction_id`   BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '账单ID',
    `enterprise_id`    BIGINT UNSIGNED NOT NULL COMMENT '企业ID',
    `unit_id`          BIGINT UNSIGNED NOT NULL COMMENT '记账单元ID',
    `user_id`          BIGINT UNSIGNED NOT NULL COMMENT '记账用户ID',
    `type`             VARCHAR(10)     NOT NULL COMMENT '类型: income-收入 expense-支出',
    `category`         VARCHAR(30)     NOT NULL COMMENT '分类',
    `amount`           DECIMAL(18,2)   NOT NULL COMMENT '金额',
    `account_id`       BIGINT UNSIGNED NOT NULL COMMENT '账户ID',
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
    KEY `idx_account_id` (`account_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='账单表';

-- =====================================================
-- 7. 预算模块表
-- =====================================================

-- 预算表
CREATE TABLE IF NOT EXISTS `biz_budget` (
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

-- 预算审批表
CREATE TABLE IF NOT EXISTS `biz_budget_approval` (
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

-- =====================================================
-- 8. 投资理财模块表
-- =====================================================

-- 理财账户表
CREATE TABLE IF NOT EXISTS `biz_investment` (
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

-- 理财记录表
CREATE TABLE IF NOT EXISTS `biz_invest_record` (
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

-- =====================================================
-- 9. 消息通知模块表
-- =====================================================

-- 通知表
CREATE TABLE IF NOT EXISTS `biz_notification` (
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

-- 推送配置表
CREATE TABLE IF NOT EXISTS `biz_push_config` (
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

-- 推送记录表
CREATE TABLE IF NOT EXISTS `biz_push_log` (
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

-- =====================================================
-- 10. 外键约束
-- =====================================================

ALTER TABLE `biz_account`
    ADD CONSTRAINT `fk_account_unit` FOREIGN KEY (`unit_id`) REFERENCES `biz_accounting_unit` (`unit_id`);

ALTER TABLE `biz_transaction`
    ADD CONSTRAINT `fk_transaction_account` FOREIGN KEY (`account_id`) REFERENCES `biz_account` (`account_id`);

ALTER TABLE `biz_account_flow`
    ADD CONSTRAINT `fk_flow_account` FOREIGN KEY (`account_id`) REFERENCES `biz_account` (`account_id`),
    ADD CONSTRAINT `fk_flow_transaction` FOREIGN KEY (`transaction_id`) REFERENCES `biz_transaction` (`transaction_id`);

ALTER TABLE `biz_budget`
    ADD CONSTRAINT `fk_budget_unit` FOREIGN KEY (`unit_id`) REFERENCES `biz_accounting_unit` (`unit_id`);

ALTER TABLE `biz_budget_approval`
    ADD CONSTRAINT `fk_approval_budget` FOREIGN KEY (`budget_id`) REFERENCES `biz_budget` (`budget_id`);

ALTER TABLE `biz_investment`
    ADD CONSTRAINT `fk_investment_unit` FOREIGN KEY (`unit_id`) REFERENCES `biz_accounting_unit` (`unit_id`);

ALTER TABLE `biz_invest_record`
    ADD CONSTRAINT `fk_record_investment` FOREIGN KEY (`investment_id`) REFERENCES `biz_investment` (`investment_id`);

-- =====================================================
-- 11. 初始化数据
-- =====================================================

-- 插入默认管理员用户 (密码: admin123)
INSERT INTO `sys_user` (`username`, `password`, `phone`, `email`, `status`) VALUES
('admin', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', '13800000000', 'admin@mamoji.com', 1);

-- 插入示例企业
INSERT INTO `biz_enterprise` (`name`, `credit_code`, `contact_person`, `contact_phone`, `status`) VALUES
('示例企业', '91110000123456789X', '张三', '13800000000', 1);

-- 将用户加入企业（设为超级管理员）
INSERT INTO `biz_enterprise_member` (`enterprise_id`, `user_id`, `role`) VALUES
(1, 1, 'super_admin');

-- 插入示例记账单元
INSERT INTO `biz_accounting_unit` (`enterprise_id`, `parent_unit_id`, `name`, `type`, `level`, `status`) VALUES
(1, NULL, '主营业务', 'business', 1, 1),
(1, NULL, '电商项目', 'domestic_ecommerce', 1, 1),
(1, 2, '淘宝店铺', 'domestic_ecommerce', 2, 1),
(1, 2, '抖音小店', 'domestic_ecommerce', 2, 1),
(1, NULL, '投资项目', 'investment', 1, 1),
(1, 5, '股票投资', 'investment', 2, 1),
(1, 5, '基金投资', 'investment', 2, 1);

-- 插入示例账户
INSERT INTO `biz_account` (`enterprise_id`, `unit_id`, `type`, `name`, `balance`, `status`) VALUES
(1, 1, 'wechat', '微信钱包', 12580.50, 1),
(1, 1, 'alipay', '支付宝', 35880.00, 1),
(1, 1, 'bank', '工商银行(1234)', 128888.88, 1),
(1, 1, 'credit_card', '招商银行信用卡', -5200.00, 1);

-- 插入示例预算
INSERT INTO `biz_budget` (`enterprise_id`, `unit_id`, `name`, `type`, `category`, `total_amount`, `period_start`, `period_end`, `status`) VALUES
(1, 1, '生活支出预算', 'monthly', 'office', 5000.00, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 1 MONTH), 'active'),
(1, 1, '进货成本预算', 'monthly', 'purchase_cost', 50000.00, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 1 MONTH), 'active');

-- 插入示例投资
INSERT INTO `biz_investment` (`enterprise_id`, `unit_id`, `name`, `product_type`, `product_code`, `principal`, `current_value`, `total_profit`, `quantity`, `cost_price`, `current_price`, `reminder_days`, `status`) VALUES
(1, 6, '贵州茅台', 'stock', '600519.SH', 45000.00, 50625.00, 5625.00, 100, 450.00, 506.25, 3, 1),
(1, 7, '易方达蓝筹', 'fund', '005827', 32000.00, 30976.00, -1024.00, 15000, 2.1333, 2.0651, 7, 1);

-- 插入示例通知
INSERT INTO `biz_notification` (`user_id`, `type`, `title`, `content`, `is_read`) VALUES
(1, 'budget_warning', '预算使用超80%', '生活支出预算已使用80%，请注意控制支出', 0),
(1, 'invest_reminder', '投资市值待更新', '贵州茅台已3天未更新市值，请及时更新', 0);
