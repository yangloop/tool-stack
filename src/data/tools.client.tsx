import { lazy } from 'react';
import type { Tool } from '../types';

function createLazyTool<TModule>(
  loader: () => Promise<TModule>,
  pick: (module: TModule) => React.ComponentType
) {
  return {
    component: lazy(() => loader().then((module) => ({ default: pick(module) }))),
    load: loader,
  };
}

const jsonTool = createLazyTool(() => import('../features/tools/components/JsonTool'), (module) => module.JsonTool);
const base64Tool = createLazyTool(() => import('../features/tools/components/Base64Tool'), (module) => module.Base64Tool);
const urlTool = createLazyTool(() => import('../features/tools/components/UrlTool'), (module) => module.UrlTool);
const htmlEntityTool = createLazyTool(() => import('../features/tools/components/HtmlEntityTool'), (module) => module.HtmlEntityTool);
const hashTool = createLazyTool(() => import('../features/tools/components/HashTool'), (module) => module.HashTool);
const timestampTool = createLazyTool(() => import('../features/tools/components/TimestampTool'), (module) => module.TimestampTool);
const uuidTool = createLazyTool(() => import('../features/tools/components/UuidTool'), (module) => module.UuidTool);
const qrCodeTool = createLazyTool(() => import('../features/tools/components/QrCodeTool'), (module) => module.QrCodeTool);
const passwordTool = createLazyTool(() => import('../features/tools/components/PasswordTool'), (module) => module.PasswordTool);
const regexTool = createLazyTool(() => import('../features/tools/components/RegexTool'), (module) => module.RegexTool);
const colorTool = createLazyTool(() => import('../features/tools/components/ColorTool'), (module) => module.ColorTool);
const jwtTool = createLazyTool(() => import('../features/tools/components/JwtTool'), (module) => module.JwtTool);
const rsaTool = createLazyTool(() => import('../features/tools/components/RsaTool'), (module) => module.RsaTool);
const uaParserTool = createLazyTool(() => import('../features/tools/components/UaParserTool'), (module) => module.UaParserTool);
const sqlTool = createLazyTool(() => import('../features/tools/components/SqlTool'), (module) => module.SqlTool);
const sqlAdvisorTool = createLazyTool(() => import('../features/tools/components/SqlAdvisorTool'), (module) => module.SqlAdvisorTool);
const crontabTool = createLazyTool(() => import('../features/tools/components/CrontabTool'), (module) => module.CrontabTool);
const urlParserTool = createLazyTool(() => import('../features/tools/components/UrlParserTool'), (module) => module.UrlParserTool);
const httpRequestTool = createLazyTool(() => import('../features/tools/components/HttpRequestTool'), (module) => module.HttpRequestTool);
const textDiffTool = createLazyTool(() => import('../features/tools/components/TextDiffTool'), (module) => module.TextDiffTool);
const otpTool = createLazyTool(() => import('../features/tools/components/OtpTool'), (module) => module.OtpTool);
const chmodTool = createLazyTool(() => import('../features/tools/components/ChmodTool'), (module) => module.ChmodTool);
const websocketTool = createLazyTool(() => import('../features/tools/components/WebsocketTool'), (module) => module.WebsocketTool);
const base64FileTool = createLazyTool(() => import('../features/tools/components/Base64FileTool'), (module) => module.Base64FileTool);
const textTemplateTool = createLazyTool(() => import('../features/tools/components/TextTemplateTool'), (module) => module.TextTemplateTool);
const dockerConvertTool = createLazyTool(() => import('../features/tools/components/DockerConvertTool'), (module) => module.DockerConvertTool);
const xmlJsonTool = createLazyTool(() => import('../features/tools/components/XmlJsonTool'), (module) => module.XmlJsonTool);
const numberBaseTool = createLazyTool(() => import('../features/tools/components/NumberBaseTool'), (module) => module.NumberBaseTool);

