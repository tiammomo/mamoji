# Mamoji 配置文档

## 1. 数据库配置 (阿里云 RDS)

```yaml
database:
  host: rm-bp14vg2ya3u8067d0ko.mysql.rds.aliyuncs.com
  port: 3306
  username: mamoji
  password: v*hhA7)1oyNG)nnjfw5AcO7*KmbZ1vA
  name: mamoji
  max_open_conns: 100
  max_idle_conns: 10
  conn_max_lifetime: 1h
```

## 2. Redis 配置 (阿里云 Redis)

```yaml
redis:
  host: r-bp17r86g9eu9urg5wepd.redis.rds.aliyuncs.com
  port: 6379
  username: mamoji
  password: v*hhA7)1oyNG)nnjfw5AcO7*KmbZ1vA
  db: 0
  pool_size: 100
```

## 3. 应用端口配置

```yaml
# 后端服务 (Spring Boot)
app:
  host: 0.0.0.0
  port: 8080

# 前端服务 (Next.js)
web:
  host: 0.0.0.0
  port: 3000
```

## 4. Docker 部署配置

### 4.1 后端镜像

```dockerfile
# 镜像地址
image: registry.cn-hangzhou.aliyuncs.com/mamoji/backend:latest

# 启动命令
docker run -d \
  --name mamoji-backend \
  -p 8080:8080 \
  -v /etc/mamoji/config.yaml:/app/config.yaml \
  registry.cn-hangzhou.aliyuncs.com/mamoji/backend:latest
```

### 4.2 前端镜像

```dockerfile
# 镜像地址
image: registry.cn-hangzhou.aliyuncs.com/mamoji/frontend:latest

# 启动命令
docker run -d \
  --name mamoji-frontend \
  -p 3000:3000 \
  registry.cn-hangzhou.aliyuncs.com/mamoji/frontend:latest
```

### 4.3 Docker Compose

```yaml
version: '3.8'

services:
  backend:
    image: registry.cn-hangzhou.aliyuncs.com/mamoji/backend:latest
    container_name: mamoji-backend
    ports:
      - "8080:8080"
    volumes:
      - ./config.yaml:/app/config.yaml
    environment:
      - SPRING_PROFILES_ACTIVE=prod
    depends_on:
      - mysql
      - redis

  frontend:
    image: registry.cn-hangzhou.aliyuncs.com/mamoji/frontend:latest
    container_name: mamoji-frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:8080

  mysql:
    image: mysql:8.0
    container_name: mamoji-mysql
    ports:
      - "3306:3306"
    environment:
      MYSQL_ROOT_PASSWORD: root_password
      MYSQL_DATABASE: mamoji
    volumes:
      - mysql_data:/var/lib/mysql

  redis:
    image: redis:7-alpine
    container_name: mamoji-redis
    ports:
      - "6379:6379"

volumes:
  mysql_data:
```

## 5. 环境变量配置

### 5.1 后端环境变量

```bash
# 数据库
DATABASE_HOST=rm-bp14vg2ya3u8067d0ko.mysql.rds.aliyuncs.com
DATABASE_PORT=3306
DATABASE_USERNAME=mamoji
DATABASE_PASSWORD=v*hhA7)1oyNG)nnjfw5AcO7*KmbZ1vA
DATABASE_NAME=mamoji

# Redis
REDIS_HOST=r-bp17r86g9eu9urg5wepd.redis.rds.aliyuncs.com
REDIS_PORT=6379
REDIS_PASSWORD=v*hhA7)1oyNG)nnjfw5AcO7*KmbZ1vA

# JWT
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRATION=86400000

# 应用
SERVER_PORT=8080
```

### 5.2 前端环境变量

```bash
# API 地址
NEXT_PUBLIC_API_URL=http://localhost:8080

# 可选配置
NEXT_PUBLIC_APP_NAME=Mamoji
```

> **注意**: 敏感信息（密码、密钥等）请使用环境变量或密钥管理服务，不要提交到代码仓库。
