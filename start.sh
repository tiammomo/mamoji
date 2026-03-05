#!/bin/bash
# Mamoji Docker 启动脚本
# 用法:
#   ./start-dev.sh      # 开发环境
#   ./start-prod.sh     # 生产环境

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}Mamoji Docker 启动脚本${NC}"

# 检查 Docker 是否安装
if ! command -v docker &> /dev/null; then
    echo -e "${RED}错误: Docker 未安装${NC}"
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${RED}错误: Docker Compose 未安装${NC}"
    exit 1
fi

# 检查 .env 文件
if [ ! -f .env ]; then
    echo -e "${YELLOW}警告: .env 文件不存在，复制 .env.example${NC}"
    if [ -f .env.example ]; then
        cp .env.example .env
        echo -e "${GREEN}已创建 .env 文件，请根据需要修改配置${NC}"
    fi
fi

# 根据参数选择环境
MODE=${1:-dev}

if [ "$MODE" = "prod" ] || [ "$MODE" = "production" ]; then
    echo -e "${YELLOW}启动生产环境...${NC}"
    COMPOSE_FILE="docker-compose.prod.yml"

    # 生产环境强制要求配置
    if [ -z "$JWT_SECRET" ]; then
        echo -e "${RED}错误: 生产环境必须配置 JWT_SECRET${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}启动开发环境...${NC}"
    COMPOSE_FILE="docker-compose.yml"
fi

# 构建并启动
echo -e "${GREEN}构建 Docker 镜像...${NC}"
docker-compose -f $COMPOSE_FILE build

echo -e "${GREEN}启动服务...${NC}"
docker-compose -f $COMPOSE_FILE up -d

# 等待服务健康
echo -e "${YELLOW}等待服务启动...${NC}"
sleep 10

# 显示状态
echo -e "${GREEN}Mamoji 服务已启动:${NC}"
docker-compose -f $COMPOSE_FILE ps

echo ""
echo -e "${GREEN}访问地址:${NC}"
echo "  - 前端: http://localhost:33000"
echo "  - 后端: http://localhost:38080"
echo ""
echo -e "${YELLOW}查看日志: docker-compose -f $COMPOSE_FILE logs -f${NC}"
echo -e "${YELLOW}停止服务: docker-compose -f $COMPOSE_FILE down${NC}"
