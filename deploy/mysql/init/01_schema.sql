-- ===========================================
-- Mamoji Database Initialization Script
-- Database: MySQL 8.0
-- ===========================================

-- ===========================================
-- 1. Create Database
-- ===========================================
DROP DATABASE IF EXISTS mamoji;
CREATE DATABASE mamoji DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE mamoji;

-- ===========================================
-- 2. Create Tables
-- ===========================================

-- -------------------------------------------------
-- sys_user: User accounts
-- -------------------------------------------------
CREATE TABLE sys_user (
    user_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT 'User ID',
    username VARCHAR(50) NOT NULL UNIQUE COMMENT 'Username (unique)',
    password VARCHAR(255) NOT NULL COMMENT 'Password (BCrypt encrypted)',
    phone VARCHAR(20) COMMENT 'Phone number',
    email VARCHAR(100) COMMENT 'Email',
    role VARCHAR(20) NOT NULL DEFAULT 'normal' COMMENT 'Role: super_admin, admin, normal',
    status TINYINT NOT NULL DEFAULT 1 COMMENT 'Status: 0=disabled, 1=normal',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation time',
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update time',
    INDEX idx_username (username),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='User accounts';

-- -------------------------------------------------
-- sys_preference: User preferences
-- -------------------------------------------------
CREATE TABLE sys_preference (
    pref_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT 'Preference ID',
    user_id BIGINT NOT NULL UNIQUE COMMENT 'User ID',
    currency VARCHAR(10) NOT NULL DEFAULT 'CNY' COMMENT 'Default currency',
    timezone VARCHAR(50) NOT NULL DEFAULT 'Asia/Shanghai' COMMENT 'Timezone',
    date_format VARCHAR(20) NOT NULL DEFAULT 'YYYY-MM-DD' COMMENT 'Date format',
    month_start TINYINT NOT NULL DEFAULT 1 COMMENT 'Month start day (1-28)',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation time',
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update time',
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='User preferences';

-- -------------------------------------------------
-- fin_category: Income/Expense categories
-- -------------------------------------------------
CREATE TABLE fin_category (
    category_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT 'Category ID',
    user_id BIGINT NOT NULL DEFAULT 0 COMMENT 'User ID (0 = system default)',
    name VARCHAR(50) NOT NULL COMMENT 'Category name',
    type VARCHAR(20) NOT NULL COMMENT 'Type: income, expense',
    status TINYINT NOT NULL DEFAULT 1 COMMENT 'Status: 0=disabled, 1=normal',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation time',
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update time',
    INDEX idx_user_id (user_id),
    INDEX idx_type (type),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Income/Expense categories';

-- -------------------------------------------------
-- fin_account: Accounts
-- -------------------------------------------------
CREATE TABLE fin_account (
    account_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT 'Account ID',
    user_id BIGINT NOT NULL COMMENT 'User ID',
    name VARCHAR(100) NOT NULL COMMENT 'Account name',
    account_type VARCHAR(50) NOT NULL COMMENT 'Type: bank, credit, cash, alipay, wechat, gold, fund_accumulation, fund, stock, topup, debt',
    account_sub_type VARCHAR(50) COMMENT 'Sub type: bank_primary, bank_secondary, credit_card',
    currency VARCHAR(10) NOT NULL DEFAULT 'CNY' COMMENT 'Currency',
    balance DECIMAL(19,4) NOT NULL DEFAULT 0 COMMENT 'Balance (positive for assets, negative for liabilities)',
    include_in_total TINYINT NOT NULL DEFAULT 1 COMMENT 'Include in total assets: 0=no, 1=yes',
    status TINYINT NOT NULL DEFAULT 1 COMMENT 'Status: 0=disabled, 1=normal',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation time',
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update time',
    INDEX idx_user_id (user_id),
    INDEX idx_account_type (account_type),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Accounts';

-- -------------------------------------------------
-- fin_transaction: Transaction records
-- -------------------------------------------------
CREATE TABLE fin_transaction (
    transaction_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT 'Transaction ID',
    user_id BIGINT NOT NULL COMMENT 'User ID',
    account_id BIGINT NOT NULL COMMENT 'Account ID',
    category_id BIGINT NOT NULL COMMENT 'Category ID (required)',
    budget_id BIGINT COMMENT 'Budget ID (optional)',
    type VARCHAR(20) NOT NULL COMMENT 'Type: income, expense',
    amount DECIMAL(19,4) NOT NULL COMMENT 'Amount',
    currency VARCHAR(10) NOT NULL DEFAULT 'CNY' COMMENT 'Currency',
    occurred_at DATETIME NOT NULL COMMENT 'Transaction time',
    note VARCHAR(500) COMMENT 'Note/remark',
    status TINYINT NOT NULL DEFAULT 1 COMMENT 'Status: 0=deleted, 1=normal',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation time',
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update time',
    INDEX idx_user_id (user_id),
    INDEX idx_account_id (account_id),
    INDEX idx_category_id (category_id),
    INDEX idx_budget_id (budget_id),
    INDEX idx_type (type),
    INDEX idx_occurred_at (occurred_at),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Transaction records';

-- -------------------------------------------------
-- fin_budget: Budgets
-- -------------------------------------------------
CREATE TABLE fin_budget (
    budget_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT 'Budget ID',
    user_id BIGINT NOT NULL COMMENT 'User ID',
    name VARCHAR(100) NOT NULL COMMENT 'Budget name',
    amount DECIMAL(19,4) NOT NULL COMMENT 'Budget amount',
    spent DECIMAL(19,4) NOT NULL DEFAULT 0 COMMENT 'Spent amount (real-time updated)',
    start_date DATE NOT NULL COMMENT 'Start date',
    end_date DATE NOT NULL COMMENT 'End date',
    status TINYINT NOT NULL DEFAULT 1 COMMENT 'Status: 0=canceled, 1=active, 2=completed, 3=over-budget',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation time',
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update time',
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_date_range (start_date, end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Budgets';

-- ===========================================
-- 3. Initial Data
-- ===========================================

-- Insert default admin user (password: admin123)
-- BCrypt hash of 'admin123'
INSERT INTO sys_user (user_id, username, password, phone, email, role, status) VALUES
(1, 'admin', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', NULL, NULL, 'super_admin', 1);

-- Insert system default categories (user_id = 0)
-- Income categories
INSERT INTO fin_category (category_id, user_id, name, type, status) VALUES
(1, 0, '工资', 'income', 1),
(2, 0, '奖金', 'income', 1),
(3, 0, '投资收入', 'income', 1),
(4, 0, '兼职收入', 'income', 1),
(5, 0, '礼金', 'income', 1),
(6, 0, '其他收入', 'income', 1);

-- Expense categories
INSERT INTO fin_category (category_id, user_id, name, type, status) VALUES
(7, 0, '餐饮', 'expense', 1),
(8, 0, '交通', 'expense', 1),
(9, 0, '购物', 'expense', 1),
(10, 0, '居住', 'expense', 1),
(11, 0, '娱乐', 'expense', 1),
(12, 0, '通讯', 'expense', 1),
(13, 0, '医疗', 'expense', 1),
(14, 0, '教育', 'expense', 1),
(15, 0, '旅游', 'expense', 1),
(16, 0, '人情', 'expense', 1),
(17, 0, '理财', 'expense', 1),
(18, 0, '其他支出', 'expense', 1);

-- ===========================================
-- 4. Views
-- ===========================================

-- Monthly summary view
CREATE OR REPLACE VIEW v_monthly_summary AS
SELECT
    user_id,
    DATE_FORMAT(occurred_at, '%Y-%m') AS month,
    SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) AS total_income,
    SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS total_expense,
    SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END) AS net_income,
    COUNT(*) AS transaction_count
FROM fin_transaction
WHERE status = 1
GROUP BY user_id, DATE_FORMAT(occurred_at, '%Y-%m');

-- Account summary view
CREATE OR REPLACE VIEW v_account_summary AS
SELECT
    user_id,
    SUM(CASE WHEN include_in_total = 1 AND account_type NOT IN ('credit', 'debt') THEN balance ELSE 0 END) AS total_assets,
    SUM(CASE WHEN account_type IN ('credit', 'debt') THEN ABS(balance) ELSE 0 END) AS total_liabilities,
    SUM(CASE WHEN include_in_total = 1 THEN balance ELSE 0 END) AS net_assets,
    COUNT(*) AS accounts_count
FROM fin_account
WHERE status = 1
GROUP BY user_id;

-- ===========================================
-- 5. Stored Procedures
-- ===========================================

-- Recalculate budget spent amount
DELIMITER //
CREATE PROCEDURE sp_recalculate_budget_spent(IN p_budget_id BIGINT)
BEGIN
    UPDATE fin_budget b
    SET spent = (
        SELECT COALESCE(SUM(t.amount), 0)
        FROM fin_transaction t
        WHERE t.budget_id = p_budget_id
          AND t.status = 1
          AND t.type = 'expense'
    ),
    status = CASE
        WHEN spent > amount THEN 3  -- over-budget
        WHEN CURDATE() > end_date THEN 2  -- completed
        ELSE 1  -- active
    END,
    updated_at = NOW()
    WHERE budget_id = p_budget_id;
END //
DELIMITER ;

-- Get monthly report
DELIMITER //
CREATE PROCEDURE sp_get_monthly_report(
    IN p_user_id BIGINT,
    IN p_year INT,
    IN p_month INT
)
BEGIN
    SELECT
        t.category_id,
        c.name AS category_name,
        t.type,
        SUM(t.amount) AS total_amount,
        COUNT(*) AS transaction_count
    FROM fin_transaction t
    LEFT JOIN fin_category c ON t.category_id = c.category_id
    WHERE t.user_id = p_user_id
      AND YEAR(t.occurred_at) = p_year
      AND MONTH(t.occurred_at) = p_month
      AND t.status = 1
    GROUP BY t.category_id, c.name, t.type
    ORDER BY t.type, total_amount DESC;
END //
DELIMITER ;

-- ===========================================
-- 6. Triggers
-- ===========================================

-- Update account balance when transaction is inserted
DELIMITER //
CREATE TRIGGER tr_transaction_after_insert
AFTER INSERT ON fin_transaction
FOR EACH ROW
BEGIN
    IF NEW.status = 1 THEN
        UPDATE fin_account
        SET balance = balance + CASE WHEN NEW.type = 'income' THEN NEW.amount ELSE -NEW.amount END,
            updated_at = NOW()
        WHERE account_id = NEW.account_id;
    END IF;
END //
DELIMITER ;

-- Update account balance when transaction is deleted
DELIMITER //
CREATE TRIGGER tr_transaction_after_delete
AFTER DELETE ON fin_transaction
FOR EACH ROW
BEGIN
    UPDATE fin_account
    SET balance = balance - CASE WHEN OLD.type = 'income' THEN OLD.amount ELSE -OLD.amount END,
        updated_at = NOW()
    WHERE account_id = OLD.account_id;
END //
DELIMITER ;

-- ===========================================
-- Done
-- ===========================================
SELECT 'Mamoji database initialized successfully!' AS result;
