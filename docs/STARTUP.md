# Mamoji 本地开发启动指南

## 前置条件

| 软件 | 版本 | 验证命令 |
|------|------|----------|
| Docker | 最新版 | `docker --version` |
| Java | 17+ | `java -version` |
| Node.js | 18+ | `node -v` |
| Maven | 3.6+ | `mvn -version` |

## 启动步骤

### 1. 启动 Docker 服务

```bash
cd /home/ubuntu/deploy_projects/mamoji
docker-compose up -d mysql redis
```

**验证：**
```bash
# MySQL
mysql -h localhost -P 3306 -u root -prootpassword -e "SELECT 'OK' as status"

# Redis
redis-cli -h localhost -p 6379 ping
```

### 2. 初始化数据库

```bash
# 创建数据库
docker-compose exec mysql mysql -u root -prootpassword -e \
  "CREATE DATABASE IF NOT EXISTS mamoji CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"

# 执行初始化脚本
for f in db/init/*.sql; do
  docker-compose exec mysql mysql -u root -prootpassword mamoji < "$f"
done
```

### 3. 启动后端

```bash
cd /home/ubuntu/deploy_projects/mamoji/api
mvn spring-boot:run
```
- 端口: **48080**
- 访问: http://localhost:48080/api/v1

### 4. 启动前端

```bash
cd /home/ubuntu/deploy_projects/mamoji/web
npm run dev -- -p 43000
```
- 端口: **43000**
- 访问: http://localhost:43000

## 测试账号

| 用户名 | 密码 |
|--------|------|
| admin | admin123 |
| testuser | test123 |

## 常用命令

```bash
# 后端测试
cd api && mvn test

# 前端测试
cd web && npm test

# 重启后端服务
fuser -k 48080/tcp; mvn spring-boot:run
```
