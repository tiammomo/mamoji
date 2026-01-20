#!/bin/bash
# ===========================================
# Mamoji 环境变量配置（示例）
# ===========================================
# 复制此文件为 setup_env.sh 并填入实际值

# MySQL 配置
export DB_HOST=localhost
export DB_PORT=3306
export DB_USER=root
export DB_PASSWORD=your_password_here
export DB_NAME=mamoji_test

# Redis 配置
export REDIS_HOST=localhost
export REDIS_PORT=6379
export REDIS_PASSWORD=your_redis_password

# API 服务配置
export API_HOST=0.0.0.0
export API_PORT=8080

echo "Database environment variables set!"
echo "Edit this file to update passwords: ~/.mamoji_env"
