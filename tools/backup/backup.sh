#!/bin/bash
# ============================================================
# Mamoji 数据库备份脚本
# ============================================================
#
# 使用方法:
#   ./backup.sh          # 备份到默认目录
#   ./backup.sh custom   # 自定义备份
#
# 定时任务示例 (每天凌晨 2 点):
#   0 2 * * * /path/to/backup.sh >> /var/log/mamoji-backup.log 2>&1
#
# ============================================================

# 配置
BACKUP_DIR="${BACKUP_DIR:-./backups}"
DATE=$(date +%Y%m%d_%H%M%S)
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-3306}"
DB_NAME="${DB_NAME:-mamoji}"
DB_USER="${DB_USER:-mamoji_mysql}"
DB_PASS="${DB_PASS:-mamoji_mysql_pass}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 创建备份目录
mkdir -p "$BACKUP_DIR"

# 开始备份
log_info "开始备份数据库: $DB_NAME"

# 执行备份
BACKUP_FILE="$BACKUP_DIR/mamoji_${DATE}.sql.gz"

mysqldump -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASS" \
    --single-transaction \
    --quick \
    --lock-tables=false \
    --routines \
    --triggers \
    --events \
    "$DB_NAME" | gzip > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    FILE_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    log_info "备份成功: $BACKUP_FILE (大小: $FILE_SIZE)"

    # 验证备份文件
    if gzip -t "$BACKUP_FILE" 2>/dev/null; then
        log_info "备份文件验证通过"
    else
        log_error "备份文件验证失败"
        exit 1
    fi

    # 清理旧备份
    log_info "清理 $RETENTION_DAYS 天前的备份..."
    find "$BACKUP_DIR" -name "mamoji_*.sql.gz" -mtime +$RETENTION_DAYS -delete
    CLEANED=$(find "$BACKUP_DIR" -name "mamoji_*.sql.gz" -mtime +$RETENTION_DAYS 2>/dev/null | wc -l)
    log_info "已清理 $CLEANED 个旧备份"

    # 保留最新备份的软链接
    ln -sf "$BACKUP_FILE" "$BACKUP_DIR/latest.sql.gz"
    log_info "已创建 latest.sql.gz 软链接"

else
    log_error "备份失败"
    exit 1
fi

log_info "备份完成!"
