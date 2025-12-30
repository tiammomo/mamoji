# 企业级财务记账系统 - 部署指南

## 一、环境要求

### 1.1 基础环境

| 组件 | 最低要求 | 推荐配置 |
|------|----------|----------|
| Docker | 24.0+ | 24.0+ |
| Docker Compose | 2.20+ | 2.20+ |
| Git | 2.0+ | 2.0+ |
| 内存 | 4GB | 8GB+ |
| 磁盘 | 50GB | 100GB+ SSD |

### 1.2 端口规划

| 端口 | 服务 | 说明 |
|------|------|------|
| 80 | HTTP | 测试环境入口 |
| 443 | HTTPS | 生产环境入口 |
| 3000 | Next.js | 前端开发服务器 |
| 8888 | Hertz | 后端API服务 |
| 3306 | MySQL | 数据库主库 |
| 3307 | MySQL | 数据库从库 (可选) |
| 6379 | Redis | 缓存服务 |

---

## 二、快速部署 (Docker Compose)

### 2.1 项目结构

```
mamoji/
├── docker/
│   ├── nginx/
│   │   ├── Dockerfile
│   │   └── nginx.conf
│   ├── nextjs/
│   │   ├── Dockerfile
│   │   └── .dockerignore
│   └── hertz/
│       ├── Dockerfile
│       └── .dockerignore
├── docs/
├── src/
│   ├── frontend/          # Next.js 项目
│   └── backend/           # Hertz 项目
├── .env.example
├── docker-compose.yml
└── README.md
```

### 2.2 配置文件

#### .env.example

```bash
# ===========================================
# 环境变量配置
# ===========================================

# 数据库配置
MYSQL_ROOT_PASSWORD=your_root_password
MYSQL_DATABASE=mamoji
MYSQL_USER=mamoji
MYSQL_PASSWORD=your_db_password

# Redis配置
REDIS_PASSWORD=your_redis_password

# JWT配置
JWT_SECRET=your_jwt_secret_key_min_32_chars
JWT_EXPIRY_HOURS=24

# 应用配置
APP_ENV=development    # development | staging | production
APP_PORT=8888
NEXT_PUBLIC_API_URL=http://localhost:8888

# 邮箱配置 (可选)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_email@example.com
SMTP_PASSWORD=your_email_password

# 微信配置 (可选)
WECHAT_APP_ID=your_app_id
WECHAT_APP_SECRET=your_app_secret

# 文件上传配置
UPLOAD_DIR=/data/uploads
MAX_UPLOAD_SIZE=10MB
```

#### docker-compose.yml

```yaml
version: '3.8'

services:
  # ===========================================
  # Nginx 反向代理
  # ===========================================
  nginx:
    image: nginx:1.24-alpine
    container_name: mamoji-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./docker/nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./docker/nginx/ssl:/etc/nginx/ssl:ro
      - uploads:/data/uploads
      - logs:/var/log/nginx
    depends_on:
      - nextjs
      - hertz
    networks:
      - mamoji-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "-q", "--spider", "http://localhost/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # ===========================================
  # Next.js 前端
  # ===========================================
  nextjs:
    build:
      context: ./src/frontend
      dockerfile: Dockerfile
    container_name: mamoji-nextjs
    expose:
      - "3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL:-http://localhost:8888}
    depends_on:
      - hertz
    networks:
      - mamoji-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "-q", "--spider", "http://localhost:3000"]
      interval: 30s
      timeout: 10s
      retries: 3

  # ===========================================
  # Hertz 后端
  # ===========================================
  hertz:
    build:
      context: ./src/backend
      dockerfile: Dockerfile
    container_name: mamoji-hertz
    expose:
      - "8888"
    environment:
      - TZ=Asia/Shanghai
      - DB_HOST=mysql
      - DB_PORT=3306
      - DB_USER=mamoji
      - DB_PASSWORD=${MYSQL_PASSWORD}
      - DB_NAME=mamoji
      - DB_MAX_OPEN_CONNS=100
      - DB_MAX_IDLE_CONNS=10
      - DB_CONN_MAX_LIFETIME=3600s
      - REDIS_HOST=redis
      - REDIS_PORT=6379
      - REDIS_DB=0
      - JWT_SECRET=${JWT_SECRET}
      - JWT_EXPIRY_HOURS=24
      - APP_ENV=${APP_ENV:-development}
      - APP_PORT=8888
      - UPLOAD_DIR=/data/uploads
      - MAX_UPLOAD_SIZE=10
    volumes:
      - uploads:/data/uploads
      - ./src/backend/config:/app/config:ro
    depends_on:
      mysql:
        condition: service_healthy
      redis:
        condition: service_started
    networks:
      - mamoji-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "-q", "--spider", "http://localhost:8888/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # ===========================================
  # MySQL 数据库
  # ===========================================
  mysql:
    image: mysql:8.0-debian
    container_name: mamoji-mysql
    expose:
      - "3306"
    environment:
      - MYSQL_ROOT_PASSWORD=${MYSQL_ROOT_PASSWORD}
      - MYSQL_DATABASE=mamoji
      - MYSQL_USER=mamoji
      - MYSQL_PASSWORD=${MYSQL_PASSWORD}
      - TZ=Asia/Shanghai
    command: >
      --character-set-server=utf8mb4
      --collation-server=utf8mb4_unicode_ci
      --default-authentication-plugin=mysql_native_password
      --innodb-buffer-pool-size=256M
      --max-connections=500
      --slow-query-log=1
      --long-query-time=2
    volumes:
      - mysql-data:/var/lib/mysql
      - ./docker/mysql/my.cnf:/etc/mysql/conf.d/my.cnf:ro
      - ./docker/mysql/init:/docker-entrypoint-initdb.d:ro
    networks:
      - mamoji-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "-u", "root", "-p${MYSQL_ROOT_PASSWORD}"]
      interval: 10s
      timeout: 5s
      retries: 5

  # ===========================================
  # Redis 缓存
  # ===========================================
  redis:
    image: redis:7.2-alpine
    container_name: mamoji-redis
    expose:
      - "6379"
    command: >
      --requirepass ${REDIS_PASSWORD}
      --appendonly yes
      --appendfsync everysec
      --maxmemory 256mb
      --maxmemory-policy allkeys-lru
    volumes:
      - redis-data:/data
    networks:
      - mamoji-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "-a", "${REDIS_PASSWORD}", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  mysql-data:
    driver: local
  redis-data:
    driver: local
  uploads:
    driver: local
  logs:
    driver: local

networks:
  mamoji-network:
    driver: bridge
```

