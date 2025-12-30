# Mamoji 安装指南

本文档提供 Mamoji 企业级财务记账系统的完整安装和配置指南。

## 📋 目录

- [系统要求](#系统要求)
- [快速安装](#快速安装)
- [手动安装](#手动安装)
- [Docker 部署](#docker-部署)
- [验证安装](#验证安装)
- [常见问题](#常见问题)
- [卸载说明](#卸载说明)

---

## 系统要求

### 最低配置

| 组件 | 最低要求 | 推荐配置 |
|------|---------|---------|
| CPU | 2 核 | 4 核+ |
| 内存 | 4 GB | 8 GB+ |
| 存储 | 20 GB SSD | 50 GB SSD+ |
| 网络 | 10 Mbps | 100 Mbps+ |

### 软件依赖

| 软件 | 最低版本 | 推荐版本 | 用途 |
|------|---------|---------|------|
| **Node.js** | 18.0+ | 20.x LTS | 前端运行时 |
| **npm / yarn** | 8.0+ | latest | 前端包管理 |
| **Go** | 1.21+ | 1.25.x | 后端运行时 |
| **MySQL** | 8.0+ | 8.0.35 | 主数据库 |
| **Redis** | 6.0+ | 7.2 | 缓存/会话 |
| **Git** | 2.0+ | 2.44 | 版本控制 |
| **Docker** (可选) | 24.0+ | 24.0.7 | 容器化部署 |
| **Docker Compose** (可选) | 2.0+ | 2.x | 容器编排 |

### 操作系统支持

| 操作系统 | 支持状态 | 说明 |
|---------|---------|------|
| Ubuntu 20.04+ | ✅ 完全支持 | 推荐开发环境 |
| Debian 11+ | ✅ 完全支持 | |
| CentOS 7+ | ✅ 完全支持 | |
| Windows 10/11 | ✅ 完全支持 | 需要 WSL2 |
| macOS 11+ | ✅ 完全支持 | 推荐 M1/M2 芯片 |

---

## 快速安装

### 方式一：Docker Compose（推荐用于生产环境）

```bash
# 1. 克隆项目
git clone https://github.com/your-org/mamoji.git
cd mamoji

# 2. 进入部署目录
cd deploy

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env 文件，修改必要的配置项

# 4. 构建并启动所有服务
docker-compose up -d --build

# 5. 等待服务启动（约 2-3 分钟）
docker-compose ps

# 6. 初始化数据库
docker-compose exec mysql mysql -uroot -pmamoji mamoji < mysql/init/01_schema.sql

# 7. 访问应用
# Web: http://localhost
# API: http://localhost/api
```

### 方式二：本地开发环境

```bash
# 1. 克隆项目
git clone https://github.com/your-org/mamoji.git
cd mamoji

# 2. 启动数据库（使用 Docker）
docker-compose -f deploy/docker-compose.yml up -d mysql redis

# 3. 安装并启动前端
cd web
npm install
npm run dev

# 4. 安装并启动后端（新终端）
cd api
go mod tidy
go run ./cmd/server

# 5. 访问应用
# 前端: http://localhost:3000
# 后端: http://localhost:8888
```

---

## 手动安装

### 第一步：环境准备

#### 1.1 安装 Node.js

**Windows (使用 nvm-windows):**

```powershell
# 安装 nvm-windows
winget install CoreyButler.NVMforWindows

# 打开新的 PowerShell 窗口
nvm install 20
nvm use 20
node -v  # 确认版本
npm -v   # 确认版本
```

**macOS (使用 nvm):**

```bash
# 安装 nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# 安装 Node.js 20
nvm install 20
nvm use 20
node -v
npm -v
```

**Linux (Ubuntu/Debian):**

```bash
# 安装 nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# 加载 nvm
source ~/.bashrc

# 安装 Node.js 20
nvm install 20
nvm use 20
node -v
npm -v
```

#### 1.2 安装 Go

**Windows:**

```powershell
# 下载 Go 安装包
winget install GoLang.Go

# 验证安装
go version
```

**macOS:**

```bash
# 使用 Homebrew
brew install go@1.25

# 验证安装
go version
```

**Linux:**

```bash
# 下载 Go
wget https://go.dev/dl/go1.25.5.linux-amd64.tar.gz
sudo rm -rf /usr/local/go
sudo tar -C /usr/local -xzf go1.25.5.linux-amd64.tar.gz

# 添加到 PATH
echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc
source ~/.bashrc

# 验证安装
go version
```

#### 1.3 安装 MySQL

**使用 Docker（推荐）:**

```bash
# 启动 MySQL 容器
docker run -d \
  --name mamoji-mysql \
  -p 3306:3306 \
  -e MYSQL_ROOT_PASSWORD=mamoji123 \
  -e MYSQL_DATABASE=mamoji \
  -v mysql-data:/var/lib/mysql \
  mysql:8.0 \
  --default-authentication-plugin=mysql_native_password

# 等待 MySQL 启动
docker exec mamoji-mysql mysqladmin ping -h localhost -uroot -pmamoji123
```

**手动安装（Ubuntu）:**

```bash
# 安装 MySQL
sudo apt update
sudo apt install mysql-server-8.0

# 启动 MySQL
sudo systemctl start mysql
sudo systemctl enable mysql

# 安全配置
sudo mysql_secure_installation

# 创建数据库和用户
sudo mysql -uroot -p
```

```sql
-- MySQL 客户端中执行
CREATE DATABASE mamoji CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'mamoji'@'%' IDENTIFIED BY 'mamoji123';
GRANT ALL PRIVILEGES ON mamoji.* TO 'mamoji'@'%';
FLUSH PRIVILEGES;
EXIT;
```

#### 1.4 安装 Redis

**使用 Docker（推荐）:**

```bash
# 启动 Redis 容器
docker run -d \
  --name mamoji-redis \
  -p 6379:6379 \
  -v redis-data:/data \
  redis:7.2-alpine \
  redis-server --appendonly yes

# 验证启动
docker exec mamoji-redis redis-cli ping
```

**手动安装（Ubuntu）:**

```bash
# 安装 Redis
sudo apt install redis-server

# 启动 Redis
sudo systemctl start redis
sudo systemctl enable redis

# 验证安装
redis-cli ping
```

### 第二步：安装前端

```bash
# 进入前端目录
cd web

# 使用 npm 安装依赖
npm install

# 或使用 yarn
yarn install

# 验证安装
npm list --depth=0
```

**依赖包说明：**

| 依赖包 | 版本 | 用途 |
|--------|------|------|
| next | 14.1.0 | React 框架 |
| react | 18.2.0 | UI 库 |
| react-dom | 18.2.0 | React DOM |
| typescript | 5.3.3 | 类型系统 |
| zustand | 4.5.0 | 状态管理 |
| shadcn/ui | 最新 | 组件库 |
| tailwindcss | 3.4.1 | CSS 框架 |
| axios | 1.6.5 | HTTP 客户端 |
| recharts | 2.10.4 | 图表库 |

#### 配置前端环境变量

```bash
# 创建环境变量文件
cp .env.example .env.local

# 编辑配置
vim .env.local
```

**环境变量说明：**

```env
# API 地址
NEXT_PUBLIC_API_URL=http://localhost:8888

# WebSocket 地址
NEXT_PUBLIC_WS_URL=ws://localhost:8888/ws

# 应用名称
NEXT_PUBLIC_APP_NAME=Mamoji

# 应用版本
NEXT_PUBLIC_APP_VERSION=1.0.0
```

#### 启动前端开发服务器

```bash
# 开发模式
npm run dev

# 生产模式构建
npm run build
npm start
```

### 第三步：安装后端

```bash
# 进入后端目录
cd api

# 下载依赖
go mod tidy

# 验证依赖
go list -m all
```

**主要依赖说明：**

| 依赖包 | 用途 |
|--------|------|
| github.com/cloudwego/hertz | HTTP 框架 |
| gorm.io/gorm | ORM 框架 |
| gorm.io/driver/mysql | MySQL 驱动 |
| github.com/redis/go-redis/v9 | Redis 客户端 |
| github.com/golang-jwt/jwt/v5 | JWT 认证 |
| github.com/spf13/viper | 配置管理 |
| go.uber.org/zap | 日志管理 |

#### 配置后端环境变量

```bash
# 创建配置目录
mkdir -p config

# 创建配置文件
cp config/config.example.yaml config/config.yaml
vim config/config.yaml
```

**配置文件说明：**

```yaml
# 应用配置
app:
  name: mamoji
  host: "0.0.0.0"
  port: 8888
  env: development
  debug: true

# 数据库配置
database:
  host: "localhost"
  port: 3306
  username: "root"
  password: "mamoji123"
  name: "mamoji"
  max_open_conns: 100
  max_idle_conns: 10
  conn_max_lifetime: 3600s

# Redis 配置
redis:
  host: "localhost"
  port: 6379
  password: ""
  db: 0
  pool_size: 100

# JWT 配置
jwt:
  secret_key: "your-secret-key-change-in-production"
  expire_time: 24h
```

#### 初始化数据库

```bash
# 导入数据库 schema
mysql -uroot -pmamoji123 mamoji < deploy/mysql/init/01_schema.sql

# 或在 MySQL 客户端中执行
source deploy/mysql/init/01_schema.sql
```

#### 启动后端服务

```bash
# 开发模式
go run ./cmd/server

# 生产模式
go build -o main ./cmd/server
./main
```

---

## Docker 部署

### 前置条件

1. 安装 Docker Engine：https://docs.docker.com/engine/install/
2. 安装 Docker Compose：https://docs.docker.com/compose/install/

### 部署步骤

#### 1. 准备部署环境

```bash
# 克隆项目
git clone https://github.com/your-org/mamoji.git
cd mamoji

# 进入部署目录
cd deploy
```

#### 2. 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑配置
vim .env
```

**完整配置示例：**

```env
# ==================== 应用配置 ====================
APP_NAME=mamoji
APP_ENV=production
APP_DEBUG=false

# ==================== 前端配置 ====================
NEXT_PUBLIC_API_URL=https://api.yourdomain.com

# ==================== 后端配置 ====================
# 数据库配置
MYSQL_ROOT_PASSWORD=your_secure_password
MYSQL_DATABASE=mamoji
MYSQL_HOST=mysql
MYSQL_PORT=3306

# Redis 配置
REDIS_HOST=redis
REDIS_PORT=6379

# JWT 配置（生产环境必须修改）
JWT_SECRET_KEY=your_very_long_and_secure_random_string
JWT_EXPIRE_HOURS=24
```

#### 3. SSL 证书配置

```bash
# 创建证书目录
mkdir -p nginx/ssl

# 复制证书文件
cp /path/to/your-ssl.crt nginx/ssl/server.crt
cp /path/to/your-ssl.key nginx/ssl/server.key

# 或使用 Let's Encrypt
certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

#### 4. 构建和启动

```bash
# 构建所有服务
docker-compose build

# 启动服务
docker-compose up -d

# 查看启动状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

#### 5. 初始化数据库

```bash
# 执行初始化脚本
docker-compose exec mysql mysql -uroot -p${MYSQL_ROOT_PASSWORD} mamoji < mysql/init/01_schema.sql
```

#### 6. 验证部署

```bash
# 检查服务健康状态
curl http://localhost/health

# 检查 API 健康状态
curl http://localhost/api/health
```

### Docker Compose 服务说明

#### docker-compose.yml 配置详解

```yaml
version: '3.8'

services:
  # Nginx 反向代理
  nginx:
    image: nginx:1.24-alpine
    container_name: mamoji-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/conf.d:/etc/nginx/conf.d:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
    depends_on:
      - web
      - api
    networks:
      - mamoji-network
    restart: unless-stopped

  # Next.js 前端
  web:
    build:
      context: ../web
      dockerfile: Dockerfile
    container_name: mamoji-web
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_URL=http://api:8888
    depends_on:
      - api
    networks:
      - mamoji-network
    restart: unless-stopped

  # Go 后端
  api:
    build:
      context: ../api
      dockerfile: Dockerfile
    container_name: mamoji-api
    environment:
      - MAMOJI_DATABASE_HOST=mysql
      - MAMOJI_REDIS_HOST=redis
    depends_on:
      mysql:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - mamoji-network
    restart: unless-stopped

  # MySQL 数据库
  mysql:
    image: mysql:8.0
    container_name: mamoji-mysql
    environment:
      - MYSQL_ROOT_PASSWORD=${MYSQL_ROOT_PASSWORD}
      - MYSQL_DATABASE=${MYSQL_DATABASE}
    volumes:
      - mysql-data:/var/lib/mysql
      - ./mysql/my.cnf:/etc/mysql/conf.d/my.cnf:ro
      - ./mysql/init:/docker-entrypoint-initdb.d:ro
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - mamoji-network
    restart: unless-stopped

  # Redis 缓存
  redis:
    image: redis:7.2-alpine
    container_name: mamoji-redis
    volumes:
      - redis-data:/data
      - ./redis/redis.conf:/usr/local/etc/redis/redis.conf:ro
    networks:
      - mamoji-network
    restart: unless-stopped

networks:
  mamoji-network:
    driver: bridge

volumes:
  mysql-data:
    driver: local
  redis-data:
    driver: local
```

### 管理命令

```bash
# 启动服务
docker-compose up -d

# 停止服务
docker-compose down

# 重启服务
docker-compose restart

# 重启单个服务
docker-compose restart api

# 查看日志
docker-compose logs -f
docker-compose logs -f api

# 查看资源使用
docker stats

# 进入容器
docker exec -it mamoji-api sh
docker exec -it mamoji-mysql mysql -uroot -p

# 更新镜像
docker-compose pull
docker-compose up -d
```

---

## 验证安装

### 前端验证

1. 打开浏览器访问 `http://localhost`
2. 应该看到 Mamoji 登录页面
3. 检查控制台无错误

### 后端 API 验证

```bash
# 健康检查
curl http://localhost:8888/health

# 预期输出
{"code":0,"message":"OK","data":{"service":"mamoji-api","status":"healthy"}}
```

### 数据库验证

```bash
# 登录 MySQL
docker exec -it mamoji-mysql mysql -uroot -pmamoji123

# 检查数据库
SHOW DATABASES;
USE mamoji;
SHOW TABLES;
EXIT;
```

### Redis 验证

```bash
# 检查 Redis 连接
docker exec -it mamoji-redis redis-cli ping

# 预期输出
PONG
```

---

## 常见问题

### Q1: npm install 失败

**问题：** 安装依赖时报错，文件被锁定或网络超时

**解决方案：**

```bash
# 清理缓存
npm cache clean --force

# 删除 node_modules 和 lock 文件
rm -rf node_modules package-lock.json

# 使用国内镜像
npm install --registry=https://registry.npmmirror.com

# 或使用 yarn
npm install -g yarn
yarn install
```

### Q2: Docker 构建失败

**问题：** 内存不足或网络问题

**解决方案：**

```bash
# 清理 Docker 资源
docker system prune -a

# 增加 Docker 内存限制（Docker Desktop）
# Settings > Resources > Memory > 4GB+
```

### Q3: MySQL 连接失败

**问题：** 无法连接到数据库

**解决方案：**

```bash
# 检查 MySQL 状态
docker logs mamoji-mysql

# 检查连接
docker exec -it mamoji-mysql mysql -uroot -p

# 检查网络
docker network ls
docker network inspect mamoji_mamoji-network
```

### Q4: 前端端口冲突

**问题：** 端口 3000 已被占用

**解决方案：**

```bash
# 查看占用端口的进程
lsof -i :3000

# 杀掉进程
kill <PID>

# 或使用其他端口
npm run dev -- -p 3001
```

### Q5: 后端无法连接 Redis

**问题：** Redis 连接超时

**解决方案：**

```bash
# 检查 Redis 状态
docker logs mamoji-redis

# 检查 Redis 配置
docker exec mamoji-redis cat /usr/local/etc/redis/redis.conf | grep bind

# 确保 bind 设置正确
```

### Q6: 热更新不生效

**问题：** 修改代码后页面不更新

**解决方案：**

```bash
# 清除 Next.js 缓存
rm -rf .next

# 重启开发服务器
```

### Q7: Windows 上运行缓慢

**问题：** WSL2 环境下运行慢

**解决方案：**

```powershell
# 在 PowerShell 中执行
wsl --shutdown

# 在 WSL2 中将项目移到 Linux 文件系统
# 例如: /home/user/projects/mamoji
```

---

## 卸载说明

### Docker 卸载

```bash
# 停止并删除服务
docker-compose down -v

# 删除数据卷
docker volume rm deploy_mysql-data deploy_redis-data

# 删除网络
docker network rm mamoji_mamoji-network
```

### 完全清理

```bash
# 删除项目目录
rm -rf mamoji

# 删除 Docker 镜像
docker rmi mamoji-web mamoji-api
docker rmi nginx:1.24-alpine mysql:8.0 redis:7.2-alpine
```

---

## 获取帮助

如果遇到本文档未涵盖的问题：

1. 查看 [README.md](README.md) 中的详细说明
2. 查看 [docs/](docs/) 目录下的其他文档
3. 提交 GitHub Issue：https://github.com/your-org/mamoji/issues
4. 发送邮件至：support@mamoji.com

---

## 更新日志

### v1.0.0 (2024-01)

- ✨ 初始版本发布
- 🎯 核心功能：账户管理、收支记录、预算管理
- 📊 报表统计：收支概览、分类统计、趋势分析
- 💰 理财收益：股票、基金、黄金投资追踪
- 🏢 企业管理：多成员、多单元权限控制
- 🐳 Docker 容器化部署支持
