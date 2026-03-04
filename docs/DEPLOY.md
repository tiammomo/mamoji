# 部署指南

## 1. MVP 开发环境

> MVP 阶段推荐本地开发，无需复杂部署。

### 1.1 环境要求

| 工具 | 版本 | 说明 |
|------|------|------|
| Node.js | >= 20.x | 前端运行环境 |
| npm / yarn | 最新版 | 包管理工具 |
| JDK | 21 | 后端运行环境 |
| Maven | 3.9+ | 后端构建工具 |

> SQLite 作为开发数据库，无需额外安装

---

## 2. 本地开发快速启动

### 2.1 方式一：纯本地开发（推荐）

```bash
# 1. 克隆项目
git clone https://github.com/tiammomo/mamoji.git
cd mamoji

# 2. 启动后端
cd backend
./mvnw spring-boot:run
# 后端运行在 http://localhost:8080

# 3. 启动前端（新终端）
cd frontend
npm install
npm run dev
# 前端运行在 http://localhost:3000
```

### 2.2 方式二：Docker Compose

```bash
# 1. 克隆项目
git clone https://github.com/tiammomo/mamoji.git
cd mamoji

# 2. 启动所有服务
docker-compose up -d

# 3. 访问应用
# 前端: http://localhost
# 后端: http://localhost:8080
```

---

## 3. 前端开发

```bash
# 进入前端目录
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
# 访问 http://localhost:3000

# 构建生产版本
npm run build

# 运行测试
npm run test
```

---

## 4. 后端开发

```bash
# 进入后端目录
cd backend

# 使用 IDE 导入 Maven 项目
# 或命令行构建

# 运行开发模式
./mvnw spring-boot:dev

# 构建生产包
./mvnw clean package -DskipTests

# 运行打包后的应用
java -jar target/mamoji-0.0.1-SNAPSHOT.jar
```

---

## 5. MVP 环境配置

### 5.1 开发环境变量

前端 (.env.local):

```bash
NEXT_PUBLIC_API_BASE=http://localhost:8080/api/v1
```

后端 (application.yml 默认配置，使用 SQLite 无需额外配置):

```yaml
spring:
  datasource:
    url: jdbc:sqlite:mamoji.db
  jpa:
    hibernate:
      ddl-auto: update
```

> MVP 阶段：开箱即用，无需配置数据库

---

## 6. 生产部署（V1.0+）

> 以下为生产环境部署，MVP 阶段可先跳过。

### 6.1 Docker 部署

#### 前端镜像构建

```dockerfile
# frontend/Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/out /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### 后端镜像构建

```dockerfile
# backend/Dockerfile
FROM eclipse-temurin:21-jdk-alpine AS builder

WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN apk add --no-cache maven
RUN mvn clean package -DskipTests

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=builder /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

### 6.2 Docker Compose 生产配置

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    container_name: mamoji-mysql
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
      MYSQL_DATABASE: mamoji
      MYSQL_USER: ${DB_USER}
      MYSQL_PASSWORD: ${DB_PASSWORD}
    volumes:
      - mysql_data:/var/lib/mysql
    networks:
      - mamoji-network
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: mamoji-redis
    restart: always
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    networks:
      - mamoji-network

  backend:
    image: mamoji/backend:latest
    container_name: mamoji-backend
    restart: always
    environment:
      - SPRING_PROFILES_ACTIVE=prod
      - SPRING_DATASOURCE_URL=jdbc:mysql://mysql:3306/mamoji
      - SPRING_DATASOURCE_USERNAME=${DB_USER}
      - SPRING_DATASOURCE_PASSWORD=${DB_PASSWORD}
      - SPRING_REDIS_HOST=redis
      - SPRING_REDIS_PASSWORD=${REDIS_PASSWORD}
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      mysql:
        condition: service_healthy
    networks:
      - mamoji-network

  frontend:
    image: mamoji/frontend:latest
    container_name: mamoji-frontend
    restart: always
    ports:
      - "80:80"
    depends_on:
      - backend
    networks:
      - mamoji-network

volumes:
  mysql_data:
  redis_data:

networks:
  mamoji-network:
    driver: bridge
```

### 6.3 部署命令

```bash
# 1. 拉取最新代码
git pull origin master

