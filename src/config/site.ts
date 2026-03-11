// 站点配置 - 支持环境变量覆盖
export const siteConfig = {
  // 域名 - 优先从环境变量读取，否则使用当前域名
  url: import.meta.env.VITE_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : ''),
  
  // 网站基本信息
  name: import.meta.env.VITE_SITE_NAME || 'ToolStack',
  title: import.meta.env.VITE_SITE_TITLE || 'ToolStack - 开发者工具箱',
  description: import.meta.env.VITE_SITE_DESCRIPTION || 'ToolStack 是一个免费的在线 IT 工具集合，提供 JSON 格式化、Base64 编解码、RSA 密钥生成等 20+ 款开发者实用工具。',
  keywords: '开发工具,在线工具,JSON格式化,Base64,哈希计算,UUID,二维码,时间戳,Docker,WebSocket,HTTP请求,正则测试,密码生成',
  
  // 语言
  lang: import.meta.env.VITE_SITE_LANG || 'zh-CN',
  
  // 作者
  author: 'ToolStack',
  
  // 社交媒体
  og: {
    type: 'website',
    image: '/logo.svg',
  },
  
  // Twitter
  twitter: {
    card: 'summary_large_image',
    site: '',
    creator: '',
  },
};

// 获取完整 URL（支持相对或绝对）
export function getFullUrl(path: string): string {
  const baseUrl = siteConfig.url;
  if (!baseUrl) {
    // 使用相对路径
    return path;
  }
  // 确保 baseUrl 不以斜杠结尾，path 以斜杠开头
  const base = baseUrl.replace(/\/$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
}

// 工具 SEO 配置
export const toolSeoConfig: Record<string, { title: string; description: string; keywords: string }> = {
  json: {
    title: 'JSON 格式化工具',
    description: '免费的在线 JSON 格式化工具，支持 JSON 压缩、验证、美化和高亮显示。',
    keywords: 'JSON格式化,JSON美化,JSON验证,JSON压缩,JSON在线工具',
  },
  sql: {
    title: 'SQL 格式化工具',
    description: 'SQL 格式化工具，支持 SQL 语句美化、压缩和语法高亮。',
    keywords: 'SQL格式化,SQL美化,SQL压缩,SQL语法高亮',
  },
  base64: {
    title: 'Base64 编解码工具',
    description: 'Base64 在线编解码工具，支持文本的 Base64 编码和解码。',
    keywords: 'Base64编码,Base64解码,Base64在线工具',
  },
  'base64-file': {
    title: 'Base64 文件转换工具',
    description: '文件与 Base64 相互转换工具，支持图片预览和下载。',
    keywords: 'Base64文件转换,图片转Base64,Base64转图片',
  },
  url: {
    title: 'URL 编解码工具',
    description: 'URL 在线编解码工具，支持 URL 编码和解码。',
    keywords: 'URL编码,URL解码,URL在线工具',
  },
  'url-parser': {
    title: 'URL 分析器',
    description: 'URL 分析器工具，解析 URL 结构，提取协议、主机、路径、查询参数等信息。',
    keywords: 'URL解析,URL分析,URL参数提取',
  },
  html: {
    title: 'HTML 实体编码解码工具',
    description: 'HTML 实体编码解码工具，支持特殊字符转换。',
    keywords: 'HTML实体编码,HTML实体解码,HTML特殊字符',
  },
  jwt: {
    title: 'JWT 解码工具',
    description: 'JWT 解码工具，解析和验证 JWT 令牌的头部、载荷和签名。',
    keywords: 'JWT解码,JWT解析,JWT验证,JWT工具',
  },
  hash: {
    title: '哈希计算工具',
    description: '哈希计算工具，支持 MD5、SHA-1、SHA-256、SHA-512 等算法。',
    keywords: 'MD5,SHA1,SHA256,SHA512,哈希计算,在线哈希',
  },
  rsa: {
    title: 'RSA 密钥生成器',
    description: 'RSA 密钥生成器，在线生成 RSA 公钥私钥对，支持加密解密测试。',
    keywords: 'RSA密钥生成,RSA公钥私钥,RSA加密解密',
  },
  otp: {
    title: 'OTP 验证码生成器',
    description: 'OTP 验证码生成器，支持 TOTP 双因素认证，兼容 Google Authenticator。',
    keywords: 'OTP,TOTP,验证码生成,双因素认证,Google Authenticator',
  },
  password: {
    title: '密码生成器',
    description: '密码生成器，生成安全随机密码，支持自定义长度和字符集。',
    keywords: '密码生成器,随机密码,安全密码',
  },
  timestamp: {
    title: '时间戳转换工具',
    description: '时间戳转换工具，Unix 时间戳与日期时间互转。',
    keywords: '时间戳转换,Unix时间戳,时间戳在线工具',
  },
  uuid: {
    title: 'UUID 生成器',
    description: 'UUID 生成器，在线生成 UUID/GUID。',
    keywords: 'UUID生成,GUID生成,UUID在线工具',
  },
  regex: {
    title: '正则表达式测试工具',
    description: '正则表达式测试工具，在线测试和验证正则。',
    keywords: '正则表达式,正则测试,正则在线工具',
  },
  crontab: {
    title: 'Crontab 生成器',
    description: 'Crontab 生成器，可视化生成和解析定时任务 Cron 表达式。',
    keywords: 'Crontab,Cron表达式,定时任务生成器',
  },
  'docker-convert': {
    title: 'Docker 命令转换器',
    description: 'Docker 命令转换器，docker run 与 docker-compose 互转。',
    keywords: 'Docker命令转换,docker-compose,Composerize,Decomposerize',
  },
  'http-request': {
    title: 'HTTP 请求工具',
    description: 'HTTP 请求工具，在线 API 测试，支持 GET、POST 等方法。',
    keywords: 'HTTP请求,API测试,Postman替代,在线HTTP工具',
  },
  websocket: {
    title: 'WebSocket 测试工具',
    description: 'WebSocket 测试工具，在线 WebSocket 客户端，支持心跳检测。',
    keywords: 'WebSocket测试,WebSocket客户端,WebSocket在线工具',
  },
  'text-diff': {
    title: '文本对比工具',
    description: '文本对比工具，比较两段文本的差异，高亮显示增删改。',
    keywords: '文本对比,代码对比,差异比较,Diff工具',
  },
  'text-template': {
    title: '文本模板替换工具',
    description: '文本模板替换工具，批量生成文本，支持变量和数据表格。',
    keywords: '文本模板,批量生成,变量替换,模板引擎',
  },
  chmod: {
    title: 'Chmod 计算器',
    description: 'Chmod 计算器，Linux 文件权限计算，数字权限与符号权限互转。',
    keywords: 'Chmod计算器,Linux权限,文件权限计算',
  },
  'ua-parser': {
    title: 'UA 分析器',
    description: 'UA 分析器，解析 User Agent 获取设备和浏览器信息。',
    keywords: 'UA解析,User Agent分析,浏览器识别',
  },
  qrcode: {
    title: '二维码生成器',
    description: '二维码生成器，在线生成自定义文本、URL 二维码。',
    keywords: '二维码生成,QR Code,二维码在线工具',
  },
  color: {
    title: '颜色转换工具',
    description: '颜色转换工具，支持 HEX、RGB、HSL 颜色格式互转。',
    keywords: '颜色转换,HEX转RGB,RGB转HSL,颜色工具',
  },
};

// 获取工具的 SEO 配置
export function getToolSeo(toolId: string) {
  const tool = toolSeoConfig[toolId];
  if (!tool) {
    return {
      title: toolId,
      description: siteConfig.description,
      keywords: siteConfig.keywords,
    };
  }
  return tool;
}
