# SEO 与多域名部署指南

## 概述

本项目支持灵活的 SEO 配置和多域名部署。通过环境变量和部署脚本，可以轻松适配不同的部署环境。

## 配置文件

### 1. 环境变量 (.env)

创建 `.env` 文件（复制 `.env.example`）:

```env
# 网站域名配置（不带尾部斜杠）
SITE_URL=https://your-domain.com

# 网站名称
SITE_NAME=ToolStack

# 默认语言
SITE_LANG=zh-CN

# SEO 默认描述
SITE_DESCRIPTION=ToolStack 是一个免费的在线 IT 工具集合
```

### 2. 站点配置 (src/config/site.ts)

所有 SEO 相关的配置都集中在 `src/config/site.ts`:

- `siteConfig`: 站点基本信息
- `toolSeoConfig`: 各工具的 SEO 配置
- `getFullUrl()`: 生成完整 URL
- `getToolSeo()`: 获取工具 SEO 配置

## 部署方式

### 方式 1: 构建时指定域名（推荐）

在构建时通过环境变量指定域名：

```bash
# Linux/Mac
SITE_URL=https://your-domain.com npm run build

# Windows PowerShell
$env:SITE_URL="https://your-domain.com"; npm run build

# Windows CMD
set SITE_URL=https://your-domain.com && npm run build
```

这将生成带有绝对 URL 的静态文件。

### 方式 2: 构建后更新域名

先构建，然后更新域名：

```bash
# 1. 构建（使用相对路径）
npm run build

# 2. 更新域名
SITE_URL=https://your-domain.com npm run update-domain
```

### 方式 3: 使用 .env 文件

```bash
# 1. 创建 .env 文件
cp .env.example .env

# 2. 编辑 .env，设置 SITE_URL

# 3. 构建
npm run build
```

## SEO 标签说明

### 支持的 Meta 标签

| 标签 | 用途 | 是否支持相对路径 |
|------|------|-----------------|
| `<title>` | 页面标题 | - |
| `<meta name="description">` | 页面描述 | ✅ |
| `<meta name="keywords">` | 关键词 | ✅ |
| `<link rel="canonical">` | 规范 URL | ✅ |
| `<meta property="og:url">` | Open Graph URL | ✅ |
| `<meta property="og:image">` | 社交分享图片 | ✅ |
| `<meta property="twitter:image">` | Twitter 卡片图片 | ✅ |
| Sitemap `<loc>` | 站点地图 URL | ❌ 必须绝对 |

### 动态 SEO 组件

`SEO` 组件会根据当前页面动态更新：

```tsx
import { SEO } from './components/SEO';

function ToolPage() {
  return (
    <>
      <SEO 
        title="JSON 格式化工具"
        description="免费的在线 JSON 格式化工具..."
        pathname="/tool/json"
      />
      <ToolComponent />
    </>
  );
}
```

## 多域名部署最佳实践

### 场景 1: 同一应用部署到多个域名

例如：同时部署到 `tool1.com` 和 `tool2.com`:

```bash
# 构建（不使用域名）
npm run build

# 部署到 tool1.com
SITE_URL=https://tool1.com npm run update-domain
# 上传 dist 到 tool1.com

# 重新构建或使用 git 恢复
npm run build

# 部署到 tool2.com
SITE_URL=https://tool2.com npm run update-domain
# 上传 dist 到 tool2.com
```

### 场景 2: CDN 边缘节点部署

如果使用 CloudFlare、阿里云 CDN 等：

1. 构建时使用相对路径
2. 在 CDN 边缘函数中动态注入 canonical URL
3. 或使用服务端渲染（SSR）

### 场景 3: 开发/测试/生产环境

```bash
# 开发环境
npm run dev

# 测试环境构建
SITE_URL=https://staging.example.com npm run build

# 生产环境构建
SITE_URL=https://www.example.com npm run build
```

## 脚本说明

### generate-static.js

生成工具页面的静态 HTML 文件，用于 SEO：

- 读取 `dist/index.html` 作为模板
- 为每个工具生成独立的 HTML 文件
- 支持通过 `SITE_URL` 环境变量指定域名

### update-domain.js

部署后更新域名的脚本：

- 更新 `sitemap.xml` 中的 URL
- 更新 `robots.txt` 中的 Sitemap 地址
- 更新所有工具页面的 canonical 和 OG 标签

## 验证 SEO

构建后可以使用以下工具验证 SEO：

1. **Google Rich Results Test**: https://search.google.com/test/rich-results
2. **Facebook Sharing Debugger**: https://developers.facebook.com/tools/debug/
3. **Twitter Card Validator**: https://cards-dev.twitter.com/validator

## 常见问题

### Q: 为什么 Sitemap 必须使用绝对 URL？

A: 根据 [Sitemap 协议规范](https://www.sitemaps.org/protocol.html)，`<loc>` 标签必须包含完整的 URL（包括协议和域名）。

### Q: 使用相对路径会影响 SEO 吗？

A: Canonical 和 OG 标签使用相对路径通常不会影响 SEO，搜索引擎会将其解析为绝对 URL。但建议生产环境使用绝对 URL 以确保最佳兼容性。

### Q: 如何防止重复内容问题？

A: 使用 Canonical 标签指定首选 URL。本项目已通过 `update-domain.js` 自动注入正确的 canonical URL。

### Q: 部署到子目录（如 /tools）怎么办？

A: 修改 `vite.config.ts` 中的 `base` 配置，并在 `.env` 中设置完整的 URL：

```env
SITE_URL=https://example.com/tools
```

## 技术细节

### 客户端动态 SEO

当用户访问工具页面时，React 会动态更新：

1. `document.title`
2. Meta 标签（description, keywords, og:*, twitter:*）
3. Canonical URL
4. JSON-LD 结构化数据

### 服务端渲染（SSR）

本项目目前使用静态生成（SSG）。如需 SSR，可以考虑：

- Vite SSR: https://vitejs.dev/guide/ssr.html
- Next.js 迁移
- 使用 Cloudflare Workers 进行边缘渲染

## 相关文件

- `src/config/site.ts` - 站点配置
- `src/components/SEO.tsx` - SEO 组件
- `scripts/generate-static.js` - 静态页面生成
- `scripts/update-domain.js` - 域名更新
- `.env.example` - 环境变量示例
