-- Mamoji MySQL 初始化脚本
-- 此脚本在 MySQL 容器首次启动时自动执行

-- 创建数据库（如果尚未存在）
-- CREATE DATABASE IF NOT EXISTS mamoji CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 设置默认字符集
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- 业务表结构由 JPA/Hibernate 自动生成
-- 此处仅保留初始化配置
-- ----------------------------

-- 设置时区
SET time_zone = '+08:00';

-- 创建测试用户（可选，仅开发环境）
-- INSERT INTO user (email, password_hash, nickname, role, permissions, created_at, updated_at)
-- VALUES ('test@mamoji.com', '$2a$10$...', '测试用户', 1, 15, NOW(), NOW())
-- ON DUPLICATE KEY UPDATE nickname = '测试用户';

SET FOREIGN_KEY_CHECKS = 1;

-- 完成提示
SELECT 'Mamoji Database Initialized Successfully!' AS status;