### 2.3 Nginx 配置

#### docker/nginx/nginx.conf

```nginx
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 2048;
    use epoll;
    multi_accept on;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # 日志格式
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for" '
                    'rt=$request_time uct="$upstream_connect_time" uht="$upstream_header_time" urt="$upstream_response_time"';

    access_log /var/log/nginx/access.log main;

    # 基础配置
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 50M;

    # Gzip压缩
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript application/rss+xml image/svg+xml;

    # 上游服务器
    upstream nextjs {
        least_conn;
        server nextjs:3000 weight=5 max_fails=3 fail_timeout=30s;
    }

    upstream hertz {
        least_conn;
        server hertz:8888 weight=5 max_fails=3 fail_timeout=30s;
    }

    server {
        listen 80;
        server_name _;
        return 301 https://$host$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name _;

        # SSL配置 (生产环境需要配置真实证书)
        ssl_certificate /etc/nginx/ssl/server.crt;
        ssl_certificate_key /etc/nginx/ssl/server.key;
        ssl_session_timeout 1d;
        ssl_session_cache shared:SSL:50m;
        ssl_session_tickets off;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
        ssl_prefer_server_ciphers off;
        add_header Strict-Transport-Security "max-age=63072000" always;

        # 健康检查
        location /health {
            access_log off;
            return 200 "OK";
            add_header Content-Type text/plain;
        }

        # 前端静态资源
        location / {
            proxy_pass http://nextjs;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
            proxy_buffering on;
            proxy_buffer_size 4k;
            proxy_buffers 8 32k;
        }

        # API请求
        location /api/ {
            proxy_pass http://hertz;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_set_header Content-Type application/json;
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }

        # 文件上传
        location /upload/ {
            proxy_pass http://hertz;
            client_max_body_size 50M;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # 文件访问
        location /files/ {
            alias /data/uploads/;
            expires 7d;
            add_header Cache-Control "public, immutable";
        }
    }
}
```

### 2.4 MySQL 配置

#### docker/mysql/my.cnf

```ini
[mysqld]
# 字符集
character-set-server = utf8mb4
collation-server = utf8mb4_unicode_ci

# 基础配置
port = 3306
bind-address = 0.0.0.0
datadir = /var/lib/mysql
socket = /var/run/mysqld/mysqld.sock

# InnoDB配置
innodb_buffer_pool_size = 256M
innodb_log_file_size = 64M
innodb_log_buffer_size = 8M
innodb_flush_log_at_trx_commit = 2
innodb_flush_method = O_DIRECT

# 连接配置
max_connections = 500
max_connect_errors = 100
wait_timeout = 600
interactive_timeout = 600

# 慢查询日志
slow_query_log = 1
slow_query_log_file = /var/log/mysql/slow.log
long_query_time = 2

# 二进制日志 (主从复制)
server-id = 1
log_bin = mysql-bin
binlog_format = ROW
expire_logs_days = 7
max_binlog_size = 256M

# 性能模式
performance_schema = ON
performance_schema_instrument = '%=ON'

[client]
default-character-set = utf8mb4
```

