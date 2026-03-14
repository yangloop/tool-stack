# ToolStack - Agent 配置指南

## 项目概述

这是一个现代化的开发者工具集合网站，使用 React + TypeScript + Vite 构建。

## SEO 配置说明

### 1. 工具SEO配置 (scripts/prerender.cjs)

每个工具在 `toolsConfig` 对象中配置：

```javascript
'tool-id': {
  name: '工具名称',
  description: '工具描述（用于meta description，对话式描述更佳）',
  keywords: '关键词1,关键词2,关键词3,长尾疑问词',
  category: '分类名称',
  faq: [
    { q: '常见问题?', a: '答案内容' }
  ],
  howTo: {
    steps: [
      { name: '步骤1', text: '详细说明' }
    ]
  }
}
```

#### AI SEO 优化配置示例
```javascript
'sql-advisor': {
  name: 'SQL 优化建议',
  description: '智能 SQL 分析与优化工具，帮助检测语法错误、分析索引使用情况、验证数据类型兼容性。支持 MySQL、PostgreSQL、SQLite、MariaDB 等数据库，提供专业的性能优化建议。',
  keywords: 'SQL分析,SQL优化,SQL语法检查,SQL性能优化,SQL索引优化,组合索引检查,MySQL优化,PostgreSQL优化,SQL怎么优化,SQL索引怎么设置',
  category: '格式化',
  faq: [
    { q: 'SQL 优化工具能做什么？', a: '可以检测 SQL/DDL 语法错误、验证表名和字段匹配、检查数据类型兼容性、分析索引使用情况。' },
    { q: '如何优化 SQL 查询性能？', a: '工具会分析你的 SQL 语句，检查是否使用了合适的索引、是否存在全表扫描。' },
    { q: '什么是组合索引最左前缀原则？', a: '组合索引的最左前缀原则指查询条件必须从索引的最左边列开始匹配才能使用索引。' }
  ],
  howTo: {
    steps: [
      { name: '输入 SQL 和 DDL', text: '在上方输入 SQL 查询语句，在下方输入对应的表结构 DDL' },
      { name: '选择数据库类型', text: '选择你使用的数据库类型以获得准确的分析结果' },
      { name: '查看优化建议', text: '系统会生成详细的分析报告，包括语法检查、索引建议、性能优化提示' }
    ]
  }
}
```

### 2. 首页SEO配置 (scripts/prerender.cjs)

首页SEO在构建后通过脚本注入：
- **标题**: ToolStack - 开发者在线工具箱 | JSON格式化 SQL优化 Base64编解码等25+工具
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

1. **描述**: 控制在150-160字符，采用对话式描述（如"免费在线 XXX 工具，可快速..."）
2. **关键词**: 包含工具名称、功能、相关技术栈、长尾疑问词（如"XXX怎么用"）
3. **标题格式**: `工具名称 - 分类 | ToolStack`
4. **结构化数据**: 每个工具页面包含 JSON-LD 格式的 Schema.org 标记，包括：
   - WebPage / SoftwareApplication（基础）
   - HowTo（使用步骤）
   - FAQPage（常见问题）
   - Organization（作者信息）

### AI SEO (AIO/GEO/AEO) 优化

为适配 AI 搜索引擎（ChatGPT、Perplexity、Claude 等），做了以下优化：

1. **FAQ 结构化内容**: 每个工具配置 3-4 个常见问题，以 FAQPage Schema 形式输出
2. **HowTo 步骤**: 提供清晰的使用步骤，便于 AI 提取操作指南
3. **对话式关键词**: 增加长尾疑问词（如"SQL怎么优化"、"JSON怎么格式化"）
4. **robots.txt AI 规则**: 允许 GPTBot、Claude-Web、PerplexityBot 等 AI 爬虫抓取
5. **语义化描述**: 描述采用自然语言，回答"这个工具是什么、能做什么、如何使用"
6. **@graph 格式**: 使用 Schema.org 的 @graph 格式输出多个结构化数据类型

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

---

## CodeEditor 组件

### 概述

`CodeEditor` 是一个基于 CodeMirror 6 的代码编辑器组件，适配项目整体 UI 风格，支持暗黑和浅色模式。

### 文件位置

- 组件源码: `src/components/CodeEditor.tsx`
- 主题配置: `src/styles/codemirror-theme.ts`
- 全局样式: `src/style.css` (搜索 `CodeEditor 组件全局样式`)

### 使用方法

```tsx
import { CodeEditor } from '../components/CodeEditor';

// 基础用法
<CodeEditor
  value={input}
  onChange={setInput}
  language="json"
  placeholder="在此粘贴 JSON 数据..."
  height="400px"
/>

// 嵌入卡片中使用（推荐）
<CodeEditor
  value={input}
  onChange={setInput}
  language="sql"
  placeholder="在此粘贴 SQL 语句..."
  height="400px"
  variant="embedded"  // 与卡片融合，无边框
/>

// 完整配置
<CodeEditor
  value={input}
  onChange={setInput}
  language="json"           // 支持: sql, json, xml, html, yaml, shell, text
  placeholder="提示文本"
  height="400px"           // 或数字: 400
  variant="embedded"       // default | embedded | minimal
  showLineNumbers={false}  // 是否显示行号
  readOnly={false}
  fontSize="13px"
  padding={12}            // 内边距（像素）
  className="custom-class"
  wrapperClassName="wrapper-class"
/>
```

### 变体说明

| 变体 | 说明 | 使用场景 |
|------|------|----------|
| `default` | 独立使用，带边框和阴影，hover 时有阴影增强 | 独立编辑器区域 |
| `embedded` | 无边框和阴影，与父容器融合 | 嵌入在 `.card` 中使用 |
| `minimal` | 极简风格，仅圆角 | 紧凑布局 |

### 主题系统

组件自动监听 `document.documentElement` 的 `dark` 类，动态切换主题：

- **浅色模式**: 使用 `surface-50` 背景，`surface-800` 文字
- **深色模式**: 使用 `surface-900` 背景，`surface-200` 文字

### 全局样式覆盖

如需修改编辑器样式，在 `src/style.css` 中添加：

```css
/* 选中文本颜色 */
.code-editor-content .cm-selectionBackground {
  background-color: #bae6fd !important;
}

/* 当前行高亮 */
.code-editor-content .cm-activeLine {
  background-color: #f1f5f9 !important;
}

/* 光标颜色 */
.code-editor-content .cm-cursor {
  border-left-color: #0ea5e9;
}
```

### 注意事项

1. 在 `.card` 中使用推荐 `variant="embedded"` 以保持视觉一致性
2. 所有工具调用 CodeEditor 时，样式会自动应用全局样式配置
3. 字体使用项目统一字体 `'JetBrains Mono', 'Fira Code', monospace`
4. 移动端自动优化字体大小防止 iOS 缩放
