# ToolStack 纯静态部署指南

## 构建

```bash
npm install
npm run build
```

构建完成后，发布目录为 `dist/`。

## 部署方式一：静态托管/CDN

将 `dist/` 目录全部上传到你的静态站点根目录即可。

关键要求：

- 保留 `dist/assets/` 目录结构与文件名（含 hash）
- 首页与工具页均可访问（如 `/`、`/tool/sql`）
- 对不存在的静态文件返回 404，不要错误回退成 HTML

## 部署方式二：Nginx（推荐）

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/tool-stack/dist;
    index index.html;

    # 静态资源缓存
    location /assets/ {
        try_files $uri =404;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # 其他静态文件
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|map)$ {
        try_files $uri =404;
        expires 30d;
        add_header Cache-Control "public";
    }

    # SPA 路由回退
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

## 发布检查清单

```bash
# 1) 核对构建产物
ls dist/assets/js | head

# 2) 检查工具页入口脚本路径
grep -n "/assets/js/index-" dist/tool/sql.html

# 3) 检查站点地图
test -f dist/sitemap.xml && echo "sitemap ok"
```
