#!/bin/bash
# ============================================================
# Mamoji 数据库恢复脚本
# ============================================================
#
# 使用方法:
#   ./restore.sh backup_file.sql.gz
#
# ============================================================

if [ -z "$1" ]; then
    echo "用法: $0 <备份文件>"
    echo "示例: $0 ./backups/mamoji_20240315_020000.sql.gz"
    exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
    echo "错误: 备份文件不存在: $BACKUP_FILE"
    exit 1
fi

# 配置
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-3306}"
DB_NAME="${DB_NAME:-mamoji}"
DB_USER="${DB_USER:-mamoji_mysql}"
DB_PASS="${DB_PASS:-mamoji_mysql_pass}"

echo "=========================================="
echo "  Mamoji 数据库恢复"
echo "=========================================="
echo "备份文件: $BACKUP_FILE"
echo "数据库: $DB_NAME"
echo ""

# 确认恢复
read -p "确认恢复数据库? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
    echo "取消恢复"
    exit 0
fi

# 开始恢复
echo "开始恢复..."

# 解压并恢复
if [[ "$BACKUP_FILE" == *.gz ]]; then
    gunzip -c "$BACKUP_FILE" | mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASS" "$DB_NAME"
else
    mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASS" "$DB_NAME" < "$BACKUP_FILE"
fi

if [ $? -eq 0 ]; then
    echo "恢复成功!"
else
    echo "恢复失败!"
    exit 1
fi
