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

### 添加新工具的完整步骤

1. **创建工具组件** - 在 `src/features/tools/components/` 创建工具组件
2. **注册工具** - 在 `src/data/tools.tsx` 中注册工具（使用 React.lazy 动态导入）
3. **配置SEO** - 在 `scripts/prerender.cjs` 的 `toolsConfig` 中添加工具配置
4. **重新构建** - 运行 `npm run build` 生成SEO页面

工具组件示例：
```tsx
// src/features/tools/components/MyTool.tsx
import { ToolPageContainer } from '../../components/common';

export function MyTool() {
  return (
    <ToolPageContainer toolId="my-tool" title="我的工具" description="描述">
      {/* 工具内容 */}
    </ToolPageContainer>
  );
}
```

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

## 项目结构

```
src/
├── pages/              # 页面级组件
│   └── Home.tsx
├── features/           # 功能模块（按领域组织）
│   └── tools/          # 工具功能模块
│       ├── components/ # 工具组件（29个工具）
│       ├── hooks/      # 工具相关 Hooks（如 useSqlAdvisor）
│       └── workers/    # Web Workers
├── components/         # 通用 UI 组件
│   ├── common/         # 通用组件库
│   ├── ads/            # 广告组件
│   ├── CodeEditor.tsx  # 代码编辑器
│   └── Layout.tsx      # 布局组件
├── data/               # 数据配置
├── hooks/              # 通用 Hooks
├── styles/             # 样式配置
├── types/              # TypeScript 类型
└── utils/              # 工具函数
```

### 目录组织原则

- **`pages/`** - 路由级页面组件
- **`features/`** - 按功能领域组织的模块，包含该领域的组件、Hooks、Workers
- **`components/`** - 跨功能复用的通用 UI 组件
- **`hooks/`** - 与具体功能无关的通用 Hooks

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

---

## 公共组件库 (src/components/common)

### 概述

公共组件库提供了一套统一的 UI 组件，用于快速构建工具页面，减少重复代码。

### 导入方式

```tsx
import { 
  ToolPageContainer, 
  ToolHeader, 
  ConvertToolLayout,
  InputPanel,
  OutputPanel,
  InputOutputLayout,
  Button, 
  CopyButton 
} from '../components/common';
```

### ToolPageContainer - 工具页面容器

统一处理页面布局、标题、工具信息和广告位。

```tsx
<ToolPageContainer
  toolId="base64"           // 工具ID，用于自动显示 ToolInfo
  title="Base64 编解码"      // 页面标题
  description="编码和解码"    // 页面描述
  icon={IconComponent}      // 图标组件
  iconColorClass="text-primary-500"  // 图标颜色类名（可选）
  maxWidth="lg"             // 最大宽度: sm | md | lg | xl | full
  showAds={true}            // 是否显示广告
  showToolInfo={true}       // 是否显示工具信息
  compactHeader={false}     // 是否使用紧凑标题样式
  headerActions={<button>}  // 标题右侧操作区域
>
  <YourToolContent />
</ToolPageContainer>
```

### ToolHeader - 工具标题

统一的标题组件，支持标准样式和紧凑样式。

```tsx
// 标准样式
<ToolHeader
  icon={FileJson}
  title="JSON 工具"
  description="格式化、压缩、验证"
  iconColorClass="text-blue-500"
/>

// 紧凑样式（工具栏样式）
<ToolHeader
  icon={Key}
  title="JWT 解码"
  description="解析 JWT 令牌"
  compact
  actions={<button>加载示例</button>}
/>
```

### ConvertToolLayout - 编解码工具布局

适用于 Base64、URL、HTML 实体等编解码工具的统一布局。

```tsx
<ConvertToolLayout
  input={input}
  onInputChange={setInput}
  output={output}
  mode={mode}                    // 'encode' | 'decode'
  onModeChange={setMode}
  onSwap={handleSwap}            // 交换输入输出
  inputLabel="原文"
  outputLabel="Base64"
  language="text"                // CodeEditor 语言
  inputPlaceholder="输入..."
  error="转换失败"               // 错误时显示的输出
/>
```

### InputPanel / OutputPanel - 输入输出面板

用于构建自定义的双栏布局。

```tsx
<InputOutputLayout
  input={
    <InputPanel
      value={input}
      onChange={setInput}
      title="输入 SQL"
      language="sql"
      stats={input.length > 0 && <span>{input.length} 字符</span>}
    />
  }
  output={
    <OutputPanel
      value={output}
      title="输出"
      copyable={!!output}
      onCopy={handleCopy}
      headerActions={<ButtonGroup>...</ButtonGroup>}
    >
      {/* 自定义内容覆盖默认编辑器 */}
      <SyntaxHighlighter>{output}</SyntaxHighlighter>
    </OutputPanel>
  }
/>
```

### Button 组件

```tsx
// 基础按钮
<Button variant="primary" size="md">提交</Button>

// 复制按钮
<CopyButton 
  text="要复制的文本" 
  variant="ghost" 
  size="sm"
  onCopy={() => console.log('已复制')}
/>

// 图标按钮
<IconButton 
  icon={<Trash2 className="w-4 h-4" />} 
  label="删除"
  variant="danger"
/>
```

**Button 变体**: `primary` | `secondary` | `success` | `warning` | `danger` | `info` | `ghost` | `ghost-success` | `ghost-danger`

**Button 尺寸**: `xs` | `sm` | `md` | `lg` | `xl`

---

## Hooks (src/hooks)

### useTheme - 主题管理

```tsx
import { useTheme, useThemeColor } from '../hooks';

// 获取当前主题状态
const { isDark, isReady } = useTheme();

// 根据主题获取不同颜色
const bgColor = useThemeColor('#ffffff', '#0f172a');

// 切换主题
const { isDark, toggleTheme, setTheme } = useThemeToggle();
```

### useClipboard - 剪贴板

```tsx
import { useClipboard } from '../hooks';

const { copied, copy } = useClipboard(2000); // 2秒后重置状态

const handleCopy = async () => {
  await copy('要复制的文本');
};
```

### useLocalStorage - 本地存储

```tsx
import { useLocalStorage } from '../hooks';

const [value, setValue] = useLocalStorage('key', defaultValue);
```

---

## 主题系统

### 颜色规范

项目使用统一的颜色系统，所有组件应遵循以下规范：

| 用途 | 浅色模式 | 深色模式 |
|------|----------|----------|
| 背景 | `surface-0` / `surface-50` | `surface-900` / `surface-800` |
| 文字 | `surface-900` / `surface-700` | `surface-100` / `surface-300` |
| 边框 | `surface-200` | `surface-700` |
| 主色 | `primary-500` | `primary-400` |
| 提示文字 | `surface-400` / `surface-500` | `surface-400` / `surface-500` |

### 使用示例

```tsx
// 卡片背景
<div className="bg-surface-0 dark:bg-surface-800">

// 文字颜色
<p className="text-surface-900 dark:text-surface-100">
<span className="text-surface-500">

// 边框
<div className="border border-surface-200 dark:border-surface-700">

// 按钮/交互元素
<button className="text-primary-500 hover:text-primary-600">
```

### 避免使用的颜色类

❌ **不要** 混用以下颜色类（已逐步替换）：
- `gray-*` - 使用 `surface-*` 替代
- `slate-*` - 使用 `surface-*` 替代
- `blue-*` - 使用 `primary-*` 替代
