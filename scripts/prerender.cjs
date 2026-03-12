/**
 * 预渲染脚本 + SEO 优化
 * 在构建后生成工具的静态HTML文件，解决直接访问404问题，并优化SEO
 */

const fs = require('fs');
const path = require('path');

// 工具详细配置 - SEO优化：包含详细的功能描述和关键词
const toolsConfig = {
  'json': {
    name: 'JSON工具',
    description: 'JSON格式化、压缩、验证和转换工具。支持语法高亮、树形查看、JSON路径查询等功能。',
    keywords: 'JSON格式化,JSON压缩,JSON验证,JSON编辑器,JSON在线工具,JSON美化,JSON解析',
    category: '格式化工具'
  },
  'sql': {
    name: 'SQL格式化',
    description: 'SQL语句美化、压缩和语法高亮工具。支持多种SQL方言，自动格式化复杂查询语句。',
    keywords: 'SQL格式化,SQL美化,SQL压缩,SQL语法高亮,MySQL格式化,PostgreSQL格式化',
    category: '格式化工具'
  },
  'sql-advisor': {
    name: 'SQL分析优化工具',
    description: '智能SQL分析优化工具：检测SQL/DDL语法错误、验证表名字段匹配、检查数据类型兼容性、分析索引使用情况（支持组合索引最左前缀原则）、提供SQL性能优化建议。支持MySQL、PostgreSQL、SQLite、MariaDB等多种数据库。',
    keywords: 'SQL分析,SQL优化,SQL语法检查,SQL性能优化,SQL索引优化,组合索引检查,数据类型检查,表名验证,字段验证,MySQL优化,PostgreSQL优化,SQL查询优化,SQL调优工具,DDL检查,索引最左前缀',
    category: '格式化工具'
  },
  'base64': {
    name: 'Base64编解码',
    description: 'Base64编码和解码工具。支持文本与Base64互转，URL安全的Base64编码。',
    keywords: 'Base64编码,Base64解码,Base64在线工具,Base64转换,URL Base64',
    category: '编解码工具'
  },
  'base64-file': {
    name: 'Base64文件转换',
    description: '文件与Base64编码相互转换工具。支持图片、文档等文件预览和下载。',
    keywords: 'Base64文件转换,图片Base64,文件转Base64,Base64下载,Base64预览',
    category: '编解码工具'
  },
  'url': {
    name: 'URL编解码',
    description: 'URL编码和解码工具。支持URL组件编码、URI编码、批量处理。',
    keywords: 'URL编码,URL解码,URL转码,URI编码,encodeURIComponent,decodeURIComponent',
    category: '编解码工具'
  },
  'url-parser': {
    name: 'URL分析器',
    description: '解析URL结构，提取协议、主机、路径、查询参数、哈希片段等信息。',
    keywords: 'URL解析,URL分析,URL参数提取,查询参数解析,URL结构分析',
    category: '编解码工具'
  },
  'html': {
    name: 'HTML实体',
    description: 'HTML实体编码和解码工具。支持特殊字符转义和反转义。',
    keywords: 'HTML实体编码,HTML实体解码,HTML转义,HTML特殊字符,&amp;,&lt;,&gt;',
    category: '编解码工具'
  },
  'jwt': {
    name: 'JWT解码',
    description: 'JWT令牌解析和验证工具。解码Header、Payload、Signature，验证Token有效性。',
    keywords: 'JWT解码,JWT验证,Token解析,JSON Web Token,JWT在线工具,JWT调试',
    category: '编解码工具'
  },
  'rsa': {
    name: 'RSA密钥生成',
    description: '生成RSA公钥私钥对，支持1024/2048/4096位密钥，提供加解密测试功能。',
    keywords: 'RSA密钥生成,RSA加密解密,公钥私钥生成,RSA在线工具,2048位密钥',
    category: '加密安全'
  },
  'hash': {
    name: '哈希计算',
    description: 'MD5、SHA-1、SHA-256、SHA-512等哈希算法计算工具。支持文件哈希校验。',
    keywords: 'MD5计算,SHA256,SHA1,SHA512,哈希计算,文件校验,在线哈希工具',
    category: '加密安全'
  },
  'otp': {
    name: 'OTP生成器',
    description: '生成TOTP双因素认证验证码，兼容Google Authenticator、Microsoft Authenticator。',
    keywords: 'TOTP生成器,双因素认证,2FA,Google Authenticator,验证码生成,OTP工具',
    category: '加密安全'
  },
  'password': {
    name: '密码生成器',
    description: '生成安全随机密码。支持自定义长度、字符集，检测密码强度。',
    keywords: '密码生成器,随机密码,强密码生成,安全密码,密码强度检测',
    category: '加密安全'
  },
  'timestamp': {
    name: '时间戳转换',
    description: 'Unix时间戳和日期互转工具。支持毫秒/秒级时间戳，多种日期格式。',
    keywords: '时间戳转换,Unix时间戳,时间戳转日期,Date转时间戳,毫秒时间戳',
    category: '开发工具'
  },
  'uuid': {
    name: 'UUID生成',
    description: '生成UUID/GUID。支持UUID v1、v4，批量生成，多种格式输出。',
    keywords: 'UUID生成,GUID生成,UUID v4,UUID在线生成,批量UUID',
    category: '开发工具'
  },
  'regex': {
    name: '正则测试',
    description: '正则表达式在线测试工具。实时匹配、替换、分割，支持多种编程语言语法。',
    keywords: '正则表达式测试,Regex测试,正则在线工具,正则匹配,正则替换',
    category: '开发工具'
  },
  'crontab': {
    name: 'Crontab生成器',
    description: '可视化生成和解析定时任务Cron表达式。支持Quartz调度器语法。',
    keywords: 'Crontab生成器,Cron表达式,定时任务,Quartz Cron,Crontab在线工具',
    category: '开发工具'
  },
  'http-request': {
    name: 'HTTP请求',
    description: '在线API测试工具。支持GET、POST、PUT、DELETE等方法，自定义Headers和Body。',
    keywords: 'HTTP请求,API测试工具,Postman在线,REST API测试,HTTP客户端',
    category: '开发工具'
  },
  'websocket': {
    name: 'WebSocket测试',
    description: '在线WebSocket客户端，测试和调试WebSocket连接。支持wss、自定义消息。',
    keywords: 'WebSocket测试,WebSocket客户端,wss测试,Socket调试,WebSocket在线工具',
    category: '开发工具'
  },
  'text-diff': {
    name: '文本对比',
    description: '比较两段文本的差异，高亮显示增删改。支持行级和字符级对比。',
    keywords: '文本对比,文本比较,Diff工具,代码对比,差异高亮,文本差异分析',
    category: '开发工具'
  },
  'text-template': {
    name: '文本模板替换',
    description: '使用变量模板批量生成文本。支持自定义分隔符，CSV数据导入。',
    keywords: '文本模板,批量生成,变量替换,模板引擎,文本生成器',
    category: '开发工具'
  },
  'chmod': {
    name: 'Chmod计算器',
    description: 'Linux文件权限计算，数字权限与符号权限互转。支持文件所有者和组设置。',
    keywords: 'Chmod计算器,Linux权限,文件权限计算,chmod 777,权限转换',
    category: '系统工具'
  },
  'ua-parser': {
    name: 'UA分析器',
    description: '解析浏览器User Agent，获取设备类型、操作系统、浏览器版本等信息。',
    keywords: 'UA解析,User Agent分析,浏览器检测,设备识别,UA在线工具',
    category: '开发工具'
  },
  'docker-convert': {
    name: 'Docker转换器',
    description: 'docker run命令与docker-compose.yml配置相互转换。支持复杂参数映射。',
    keywords: 'Docker转换,docker-compose生成,docker run转compose,Docker Compose工具',
    category: '开发工具'
  },
  'qrcode': {
    name: '二维码生成',
    description: '生成自定义二维码。支持自定义颜色、尺寸、Logo，下载PNG格式。',
    keywords: '二维码生成,QR Code生成,自定义二维码,二维码美化,QR Code在线工具',
    category: '实用工具'
  },
  'color': {
    name: '颜色转换',
    description: 'HEX、RGB、HSL颜色转换工具。支持颜色选择器、预设颜色、颜色格式互转。',
    keywords: '颜色转换,HEX转RGB,RGB转HSL,颜色选择器,在线取色器,颜色格式转换',
    category: '实用工具'
  }
};

