-- =============================================
-- Mamoji Database Initialization Script
-- Generated: 2026-01-28
-- =============================================

-- 设置环境
USE mamoji;

-- =============================================
-- 1. 更新管理员密码 (admin123)
-- =============================================
UPDATE sys_user SET password = '$2b$12$EhqeqadVgyN2mrPARUTIEe7qi2f9xJQB7gzHLifU6.BVot1FzqQFu'
WHERE username = 'admin';

-- =============================================
-- 2. 添加 refund_id 列 (修复 Entity 映射)
-- =============================================
ALTER TABLE fin_transaction ADD COLUMN refund_id BIGINT NULL AFTER budget_id;

-- =============================================
-- 3. 设置字符集并插入中文测试账户
-- =============================================
SET NAMES utf8mb4;
INSERT INTO fin_account (user_id, name, account_type, balance, include_in_total, status, created_at, updated_at) VALUES
(1, '主银行账户', 'BANK', 10000.00, 1, 1, NOW(), NOW()),
(1, '现金钱包', 'CASH', 500.00, 1, 1, NOW(), NOW()),
(1, '信用卡', 'CREDIT', -2000.00, 1, 1, NOW(), NOW());

-- =============================================
-- 4. 插入中文测试预算
-- =============================================
INSERT INTO fin_budget (user_id, name, amount, spent, start_date, end_date, status, created_at, updated_at) VALUES
(1, '餐饮预算', 2000.00, 500.00, CURDATE() - INTERVAL 5 DAY, CURDATE() + INTERVAL 25 DAY, 1, NOW(), NOW()),
(1, '交通预算', 1000.00, 200.00, CURDATE() - INTERVAL 5 DAY, CURDATE() + INTERVAL 25 DAY, 1, NOW(), NOW());

-- =============================================
-- 5. 插入中文测试交易
-- =============================================
INSERT INTO fin_transaction (user_id, account_id, category_id, type, amount, occurred_at, note, status, created_at, updated_at) VALUES
(1, 1, 1, 'EXPENSE', 100.00, NOW() - INTERVAL 2 DAY, '超市购物', 1, NOW(), NOW()),
(1, 1, 2, 'EXPENSE', 50.00, NOW() - INTERVAL 2 DAY, '交通费用', 1, NOW(), NOW()),
(1, 1, 11, 'INCOME', 5000.00, NOW() - INTERVAL 1 DAY, '工资收入', 1, NOW(), NOW()),
(1, 2, 3, 'EXPENSE', 30.00, NOW(), '买咖啡', 1, NOW(), NOW());

-- =============================================
-- 6. 插入中文分类数据
-- =============================================
INSERT INTO fin_category (user_id, name, type, status) VALUES
-- 支出分类 (12个)
(0, '餐饮', 'expense', 1),
(0, '交通', 'expense', 1),
(0, '购物', 'expense', 1),
(0, '居住', 'expense', 1),
(0, '娱乐', 'expense', 1),
(0, '通讯', 'expense', 1),
(0, '医疗', 'expense', 1),
(0, '教育', 'expense', 1),
(0, '旅游', 'expense', 1),
(0, '人情', 'expense', 1),
(0, '理财', 'expense', 1),
(0, '其他支出', 'expense', 1),
-- 收入分类 (6个)
(0, '工资', 'income', 1),
(0, '奖金', 'income', 1),
(0, '投资收入', 'income', 1),
(0, '兼职收入', 'income', 1),
(0, '礼金', 'income', 1),
(0, '其他收入', 'income', 1);

-- =============================================
-- 验证数据
-- =============================================
SELECT 'Users' as tbl, COUNT(*) as cnt FROM sys_user
UNION ALL SELECT 'Accounts', COUNT(*) FROM fin_account
UNION ALL SELECT 'Categories', COUNT(*) FROM fin_category
UNION ALL SELECT 'Budgets', COUNT(*) FROM fin_budget
UNION ALL SELECT 'Transactions', COUNT(*) FROM fin_transaction;
