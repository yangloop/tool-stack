# ToolStack - 开发者在线工具箱

一个现代化的开发者工具集合网站，专为开发者和系统管理员设计。包含 28+ 实用工具，涵盖 JSON/SQL 格式化与优化、编解码、加密安全、开发调试等多个领域，界面简洁美观，支持深色模式。

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/react-19-61DAFB.svg)
![TypeScript](https://img.shields.io/badge/typescript-5.9-3178C6.svg)
![Vite](https://img.shields.io/badge/vite-7-646CFF.svg)

## ✨ 特性

- 🎨 **现代化 UI** - 采用玻璃态设计风格，支持浅色/深色模式
- ⚡ **高性能** - 基于 React 19 + Vite 7，加载速度快
- 📱 **响应式设计** - 完美适配桌面和移动设备
- 🛠️ **丰富工具** - 28+ 款常用开发工具
- 💾 **本地优先** - 数据存储在本地，保护隐私
- 🔌 **Web Worker** - RSA 密钥生成等耗时任务使用后台线程
- 🎯 **专业组件** - 使用业界标准第三方库实现核心功能
- 📝 **统一代码编辑器** - 基于 CodeMirror 6 的 CodeEditor 组件，支持 SQL/JSON/XML/HTML/YAML/JS/TS/CSS/Shell/Text 多语言语法高亮

## 🚀 在线演示

[https://toolstack.juvvv.com](https://toolstack.juvvv.com)

## 🛠️ 工具列表

### 格式化工具
| 工具 | 描述 | 技术亮点 |
|------|------|----------|
| JSON 工具 | 格式化、压缩、验证 JSON，支持树形查看 | [@uiw/react-json-view](https://github.com/uiwjs/react-json-view) |
| SQL 格式化 | SQL 语句美化、压缩和语法高亮 | [sql-formatter](https://github.com/sql-formatter-org/sql-formatter) + [react-syntax-highlighter](https://github.com/react-syntax-highlighter/react-syntax-highlighter) |
| SQL 分析优化 | 智能 SQL 分析：语法检查、表名字段验证、数据类型检查、索引优化建议（支持组合索引最左前缀）、性能优化 | [node-sql-parser](https://github.com/taozhi8833998/node-sql-parser) |
| XML/JSON 互转 | XML 与 JSON 格式互相转换，支持属性、格式化和高亮显示 | [fast-xml-parser](https://github.com/NaturalIntelligence/fast-xml-parser) |
| 文本对比 | 比较两段文本的差异，字符级高亮显示增删改 | [diff](https://github.com/kpdecker/jsdiff) |

### 编解码工具
| 工具 | 描述 |
|------|------|
| Base64 编解码 | 文本 Base64 编码/解码 |
| Base64 文件转换 | 文件与 Base64 相互转换，支持预览 |
| URL 编解码 | URL 编码和解码 |
| URL 解析器 | 解析 URL 结构，提取协议、主机、路径、查询参数等 |
| HTML 实体 | HTML 实体编码和解码 |
| JWT 解码 | JWT 令牌解析和验证 |
| 进制转换 | 二进制、八进制、十进制、十六进制互转 |

### 加密与安全
| 工具 | 描述 | 技术亮点 |
|------|------|----------|
| RSA 密钥生成 | 生成 RSA 公钥私钥对，支持加解密测试（Web Worker） | [jsencrypt](https://github.com/travist/jsencrypt) |
| 哈希计算 | MD5、SHA-1、SHA-256、SHA-512 计算 |
| OTP 生成器 | TOTP 双因素认证码，兼容 Google Authenticator | [otpauth](https://github.com/hectorm/otpauth) |
| 密码生成器 | 生成安全随机密码 |

### 开发工具
| 工具 | 描述 |
|------|------|
| 时间戳转换 | Unix 时间戳与日期互转 |
| UUID 生成 | 生成 UUID/GUID |
| 正则测试 | 正则表达式在线测试 |
| UA 分析器 | 解析 User Agent 获取设备信息 |
| Crontab 生成器 | 可视化生成和解析定时任务 Cron 表达式 |
| HTTP 请求 | 在线 API 测试工具，支持 cURL 导入和代码生成 |
| WebSocket 测试 | WebSocket 客户端，支持心跳检测 |
| 文本模板替换 | 批量生成文本，支持变量和数据表格 |
| Docker 转换器 | docker run 与 docker-compose 互转 |
| Chmod 计算器 | Linux 文件权限计算，数字权限与符号权限互转 |

### 实用工具
| 工具 | 描述 | 技术亮点 |
|------|------|----------|
| 二维码生成 | 生成自定义二维码，支持颜色定制 | [react-colorful](https://github.com/omgovich/react-colorful) |
| 颜色转换 | HEX、RGB、HSL 颜色转换，支持颜色选择器 | [react-colorful](https://github.com/omgovich/react-colorful) |

## 📦 技术栈

- **前端框架**: React 19
- **开发语言**: TypeScript 5.9
- **构建工具**: Vite 7
- **样式**: Tailwind CSS 3 + 自定义设计系统
- **路由**: React Router 7
- **图标**: Lucide React
- **代码编辑器**: CodeMirror 6

### 核心第三方库

| 库 | 用途 | 版本 |
|---|------|------|
| [@uiw/react-codemirror](https://github.com/uiwjs/react-codemirror) | CodeMirror 6 React 封装 | ^4.x |
| [@codemirror/lang-sql](https://github.com/codemirror/lang-sql) | SQL 语法支持 | ^6.x |
| [@codemirror/lang-json](https://github.com/codemirror/lang-json) | JSON 语法支持 | ^6.x |
| [@codemirror/lang-xml](https://github.com/codemirror/lang-xml) | XML 语法支持 | ^6.x |
| [@codemirror/lang-yaml](https://github.com/codemirror/lang-yaml) | YAML 语法支持 | ^6.x |
| [react-colorful](https://github.com/omgovich/react-colorful) | 现代化颜色选择器组件 | ^5.x |
| [@uiw/react-json-view](https://github.com/uiwjs/react-json-view) | JSON 格式化查看器 | ^2.x |
| [sql-formatter](https://github.com/sql-formatter-org/sql-formatter) | SQL 语句格式化 | ^15.x |
| [react-syntax-highlighter](https://github.com/react-syntax-highlighter/react-syntax-highlighter) | 语法高亮（Prism） | ^15.x |
| [jsencrypt](https://github.com/travist/jsencrypt) | RSA 加密解密 | ^3.x |
| [otpauth](https://github.com/hectorm/otpauth) | TOTP 双因素认证 | ^9.x |
| [composerize](https://github.com/magicmark/composerize) | Docker 命令转换 | ^1.x |
| [decomposerize](https://github.com/magicmark/composerize) | Docker Compose 转换 | ^1.x |
| [axios](https://github.com/axios/axios) | HTTP 请求 | ^1.x |
| [qrcode](https://github.com/soldair/node-qrcode) | 二维码生成 | ^1.x |
| [fast-xml-parser](https://github.com/NaturalIntelligence/fast-xml-parser) | XML 解析与转换 | ^5.x |
| [diff](https://github.com/kpdecker/jsdiff) | 文本差异对比 | ^7.x |
| [node-sql-parser](https://github.com/taozhi8833998/node-sql-parser) | SQL 解析器 | ^5.x |

## 🏗️ 安装与运行

### 环境要求
- Node.js >= 18
- npm >= 9

### 安装步骤

```bash
# 克隆项目（GitHub）
git clone https://github.com/yangloop/tool-stack.git
cd tool-stack

# 或克隆项目（Gitee）
git clone https://gitee.com/yangloop/tool-stack.git
cd tool-stack

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview
```

## 📁 项目结构

```
/
├── src/
│   ├── pages/              # 页面级组件
│   │   └── Home.tsx        # 首页
│   ├── features/           # 功能模块
│   │   └── tools/          # 工具功能模块
│   │       ├── components/ # 工具组件
│   │       │   ├── docker-convert/  # Docker 转换工具子模块
│   │       │   ├── http-request/    # HTTP 请求工具子模块
│   │       │   └── ...
│   │       ├── hooks/      # 工具相关 Hooks
│   │       │   └── useSqlAdvisor.ts
│   │       └── workers/    # Web Workers
│   │           ├── rsaWorker.ts
│   │           ├── sqlAdvisorWorker.ts
│   │           └── sqlAdvisor/
│   ├── components/         # 通用组件
│   │   ├── common/         # 通用 UI 组件（Button、CopyButton、ToolHeader 等）
│   │   ├── ads/            # 广告组件
│   │   ├── CodeEditor.tsx  # 公共代码编辑器组件（CodeMirror 6）
│   │   ├── Layout.tsx      # 布局组件
│   │   └── Home.tsx        # 首页组件
│   ├── data/
│   │   ├── tools.tsx       # 工具注册配置
│   │   └── toolInfoData.ts # 工具信息数据
│   ├── hooks/              # 通用 Hooks
│   │   ├── useClipboard.ts # 剪贴板 Hook
│   │   ├── useLocalStorage.ts  # 本地存储 Hook
│   │   └── useTheme.ts     # 主题管理 Hook
│   ├── styles/             # 样式文件
│   ├── types/              # TypeScript 类型定义
│   ├── utils/              # 工具函数
│   ├── App.tsx             # 主应用
│   └── main.tsx            # 入口文件
├── scripts/
│   └── prerender.cjs       # SEO 预渲染脚本
├── public/                 # 静态资源
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

### 目录说明

- **`pages/`** - 页面级组件，对应路由页面
- **`features/tools/`** - 工具相关功能模块，按功能聚合（组件、Hooks、Workers）
- **`components/`** - 通用 UI 组件，可在多个功能间复用
- **`hooks/`** - 通用 Hooks，与具体功能无关
- **`styles/`** - 全局样式和主题配置

## 🧩 添加新工具

1. 在 `src/features/tools/components/` 创建工具组件
2. 在 `src/data/tools.tsx` 注册工具
3. 在 `scripts/prerender.cjs` 中添加 SEO 配置

示例：

```typescript
// src/features/tools/components/MyTool.tsx
import { ToolPageContainer } from '../../../components/common';

export function MyTool() {
  return (
    <ToolPageContainer toolId="my-tool" title="我的工具" description="工具描述">
      {/* 工具内容 */}
    </ToolPageContainer>
  );
}

// src/data/tools.tsx
const MyTool = lazy(() => import('../features/tools/components/MyTool').then(m => ({ default: m.MyTool })));

export const tools: Tool[] = [
  // ...
  {
    id: 'my-tool',
    name: '我的工具',
    description: '工具描述',
    icon: 'Wrench',
    category: 'dev',
    component: MyTool,
    new: true,
  },
];
```

## 📝 开发规范

- 使用 TypeScript 编写，确保类型安全
- 工具组件使用统一的卡片样式（`card` 类）
- 使用公共组件库快速构建工具页面（`ToolPageContainer`、`ToolHeader`、`ConvertToolLayout` 等）
- 使用 `useLocalStorage` Hook 持久化数据
- 使用 `CodeEditor` 组件统一代码编辑（支持 SQL/JSON/XML/HTML/YAML/JS/TS/CSS/Shell/Text）
- 使用 `useClipboard` Hook 处理复制操作
- 耗时任务使用 Web Worker 避免阻塞 UI
- 支持浅色/深色模式切换
- 优先使用成熟的第三方库实现核心功能

## 🔍 SEO 优化

项目内置完善的 SEO 支持：
- 自动生成 Sitemap
- 每个工具独立页面和 Meta 标签
- Schema.org 结构化数据（JSON-LD）
- FAQPage 和 HowTo 结构化标记
- 支持 AI 搜索引擎（ChatGPT、Perplexity、Claude 等）

## 🤝 贡献指南

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

## 📄 许可证

[MIT](LICENSE) © 2024-2025 ToolStack

## 🙏 致谢

感谢以下开源项目的支持：
- [CodeMirror 6](https://codemirror.net/) - 现代化代码编辑器
- [@uiw/react-codemirror](https://github.com/uiwjs/react-codemirror) - CodeMirror React 封装
- [react-colorful](https://github.com/omgovich/react-colorful) - 现代化颜色选择器
- [@uiw/react-json-view](https://github.com/uiwjs/react-json-view) - JSON 查看器
- [sql-formatter](https://github.com/sql-formatter-org/sql-formatter) - SQL 格式化
- [node-sql-parser](https://github.com/taozhi8833998/node-sql-parser) - SQL 解析器（支持MySQL/MariaDB、PostgreSQL、SQLite、SQL Server）
- [react-syntax-highlighter](https://github.com/react-syntax-highlighter/react-syntax-highlighter) - 语法高亮
- [composerize](https://github.com/magicmark/composerize) - Docker 命令转换
- [decomposerize](https://github.com/magicmark/composerize) - Docker Compose 转换
- [jsencrypt](https://github.com/travist/jsencrypt) - RSA 加密
- [otpauth](https://github.com/hectorm/otpauth) - TOTP 实现
- [fast-xml-parser](https://github.com/NaturalIntelligence/fast-xml-parser) - XML 解析与转换
- [diff](https://github.com/kpdecker/jsdiff) - 文本差异对比
