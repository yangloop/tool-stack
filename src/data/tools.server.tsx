import type { Tool } from '../types';

import { JsonTool } from '../features/tools/components/JsonTool';
import { Base64Tool } from '../features/tools/components/Base64Tool';
import { UrlTool } from '../features/tools/components/UrlTool';
import { HtmlEntityTool } from '../features/tools/components/HtmlEntityTool';
import { HashTool } from '../features/tools/components/HashTool';
import { TimestampTool } from '../features/tools/components/TimestampTool';
import { UuidTool } from '../features/tools/components/UuidTool';
import { QrCodeTool } from '../features/tools/components/QrCodeTool';
import { PasswordTool } from '../features/tools/components/PasswordTool';
import { RegexTool } from '../features/tools/components/RegexTool';
import { ColorTool } from '../features/tools/components/ColorTool';
import { JwtTool } from '../features/tools/components/JwtTool';
import { UaParserTool } from '../features/tools/components/UaParserTool';
import { SqlTool } from '../features/tools/components/SqlTool';
import { SqlAdvisorTool } from '../features/tools/components/SqlAdvisorTool';
import { CrontabTool } from '../features/tools/components/CrontabTool';
import { UrlParserTool } from '../features/tools/components/UrlParserTool';
import { HttpRequestTool } from '../features/tools/components/HttpRequestTool';
import { TextDiffTool } from '../features/tools/components/TextDiffTool';
import { OtpTool } from '../features/tools/components/OtpTool';
import { ChmodTool } from '../features/tools/components/ChmodTool';
import { WebsocketTool } from '../features/tools/components/WebsocketTool';
import { Base64FileTool } from '../features/tools/components/Base64FileTool';
import { TextTemplateTool } from '../features/tools/components/TextTemplateTool';
import { DockerConvertTool } from '../features/tools/components/DockerConvertTool';
import { XmlJsonTool } from '../features/tools/components/XmlJsonTool';
import { NumberBaseTool } from '../features/tools/components/NumberBaseTool';
import { SsrSafeToolPlaceholder } from '../features/tools/components/SsrSafeToolPlaceholder';

function RsaToolSsrPlaceholder() {
  return (
    <SsrSafeToolPlaceholder
      toolId="rsa"
      title="RSA 密钥生成"
      description="生成RSA公钥私钥对，支持加解密测试"
    />
  );
}

