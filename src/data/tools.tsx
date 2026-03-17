import type { Tool } from '../types';
import { lazy } from 'react';

// 使用 React.lazy 进行动态导入，实现代码分割
// 每个工具组件只有在被访问时才会加载

const JsonTool = lazy(() => import('../features/tools/components/JsonTool').then(m => ({ default: m.JsonTool })));
const Base64Tool = lazy(() => import('../features/tools/components/Base64Tool').then(m => ({ default: m.Base64Tool })));
const UrlTool = lazy(() => import('../features/tools/components/UrlTool').then(m => ({ default: m.UrlTool })));
const HtmlEntityTool = lazy(() => import('../features/tools/components/HtmlEntityTool').then(m => ({ default: m.HtmlEntityTool })));
const HashTool = lazy(() => import('../features/tools/components/HashTool').then(m => ({ default: m.HashTool })));
const TimestampTool = lazy(() => import('../features/tools/components/TimestampTool').then(m => ({ default: m.TimestampTool })));
const UuidTool = lazy(() => import('../features/tools/components/UuidTool').then(m => ({ default: m.UuidTool })));
const QrCodeTool = lazy(() => import('../features/tools/components/QrCodeTool').then(m => ({ default: m.QrCodeTool })));
const PasswordTool = lazy(() => import('../features/tools/components/PasswordTool').then(m => ({ default: m.PasswordTool })));
const RegexTool = lazy(() => import('../features/tools/components/RegexTool').then(m => ({ default: m.RegexTool })));
const ColorTool = lazy(() => import('../features/tools/components/ColorTool').then(m => ({ default: m.ColorTool })));
const JwtTool = lazy(() => import('../features/tools/components/JwtTool').then(m => ({ default: m.JwtTool })));
const RsaTool = lazy(() => import('../features/tools/components/RsaTool').then(m => ({ default: m.RsaTool })));
const UaParserTool = lazy(() => import('../features/tools/components/UaParserTool').then(m => ({ default: m.UaParserTool })));
const SqlTool = lazy(() => import('../features/tools/components/SqlTool').then(m => ({ default: m.SqlTool })));
const SqlAdvisorTool = lazy(() => import('../features/tools/components/SqlAdvisorTool').then(m => ({ default: m.SqlAdvisorTool })));
const CrontabTool = lazy(() => import('../features/tools/components/CrontabTool').then(m => ({ default: m.CrontabTool })));
const UrlParserTool = lazy(() => import('../features/tools/components/UrlParserTool').then(m => ({ default: m.UrlParserTool })));
const HttpRequestTool = lazy(() => import('../features/tools/components/HttpRequestTool').then(m => ({ default: m.HttpRequestTool })));
const TextDiffTool = lazy(() => import('../features/tools/components/TextDiffTool').then(m => ({ default: m.TextDiffTool })));
const OtpTool = lazy(() => import('../features/tools/components/OtpTool').then(m => ({ default: m.OtpTool })));
const ChmodTool = lazy(() => import('../features/tools/components/ChmodTool').then(m => ({ default: m.ChmodTool })));
const WebsocketTool = lazy(() => import('../features/tools/components/WebsocketTool').then(m => ({ default: m.WebsocketTool })));
const Base64FileTool = lazy(() => import('../features/tools/components/Base64FileTool').then(m => ({ default: m.Base64FileTool })));
const TextTemplateTool = lazy(() => import('../features/tools/components/TextTemplateTool').then(m => ({ default: m.TextTemplateTool })));
const DockerConvertTool = lazy(() => import('../features/tools/components/DockerConvertTool').then(m => ({ default: m.DockerConvertTool })));
const XmlJsonTool = lazy(() => import('../features/tools/components/XmlJsonTool').then(m => ({ default: m.XmlJsonTool })));
const NumberBaseTool = lazy(() => import('../features/tools/components/NumberBaseTool').then(m => ({ default: m.NumberBaseTool })));

