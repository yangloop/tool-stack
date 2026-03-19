#!/bin/bash

# ToolStack SSR 部署脚本

set -e

echo "🚀 开始部署 ToolStack..."

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查 Node.js 版本
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js 未安装${NC}"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}❌ Node.js 版本过低，需要 18+，当前版本: $(node -v)${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Node.js 版本: $(node -v)${NC}"

# 安装依赖
echo "📦 安装依赖..."
npm ci

# 构建项目
echo "🔨 构建项目..."
npm run build

# 创建日志目录
mkdir -p logs

# 检查 PM2 是否安装
if command -v pm2 &> /dev/null; then
    echo "🔄 使用 PM2 启动..."
    pm2 reload ecosystem.config.js --env production || pm2 start ecosystem.config.js --env production
    pm2 save
    echo -e "${GREEN}✓ 部署完成！${NC}"
    echo ""
    echo "查看状态: pm2 status"
    echo "查看日志: pm2 logs tool-stack"
else
    echo -e "${YELLOW}⚠️ PM2 未安装，使用 npm start 启动...${NC}"
    echo "建议安装 PM2: npm install -g pm2"
    echo ""
    nohup npm start > logs/server.log 2>&1 &
    echo -e "${GREEN}✓ 服务已启动在后台${NC}"
    echo "查看日志: tail -f logs/server.log"
fi

echo ""
echo "🌐 访问地址: http://localhost:3000"
