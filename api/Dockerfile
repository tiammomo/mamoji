# 构建阶段
FROM golang:1.25-alpine AS builder

# 设置工作目录
WORKDIR /app

# 复制依赖文件
COPY go.mod go.sum ./
RUN go mod download

# 复制源代码
COPY . .

# 编译应用
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main ./cmd/server

# 运行阶段
FROM alpine:latest AS runner

# 安装运行时依赖
RUN apk --no-cache add ca-certificates tzdata

# 设置工作目录
WORKDIR /home/mamoji

# 复制编译产物
COPY --from=builder /app/main .
COPY --from=builder /app/config ./config

# 创建非root用户
RUN addgroup -g 1000 mamoji && \
    adduser -u 1000 -G mamoji -s /bin/sh -D mamoji

# 切换用户
USER mamoji

# 暴露端口
EXPOSE 8888

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s \
    CMD wget -q --spider http://localhost:8888/health || exit 1

# 启动应用
ENTRYPOINT ["./main"]