export const tools: Tool[] = [
  // ==================== 格式化工具 ====================
  {
    id: 'json',
    name: 'JSON工具',
    description: 'JSON格式化、压缩、验证和转换',
    icon: 'Braces',
    category: 'format',
    component: JsonTool,
    hot: true,
  },
  {
    id: 'sql',
    name: 'SQL 格式化',
    description: 'SQL语句美化、压缩和语法高亮',
    icon: 'Database',
    category: 'format',
    component: SqlTool,
    hot: true,
    new: true,
  },
  {
    id: 'sql-advisor',
    name: 'SQL 优化建议',
    description: '分析SQL DDL和SQL语句，提供性能优化建议',
    icon: 'Sparkles',
    category: 'format',
    component: SqlAdvisorTool,
    hot: true,
    new: true,
  },
  {
    id: 'xml-json',
    name: 'XML / JSON 互转',
    description: 'XML 与 JSON 格式互相转换，支持属性、格式化和高亮显示',
    icon: 'FileCode',
    category: 'format',
    component: XmlJsonTool,
    new: true,
  },
  {
    id: 'text-diff',
    name: '文本对比',
    description: '比较两段文本的差异，高亮显示增删改',
    icon: 'GitCompare',
    category: 'format',
    component: TextDiffTool,
    new: true,
  },

  // ==================== 编解码工具 ====================
  {
    id: 'base64',
    name: 'Base64 编解码',
    description: 'Base64编码和解码工具',
    icon: 'Code',
    category: 'codec',
    component: Base64Tool,
    hot: true,
  },
  {
    id: 'base64-file',
    name: 'Base64 文件转换',
    description: '文件与 Base64 编码相互转换，支持图片预览和下载',
    icon: 'FileCode',
    category: 'codec',
    component: Base64FileTool,
    new: true,
  },
  {
    id: 'url',
    name: 'URL 编解码',
    description: 'URL编码和解码工具',
    icon: 'Link',
    category: 'codec',
    component: UrlTool,
  },
  {
    id: 'url-parser',
    name: 'URL 解析',
    description: '解析URL结构，提取协议、主机、路径、查询参数等信息',
    icon: 'Globe',
    category: 'codec',
    component: UrlParserTool,
    new: true,
  },
  {
    id: 'html',
    name: 'HTML 实体',
    description: 'HTML实体编码和解码',
    icon: 'FileCode',
    category: 'codec',
    component: HtmlEntityTool,
  },
  {
    id: 'jwt',
    name: 'JWT 解码',
    description: 'JWT令牌解析和验证',
    icon: 'Key',
    category: 'codec',
    component: JwtTool,
    new: true,
  },

  // ==================== 安全加密 ====================
  {
    id: 'hash',
    name: '哈希计算',
    description: 'MD5、SHA系列哈希计算',
    icon: 'Hash',
    category: 'security',
    component: HashTool,
    hot: true,
  },
  {
    id: 'rsa',
    name: 'RSA 密钥生成',
    description: '生成RSA公钥私钥对，支持加解密测试',
    icon: 'Key',
    category: 'security',
    component: RsaTool,
    hot: true,
    new: true,
  },
  {
    id: 'otp',
    name: 'OTP 生成',
    description: '生成 TOTP 双因素认证验证码，支持 Google Authenticator',
    icon: 'Shield',
    category: 'security',
    component: OtpTool,
    new: true,
  },
  {
    id: 'password',
    name: '密码生成',
    description: '生成安全随机密码',
    icon: 'Lock',
    category: 'security',
    component: PasswordTool,
  },

  // ==================== 开发调试 ====================
  {
    id: 'timestamp',
    name: '时间戳转换',
    description: 'Unix时间戳和日期互转',
    icon: 'Clock',
    category: 'dev',
    component: TimestampTool,
    hot: true,
  },
  {
    id: 'uuid',
    name: 'UUID 生成',
    description: '生成UUID/GUID',
    icon: 'Fingerprint',
    category: 'dev',
    component: UuidTool,
  },
  {
    id: 'regex',
    name: '正则表达式测试',
    description: '正则表达式在线测试',
    icon: 'Search',
    category: 'dev',
    component: RegexTool,
  },
  {
    id: 'ua-parser',
    name: 'UA 解析',
    description: '解析浏览器 User Agent 获取设备和系统信息',
    icon: 'Terminal',
    category: 'dev',
    component: UaParserTool,
    new: true,
  },
  {
    id: 'crontab',
    name: 'Crontab 生成',
    description: '可视化生成和解析定时任务 Cron 表达式',
    icon: 'Clock',
    category: 'dev',
    component: CrontabTool,
    hot: true,
    new: true,
  },
  {
    id: 'http-request',
    name: 'HTTP 请求',
    description: '在线API测试工具，支持各种HTTP方法和请求头',
    icon: 'Send',
    category: 'dev',
    component: HttpRequestTool,
    hot: true,
    new: true,
  },
  {
    id: 'docker-convert',
    name: 'Docker 转换',
    description: 'docker run 命令与 docker-compose.yml 配置相互转换',
    icon: 'Container',
    category: 'dev',
    component: DockerConvertTool,
    hot: true,
    new: true,
  },
  {
    id: 'text-template',
    name: '文本模板替换',
    description: '使用变量模板批量生成文本，支持自定义分隔符',
    icon: 'FileText',
    category: 'dev',
    component: TextTemplateTool,
    hot: true,
    new: true,
  },
  {
    id: 'chmod',
    name: 'Chmod 计算',
    description: 'Linux 文件权限计算，数字权限与符号权限互转',
    icon: 'FileLock',
    category: 'dev',
    component: ChmodTool,
    new: true,
  },
  {
    id: 'websocket',
    name: 'WebSocket 测试',
    description: '在线 WebSocket 客户端，测试和调试 WebSocket 连接',
    icon: 'Wifi',
    category: 'dev',
    component: WebsocketTool,
    hot: true,
    new: true,
  },

  // ==================== 实用工具 ====================
  {
    id: 'qrcode',
    name: '二维码生成',
    description: '生成自定义二维码',
    icon: 'QrCode',
    category: 'util',
    component: QrCodeTool,
  },
  {
    id: 'color',
    name: '颜色转换',
    description: 'HEX、RGB、HSL颜色转换',
    icon: 'Palette',
    category: 'util',
    component: ColorTool,
  },
  {
    id: 'number-base',
    name: '进制转换',
    description: '二进制、八进制、十进制、十六进制互转',
    icon: 'Binary',
    category: 'util',
    component: NumberBaseTool,
    new: true,
  },
];

export const categories = [
  { id: 'format', name: '格式化', icon: 'AlignLeft' },
  { id: 'codec', name: '编解码', icon: 'Code' },
  { id: 'security', name: '安全加密', icon: 'Shield' },
  { id: 'dev', name: '开发调试', icon: 'Terminal' },
  { id: 'util', name: '实用工具', icon: 'Wrench' },
] as const;
