// 生成静态 HTML 文件，便于搜索引擎抓取
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distDir = path.join(__dirname, '../dist');
const tools = [
  'json', 'sql',
  'base64', 'base64-file', 'url', 'url-parser', 'html', 'jwt',
  'hash', 'rsa', 'otp', 'password',
  'timestamp', 'uuid', 'regex', 'crontab', 'docker-convert', 
  'http-request', 'websocket', 'text-diff', 'text-template', 'chmod', 'ua-parser',
  'qrcode', 'color'
];

// 工具描述
const toolDescriptions = {
  'json': '免费的在线 JSON 格式化工具，支持 JSON 压缩、验证、美化和高亮显示。',
  'sql': 'SQL 格式化工具，支持 SQL 语句美化、压缩和语法高亮。',
  'base64': 'Base64 在线编解码工具，支持文本的 Base64 编码和解码。',
  'base64-file': '文件与 Base64 相互转换工具，支持图片预览和下载。',
  'url': 'URL 在线编解码工具，支持 URL 编码和解码。',
  'url-parser': 'URL 分析器工具，解析 URL 结构，提取协议、主机、路径、查询参数等信息。',
  'html': 'HTML 实体编码解码工具，支持特殊字符转换。',
  'jwt': 'JWT 解码工具，解析和验证 JWT 令牌的头部、载荷和签名。',
  'hash': '哈希计算工具，支持 MD5、SHA-1、SHA-256、SHA-512 等算法。',
  'rsa': 'RSA 密钥生成器，在线生成 RSA 公钥私钥对，支持加密解密测试。',
  'otp': 'OTP 验证码生成器，支持 TOTP 双因素认证，兼容 Google Authenticator。',
  'password': '密码生成器，生成安全随机密码，支持自定义长度和字符集。',
  'timestamp': '时间戳转换工具，Unix 时间戳与日期时间互转。',
  'uuid': 'UUID 生成器，在线生成 UUID/GUID。',
  'regex': '正则表达式测试工具，在线测试和验证正则。',
  'crontab': 'Crontab 生成器，可视化生成和解析定时任务 Cron 表达式。',
  'docker-convert': 'Docker 命令转换器，docker run 与 docker-compose 互转。',
  'http-request': 'HTTP 请求工具，在线 API 测试，支持 GET、POST 等方法。',
  'websocket': 'WebSocket 测试工具，在线 WebSocket 客户端，支持心跳检测。',
  'text-diff': '文本对比工具，比较两段文本的差异，高亮显示增删改。',
  'text-template': '文本模板替换工具，批量生成文本，支持变量和数据表格。',
  'chmod': 'Chmod 计算器，Linux 文件权限计算，数字权限与符号权限互转。',
  'ua-parser': 'UA 分析器，解析 User Agent 获取设备和浏览器信息。',
  'qrcode': '二维码生成器，在线生成自定义文本、URL 二维码。',
  'color': '颜色转换工具，支持 HEX、RGB、HSL 颜色格式互转。',
};

const toolNames = {
  'json': 'JSON 工具',
  'sql': 'SQL 格式化',
  'base64': 'Base64 编解码',
  'base64-file': 'Base64 文件转换',
  'url': 'URL 编解码',
  'url-parser': 'URL 分析器',
  'html': 'HTML 实体',
  'jwt': 'JWT 解码',
  'hash': '哈希计算',
  'rsa': 'RSA 密钥生成',
  'otp': 'OTP 生成器',
  'password': '密码生成器',
  'timestamp': '时间戳转换',
  'uuid': 'UUID 生成',
  'regex': '正则测试',
  'crontab': 'Crontab 生成器',
  'docker-convert': 'Docker 转换器',
  'http-request': 'HTTP 请求',
  'websocket': 'WebSocket 测试',
  'text-diff': '文本对比',
  'text-template': '文本模板替换',
  'chmod': 'Chmod 计算器',
  'ua-parser': 'UA 分析器',
  'qrcode': '二维码生成',
  'color': '颜色转换',
};

// 支持从环境变量读取域名，默认为空（使用相对路径）
const baseUrl = process.env.SITE_URL || '';

// 读取模板 HTML
const templatePath = path.join(distDir, 'index.html');
const template = fs.readFileSync(templatePath, 'utf-8');

// 为每个工具生成静态 HTML
tools.forEach(toolId => {
  const toolName = toolNames[toolId];
  const description = toolDescriptions[toolId] || `ToolStack ${toolName} - 免费在线开发工具`;
  
  // 替换模板中的 SEO 内容
  let html = template
    .replace(/<title>.*?<\/title>/, `<title>${toolName} - ToolStack</title>`)
    .replace(/<meta name="description" content=".*?"\/>/, `<meta name="description" content="${description}"/>`)
    .replace(/<meta property="og:title" content=".*?"\/>/, `<meta property="og:title" content="${toolName} - ToolStack"/>`)
    .replace(/<meta property="og:description" content=".*?"\/>/, `<meta property="og:description" content="${description}"/>`)
    .replace(/<meta property="og:url" content=".*?"\/>/, `<meta property="og:url" content="${baseUrl}/tool/${toolId}"/>`)
    .replace(/<link rel="canonical" href=".*?"\/>/, `<link rel="canonical" href="${baseUrl}/tool/${toolId}"/>`)
    .replace(/"url": "https:\/\/toolstack\.juvvv\.com"/, `"url": "${baseUrl}/tool/${toolId}"`);

  // 创建工具目录
  const toolDir = path.join(distDir, 'tool', toolId);
  fs.mkdirSync(toolDir, { recursive: true });
  
  // 写入 HTML 文件
  fs.writeFileSync(path.join(toolDir, 'index.html'), html);
  console.log(`✓ Generated /tool/${toolId}/index.html`);
});

console.log(`\n✅ Generated ${tools.length} static HTML files for SEO`);