export const tools: Tool[] = [
  { id: 'json', name: 'JSON工具', description: 'JSON格式化、压缩、验证和转换', icon: 'Braces', category: 'format', component: jsonTool.component, load: jsonTool.load, hot: true },
  { id: 'sql', name: 'SQL 格式化', description: 'SQL语句美化、压缩和语法高亮', icon: 'Database', category: 'format', component: sqlTool.component, load: sqlTool.load, hot: true, new: true },
  { id: 'sql-advisor', name: 'SQL 优化建议', description: '分析SQL DDL和SQL语句，提供性能优化建议', icon: 'Sparkles', category: 'format', component: sqlAdvisorTool.component, load: sqlAdvisorTool.load, hot: true, new: true },
  { id: 'xml-json', name: 'XML / JSON 互转', description: 'XML 与 JSON 格式互相转换，支持属性、格式化和高亮显示', icon: 'FileCode', category: 'format', component: xmlJsonTool.component, load: xmlJsonTool.load, new: true },
  { id: 'text-diff', name: '文本对比', description: '比较两段文本的差异，高亮显示增删改', icon: 'GitCompare', category: 'format', component: textDiffTool.component, load: textDiffTool.load, new: true },
  { id: 'base64', name: 'Base64 编解码', description: 'Base64编码和解码工具', icon: 'Code', category: 'codec', component: base64Tool.component, load: base64Tool.load, hot: true },
  { id: 'base64-file', name: 'Base64 文件转换', description: '文件与 Base64 编码相互转换，支持图片预览和下载', icon: 'FileCode', category: 'codec', component: base64FileTool.component, load: base64FileTool.load, new: true },
  { id: 'url', name: 'URL 编解码', description: 'URL编码和解码工具', icon: 'Link', category: 'codec', component: urlTool.component, load: urlTool.load },
  { id: 'url-parser', name: 'URL 解析', description: '解析URL结构，提取协议、主机、路径、查询参数等信息', icon: 'Globe', category: 'codec', component: urlParserTool.component, load: urlParserTool.load, new: true },
  { id: 'html', name: 'HTML 实体', description: 'HTML实体编码和解码', icon: 'FileCode', category: 'codec', component: htmlEntityTool.component, load: htmlEntityTool.load },
  { id: 'jwt', name: 'JWT 解码', description: 'JWT令牌解析和验证', icon: 'Key', category: 'codec', component: jwtTool.component, load: jwtTool.load, new: true },
  { id: 'hash', name: '哈希计算', description: 'MD5、SHA系列哈希计算', icon: 'Hash', category: 'security', component: hashTool.component, load: hashTool.load, hot: true },
  { id: 'rsa', name: 'RSA 密钥生成', description: '生成RSA公钥私钥对，支持加解密测试', icon: 'Key', category: 'security', component: rsaTool.component, load: rsaTool.load, hot: true, new: true },
  { id: 'otp', name: 'OTP 生成', description: '生成 TOTP 双因素认证验证码，支持 Google Authenticator', icon: 'Shield', category: 'security', component: otpTool.component, load: otpTool.load, new: true },
  { id: 'password', name: '密码生成', description: '生成安全随机密码', icon: 'Lock', category: 'security', component: passwordTool.component, load: passwordTool.load },
  { id: 'timestamp', name: '时间戳转换', description: 'Unix时间戳和日期互转', icon: 'Clock', category: 'dev', component: timestampTool.component, load: timestampTool.load, hot: true },
  { id: 'uuid', name: 'UUID 生成', description: '生成UUID/GUID', icon: 'Fingerprint', category: 'dev', component: uuidTool.component, load: uuidTool.load },
  { id: 'regex', name: '正则表达式测试', description: '正则表达式在线测试', icon: 'Search', category: 'dev', component: regexTool.component, load: regexTool.load },
  { id: 'ua-parser', name: 'UA 解析', description: '解析浏览器 User Agent 获取设备和系统信息', icon: 'Terminal', category: 'dev', component: uaParserTool.component, load: uaParserTool.load, new: true },
  { id: 'crontab', name: 'Crontab 生成', description: '可视化生成和解析定时任务 Cron 表达式', icon: 'Clock', category: 'dev', component: crontabTool.component, load: crontabTool.load, hot: true, new: true },
  { id: 'http-request', name: 'HTTP 请求', description: '在线API测试工具，支持各种HTTP方法和请求头', icon: 'Send', category: 'dev', component: httpRequestTool.component, load: httpRequestTool.load, hot: true, new: true },
  { id: 'docker-convert', name: 'Docker 转换', description: 'docker run 命令与 docker-compose.yml 配置相互转换', icon: 'Container', category: 'dev', component: dockerConvertTool.component, load: dockerConvertTool.load, hot: true, new: true },
  { id: 'text-template', name: '文本模板替换', description: '使用变量模板批量生成文本，支持自定义分隔符', icon: 'FileText', category: 'dev', component: textTemplateTool.component, load: textTemplateTool.load, hot: true, new: true },
  { id: 'chmod', name: 'Chmod 计算', description: 'Linux 文件权限计算，数字权限与符号权限互转', icon: 'FileLock', category: 'dev', component: chmodTool.component, load: chmodTool.load, new: true },
  { id: 'websocket', name: 'WebSocket 测试', description: '在线 WebSocket 客户端，测试和调试 WebSocket 连接', icon: 'Wifi', category: 'dev', component: websocketTool.component, load: websocketTool.load, hot: true, new: true },
  { id: 'qrcode', name: '二维码生成', description: '生成自定义二维码', icon: 'QrCode', category: 'util', component: qrCodeTool.component, load: qrCodeTool.load },
  { id: 'color', name: '颜色转换', description: 'HEX、RGB、HSL颜色转换', icon: 'Palette', category: 'util', component: colorTool.component, load: colorTool.load },
  { id: 'number-base', name: '进制转换', description: '二进制、八进制、十进制、十六进制互转', icon: 'Binary', category: 'util', component: numberBaseTool.component, load: numberBaseTool.load, new: true },
];

export const categories = [
  { id: 'format', name: '格式化', icon: 'AlignLeft' },
  { id: 'codec', name: '编解码', icon: 'Code' },
  { id: 'security', name: '安全加密', icon: 'Shield' },
  { id: 'dev', name: '开发调试', icon: 'Terminal' },
  { id: 'util', name: '实用工具', icon: 'Wrench' },
] as const;
