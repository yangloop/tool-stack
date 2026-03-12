# ToolStack - Agent 配置指南

## 项目概述

这是一个现代化的开发者工具集合网站，使用 React + TypeScript + Vite 构建。

## SEO 配置说明

### 1. 工具SEO配置 (scripts/prerender.cjs)

每个工具在 `toolsConfig` 对象中配置：

```javascript
'tool-id': {
  name: '工具名称',
  description: '工具描述（用于meta description）',
  keywords: '关键词1,关键词2,关键词3',
  category: '分类名称'
}
```

#### SQL分析优化工具 SEO 配置
```javascript
'sql-advisor': {
  name: 'SQL分析优化工具',
  description: '智能SQL分析优化工具：检测SQL/DDL语法错误、验证表名字段匹配、检查数据类型兼容性、分析索引使用情况（支持组合索引最左前缀原则）、提供SQL性能优化建议。支持MySQL、PostgreSQL、SQLite、MariaDB等多种数据库。',
  keywords: 'SQL分析,SQL优化,SQL语法检查,SQL性能优化,SQL索引优化,组合索引检查,数据类型检查,表名验证,字段验证,MySQL优化,PostgreSQL优化,SQL查询优化,SQL调优工具,DDL检查,索引最左前缀',
  category: '格式化工具'
}
```

### 2. 首页SEO配置 (scripts/prerender.cjs)

首页SEO在构建后通过脚本注入：
- **标题**: ToolStack - 开发者工具箱
- **描述**: 包含25+实用工具的概述，特别强调SQL格式化与智能优化分析功能
- **关键词**: 包含SQL相关关键词（SQL格式化, SQL分析, SQL优化, SQL语法检查, 索引优化等）

### 3. HTML模板SEO (index.html)

HTML模板中包含SEO占位符，构建时被替换：
- `<!-- TITLE_PLACEHOLDER -->` - 标题占位符
- `<!-- DESC_PLACEHOLDER -->` - 描述占位符
- `<!-- KEYWORDS_PLACEHOLDER -->` - 关键词占位符
- `<!-- JSONLD_PLACEHOLDER -->` - 结构化数据占位符

### 4. 生成的SEO文件

构建后生成以下SEO相关文件：
- `dist/index.html` - 首页（含SEO元数据）
- `dist/tool/{tool-id}.html` - 各工具页面
- `dist/tool/{tool-id}/index.html` - 工具页面（目录索引）
- `dist/sitemap.xml` - 站点地图
- `dist/robots.txt` - 爬虫规则

## 开发规范

### 添加新工具的SEO步骤

1. 在 `scripts/prerender.cjs` 的 `toolsConfig` 中添加工具配置
2. 确保包含详细的 `description` 和 `keywords`
3. 重新构建项目生成SEO页面

### SEO最佳实践

1. **描述**: 控制在150-160字符，包含核心功能关键词
2. **关键词**: 包含工具名称、功能、相关技术栈
3. **标题格式**: `工具名称 - 分类 | ToolStack`
4. **结构化数据**: 每个工具页面都包含 JSON-LD 格式的 Schema.org 标记

## 技术栈

- **前端框架**: React 19
- **构建工具**: Vite 7
- **SEO生成**: 自定义 Node.js 脚本 (prerender.cjs)
- **结构化数据**: Schema.org JSON-LD

## 构建命令

```bash
npm run build
```

构建后会自动执行 `scripts/prerender.cjs` 生成所有SEO页面。
