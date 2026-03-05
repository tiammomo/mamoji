# Mamoji Frontend Dockerfile
# 构建: docker build -t mamoji/frontend:latest ./frontend
# 运行: docker run -d -p 33000:80 --network mamoji-network mamoji/frontend:latest

# 阶段一：构建
FROM node:20-alpine AS builder

WORKDIR /app

# 复制依赖文件
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production

# 复制源码
COPY . .

# 构建生产版本
RUN npm run build

# 阶段二：运行
FROM nginx:alpine

# 复制构建产物
COPY --from=builder /app/out /usr/share/nginx/html

# 复制 nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 暴露端口
EXPOSE 80

# 启动 nginx
CMD ["nginx", "-g", "daemon off;"]