### 2.5 启动命令

```bash
# 1. 克隆项目
git clone <repository_url>
cd mamoji

# 2. 复制环境变量文件
cp .env.example .env
# 编辑 .env 文件，填入实际配置

# 3. 构建并启动所有服务
docker compose up -d --build

# 4. 查看启动状态
docker compose ps

# 5. 查看日志
docker compose logs -f

# 6. 停止服务
docker compose down

# 7. 停止并删除数据卷
docker compose down -v
```

---

## 三、生产环境部署

### 3.1 SSL 证书配置

```bash
# 生成自签名证书 (测试用)
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout docker/nginx/ssl/server.key \
    -out docker/nginx/ssl/server.crt \
    -subj "/C=CN/ST=Shanghai/L=Shanghai/O=Mamoji/CN=localhost"

# 使用 Let's Encrypt (生产环境推荐)
# 使用 certbot 获取免费证书
certbot certonly --standalone -d your-domain.com
# 复制证书到 nginx 目录
cp /etc/letsencrypt/live/your-domain.com/fullchain.pem docker/nginx/ssl/server.crt
cp /etc/letsencrypt/live/your-domain.com/privkey.pem docker/nginx/ssl/server.key
```

### 3.2 Docker 镜像构建

#### 前端 Dockerfile (src/frontend/Dockerfile)

```dockerfile
# 构建阶段
FROM node:20-alpine AS builder

WORKDIR /app

# 安装依赖
COPY package*.json ./
RUN npm ci

# 复制源码
COPY . .

# 构建
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN npm run build

# 生产阶段
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# 创建非root用户
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 复制构建产物
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

#### 后端 Dockerfile (src/backend/Dockerfile)

```dockerfile
# 构建阶段
FROM golang:1.21-alpine AS builder

WORKDIR /app

# 安装依赖
COPY go.mod go.sum ./
RUN go mod download

# 复制源码
COPY . .

# 编译
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main .

# 生产阶段
FROM alpine:latest AS runner

WORKDIR /app

# 安装运行时依赖
RUN apk --no-cache add ca-certificates tzdata

# 创建非root用户
RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup

# 复制构建产物
COPY --from=builder --chown=1001:1001 /app/main .
COPY --from=builder --chown=1001:1001 /app/config ./config

USER appuser

EXPOSE 8888

CMD ["./main"]
```

### 3.3 健康检查脚本

```bash
#!/bin/bash
# health_check.sh

# 检查所有容器状态
check_container_status() {
    local containers=$(docker compose ps -q)
    for container in $containers; do
        local status=$(docker inspect --format='{{.State.Status}}' $container 2>/dev/null)
        if [ "$status" != "running" ]; then
            echo "ERROR: Container $container is not running (status: $status)"
            return 1
        fi
    done
    echo "All containers are running"
    return 0
}

# 检查服务健康端点
check_service_health() {
    local services=("nginx" "hertz")
    for service in ${services[@]}; do
        local health=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8888/health 2>/dev/null)
        if [ "$health" != "200" ]; then
            echo "WARNING: Service $service health check failed (HTTP: $health)"
        else
            echo "OK: Service $service is healthy"
        fi
    done
}

# 检查数据库连接
check_database_connection() {
    local result=$(docker exec mamoji-mysql mysqladmin ping -h localhost -u root -p${MYSQL_ROOT_PASSWORD} 2>/dev/null)
    if [ "$result" == "mysqld is alive" ]; then
        echo "OK: MySQL is alive"
    else
        echo "ERROR: MySQL connection failed"
        return 1
    fi
}

# 主检查流程
echo "=== Mamoji Health Check ==="
echo "Time: $(date)"
echo ""

check_container_status
check_database_connection
check_service_health

echo ""
echo "=== Check Complete ==="
```

---

## 四、运维管理

### 4.1 日志管理

```bash
# 查看应用日志
docker compose logs -f hertz
docker compose logs -f nextjs

# 查看 Nginx 日志
docker exec mamoji-nginx tail -f /var/log/nginx/access.log
docker exec mamoji-nginx tail -f /var/log/nginx/error.log

# 日志轮转配置
# 在 /etc/logrotate.d/docker-compose 添加:
/var/log/nginx/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 nginx adm
    sharedscripts
    postrotate
        [ -f /var/run/nginx.pid ] && kill -USR1 `cat /var/run/nginx.pid`
    endscript
}
```

### 4.2 备份恢复

```bash
#!/bin/bash
# backup.sh - 数据库备份脚本

# 配置
BACKUP_DIR="/data/backup"
DATE=$(date +%Y%m%d_%H%M%S)
KEEP_DAYS=7
MYSQL_CONTAINER="mamoji-mysql"

