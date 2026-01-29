# Mamoji 本地开发启动指南

> 本文档指导如何在本地环境启动和配置 Mamoji 项目。

## 前置条件

### 1.1 必需软件

| 软件 | 版本要求 | 安装说明 |
|------|----------|----------|
| Docker Desktop | 最新版 | [Docker 官网](https://www.docker.com/products/docker-desktop) |
| Java | 17+ | `java -version` 验证 |
| Node.js | 18+ | `node -v` 验证 |
| Maven | 3.6+ | `mvn -version` 验证 |
| Git | 最新版 | `git --version` 验证 |

### 1.2 WSL2 配置（Windows 用户）

```powershell
# 在 PowerShell 中以管理员身份运行
wsl --install

# 重启电脑后，设置 WSL2 为默认
wsl --set-default-version 2

# 在 Docker Desktop Settings > Resources > WSL Integration 中启用
```

---

## 第一步：克隆项目

```bash
# 克隆项目
git clone https://github.com/your-repo/mamoji.git
cd mamoji

# 拉取最新代码
git pull origin master
```

---

## 第二步：启动 Docker 服务

### 2.1 启动所有服务

```bash
# 进入项目根目录
cd /home/ubuntu/deploy_projects/mamoji

# 启动 Docker 服务（后台运行）
docker-compose up -d

# 查看服务状态
docker-compose ps
```

### 2.2 预期输出

```
NAME            IMAGE               COMMAND              SERVICE          CREATED             STATUS              PORTS
mamoji-mysql    mysql:8.0           "docker-entrypoint.s"   mysql            10 seconds ago      Up 9 seconds        0.0.0.0:3306->3306/tcp
mamoji-redis    redis:7-alpine      "docker-entrypoint.s"   redis            10 seconds ago      Up 9 seconds        0.0.0.0:6379->6379/tcp
```

### 2.3 验证服务

```bash
# 验证 MySQL
mysql -h localhost -P 3306 -u root -prootpassword -e "SELECT 'MySQL OK' as status"

# 预期输出:
# +----------+
# | status   |
# +----------+
# | MySQL OK |
# +----------+

# 验证 Redis
redis-cli -h localhost -p 6379 ping

# 预期输出:
# PONG
```

---

## 第三步：初始化数据库

### 3.1 创建数据库

```bash
# 创建主数据库
docker-compose exec mysql mysql -u root -prootpassword -e "CREATE DATABASE IF NOT EXISTS mamoji CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"

# 创建测试数据库
docker-compose exec mysql mysql -u root -prootpassword -e "CREATE DATABASE IF NOT EXISTS mamoji_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
```

### 3.2 运行初始化脚本

```bash
# 进入项目目录
cd /home/ubuntu/deploy_projects/mamoji

# 执行数据库初始化脚本
docker-compose exec mysql mysql -u root -prootpassword mamoji < db/init/01_schema.sql
docker-compose exec mysql mysql -u root -prootpassword mamoji < db/init/2_sys_user.sql
docker-compose exec mysql mysql -u root -prootpassword mamoji < db/init/3_fin_category.sql
docker-compose exec mysql mysql -u root -prootpassword mamoji < db/init/4_fin_account.sql
docker-compose exec mysql mysql -u root -prootpassword mamoji < db/init/5_fin_transaction.sql
docker-compose exec mysql mysql -u root -prootpassword mamoji < db/init/6_fin_budget.sql
docker-compose exec mysql mysql -u root -prootpassword mamoji < db/init/7_fin_refund.sql

# 验证数据
docker-compose exec mysql mysql -u root -prootpassword mamoji -e "SHOW TABLES"
```

### 3.3 预期输出

```
+---------------------+
| Tables_in_mamoji    |
+---------------------+
| fin_account         |
| fin_budget          |
| fin_category        |
| fin_refund          |
| fin_transaction     |
| sys_preference      |
| sys_user            |
+---------------------+
```

---

## 第四步：启动后端服务

### 4.1 方式一：直接运行（推荐）

```bash
# 进入后端目录
cd /home/ubuntu/deploy_projects/mamoji/api

# 启动应用（使用 dev 配置）
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

### 4.2 方式二：打包运行

```bash
# 进入后端目录
cd /home/ubuntu/deploy_projects/mamoji/api

# 打包
mvn package -DskipTests

# 运行
java -jar target/mamoji-api-1.0.0.jar --spring.profiles.active=dev
```

### 4.3 验证后端启动

```bash
# 测试 API 健康检查
curl http://localhost:8080/api/v1/auth/profile

# 预期输出（未认证）:
# {"code":401,"message":"Unauthorized"}
```

---

## 第五步：启动前端服务

### 5.1 安装依赖

```bash
# 进入前端目录
cd /home/ubuntu/deploy_projects/mamoji/web

# 安装依赖
npm install
```

### 5.2 启动开发服务器

```bash
# 启动开发服务器
npm run dev
```

### 5.3 访问前端

打开浏览器访问: http://localhost:3000

---

## 第六步：运行测试

### 6.1 后端测试

```bash
# 进入后端目录
cd /home/ubuntu/deploy_projects/mamoji/api

# 运行测试（确保 Docker MySQL 已启动）
mvn test

# 预期结果: 63 tests pass
```

### 6.2 前端测试

```bash
# 进入前端目录
cd /home/ubuntu/deploy_projects/mamoji/web

# 运行测试
npm test

# 预期结果: 43+ tests pass
```

---

## 常见问题

### Q1: Docker 服务启动失败

```bash
# 检查端口占用
lsof -i :3306
lsof -i :6379

# 停止占用端口的进程，或修改 docker-compose.yml 中的端口映射
```

### Q2: MySQL 连接被拒绝

```bash
# 检查容器状态
docker-compose ps

# 查看 MySQL 日志
docker-compose logs mysql

# 重启 MySQL
docker-compose restart mysql
```

### Q3: Redis 连接超时

```bash
# 确认 Redis 正在运行
docker-compose ps | grep redis

# 测试连接
docker-compose exec redis redis-cli ping
```

### Q4: 后端启动报错找不到数据库

```bash
# 确认数据库已创建
docker-compose exec mysql mysql -u root -prootpassword -e "SHOW DATABASES"

# 确认测试数据库存在
docker-compose exec mysql mysql -u root -prootpassword -e "CREATE DATABASE IF NOT EXISTS mamoji_test"
```

---

## 开发工作流

### 每日开发

```bash
# 1. 拉取最新代码
git pull origin master

# 2. 启动 Docker 服务
docker-compose up -d

# 3. 启动后端
cd api && mvn spring-boot:run

# 4. 启动前端（新终端）
cd web && npm run dev
```

### 代码更新后

```bash
# 重新构建后端
cd api && mvn clean package -DskipTests

# 重启后端服务
docker-compose restart api
```

### 停止开发

```bash
# 停止 Docker 服务
docker-compose down

# 或只停止特定服务
docker-compose stop mysql redis
```

---

## 相关文档

- [README.md](../README.md) - 项目主文档
- [local-config.md](local-config.md) - 本地配置信息
- [skills.md](skills.md) - Skills 维护指南
- [api.md](api.md) - API 接口文档
- [db.md](db.md) - 数据库设计

---

## 账号信息

### 测试账号

| 用户名 | 密码 | 角色 |
|--------|------|------|
| admin | admin123 | 超级管理员 |
| testuser | test123 | 普通用户 |

### 默认分类

- 收入分类: 工资、奖金、投资收入、兼职收入、礼金、其他收入
- 支出分类: 餐饮、交通、购物、居住、娱乐、通讯、医疗、教育、旅游、人情、理财、其他支出
