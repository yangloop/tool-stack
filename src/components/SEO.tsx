import { useEffect } from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  pathname?: string;
}

const defaultTitle = 'ToolStack - 开发者工具箱';
const defaultDescription = 'ToolStack 是一个免费的在线 IT 工具集合，提供 JSON 格式化、Base64 编解码、RSA 密钥生成、Docker 命令转换等 20+ 款实用工具。';
const defaultKeywords = '开发工具,在线工具,JSON格式化,Base64,哈希计算,UUID生成,二维码,Docker,WebSocket,HTTP请求';
const siteUrl = 'https://toolstack.example.com'; // 请替换为实际域名

export function SEO({ 
  title, 
  description = defaultDescription, 
  keywords = defaultKeywords,
  pathname = ''
}: SEOProps) {
  const fullTitle = title ? `${title} - ToolStack` : defaultTitle;
  const url = `${siteUrl}${pathname}`;

  useEffect(() => {
    // 更新标题
    document.title = fullTitle;

    // 更新 meta 标签
    updateMeta('description', description);
    updateMeta('keywords', keywords);
    
    // Open Graph
    updateMeta('og:title', fullTitle);
    updateMeta('og:description', description);
    updateMeta('og:url', url);
    updateMeta('og:type', 'website');
    updateMeta('og:site_name', 'ToolStack');
    
    // Twitter Card
    updateMeta('twitter:card', 'summary_large_image');
    updateMeta('twitter:title', fullTitle);
    updateMeta('twitter:description', description);
    
    // Canonical URL
    updateCanonical(url);

  }, [fullTitle, description, keywords, url]);

  return null;
}

function updateMeta(name: string, content: string) {
  // 尝试通过 name 查找
  let meta = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement;
  
  // 尝试通过 property 查找 (Open Graph)
  if (!meta) {
    meta = document.querySelector(`meta[property="${name}"]`) as HTMLMetaElement;
  }
  
  if (meta) {
    meta.content = content;
  } else {
    // 创建新 meta 标签
    meta = document.createElement('meta');
    if (name.startsWith('og:') || name.startsWith('twitter:')) {
      meta.setAttribute('property', name);
    } else {
      meta.name = name;
    }
    meta.content = content;
    document.head.appendChild(meta);
  }
}

function updateCanonical(url: string) {
  let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
  if (link) {
    link.href = url;
  } else {
    link = document.createElement('link');
    link.rel = 'canonical';
    link.href = url;
    document.head.appendChild(link);
  }
}

// 生成工具页面的 SEO 配置
export function getToolSEO(toolId: string, toolName: string) {
  const toolDescriptions: Record<string, string> = {
    'json': '免费的在线 JSON 格式化工具，支持 JSON 压缩、验证、美化和高亮显示。',
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
    'qrcode': '二维码生成器，在线生成自定义文本、URL 二维码。',
    'color': '颜色转换工具，支持 HEX、RGB、HSL 颜色格式互转。',
    'timestamp': '时间戳转换工具，Unix 时间戳与日期时间互转。',
    'uuid': 'UUID 生成器，在线生成 UUID/GUID。',
    'regex': '正则表达式测试工具，在线测试和验证正则。',
    'sql': 'SQL 格式化工具，SQL 语句美化、压缩和语法高亮。',
    'docker-convert': 'Docker 命令转换器，docker run 与 docker-compose 互转。',
    'http-request': 'HTTP 请求工具，在线 API 测试，支持 GET、POST 等方法。',
    'websocket': 'WebSocket 测试工具，在线 WebSocket 客户端，支持心跳检测。',
    'text-diff': '文本对比工具，比较两段文本的差异，高亮显示增删改。',
    'text-template': '文本模板替换工具，批量生成文本，支持变量和数据表格。',
    'chmod': 'Chmod 计算器，Linux 文件权限计算，数字权限与符号权限互转。',
    'crontab': 'Crontab 生成器，可视化生成和解析定时任务 Cron 表达式。',
    'ua-parser': 'UA 分析器，解析 User Agent 获取设备和浏览器信息。',
  };

  return {
    title: toolName,
    description: toolDescriptions[toolId] || `ToolStack ${toolName} - 免费在线开发工具`,
    keywords: `${toolName},在线工具,开发工具,ToolStack`,
    pathname: `/tool/${toolId}`
  };
}
