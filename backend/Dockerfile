# Mamoji Backend Dockerfile
# 构建: docker build -t mamoji/backend:latest ./backend
# 运行: docker run -d -p 38080:38080 --network mamoji-network mamoji/backend:latest

# 阶段一：构建
FROM eclipse-temurin:21-jdk-alpine AS builder

WORKDIR /app

# 安装 Maven
RUN apk add --no-cache maven

# 复制 pom.xml 和源码
COPY pom.xml .
COPY src ./src

# 构建（跳过测试）
RUN mvn clean package -DskipTests -q

# 阶段二：运行
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# 创建非 root 用户（安全）
RUN addgroup -S mamoji && adduser -S mamoji -G mamoji

# 复制构建产物
COPY --from=builder /app/target/*.jar app.jar

# 设置权限
RUN chown -R mamoji:mamoji /app

# 切换到非 root 用户
USER mamoji

# 暴露端口
EXPOSE 38080

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:38080/actuator/health || exit 1

# 启动应用
ENTRYPOINT ["java", "-jar", "app.jar"]