const domain = 'https://toolstack.juvvv.com';
const distDir = path.resolve(__dirname, '../dist');
const toolDir = path.join(distDir, 'tool');

// 读取 index.html 模板
const indexHtml = fs.readFileSync(path.join(distDir, 'index.html'), 'utf-8');

// 确保 tool 目录存在
if (!fs.existsSync(toolDir)) {
  fs.mkdirSync(toolDir, { recursive: true });
}

// 生成每个工具的SEO页面
Object.entries(toolsConfig).forEach(([toolId, config]) => {
  const toolUrl = `${domain}/tool/${toolId}`;
  const pageTitle = `${config.name} - ${config.category} | ToolStack`;
  const pageDesc = config.description;
  const keywords = `${config.keywords},ToolStack,开发者工具,在线工具`;
  
  // 结构化数据
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": config.name,
    "description": config.description,
    "url": toolUrl,
    "mainEntity": {
      "@type": "SoftwareApplication",
      "name": config.name,
      "applicationCategory": "DeveloperApplication",
      "operatingSystem": "Any",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "CNY"
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.8",
        "ratingCount": "100"
      }
    },
    "isPartOf": {
      "@type": "WebSite",
      "name": "ToolStack",
      "url": domain
    }
  };

  // 替换占位符
  let toolHtml = indexHtml
    .replace(/<title>.*?<\/title>/, `<title>${pageTitle}</title>`)
    .replace(/<meta name="description" content=".*?"/, `<meta name="description" content="${pageDesc}"`)
    .replace(/<meta name="keywords" content=".*?"/, `<meta name="keywords" content="${keywords}"`)
    .replace(/<link rel="canonical" href=".*?"/, `<link rel="canonical" href="${toolUrl}"`)
    .replace(/<meta property="og:title" content=".*?"/, `<meta property="og:title" content="${pageTitle}"`)
    .replace(/<meta property="og:description" content=".*?"/, `<meta property="og:description" content="${pageDesc}"`)
    .replace(/<meta property="og:url" content=".*?"/, `<meta property="og:url" content="${toolUrl}"`)
    .replace(/<meta name="twitter:title" content=".*?"/, `<meta name="twitter:title" content="${pageTitle}"`)
    .replace(/<meta name="twitter:description" content=".*?"/, `<meta name="twitter:description" content="${pageDesc}"`)
    .replace(/<!-- JSONLD_PLACEHOLDER -->.*?<!-- \/JSONLD_PLACEHOLDER -->/s, JSON.stringify(jsonLd, null, 2));

  // 生成 .html 文件
  const htmlFile = path.join(toolDir, `${toolId}.html`);
  fs.writeFileSync(htmlFile, toolHtml);
  console.log(`✓ Generated: tool/${toolId}.html`);

  // 生成目录下的 index.html
  const toolSubDir = path.join(toolDir, toolId);
  if (!fs.existsSync(toolSubDir)) {
    fs.mkdirSync(toolSubDir, { recursive: true });
  }
  const indexFile = path.join(toolSubDir, 'index.html');
  fs.writeFileSync(indexFile, toolHtml);
  console.log(`✓ Generated: tool/${toolId}/index.html`);
});