# 创建备份目录
mkdir -p $BACKUP_DIR

# 备份数据库
echo "Starting backup at $DATE..."
docker exec $MYSQL_CONTAINER mysqldump \
    -u root -p${MYSQL_ROOT_PASSWORD} \
    --single-transaction \
    --routines \
    --triggers \
    mamoji > ${BACKUP_DIR}/mamoji_backup_${DATE}.sql

# 压缩备份文件
gzip ${BACKUP_DIR}/mamoji_backup_${DATE}.sql

# 清理旧备份
find $BACKUP_DIR -name "*.sql.gz" -mtime +$KEEP_DAYS -delete

# 上传远程存储 (可选)
# aws s3 cp ${BACKUP_DIR}/mamoji_backup_${DATE}.sql.gz s3://your-bucket/backup/

echo "Backup completed: mamoji_backup_${DATE}.sql.gz"

# 恢复命令
# docker exec -i $MYSQL_CONTAINER mysql -u root -p${MYSQL_ROOT_PASSWORD} mamoji < backup_file.sql
```

### 4.3 数据迁移

```bash
#!/bin/bash
# migrate_data.sh - 数据迁移脚本

# 导出数据
echo "Exporting data..."
docker exec mamoji-mysql mysqldump \
    -u root -p${MYSQL_ROOT_PASSWORD} \
    --databases mamoji \
    --single-transaction \
    > migration_dump.sql

# 导入数据
echo "Importing data..."
docker exec -i target-mysql-container mysql \
    -u root -p${MYSQL_ROOT_PASSWORD} \
    < migration_dump.sql

echo "Migration completed!"
```

### 4.4 扩缩容

```bash
# 水平扩展后端服务
docker compose up -d --scale hertz=3

# 扩展 Redis 集群 (需要修改配置)
# 使用 Redis Sentinel 或 Redis Cluster

# 读写分离 (配置多个从库)
# 修改 docker-compose.yml 添加从库配置
```

---

## 五、监控告警

### 5.1 Prometheus 配置

```yaml
# prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'mamoji-hertz'
    static_configs:
      - targets: ['hertz:8888']
    metrics_path: /metrics

  - job_name: 'mamoji-nginx'
    static_configs:
      - targets: ['nginx:80']
    metrics_path: /nginx_status

  - job_name: 'mysql'
    static_configs:
      - targets: ['mysql:3306']
```

### 5.2 Grafana 仪表盘

建议导入以下仪表盘:
- Node Exporter Full (监控服务器资源)
- MySQL Overview (监控数据库)
- Redis Exporter (监控缓存)

### 5.3 告警规则

```yaml
# alert_rules.yml
groups:
  - name: mamoji-alerts
    rules:
      - alert: ServiceDown
        expr: up == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "服务不可用: {{ $labels.job }}"

      - alert: HighErrorRate
        expr: rate(http_errors_total[5m]) / rate(http_requests_total[5m]) > 0.05
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "错误率过高: {{ $value }}%"

      - alert: HighMemoryUsage
        expr: (1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) > 0.9
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "内存使用率超过 90%"

      - alert: DatabaseConnectionHigh
        expr: mysql_global_status_threads_connected / mysql_global_variables_max_connections > 0.8
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "数据库连接数过高"
```

---

## 六、故障排查

### 6.1 常见问题

| 问题 | 可能原因 | 解决方案 |
|------|----------|----------|
| 502 Bad Gateway | 后端服务未启动 | 检查 hertz 容器状态 |
| 连接数据库失败 | 配置错误或网络问题 | 检查环境变量和网络连接 |
| 文件上传失败 | 目录权限或大小限制 | 检查 uploads volume 和 nginx 配置 |
| 缓存未命中 | Redis 连接问题 | 检查 Redis 容器状态 |
| SSL 证书错误 | 证书过期或配置错误 | 更新证书 |

### 6.2 调试命令

```bash
# 进入容器排查
docker exec -it mamoji-hertz /bin/sh
docker exec -it mamoji-mysql mysql -u root -p

# 查看资源使用
docker stats

# 网络诊断
docker network inspect mamoji_mamoji-network

# 查看进程
docker exec mamoji-hertz ps aux
```

---

## 七、版本更新

```bash
# 1. 拉取最新代码
git pull origin main

# 2. 更新环境变量 (如有变更)
cp .env.example .env.new
# 合并变更: diff .env .env.new

# 3. 重新构建并启动
docker compose up -d --build

# 4. 执行数据库迁移 (如有)
# docker exec mamoji-hertz ./main migrate

# 5. 验证更新
docker compose logs -f --tail=100

# 6. 回滚 (如有问题)
docker compose down
docker tag mamoji-hertz:latest mamoji-hertz:backup
docker compose up -d
```
