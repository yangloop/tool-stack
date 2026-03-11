/**
 * 预渲染脚本
 * 在构建后生成工具的静态HTML文件，解决直接访问404问题
 */

const fs = require('fs');
const path = require('path');

// 工具列表（与 src/data/tools.tsx 保持一致）
const tools = [
  'json', 'sql', 'base64', 'base64-file', 'url', 'url-parser', 
  'html', 'jwt', 'rsa', 'hash', 'timestamp', 'uuid', 'regex',
  'ua-parser', 'crontab', 'http-request', 'docker-convert',
  'text-diff', 'text-template', 'otp', 'chmod', 'websocket',
  'qrcode', 'password', 'color'
];

const distDir = path.resolve(__dirname, '../dist');
const toolDir = path.join(distDir, 'tool');

// 读取 index.html 模板
const indexHtml = fs.readFileSync(path.join(distDir, 'index.html'), 'utf-8');

// 确保 tool 目录存在
if (!fs.existsSync(toolDir)) {
  fs.mkdirSync(toolDir, { recursive: true });
}

// 为每个工具生成静态HTML
tools.forEach(toolId => {
  const toolHtml = indexHtml
    .replace('<title>ToolStack - 开发者工具箱</title>', `<title>${getToolName(toolId)} - ToolStack</title>`)
    .replace('content="ToolStack - 开发者工具箱"', `content="${getToolDesc(toolId)}"`);
  
  const toolFile = path.join(toolDir, `${toolId}.html`);
  fs.writeFileSync(toolFile, toolHtml);
  console.log(`✓ Generated: tool/${toolId}.html`);
});

// 同时生成无后缀版本（用于直接访问 /tool/regex）
tools.forEach(toolId => {
  const toolDir2 = path.join(toolDir, toolId);
  if (!fs.existsSync(toolDir2)) {
    fs.mkdirSync(toolDir2, { recursive: true });
  }
  
  const toolHtml = indexHtml
    .replace('<title>ToolStack - 开发者工具箱</title>', `<title>${getToolName(toolId)} - ToolStack</title>`)
    .replace('content="ToolStack - 开发者工具箱"', `content="${getToolDesc(toolId)}"`);
  
  const toolFile = path.join(toolDir2, 'index.html');
  fs.writeFileSync(toolFile, toolHtml);
  console.log(`✓ Generated: tool/${toolId}/index.html`);
});

console.log(`\n✅ 预渲染完成！共生成 ${tools.length * 2} 个页面`);

// 工具名称映射
function getToolName(id) {
  const names = {
    'json': 'JSON工具',
    'sql': 'SQL格式化',
    'base64': 'Base64编解码',
    'base64-file': 'Base64文件转换',
    'url': 'URL编解码',
    'url-parser': 'URL分析器',
    'html': 'HTML实体',
    'jwt': 'JWT解码',
    'rsa': 'RSA密钥生成',
    'hash': '哈希计算',
    'timestamp': '时间戳转换',
    'uuid': 'UUID生成',
    'regex': '正则测试',
    'ua-parser': 'UA分析器',
    'crontab': 'Crontab生成器',
    'http-request': 'HTTP请求',
    'docker-convert': 'Docker转换器',
    'text-diff': '文本对比',
    'text-template': '文本模板替换',
    'otp': 'OTP生成器',
    'chmod': 'Chmod计算器',
    'websocket': 'WebSocket测试',
    'qrcode': '二维码生成',
    'password': '密码生成器',
    'color': '颜色转换',
  };
  return names[id] || id;
}

// 工具描述映射
function getToolDesc(id) {
  const descs = {
    'json': 'JSON格式化、压缩、验证和转换',
    'sql': 'SQL语句美化、压缩和语法高亮',
    'base64': 'Base64编码和解码工具',
    'base64-file': '文件与Base64编码相互转换',
    'url': 'URL编码和解码工具',
    'url-parser': '解析URL结构，提取协议、主机、路径、查询参数',
    'html': 'HTML实体编码和解码',
    'jwt': 'JWT令牌解析和验证',
    'rsa': '生成RSA公钥私钥对，支持加解密测试',
    'hash': 'MD5、SHA系列哈希计算',
    'timestamp': 'Unix时间戳和日期互转',
    'uuid': '生成UUID/GUID',
    'regex': '正则表达式在线测试',
    'ua-parser': '解析浏览器User Agent获取设备信息',
    'crontab': '可视化生成和解析定时任务Cron表达式',
    'http-request': '在线API测试工具，支持各种HTTP方法',
    'docker-convert': 'docker run命令与docker-compose.yml相互转换',
    'text-diff': '比较两段文本的差异，高亮显示增删改',
    'text-template': '使用变量模板批量生成文本',
    'otp': '生成TOTP双因素认证验证码',
    'chmod': 'Linux文件权限计算，数字权限与符号权限互转',
    'websocket': '在线WebSocket客户端，测试和调试WebSocket连接',
    'qrcode': '生成自定义二维码',
    'password': '生成安全随机密码',
    'color': 'HEX、RGB、HSL颜色转换',
  };
  return descs[id] || `${getToolName(id)} - 在线工具`;
}
