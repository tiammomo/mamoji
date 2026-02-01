# Mamoji 配置文档

## 端口配置

| 服务 | 端口 | 说明 |
|------|------|------|
| MySQL | 3306 | 主数据库 |
| Redis | 6379 | 缓存服务 |
| 后端 API | 48080 | Spring Boot |
| 前端 Web | 43000 | Next.js |

## 环境变量

### 后端 (application-dev.yml)
```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/mamoji?useUnicode=true&characterEncoding=UTF-8&serverTimezone=Asia/Shanghai
    username: root
    password: rootpassword
  data:
    redis:
      host: localhost
      port: 6379

jwt:
  secret: mamoji-jwt-secret-key-2024-must-be-at-least-256-bits
  expiration: 86400000
```

### 前端 (.env.local)
```bash
NEXT_PUBLIC_API_URL=http://localhost:48080
```

## 云端配置 (生产环境)

```yaml
# 数据库 (阿里云 RDS)
host: rm-bp14vg2ya3u8067d0ko.mysql.rds.aliyuncs.com
port: 3306

# Redis (阿里云 Redis)
host: r-bp17r86g9eu9urg5wepd.redis.rds.aliyuncs.com
port: 6379

# 后端端口
port: 8080
```
