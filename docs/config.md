# Mamoji 配置文档

## 1. 数据库配置 (阿里云 RDS)

```yaml
database:
  host: rm-bp14vg2ya3u8067d0ko.mysql.rds.aliyuncs.com
  port: 3306
  username: mamoji
  password: ${DATABASE_PASSWORD}
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
  password: ${REDIS_PASSWORD}
  db: 0
  pool_size: 100
```

## 3. 应用端口配置

```yaml
# 后端服务 (Spring Boot)
app:
  host: 0.0.0.0
  port: 48080

# 前端服务 (Next.js)
web:
  host: 0.0.0.0
  port: 43000
```

## 4. 环境变量配置

### 4.1 后端环境变量

```bash
# 数据库
DATABASE_HOST=rm-bp14vg2ya3u8067d0ko.mysql.rds.aliyuncs.com
DATABASE_PORT=3306
DATABASE_USERNAME=mamoji
DATABASE_PASSWORD=your_password_here
DATABASE_NAME=mamoji

# Redis
REDIS_HOST=r-bp17r86g9eu9urg5wepd.redis.rds.aliyuncs.com
REDIS_PORT=6379
REDIS_PASSWORD=your_password_here

# JWT
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRATION=86400000

# 应用
SERVER_PORT=48080
```

### 4.2 前端环境变量

```bash
# API 地址
NEXT_PUBLIC_API_URL=http://localhost:48080

# 可选配置
NEXT_PUBLIC_APP_NAME=Mamoji
```

> **注意**: 敏感信息（密码、密钥等）请使用环境变量或密钥管理服务，不要提交到代码仓库。
