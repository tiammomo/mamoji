# Mamoji 本地开发配置

> 本文档记录本地开发环境的配置信息，与云端配置分开管理。

---

## 1. Docker 服务配置

### 1.1 MySQL (本地 Docker)

```yaml
mysql:
  image: mysql:8.0
  container_name: mamoji-mysql
  host: localhost
  port: 3306
  username: root
  password: rootpassword
  database: mamoji
  character_set: utf8mb4
  collation: utf8mb4_unicode_ci
```

### 1.2 Redis (本地 Docker)

```yaml
redis:
  image: redis:7-alpine
  container_name: mamoji-redis
  host: localhost
  port: 6379
  database: 0
  password: (无密码)
```

---

## 2. Docker Compose 启动命令

### 2.1 启动所有服务

```bash
# 进入项目根目录
cd /home/ubuntu/deploy_projects/mamoji

# 启动所有服务（后台运行）
docker-compose up -d

# 或者查看实时日志
docker-compose up -d --watch
```

### 2.2 服务管理

```bash
# 查看服务状态
docker-compose ps

# 查看特定服务日志
docker-compose logs -f mysql
docker-compose logs -f redis

# 重启特定服务
docker-compose restart mysql
docker-compose restart redis

# 停止所有服务
docker-compose down

# 停止并删除数据卷（慎用！会清空数据）
docker-compose down -v
```

---

## 3. 数据库连接验证

### 3.1 MySQL 连接测试

```bash
# 命令行连接
mysql -h localhost -P 3306 -u root -prootpassword

# 或者使用 docker-compose exec
docker-compose exec mysql mysql -u root -prootpassword -e "SELECT 'MySQL OK' as status"

# 检查数据库
docker-compose exec mysql mysql -u root -prootpassword -e "SHOW DATABASES"
docker-compose exec mysql mysql -u root -prootpassword mamoji -e "SHOW TABLES"
```

### 3.2 Redis 连接测试

```bash
# 命令行连接
redis-cli -h localhost -p 6379 ping
# 预期返回: PONG

# 使用 docker-compose exec
docker-compose exec redis redis-cli ping
```

---

## 4. 测试数据库配置

### 4.1 application-test.yml

**文件**: `api/src/test/resources/application-test.yml`

```yaml
spring:
  config:
    activate:
      on-profile: test

  datasource:
    url: jdbc:mysql://localhost:3306/mamoji_test?useUnicode=true&characterEncoding=utf8&serverTimezone=Asia/Shanghai&useSSL=false&allowPublicKeyRetrieval=true
    username: root
    password: rootpassword
    driver-class-name: com.mysql.cj.jdbc.Driver
    hikari:
      minimum-idle: 5
      maximum-pool-size: 10
      connection-timeout: 30000

  # Redis Configuration
  data:
    redis:
      host: localhost
      port: 6379
      database: 0
      timeout: 5000ms
```

### 4.2 创建测试数据库

```bash
# 创建测试数据库
docker-compose exec mysql mysql -u root -prootpassword -e "CREATE DATABASE IF NOT EXISTS mamoji_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
```

---

## 5. 后端环境变量

### 5.1 本地开发环境

**文件**: `api/src/main/resources/application-dev.yml`

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/mamoji?useUnicode=true&characterEncoding=UTF-8&zeroDateTimeBehavior=convertToNull&useSSL=false&serverTimezone=Asia/Shanghai&allowPublicKeyRetrieval=true&connectionCollation=utf8mb4_unicode_ci
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

### 5.2 系统环境变量（推荐）

```bash
# ~/.bashrc 或 ~/.zshrc 添加
export MAMOJI_DB_HOST=localhost
export MAMOJI_DB_PORT=3306
export MAMOJI_DB_USER=root
export MAMOJI_DB_PASSWORD=rootpassword
export MAMOJI_DB_NAME=mamoji
export MAMOJI_REDIS_HOST=localhost
export MAMOJI_REDIS_PORT=6379
export MAMOJI_JWT_SECRET=your-secret-key-here
```