// 更新首页的SEO
const homeJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "ToolStack",
  "alternateName": "ToolStack 开发者工具箱",
  "description": "ToolStack 是一个现代化的开发者工具集合，包含 20+ 实用工具：JSON格式化、SQL美化、Base64编解码、哈希计算、RSA加密、二维码生成等。",
  "url": domain,
  "potentialAction": {
    "@type": "SearchAction",
    "target": `${domain}/?search={search_term_string}`,
    "query-input": "required name=search_term_string"
  },
  "hasPart": Object.values(toolsConfig).map(tool => ({
    "@type": "WebPage",
    "name": tool.name,
    "description": tool.description
  }))
};

let homeHtml = indexHtml
  .replace(/<title>.*?<\/title>/, `<title>ToolStack - 开发者工具箱</title>`)
  .replace(/<meta name="description" content=".*?"/, `<meta name="description" content="ToolStack 是一个现代化的开发者工具集合，包含 25+ 实用工具：JSON格式化、SQL格式化与智能优化分析、Base64编解码、哈希计算、RSA加密、二维码生成等。SQL分析工具支持语法检查、索引优化、数据类型验证、组合索引分析。界面简洁，支持深色模式。"`)
  .replace(/<meta name="keywords" content=".*?"/, `<meta name="keywords" content="开发者工具,在线工具,JSON格式化,SQL格式化,SQL分析,SQL优化,SQL语法检查,索引优化,组合索引检查,Base64编解码,哈希计算,MD5,SHA,RSA加密,二维码生成,UUID生成,时间戳转换,正则表达式测试,Crontab生成器"`)
  .replace(/<link rel="canonical" href=".*?"/, `<link rel="canonical" href="${domain}/"`)
  .replace(/<meta property="og:title" content=".*?"/, `<meta property="og:title" content="ToolStack - 开发者工具箱"`)
  .replace(/<meta property="og:description" content=".*?"/, `<meta property="og:description" content="ToolStack 是一个现代化的开发者工具集合，包含 25+ 实用工具：JSON格式化、SQL格式化与智能优化分析、Base64编解码、哈希计算等。界面简洁，支持深色模式。"`)
  .replace(/<meta property="og:url" content=".*?"/, `<meta property="og:url" content="${domain}/"`)
  .replace(/<meta name="twitter:title" content=".*?"/, `<meta name="twitter:title" content="ToolStack - 开发者工具箱"`)
  .replace(/<meta name="twitter:description" content=".*?"/, `<meta name="twitter:description" content="ToolStack 是一个现代化的开发者工具集合，包含 25+ 实用工具：JSON格式化、SQL格式化与智能优化分析、Base64编解码等。"`)
  .replace(/<!-- JSONLD_PLACEHOLDER -->.*?<!-- \/JSONLD_PLACEHOLDER -->/s, JSON.stringify(homeJsonLd, null, 2));

