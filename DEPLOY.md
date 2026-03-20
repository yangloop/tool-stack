# ToolStack SSR 部署指南

## 方式一：Docker 部署（推荐）

### 1. 构建镜像

```bash
# 构建生产镜像
docker build -t tool-stack:ssr .

# 运行容器
docker run -d \
  --name tool-stack \
  -p 3000:3000 \
  --restart unless-stopped \
  tool-stack:ssr
```

### 2. 使用 Docker Compose

```bash
# 启动服务
docker compose up -d --build

# 查看日志
docker compose logs -f

# 停止服务
docker compose down
```

## 方式二：手动部署

### 环境要求

- Node.js 18+
- npm 或 yarn
- Git

### 部署步骤

```bash
# 1. 克隆代码
git clone <your-repo-url> tool-stack
cd tool-stack

# 2. 安装依赖
npm install

# 3. 构建项目
npm run build

# 4. 启动服务
npm start
```

### 使用 PM2 管理进程

```bash
# 安装 PM2
npm install -g pm2

# 启动应用
pm2 start ecosystem.config.js

# 查看状态
pm2 status

# 查看日志
pm2 logs tool-stack

# 重启
pm2 restart tool-stack

# 开机自启
pm2 startup
pm2 save
```

## 方式三：Vercel 部署（静态生成）

如果想部署为静态站点（无 SSR）：

```bash
# 1. 安装 Vercel CLI
npm i -g vercel

# 2. 部署
vercel --prod
```

注意：Vercel 部署需要修改 `vercel.json` 配置。

## 方式四：Nginx 反向代理

### Nginx 配置示例

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    # 重定向到 HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    # SSL 证书
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # 反向代理到 Node.js 应用
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://localhost:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

## 环境变量

创建 `.env` 文件：

```bash
# 端口
PORT=3000

# 环境
NODE_ENV=production

# 可选：自定义域名
DOMAIN=https://your-domain.com
```

`docker compose` 会自动读取项目根目录下的 `.env`，并将宿主机端口映射为 `${PORT}:3000`。

## 健康检查

应用内置健康检查端点：

```bash
curl http://localhost:3000/health
```

## 日志管理

### 查看日志

```bash
# Docker
docker logs -f tool-stack

# PM2
pm2 logs tool-stack

# 手动部署（systemd）
journalctl -u tool-stack -f
```

## 更新部署

```bash
# 拉取最新代码
git pull

# 重新构建
npm run build

# 重启服务
pm2 restart tool-stack
# 或
docker compose up -d --build
```

## 故障排查

### 1. 端口被占用

```bash
# 查看端口占用
lsof -i :3000

# 杀死进程
kill -9 <PID>
```

### 2. 内存不足

```bash
# 查看内存使用
free -h

# 增加 Node 内存限制
NODE_OPTIONS="--max-old-space-size=2048" npm start
```

### 3. 权限问题

```bash
# 确保目录权限正确
chmod -R 755 /path/to/tool-stack
chown -R www-data:www-data /path/to/tool-stack
```

## 性能优化

### 启用 Gzip

Nginx 配置中添加：

```nginx
gzip on;
gzip_vary on;
gzip_proxied any;
gzip_comp_level 6;
gzip_types text/plain text/css text/xml application/json application/javascript application/rss+xml application/atom+xml image/svg+xml;
```

### CDN 加速

将静态资源上传到 CDN，修改 `vite.config.ts` 中的 `base` 配置。

## 监控

推荐使用以下工具监控应用：

- **PM2**: 进程监控
- **Uptime Kuma**: 服务可用性监控
- **Prometheus + Grafana**: 指标监控