# 2. 构建镜像
docker-compose -f docker-compose.prod.yml build

# 3. 启动服务
docker-compose -f docker-compose.prod.yml up -d

# 4. 查看日志
docker-compose -f docker-compose.prod.yml logs -f

# 5. 检查服务状态
docker-compose -f docker-compose.prod.yml ps
```

---

## 7. 数据库初始化

### 7.1 初始化数据

```bash
# MVP 阶段：JPA 自动建表，无需手动执行
# 首次启动时自动创建表结构和默认数据

# 手动执行 SQL（如需要）
docker exec -i mamoji-mysql mysql -u${DB_USER} -p${DB_PASSWORD} mamoji < init-data.sql
```

### 7.2 数据库备份与恢复

```bash
# 备份
docker exec mamoji-mysql mysqldump -u${DB_USER} -p${DB_PASSWORD} mamoji > backup_$(date +%Y%m%d).sql

# 恢复
docker exec -i mamoji-mysql mysql -u${DB_USER} -p${DB_PASSWORD} mamoji < backup_20240301.sql
```

---

## 8. CI/CD 部署

### 8.1 GitHub Actions 配置

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}

      - name: Build and push backend
        uses: docker/build-push-action@v5
        with:
          context: ./backend
          push: true
          tags: mamoji/backend:${{ github.sha }}
          cache-from: type=registry,ref=mamoji/backend:latest
          cache-to: type=inline

      - name: Build and push frontend
        uses: docker/build-push-action@v5
        with:
          context: ./frontend
          push: true
          tags: mamoji/frontend:${{ github.sha }}
          cache-from: type=registry,ref=mamoji/frontend:latest
          cache-to: type=inline

      - name: Deploy to server
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd /opt/mamoji
            docker-compose -f docker-compose.prod.yml pull
            docker-compose -f docker-compose.prod.yml up -d
```

---

## 9. 运维监控

### 9.1 健康检查

```bash
# 检查容器健康状态
docker ps

# 检查应用健康端点
curl http://localhost:8080/actuator/health

# 检查前端
curl -I http://localhost
```

### 9.2 日志管理

```bash
# 查看后端日志
docker logs -f mamoji-backend

# 查看最近 100 行日志
docker logs --tail 100 mamoji-backend

# 查看错误日志
docker logs mamoji-backend 2>&1 | grep -i error
```

### 9.3 性能监控

| 监控项 | 工具 | 访问地址 |
|--------|------|----------|
| 后端 Actuator | Spring Boot | /actuator/prometheus |
| 前端性能 | Vercel Analytics | Vercel Dashboard |
| 容器监控 | Docker Stats | 命令行 |

---

## 10. 常见问题

### 10.1 启动失败

```bash
# 1. 检查端口占用
netstat -tulpn | grep 8080

# 2. 检查 Docker 资源
docker stats

# 3. 查看详细日志
docker-compose logs backend
```

### 10.2 数据库连接失败

```bash
# 1. 检查 MySQL 是否运行
docker ps | grep mysql

# 2. 检查网络连接
docker exec -it backend sh
ping mysql

# 3. 检查数据库配置
docker exec mamoji-mysql mysql -u${DB_USER} -p${DB_PASSWORD} -e "SHOW DATABASES;"
```

### 10.3 前端构建失败

```bash
# 1. 清理 node_modules
rm -rf node_modules package-lock.json

# 2. 重新安装
npm install

# 3. 检查 Node 版本
node -v
```

---

## 11. 安全建议

### 11.1 生产环境必须修改的配置

| 配置项 | 说明 | 建议值 |
|--------|------|--------|
| JWT_SECRET | JWT 签名密钥 | 64 位随机字符串 |
| DB_PASSWORD | 数据库密码 | 强密码 |
| REDIS_PASSWORD | Redis 密码 | 强密码 |
| NEXTAUTH_SECRET | NextAuth 密钥 | 32 位随机字符串 |
| SSL 证书 | HTTPS | 使用 Let's Encrypt |

### 11.2 安全检查清单

- [ ] 修改默认密码
- [ ] 启用 HTTPS
- [ ] 配置防火墙规则
- [ ] 开启日志审计
- [ ] 定期备份数据
- [ ] 更新依赖版本