---

## 6. 前端环境配置

### 6.1 环境变量文件

**文件**: `web/.env.local`

```bash
# API 地址配置（后端端口 48080）
NEXT_PUBLIC_API_URL=http://localhost:48080

# 可选配置
NEXT_PUBLIC_APP_NAME=Mamoji
NEXT_PUBLIC_APP_VERSION=1.0.0
```

---

## 7. 端口映射

| 服务 | 容器端口 | 本地端口 | 说明 |
|------|----------|----------|------|
| MySQL | 3306 | 3306 | 主数据库 |
| Redis | 6379 | 6379 | 缓存服务 |
| API | 8080 | 48080 | 后端服务 |
| Web | 3000 | 43000 | 前端服务（3000 被 Grafana 占用） |

### 7.1 启动命令

```bash
# 启动 Docker 服务（MySQL + Redis）
docker compose up -d mysql redis

# 启动后端（dev profile，使用 localhost:3306）
cd api
SPRING_PROFILES_ACTIVE=dev mvn spring-boot:run

# 启动前端（端口 43000，API 指向 localhost:48000）
cd web
NEXT_PUBLIC_API_URL=http://localhost:48080 npm run dev -- -p 43000
```

---

## 8. 数据持久化

### 8.1 Docker Volume

```bash
# 查看数据卷
docker volume ls | grep mamoji

# 备份数据卷
docker run --rm -v mamoji_mysql_data:/data -v $(pwd)/backup:/backup alpine tar czf /backup/mysql-backup.tar.gz -C /data .

# 恢复数据卷
docker run --rm -v mamoji_mysql_data:/data -v $(pwd)/backup:/backup alpine sh -c "cd /data && tar xzf /backup/mysql-backup.tar.gz"
```

---

## 9. 常见问题处理

### 9.1 Docker 服务启动失败

```bash
# 检查端口占用
lsof -i :3306
lsof -i :6379

# 停止占用端口的进程
# 或修改 docker-compose.yml 中的端口映射
```

### 9.2 MySQL 连接被拒绝

```bash
# 检查容器状态
docker-compose ps

# 查看 MySQL 日志
docker-compose logs mysql

# 重启 MySQL 容器
docker-compose restart mysql
```

### 9.3 Redis 连接超时

```bash
# 确认 Redis 容器正在运行
docker-compose ps | grep redis

# 查看 Redis 日志
docker-compose logs redis

# 测试 Redis 连接
docker-compose exec redis redis-cli ping
```

### 9.4 数据卷权限问题

```bash
# 重建数据卷
docker-compose down -v
docker-compose up -d
```

---

## 10. 开发工作流

### 10.1 每日开发流程

```bash
# 1. 启动 Docker 服务（MySQL + Redis）
cd /home/ubuntu/deploy_projects/mamoji
docker compose up -d mysql redis

# 2. 验证服务状态
docker compose ps

# 3. 启动后端（端口 48080）
cd api
SPRING_PROFILES_ACTIVE=dev mvn spring-boot:run

# 4. 启动前端（新终端，端口 43000）
cd web
NEXT_PUBLIC_API_URL=http://localhost:48080 npm run dev -- -p 43000
```

### 10.2 测试流程

```bash
# 后端测试（使用 Docker MySQL）
cd api
mvn test -Dspring.profiles.active=test

# 前端测试
cd web
npm test
```

### 10.3 代码更新后

```bash
# 重新构建并重启服务
docker-compose down
docker-compose up -d --build

# 或只重启特定服务
docker-compose restart api
docker-compose restart web
```

---

## 11. 相关文档

- [README.md](../README.md) - 项目主文档
- [docs/db.md](db.md) - 数据库设计文档
- [docs/api.md](api.md) - API 接口文档
- [docs/skills.md](skills.md) - Skills 维护指南