export const tools: Tool[] = [
  { id: 'json', name: 'JSON工具', description: 'JSON格式化、压缩、验证和转换', icon: 'Braces', category: 'format', component: JsonTool, hot: true },
  { id: 'sql', name: 'SQL 格式化', description: 'SQL语句美化、压缩和语法高亮', icon: 'Database', category: 'format', component: SqlTool, hot: true, new: true },
  { id: 'sql-advisor', name: 'SQL 优化建议', description: '分析SQL DDL和SQL语句，提供性能优化建议', icon: 'Sparkles', category: 'format', component: SqlAdvisorTool, hot: true, new: true },
  { id: 'xml-json', name: 'XML / JSON 互转', description: 'XML 与 JSON 格式互相转换，支持属性、格式化和高亮显示', icon: 'FileCode', category: 'format', component: XmlJsonTool, new: true },
  { id: 'text-diff', name: '文本对比', description: '比较两段文本的差异，高亮显示增删改', icon: 'GitCompare', category: 'format', component: TextDiffTool, new: true },
  { id: 'base64', name: 'Base64 编解码', description: 'Base64编码和解码工具', icon: 'Code', category: 'codec', component: Base64Tool, hot: true },
  { id: 'base64-file', name: 'Base64 文件转换', description: '文件与 Base64 编码相互转换，支持图片预览和下载', icon: 'FileCode', category: 'codec', component: Base64FileTool, new: true },
  { id: 'url', name: 'URL 编解码', description: 'URL编码和解码工具', icon: 'Link', category: 'codec', component: UrlTool },
  { id: 'url-parser', name: 'URL 解析', description: '解析URL结构，提取协议、主机、路径、查询参数等信息', icon: 'Globe', category: 'codec', component: UrlParserTool, new: true },
  { id: 'html', name: 'HTML 实体', description: 'HTML实体编码和解码', icon: 'FileCode', category: 'codec', component: HtmlEntityTool },
  { id: 'jwt', name: 'JWT 解码', description: 'JWT令牌解析和验证', icon: 'Key', category: 'codec', component: JwtTool, new: true },
  { id: 'hash', name: '哈希计算', description: 'MD5、SHA系列哈希计算', icon: 'Hash', category: 'security', component: HashTool, hot: true },
  { id: 'rsa', name: 'RSA 密钥生成', description: '生成RSA公钥私钥对，支持加解密测试', icon: 'Key', category: 'security', component: RsaToolSsrPlaceholder, hot: true, new: true },
  { id: 'otp', name: 'OTP 生成', description: '生成 TOTP 双因素认证验证码，支持 Google Authenticator', icon: 'Shield', category: 'security', component: OtpTool, new: true },
  { id: 'password', name: '密码生成', description: '生成安全随机密码', icon: 'Lock', category: 'security', component: PasswordTool },
  { id: 'timestamp', name: '时间戳转换', description: 'Unix时间戳和日期互转', icon: 'Clock', category: 'dev', component: TimestampTool, hot: true },
  { id: 'uuid', name: 'UUID 生成', description: '生成UUID/GUID', icon: 'Fingerprint', category: 'dev', component: UuidTool },
  { id: 'regex', name: '正则表达式测试', description: '正则表达式在线测试', icon: 'Search', category: 'dev', component: RegexTool },
  { id: 'ua-parser', name: 'UA 解析', description: '解析浏览器 User Agent 获取设备和系统信息', icon: 'Terminal', category: 'dev', component: UaParserTool, new: true },
  { id: 'crontab', name: 'Crontab 生成', description: '可视化生成和解析定时任务 Cron 表达式', icon: 'Clock', category: 'dev', component: CrontabTool, hot: true, new: true },
  { id: 'http-request', name: 'HTTP 请求', description: '在线API测试工具，支持各种HTTP方法和请求头', icon: 'Send', category: 'dev', component: HttpRequestTool, hot: true, new: true },
  { id: 'docker-convert', name: 'Docker 转换', description: 'docker run 命令与 docker-compose.yml 配置相互转换', icon: 'Container', category: 'dev', component: DockerConvertTool, hot: true, new: true },
  { id: 'text-template', name: '文本模板替换', description: '使用变量模板批量生成文本，支持自定义分隔符', icon: 'FileText', category: 'dev', component: TextTemplateTool, hot: true, new: true },
  { id: 'chmod', name: 'Chmod 计算', description: 'Linux 文件权限计算，数字权限与符号权限互转', icon: 'FileLock', category: 'dev', component: ChmodTool, new: true },
  { id: 'websocket', name: 'WebSocket 测试', description: '在线 WebSocket 客户端，测试和调试 WebSocket 连接', icon: 'Wifi', category: 'dev', component: WebsocketTool, hot: true, new: true },
  { id: 'qrcode', name: '二维码生成', description: '生成自定义二维码', icon: 'QrCode', category: 'util', component: QrCodeTool },
  { id: 'color', name: '颜色转换', description: 'HEX、RGB、HSL颜色转换', icon: 'Palette', category: 'util', component: ColorTool },
  { id: 'number-base', name: '进制转换', description: '二进制、八进制、十进制、十六进制互转', icon: 'Binary', category: 'util', component: NumberBaseTool, new: true },
];

export const categories = [
  { id: 'format', name: '格式化', icon: 'AlignLeft' },
  { id: 'codec', name: '编解码', icon: 'Code' },
  { id: 'security', name: '安全加密', icon: 'Shield' },
  { id: 'dev', name: '开发调试', icon: 'Terminal' },
  { id: 'util', name: '实用工具', icon: 'Wrench' },
] as const;