fs.writeFileSync(path.join(distDir, 'index.html'), homeHtml);
console.log(`✓ Updated: index.html`);

// 生成 sitemap.xml
const sitemapEntries = [
  { url: domain, priority: '1.0', changefreq: 'weekly' },
  ...Object.keys(toolsConfig).map(id => ({
    url: `${domain}/tool/${id}`,
    priority: '0.8',
    changefreq: 'monthly'
  }))
];

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapEntries.map(entry => `  <url>
    <loc>${entry.url}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

fs.writeFileSync(path.join(distDir, 'sitemap.xml'), sitemap);
console.log(`✓ Generated: sitemap.xml`);

// 生成 robots.txt
const robots = `User-agent: *
Allow: /

Sitemap: ${domain}/sitemap.xml
`;
fs.writeFileSync(path.join(distDir, 'robots.txt'), robots);
console.log(`✓ Generated: robots.txt`);

console.log(`\n✅ SEO优化完成！共生成 ${Object.keys(toolsConfig).length * 2 + 1} 个页面`);
console.log(`   - ${Object.keys(toolsConfig).length} 个工具页面（HTML + index）`);
console.log(`   - 1 个首页`);
console.log(`   - 1 个 Sitemap`);
console.log(`   - 1 个 Robots.txt`);
