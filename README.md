# ToolStack - IT 工具箱

一个现代化的 IT 工具集合网站，专为开发者和系统管理员设计。包含 20+ 实用工具，界面简洁美观，支持深色模式。

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/react-19-61DAFB.svg)
![TypeScript](https://img.shields.io/badge/typescript-5.6-3178C6.svg)
![Vite](https://img.shields.io/badge/vite-7-646CFF.svg)

## ✨ 特性

- 🎨 **现代化 UI** - 采用玻璃态设计风格，支持浅色/深色模式
- ⚡ **高性能** - 基于 React 19 + Vite 7，加载速度快
- 📱 **响应式设计** - 完美适配桌面和移动设备
- 🛠️ **丰富工具** - 20+ 款常用开发工具
- 💾 **本地优先** - 数据存储在本地，保护隐私
- 🔌 **Web Worker** - RSA 密钥生成等耗时任务使用后台线程

## 🚀 在线演示

[https://toolstack.example.com](https://toolstack.example.com) （请替换为实际地址）

## 🛠️ 工具列表

### 格式化工具
| 工具 | 描述 |
|------|------|
| JSON 工具 | 格式化、压缩、验证 JSON |
| SQL 格式化 | SQL 语句美化、压缩和语法高亮 |

### 编解码工具
| 工具 | 描述 |
|------|------|
| Base64 编解码 | 文本 Base64 编码/解码 |
| Base64 文件转换 | 文件与 Base64 相互转换，支持预览 |
| URL 编解码 | URL 编码和解码 |
| URL 分析器 | 解析 URL 结构，提取参数 |
| HTML 实体 | HTML 实体编码和解码 |
| JWT 解码 | JWT 令牌解析和验证 |

### 加密与安全
| 工具 | 描述 |
|------|------|
| RSA 密钥生成 | 生成 RSA 公钥私钥对，支持加解密测试（Web Worker） |
| 哈希计算 | MD5、SHA-1、SHA-256、SHA-512 计算 |
| OTP 生成器 | TOTP 双因素认证码，兼容 Google Authenticator |
| 密码生成器 | 生成安全随机密码 |

### 开发工具
| 工具 | 描述 |
|------|------|
| 时间戳转换 | Unix 时间戳与日期互转 |
| UUID 生成 | 生成 UUID/GUID |
| 正则测试 | 正则表达式在线测试 |
| UA 分析器 | 解析 User Agent 获取设备信息 |
| Crontab 生成器 | 可视化生成 Cron 表达式 |
| HTTP 请求 | 在线 API 测试工具 |
| 文本对比 | 比较文本差异，字符级高亮 |
| WebSocket 测试 | WebSocket 客户端，支持心跳检测 |
| 文本模板替换 | 批量生成文本，支持变量和数据表格 |
| Docker 转换器 | docker run 与 docker-compose 互转 |

### 系统工具
| 工具 | 描述 |
|------|------|
| Chmod 计算器 | Linux 文件权限计算 |

### 实用工具
| 工具 | 描述 |
|------|------|
| 二维码生成 | 生成自定义二维码 |
| 颜色转换 | HEX、RGB、HSL 颜色转换 |

## 📦 技术栈

- **前端框架**: React 19
- **开发语言**: TypeScript 5.6
- **构建工具**: Vite 7
- **样式**: Tailwind CSS 3 + 自定义设计系统
- **路由**: React Router 7
- **图标**: Lucide React
- **第三方库**:
  - `jsencrypt` - RSA 加密
  - `otpauth` - TOTP 验证码
  - `composerize` / `decomposerize` - Docker 命令转换
  - `axios` - HTTP 请求

## 🏗️ 安装与运行

### 环境要求
- Node.js >= 18
- npm >= 9

### 安装步骤

```bash
# 克隆项目
git clone https://github.com/yourusername/toolstack.git
cd toolstack/it-tools

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
it-tools/
├── src/
│   ├── components/
│   │   ├── tools/          # 工具组件
│   │   │   ├── docker-convert/  # Docker 转换工具模块
│   │   │   ├── http-request/    # HTTP 请求工具模块
│   │   │   └── ...
│   │   ├── Layout.tsx      # 布局组件
│   │   └── ads/            # 广告组件
│   ├── data/
│   │   └── tools.tsx       # 工具注册配置
│   ├── hooks/
│   │   └── useLocalStorage.ts  # 本地存储 Hook
│   ├── types/
│   │   └── index.ts        # 类型定义
│   ├── App.tsx             # 主应用
│   └── main.tsx            # 入口文件
├── public/                 # 静态资源
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

## 🧩 添加新工具

1. 在 `src/components/tools/` 创建工具组件
2. 在 `src/data/tools.tsx` 注册工具
3. 导出组件到 `src/components/tools/index.ts`

示例：

```typescript
// src/data/tools.tsx
{
  id: 'my-tool',
  name: '我的工具',
  description: '工具描述',
  icon: 'Wrench',
  category: 'dev',
  component: MyTool,
  new: true,
}
```

## 📝 开发规范

- 使用 TypeScript 编写，确保类型安全
- 工具组件使用统一的卡片样式（`card` 类）
- 使用 `useLocalStorage` Hook 持久化数据
- 耗时任务使用 Web Worker 避免阻塞 UI
- 支持浅色/深色模式切换

## 🤝 贡献指南

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

## 📄 许可证

[MIT](LICENSE) © 2024 ToolStack

## 🙏 致谢

感谢以下开源项目的支持：
- [composerize](https://github.com/magicmark/composerize) - Docker 命令转换
- [decomposerize](https://github.com/magicmark/composerize) - Docker Compose 转换
- [jsencrypt](https://github.com/travist/jsencrypt) - RSA 加密
- [otpauth](https://github.com/hectorm/otpauth) - TOTP 实现
