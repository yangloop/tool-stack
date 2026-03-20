/**
 * SSR 预渲染脚本 + SEO 优化
 * 在构建后生成工具的静态HTML文件，适配SSR模式
 */

const fs = require('fs');
const path = require('path');

// 工具详细配置 - SEO优化：包含详细的功能描述、关键词和AI友好的FAQ内容
const toolsConfig = {
  'json': {
    name: 'JSON 工具',
    description: '免费在线 JSON 格式化与校验工具，适合快速美化、压缩、检查 JSON 语法错误，处理接口返回、配置文件和测试数据更高效。',
    keywords: 'JSON格式化,JSON校验,JSON压缩,JSON美化,JSON语法检查,JSON错误定位,JSON在线工具,JSON怎么格式化,JSON报错怎么查',
    category: '格式化',
    faq: [
      { q: 'JSON 格式化工具可以做什么？', a: '可以把压缩的 JSON 美化成易读格式，也可以压缩输出，同时检查常见语法错误，方便接口调试和配置排查。' },
      { q: 'JSON 格式错误怎么查？', a: '把内容粘贴到工具中后，通常可以快速发现缺少引号、逗号、多余括号或转义不正确等问题，再逐项修正。' },
      { q: '适合处理哪些 JSON 内容？', a: '适合处理接口响应、前端配置、Mock 数据、日志片段以及需要复制到代码中的 JSON 文本。' },
      { q: 'JSON 格式化会上传数据吗？', a: '不会，工具主要在浏览器本地处理内容，适合处理日常开发数据和内部测试文本。' }
    ],
    howTo: {
      steps: [
        { name: '粘贴待处理 JSON', text: '把接口返回或本地配置中的 JSON 文本粘贴到输入区。' },
        { name: '检查并格式化', text: '工具会尝试解析 JSON，并输出美化结果或提示你修正语法问题。' },
        { name: '复制或压缩结果', text: '确认内容正确后，可以复制格式化后的 JSON，或切换为压缩模式继续使用。' }
      ]
    }
  },
  'sql': {
    name: 'SQL 格式化',
    description: '免费在线 SQL 格式化工具，支持 MySQL、PostgreSQL、SQLite 等常见方言，适合整理复杂查询、优化可读性和快速复制到文档或代码中。',
    keywords: 'SQL格式化,SQL美化,SQL排版,SQL压缩,MySQL格式化,PostgreSQL格式化,SQL在线工具,SQL怎么格式化,SQL可读性优化',
    category: '格式化',
    faq: [
      { q: 'SQL 格式化工具支持哪些数据库？', a: '常见的 MySQL、PostgreSQL、SQLite、MariaDB、SQL Server 等 SQL 语法都可以用于日常排版和阅读。' },
      { q: 'SQL 格式化后能直接执行吗？', a: '通常可以，格式化主要调整缩进、换行和关键字展示，不会主动改变查询逻辑，但复杂语句仍建议自行核对。' },
      { q: '适合哪些 SQL 场景？', a: '适合整理联表查询、子查询、DDL 语句、慢查询分析前的阅读，以及代码评审中的 SQL 展示。' },
      { q: '可以把 SQL 压缩成单行吗？', a: '可以，整理完可读版本后，再切换成压缩输出，方便内嵌到代码、配置或日志中。' }
    ],
    howTo: {
      steps: [
        { name: '粘贴 SQL 语句', text: '把待整理的查询、更新或建表语句粘贴到输入框中。' },
        { name: '选择数据库方言', text: '根据 SQL 实际来源选择更接近的方言，得到更自然的换行和关键字排版。' },
        { name: '复制格式化结果', text: '确认格式清晰后复制结果，继续用于调试、评审、文档或代码提交。' }
      ]
    }
  },
  'sql-advisor': {
    name: 'SQL 优化建议',
    description: '免费在线 SQL 优化分析工具，可检查 SQL 与 DDL 的匹配关系、索引使用情况和常见性能风险，适合排查慢查询和优化执行效率。',
    keywords: 'SQL优化,SQL分析,慢查询优化,索引分析,SQL语法检查,DDL校验,SQL性能优化,SQL怎么优化,索引怎么用',
    category: '格式化',
    faq: [
      { q: 'SQL 优化建议工具主要分析什么？', a: '会结合 SQL 和表结构检查字段匹配、索引命中、查询条件写法、数据类型兼容性以及一些常见性能风险。' },
      { q: '为什么要同时输入 DDL？', a: '有了表结构后，工具才能更准确判断字段是否存在、索引是否可用，以及查询条件是否更容易触发全表扫描。' },
      { q: '能发现索引问题吗？', a: '可以，尤其适合检查组合索引使用、筛选条件顺序以及最左前缀是否生效这类问题。' },
      { q: '适合用来替代数据库执行计划吗？', a: '不能完全替代，但很适合在没有数据库环境时先做一轮静态分析，帮助你快速发现明显问题。' }
    ],
    howTo: {
      steps: [
        { name: '输入 SQL 和表结构', text: '把待分析的 SQL 语句和对应表的 DDL 一起粘贴到工具中。' },
        { name: '选择数据库类型', text: '根据实际环境选择 MySQL、PostgreSQL、SQLite 等数据库类型。' },
        { name: '阅读优化结果', text: '查看语法校验、索引提示和性能建议，结合业务场景决定是否调整查询写法。' }
      ]
    }
  },
  'xml-json': {
    name: 'XML / JSON 互转',
    description: '免费在线 XML 与 JSON 互转工具，适合处理接口报文、配置文件和第三方回调数据，支持属性、嵌套结构和格式化输出。',
    keywords: 'XML转JSON,JSON转XML,XML在线转换,JSON在线转换,报文转换,接口数据转换,XML怎么转JSON,JSON怎么转XML',
    category: '格式化',
    faq: [
      { q: 'XML 和 JSON 互转适合什么场景？', a: '适合调试 SOAP 报文、第三方平台回调、旧系统配置文件，以及需要在前后端之间统一数据结构时使用。' },
      { q: 'XML 属性转换后会变成什么？', a: 'XML 的属性通常会保留到 JSON 的独立字段中，便于继续读取和二次处理。' },
      { q: '复杂嵌套结构能转换吗？', a: '一般可以，常见节点嵌套、数组结构和多层对象都能处理，但极少数特殊命名空间格式仍建议额外核对。' },
      { q: '转换后的数据会自动格式化吗？', a: '会，工具会尽量把输出整理成更容易阅读和复制的格式。' }
    ],
    howTo: {
      steps: [
        { name: '粘贴 XML 或 JSON', text: '把需要转换的报文或配置内容粘贴到输入区。' },
        { name: '执行互转', text: '选择 XML 转 JSON 或 JSON 转 XML，并等待工具整理结构。' },
        { name: '检查并复制结果', text: '确认字段层级和属性信息无误后，再复制到接口调试或代码中使用。' }
      ]
    }
  },
  'base64': {
    name: 'Base64 编解码',
    description: '免费在线 Base64 编码解码工具，适合处理接口参数、认证信息、文本传输和 URL 安全 Base64 内容，支持快速互转与复制。',
    keywords: 'Base64编码,Base64解码,Base64在线工具,URL安全Base64,Base64文本转换,Base64怎么解码,Base64怎么编码',
    category: '编解码',
    faq: [
      { q: 'Base64 编码通常用在什么地方？', a: '常见于 Basic Auth、图片内嵌、接口传参、消息内容封装以及需要把二进制内容转成文本时。' },
      { q: '为什么 Base64 解码后会乱码？', a: '通常和原始文本编码有关，比如 UTF-8、GBK 不一致，或者传入内容本身就不是合法的 Base64 字符串。' },
      { q: 'URL 安全 Base64 和普通 Base64 有什么区别？', a: 'URL 安全版本会把加号和斜杠替换成更适合 URL 传输的字符，避免再次转义。' },
      { q: '这个工具适合处理长文本吗？', a: '适合日常开发文本和中等长度内容，特别长的数据建议分段检查，避免一次性复制带来阅读困难。' }
    ],
    howTo: {
      steps: [
        { name: '输入原文或编码串', text: '把待编码文本或待解码的 Base64 字符串粘贴到输入框。' },
        { name: '选择编码方向', text: '按当前需求切换为编码或解码，也可根据场景选择 URL 安全格式。' },
        { name: '复制输出结果', text: '确认结果无误后复制，用于接口请求、代码调试或文档记录。' }
      ]
    }
  },
  'base64-file': {
    name: 'Base64 文件转换',
    description: '免费在线文件与 Base64 互转工具，适合把图片、PDF 和附件快速转成 Base64，或把 Base64 内容还原成可下载文件。',
    keywords: '文件转Base64,Base64转文件,图片转Base64,Base64图片还原,Base64文件下载,Base64附件转换',
    category: '编解码',
    faq: [
      { q: '哪些文件适合转成 Base64？', a: '常见图片、图标、小型 PDF、前端演示素材和需要内嵌到接口请求中的附件都很适合。' },
      { q: 'Base64 文件转换后为什么体积变大？', a: 'Base64 会把二进制内容编码成文本，通常会比原始文件大一些，这是正常现象。' },
      { q: 'Base64 内容可以还原成原文件吗？', a: '可以，只要原始字符串完整且格式正确，通常都能还原回对应文件。' },
      { q: '图片文件能预览吗？', a: '可以，常见图片在转换后一般都能直接预览，方便确认内容是否正确。' }
    ],
    howTo: {
      steps: [
        { name: '上传文件或粘贴 Base64', text: '根据当前需求选择上传本地文件，或直接粘贴已有的 Base64 字符串。' },
        { name: '执行文件互转', text: '工具会把文件转为 Base64，或把 Base64 解析并还原成文件内容。' },
        { name: '预览并下载结果', text: '确认内容正确后复制 Base64，或把还原后的文件下载到本地。' }
      ]
    }
  },
  'url': {
    name: 'URL 编解码',
    description: '免费在线 URL 编码解码工具，适合处理中文参数、特殊字符、回调地址和 query string，快速判断该用 encodeURI 还是 encodeURIComponent。',
    keywords: 'URL编码,URL解码,URI编码,encodeURI,encodeURIComponent,中文URL转码,URL参数编码,URL怎么解码',
    category: '编解码',
    faq: [
      { q: 'URL 编码和解码分别什么时候用？', a: '当参数里包含中文、空格、问号、等号、斜杠等特殊字符时通常需要编码；排查接口参数时常需要解码查看原文。' },
      { q: 'encodeURI 和 encodeURIComponent 怎么选？', a: '完整地址通常更接近 encodeURI，单个参数值更适合 encodeURIComponent。' },
      { q: '为什么接口里的中文参数会乱码？', a: '往往是编码方式不一致，或者参数拼接前没有先做 URL 编码。' },
      { q: '这个工具适合调试回调地址吗？', a: '很适合，尤其在 OAuth、支付跳转、分享链接等场景中，能快速检查回调参数是否编码正确。' }
    ],
    howTo: {
      steps: [
        { name: '粘贴 URL 或参数', text: '把完整链接或单个 query 参数内容粘贴到输入框。' },
        { name: '选择编码或解码', text: '根据场景执行 URL 编码、解码，或对比两种编码方式的结果。' },
        { name: '复制用于调试', text: '把输出结果复制到浏览器地址栏、接口文档或代码中继续使用。' }
      ]
    }
  },
  'url-parser': {
    name: 'URL 解析',
    description: '免费在线 URL 解析工具，可快速拆分协议、主机、端口、路径、查询参数和哈希片段，适合接口联调和跳转链接排查。',
    keywords: 'URL解析,URL参数解析,查询参数提取,URL结构分析,URL拆分,URL在线工具,URL参数怎么获取,链接结构分析',
    category: '编解码',
    faq: [
      { q: 'URL 解析工具适合哪些场景？', a: '适合检查回调地址、支付跳转链接、带签名参数的接口地址，以及分析前端路由中的 path、query 和 hash。' },
      { q: '能提取出所有 query 参数吗？', a: '可以，通常会把 URL 中的查询参数拆成更清晰的键值对，方便逐项查看和复制。' },
      { q: '为什么有些 URL 解析不完整？', a: '如果输入的是相对路径、缺少协议，或者内容本身并不是标准 URL，解析结果可能不够完整。' },
      { q: '能直接看出端口和 hash 吗？', a: '可以，工具通常会把端口、hash 片段和路径拆开显示，方便排查跳转问题。' }
    ],
    howTo: {
      steps: [
        { name: '输入完整链接', text: '把需要分析的 URL 粘贴到输入框，尽量带上协议和完整参数。' },
        { name: '查看拆分结果', text: '工具会自动展示协议、域名、端口、路径、参数和 hash 等部分。' },
        { name: '复制单项信息', text: '按需复制某个参数值或路径片段，用于接口联调和日志排查。' }
      ]
    }
  },
  'html': {
    name: 'HTML 实体',
    description: '免费在线 HTML 实体编码解码工具，适合处理富文本展示、代码示例转义、特殊符号输出和接口返回中的 HTML 内容。',
    keywords: 'HTML实体,HTML转义,HTML解码,HTML实体编码,HTML特殊字符,HTML标签转义,HTML怎么转义',
    category: '编解码',
    faq: [
      { q: 'HTML 实体编码适合什么场景？', a: '适合在网页中安全展示代码片段、富文本内容、模板变量和特殊字符，避免被浏览器当作真实标签解析。' },
      { q: '哪些字符最常需要转义？', a: '尖括号、引号、与号这类字符最常见，尤其在展示 HTML 代码和富文本时。' },
      { q: '为什么复制出来的内容有 &amp;lt; 这种形式？', a: '那是 HTML 实体编码后的结果，浏览器显示时会还原成对应字符，但在源码中通常要保留编码格式。' },
      { q: '中文一般需要转义吗？', a: '多数现代页面不需要，但如果你在处理旧系统、邮件模板或特殊字符集环境，仍然可能会用到。' }
    ],
    howTo: {
      steps: [
        { name: '粘贴原始文本', text: '把待转义的 HTML 片段或待解码的实体字符串粘贴到输入区。' },
        { name: '执行编码或解码', text: '根据你的使用场景切换为 HTML 实体编码或反向解码。' },
        { name: '复制到页面或模板', text: '把处理后的内容复制到网页、邮件模板、富文本编辑器或接口调试工具中。' }
      ]
    }
  },
  'jwt': {
    name: 'JWT 解码',
    description: '免费在线 JWT 解码工具，可快速解析 Header、Payload 和过期时间，适合排查登录状态、接口鉴权和 Token 字段问题。',
    keywords: 'JWT解码,JWT解析,Token解码,JWT在线工具,JWT过期时间查看,JWT调试,JWT怎么解码',
    category: '编解码',
    faq: [
      { q: 'JWT 解码工具能看哪些信息？', a: '通常可以查看 Header、Payload、签名段结构、用户声明字段以及过期时间、签发时间等常见信息。' },
      { q: 'JWT 解码后为什么看不到明文密码？', a: 'JWT 不是用来存密码的，通常只保存身份声明和业务字段，所以解码后看到的是载荷信息而不是敏感原文。' },
      { q: 'JWT 过期时间怎么看？', a: '如果 Token 中包含 exp 字段，工具会把它解析成更直观的时间，帮助你判断当前令牌是否已经过期。' },
      { q: 'JWT 解码等于验签吗？', a: '不等于，解码只是读取内容；真正校验签名是否可信，还需要结合密钥或服务端逻辑。' }
    ],
    howTo: {
      steps: [
        { name: '粘贴 JWT Token', text: '把请求头、Cookie 或本地存储中的 JWT 字符串粘贴到输入框。' },
        { name: '查看解析结果', text: '工具会拆分并显示 Header、Payload 和时间声明等核心字段。' },
        { name: '核对登录与鉴权信息', text: '根据解析内容检查用户标识、权限字段和过期时间，继续定位接口问题。' }
      ]
    }
  },
  'rsa': {
    name: 'RSA 密钥生成',
    description: '免费在线 RSA 密钥生成与测试工具，支持常用密钥长度，适合生成公私钥、验证加解密流程和调试签名相关逻辑。',
    keywords: 'RSA密钥生成,RSA公钥私钥,在线RSA工具,RSA加解密测试,RSA签名调试,RSA怎么生成密钥',
    category: '安全加密',
    faq: [
      { q: 'RSA 工具适合哪些开发场景？', a: '适合接口加密、签名验签、测试环境密钥生成、支付对接和需要快速验证公私钥流程的场景。' },
      { q: '2048 位和 4096 位怎么选？', a: '大多数业务系统使用 2048 位就足够，4096 位更安全但生成和运算会更慢。' },
      { q: '公钥和私钥分别怎么用？', a: '常见场景里公钥用于加密或验签，私钥用于解密或签名，具体要看你的接入协议设计。' },
      { q: '可以直接拿生成的密钥上线吗？', a: '测试和内部调试可以，但正式生产环境建议使用专门的密钥管理流程来生成和保存。' }
    ],
    howTo: {
      steps: [
        { name: '选择密钥长度', text: '根据安全性和性能要求选择常见的 2048 位或 4096 位密钥长度。' },
        { name: '生成公私钥', text: '点击生成后获取一组可测试的公钥和私钥内容。' },
        { name: '执行加解密测试', text: '把示例文本放入测试区，验证密钥是否能按预期完成加密、解密或签名流程。' }
      ]
    }
  },
  'hash': {
    name: '哈希计算',
    description: '免费在线哈希计算工具，支持 MD5、SHA1、SHA256、SHA512 等算法，适合校验文件完整性、比对文本变化和调试签名流程。',
    keywords: '哈希计算,MD5计算,SHA256计算,SHA1计算,文件哈希,在线哈希工具,文件完整性校验,哈希值怎么计算',
    category: '安全加密',
    faq: [
      { q: '哈希计算通常用来做什么？', a: '常用于文件完整性校验、接口签名辅助、缓存键生成、密码摘要存储以及快速比较两段内容是否相同。' },
      { q: 'MD5 和 SHA256 应该选哪个？', a: '如果只是做非安全场景的快速比对，MD5 够用；如果涉及安全性和更强碰撞抗性，通常更推荐 SHA256。' },
      { q: '同样的内容为什么哈希值始终一样？', a: '哈希算法具有确定性，只要输入内容完全一致，输出摘要就会保持一致。' },
      { q: '文件哈希和文本哈希都能算吗？', a: '都可以，适合校验下载包、安装文件、日志内容和配置文本。' }
    ],
    howTo: {
      steps: [
        { name: '输入文本或上传文件', text: '根据你的需求选择粘贴字符串，或上传待校验的本地文件。' },
        { name: '切换哈希算法', text: '选择 MD5、SHA1、SHA256、SHA512 等算法，比较不同摘要结果。' },
        { name: '复制摘要进行校验', text: '把计算结果复制到发布说明、接口文档或脚本中，继续做完整性校验。' }
      ]
    }
  },
  'otp': {
    name: 'OTP 生成',
    description: '免费在线 TOTP 验证码生成工具，兼容 Google Authenticator、Authy 等常见 2FA 应用，适合测试双因素认证流程。',
    keywords: 'TOTP生成器,OTP生成,2FA工具,Google Authenticator兼容,在线验证码生成,双因素认证测试,TOTP怎么用',
    category: '安全加密',
    faq: [
      { q: 'OTP 生成工具适合什么场景？', a: '适合测试双因素认证、演示 2FA 接入、验证密钥是否正确，以及排查验证码时间同步问题。' },
      { q: 'TOTP 和短信验证码有什么区别？', a: 'TOTP 通常基于共享密钥和本地时间生成，不依赖短信通道，常用于更稳定的双因素认证。' },
      { q: '为什么验证码每隔几十秒会变化？', a: '这是 TOTP 的正常机制，验证码会按时间窗口刷新，以降低重复使用的风险。' },
      { q: '密钥可以直接复制到手机验证器吗？', a: '通常可以，若工具支持二维码，也能更方便地扫码导入到常见验证器应用中。' }
    ],
    howTo: {
      steps: [
        { name: '输入或导入密钥', text: '把 Base32 格式的 TOTP 密钥粘贴到输入框，或通过二维码方式导入。' },
        { name: '查看实时验证码', text: '工具会按当前时间窗口计算并展示可用的动态验证码。' },
        { name: '对照业务系统验证', text: '把生成的验证码填入登录页或测试接口，确认双因素认证流程是否正常。' }
      ]
    }
  },
  'password': {
    name: '密码生成',
    description: '免费在线随机密码生成器，支持自定义长度和字符集，适合生成高强度账号密码、测试口令和临时访问凭证。',
    keywords: '密码生成器,随机密码生成,强密码,在线密码工具,密码强度检测,安全密码怎么生成,高强度密码',
    category: '安全加密',
    faq: [
      { q: '多长的密码更安全？', a: '多数场景建议至少 12 位，若是重要账号、服务器或管理后台，通常推荐 16 位及以上并混合多种字符。' },
      { q: '为什么要包含大小写和符号？', a: '字符种类越丰富，暴力破解成本通常越高，也更能避免常见弱口令模式。' },
      { q: '密码生成后会被保存吗？', a: '一般不会，工具主要用于本地即时生成和复制，适合临时创建和快速测试。' },
      { q: '适合生成哪些类型的密码？', a: '适合网站账号、数据库测试用户、临时接口密钥、内部系统演示账号等。' }
    ],
    howTo: {
      steps: [
        { name: '设定密码规则', text: '根据业务要求设置密码长度，以及是否包含大写、小写、数字和特殊字符。' },
        { name: '生成随机密码', text: '点击生成按钮，工具会立即输出一组或多组可用密码。' },
        { name: '复制到目标系统', text: '把满意的结果复制到账号注册、初始化脚本或测试环境中继续使用。' }
      ]
    }
  },
  'timestamp': {
    name: '时间戳转换',
    description: '免费在线时间戳转换工具，支持秒级和毫秒级 Unix 时间戳互转，适合接口调试、日志排查和日期格式核对。',
    keywords: '时间戳转换,Unix时间戳,时间戳转日期,日期转时间戳,毫秒时间戳,在线时间戳工具,时间戳怎么看',
    category: '开发调试',
    faq: [
      { q: '怎么判断时间戳是秒还是毫秒？', a: '常见规则是 10 位多为秒级，13 位多为毫秒级，但仍建议结合接口文档和上下文一起判断。' },
      { q: '为什么转换出来的时间不对？', a: '经常是秒毫秒搞反、时区理解不一致，或者原始时间戳本身就不是标准 Unix 时间。' },
      { q: '适合排查哪些问题？', a: '适合排查接口返回时间、日志记录时间、缓存过期时间和 JWT 过期字段这类问题。' },
      { q: '可以把日期反向转成时间戳吗？', a: '可以，输入日期时间后通常就能直接得到对应的秒级或毫秒级时间戳。' }
    ],
    howTo: {
      steps: [
        { name: '输入时间戳或日期', text: '把秒级、毫秒级时间戳或标准日期字符串输入到工具中。' },
        { name: '自动识别并转换', text: '工具会尝试判断输入类型，并同步给出日期或时间戳结果。' },
        { name: '复制到日志或代码', text: '确认格式正确后复制结果，用于接口联调、日志排查或脚本处理。' }
      ]
    }
  },
  'uuid': {
    name: 'UUID 生成',
    description: '免费在线 UUID 生成器，支持快速批量生成 UUID v4，适合准备测试数据、数据库主键、请求追踪 ID 和临时标识。',
    keywords: 'UUID生成,UUID在线生成,UUID v4,GUID生成,批量UUID,随机ID生成,UUID怎么生成',
    category: '开发调试',
    faq: [
      { q: 'UUID 常用在什么地方？', a: '常见于数据库主键、订单号占位、日志追踪 ID、消息去重标识和接口请求链路跟踪。' },
      { q: 'UUID v4 为什么最常见？', a: '因为 v4 生成方式简单、随机性强，适合大多数需要唯一标识但不依赖有序性的场景。' },
      { q: '可以一次生成多个 UUID 吗？', a: '可以，批量生成很适合准备测试数据、脚本示例和批量导入场景。' },
      { q: 'UUID 和自增 ID 哪个更合适？', a: '要看场景。UUID 更适合分布式唯一标识，自增 ID 更适合简单数据库内部排序。' }
    ],
    howTo: {
      steps: [
        { name: '选择生成数量', text: '设置你一次需要生成的 UUID 个数，用于单条测试或批量数据准备。' },
        { name: '生成 UUID 列表', text: '点击生成后，工具会立即输出可复制的 UUID v4 结果。' },
        { name: '复制到数据库或脚本', text: '把生成结果复制到 SQL、接口参数、测试夹具或配置文件中使用。' }
      ]
    }
  },
  'regex': {
    name: '正则表达式测试',
    description: '免费在线正则表达式测试工具，适合验证匹配规则、替换结果和捕获组，快速调试邮箱、手机号、日志等文本模式。',
    keywords: '正则表达式测试,Regex测试,在线正则工具,正则匹配,正则替换,捕获组调试,正则怎么写',
    category: '开发调试',
    faq: [
      { q: '正则表达式测试工具适合哪些场景？', a: '适合调试表单校验、日志提取、文本替换、批量查找规则以及各种字符串匹配需求。' },
      { q: '为什么正则明明写了却匹配不到？', a: '通常和边界符、转义字符、换行模式或大小写匹配选项有关，建议逐步缩小匹配范围检查。' },
      { q: '可以看捕获组结果吗？', a: '可以，调试复杂表达式时，查看捕获组能帮助你确认每一段匹配是否符合预期。' },
      { q: '适合验证手机号、邮箱、URL 这类规则吗？', a: '很适合，这类高频规则通常都可以先在工具里测试通过后再放进代码中。' }
    ],
    howTo: {
      steps: [
        { name: '输入正则规则', text: '先把你要测试的正则表达式粘贴到规则输入区。' },
        { name: '输入测试文本', text: '把需要匹配、替换或提取的文本内容粘贴到示例区域。' },
        { name: '查看匹配与捕获组', text: '根据结果调整表达式，确认命中位置、匹配数量和捕获组信息。' }
      ]
    }
  },
  'crontab': {
    name: 'Crontab 生成',
    description: '免费在线 Cron 表达式生成与解析工具，适合快速配置 Linux 定时任务、Quartz 计划任务和常见周期执行规则。',
    keywords: 'Crontab生成,Cron表达式生成,Cron解析,定时任务,在线Cron工具,Quartz表达式,Cron怎么写',
    category: '开发调试',
    faq: [
      { q: 'Cron 表达式适合哪些场景？', a: '适合配置定时备份、定时同步、自动清理、报表任务、消息重试和周期性接口调用。' },
      { q: '普通 Cron 和 Quartz 表达式有什么区别？', a: 'Quartz 通常比标准 Cron 多秒字段，适合 Java 调度框架等更细粒度的任务配置。' },
      { q: '为什么我的表达式没有按预期执行？', a: '常见原因包括星期和日期字段冲突、时区设置不一致，或者调度器本身对表达式格式有特殊要求。' },
      { q: '可以把已有表达式反向解析吗？', a: '可以，反向解析能帮助你快速读懂老系统中的 Cron 配置，减少手动推断成本。' }
    ],
    howTo: {
      steps: [
        { name: '选择执行频率', text: '根据业务需求选择每天、每周、每月或自定义的执行规则。' },
        { name: '生成或解析表达式', text: '输入条件后自动生成 Cron，也可以把已有表达式贴进来反向解析。' },
        { name: '复制到调度系统', text: '确认时间规则正确后，把结果复制到 Linux、Spring、Quartz 或其他任务平台中。' }
      ]
    }
  },
  'http-request': {
    name: 'HTTP 请求',
    description: '免费在线 HTTP 请求测试工具，支持常见方法、请求头、Query、JSON 和表单请求体，适合快速联调 REST API 和接口排错。',
    keywords: 'HTTP请求测试,API测试工具,在线Postman,REST调试,接口测试,在线HTTP客户端,HTTP请求怎么调试',
    category: '开发调试',
    faq: [
      { q: 'HTTP 请求工具适合哪些调试场景？', a: '适合联调登录接口、上传参数、查看响应头、排查状态码问题，以及快速验证第三方 API 是否可用。' },
      { q: '支持哪些请求体格式？', a: '常见的 JSON、XML、表单、Raw 文本和 Query 参数都适合用来测试。' },
      { q: '为什么有些接口会报 CORS？', a: '浏览器环境会受到跨域限制，这不是工具本身逻辑错误，而是目标接口响应策略导致的。' },
      { q: '可以保存历史请求吗？', a: '通常可以，适合重复调试同一个接口或复用参数模板。' }
    ],
    howTo: {
      steps: [
        { name: '填写接口地址', text: '输入目标 API 的 URL，并确认请求方法是否正确。' },
        { name: '配置请求参数', text: '根据接口文档设置 Query、Headers、鉴权信息和请求体内容。' },
        { name: '发送并分析响应', text: '点击发送后查看状态码、响应头和返回数据，继续定位参数或鉴权问题。' }
      ]
    }
  },
  'websocket': {
    name: 'WebSocket 测试',
    description: '免费在线 WebSocket 调试工具，适合测试 ws 或 wss 连接、收发实时消息、排查握手失败和事件推送异常。',
    keywords: 'WebSocket测试,WebSocket调试,wss测试,在线Socket工具,WebSocket客户端,实时消息调试,WebSocket怎么连',
    category: '开发调试',
    faq: [
      { q: 'WebSocket 测试工具适合什么场景？', a: '适合调试聊天、通知推送、行情订阅、设备状态同步和任何需要实时双向通信的服务。' },
      { q: 'ws 和 wss 应该怎么选？', a: '测试环境可以用 ws，正式环境和 HTTPS 页面通常更适合使用加密的 wss。' },
      { q: '为什么连接一建立就断开？', a: '常见原因包括握手认证失败、服务端主动断开、路径不正确，或协议和端口配置不匹配。' },
      { q: '能查看服务端返回的消息吗？', a: '可以，工具适合直接观察连接状态、收到的事件消息和发送记录。' }
    ],
    howTo: {
      steps: [
        { name: '输入 WebSocket 地址', text: '填入 ws:// 或 wss:// 开头的服务地址，确认路径和端口正确。' },
        { name: '建立连接并发送消息', text: '点击连接后发送测试消息，观察服务端是否按预期返回。' },
        { name: '根据日志排查问题', text: '结合连接状态、返回消息和错误提示判断是地址、鉴权还是服务端逻辑问题。' }
      ]
    }
  },
  'text-diff': {
    name: '文本对比',
    description: '免费在线文本对比工具，基于 Monaco Diff Editor 提供接近 VS Code 的代码对比体验，支持行内 diff、差异统计、定位跳转、一键格式化和 JSON 重排。',
    keywords: '文本对比,Monaco Diff,代码对比,在线Diff,JSON对比,SQL对比,VSCode diff,配置文件对比,文本差异怎么看',
    category: '开发调试',
    faq: [
      { q: '文本对比工具适合哪些内容？', a: '适合对比代码、JSON、SQL、HTML、XML、YAML、配置文件、接口响应以及文档版本差异。' },
      { q: '支持行内差异和差异定位吗？', a: '支持，可以在双栏或行内模式下查看更细粒度的变更，并通过上一个/下一个差异快速跳转。' },
      { q: '可以一键格式化代码后再比较吗？', a: '可以，适合先统一 JSON、SQL、TS/JS、HTML、CSS、YAML 等代码格式，再更准确地查看真实差异。' },
      { q: 'JSON 重排有什么用？', a: '当两个 JSON 只是字段顺序不同而内容相同时，先重排键名可以更容易看出真正变化。' }
    ],
    howTo: {
      steps: [
        { name: '选择代码类型', text: '根据待比较内容切换为 JSON、SQL、TypeScript、HTML、XML、YAML 或纯文本。' },
        { name: '格式化或重排内容', text: '对左右内容执行一键格式化，JSON 还可以先重排键名，减少无意义的顺序噪音。' },
        { name: '查看并定位差异', text: '在双栏或行内 diff 视图中查看高亮变化，再通过差异导航按钮快速跳转到每一处改动。' }
      ]
    }
  },
  'text-template': {
    name: '文本模板替换',
    description: '免费在线文本模板批量生成工具，适合用变量占位批量生成邮件、SQL、配置、代码片段和运营文案。',
    keywords: '文本模板替换,变量替换,批量生成文本,模板生成器,在线模板工具,批量SQL生成,占位符替换',
    category: '开发调试',
    faq: [
      { q: '文本模板替换工具适合什么场景？', a: '适合批量生成 SQL、接口文档、测试账号、邮件文案、代码片段以及重复性很强的文本内容。' },
      { q: '占位符应该怎么写？', a: '常见做法是在模板里使用统一格式的变量名占位，再为每个变量提供对应值。' },
      { q: '可以一次生成多份文本吗？', a: '可以，这类工具最大的价值就是把一套模板批量套用到多组数据上。' },
      { q: '适合生成代码吗？', a: '适合生成重复结构明显的代码或配置，但复杂逻辑仍建议人工复核。' }
    ],
    howTo: {
      steps: [
        { name: '编写模板内容', text: '先写出基础文本，并用占位符标记会变化的变量位置。' },
        { name: '填写变量数据', text: '逐项输入变量值，或导入多组数据用于批量输出。' },
        { name: '生成并校对结果', text: '批量生成后快速检查拼接效果，再复制到脚本、文档或系统中使用。' }
      ]
    }
  },
  'chmod': {
    name: 'Chmod 计算',
    description: '免费在线 Linux 文件权限计算器，可在数字权限和符号权限之间快速互转，适合理解 755、644、600 等常见权限设置。',
    keywords: 'chmod计算器,Linux权限计算,755权限,644权限,文件权限转换,在线chmod工具,Linux权限怎么设置',
    category: '开发调试',
    faq: [
      { q: '755 和 644 分别是什么意思？', a: '755 常用于目录和可执行脚本，644 常用于普通文件，两者的核心差异在于是否给其他用户执行权限。' },
      { q: '为什么不建议直接用 777？', a: '777 权限过大，容易带来安全风险，除非明确知道场景需要，否则不建议在生产环境随意使用。' },
      { q: '数字权限和符号权限怎么换算？', a: '读、写、执行分别对应 4、2、1，组合起来就能得到 7、6、5、4 等常见权限值。' },
      { q: '适合排查哪些问题？', a: '适合排查脚本无法执行、目录无法访问、上传文件权限异常等 Linux 权限问题。' }
    ],
    howTo: {
      steps: [
        { name: '选择读写执行权限', text: '通过可视化勾选方式设置所有者、用户组和其他用户的权限。' },
        { name: '查看数字与符号结果', text: '工具会同步显示类似 755、644 这样的数字权限，以及 rwxr-xr-x 这样的符号形式。' },
        { name: '复制 chmod 命令', text: '确认无误后把结果复制到终端或部署脚本中直接使用。' }
      ]
    }
  },
  'ua-parser': {
    name: 'UA 解析',
    description: '免费在线 User Agent 解析工具，可快速识别浏览器、系统、设备类型和版本信息，适合排查兼容性和日志来源。',
    keywords: 'UA解析,User Agent解析,浏览器识别,设备识别,在线UA工具,浏览器版本检测,User Agent怎么看',
    category: '开发调试',
    faq: [
      { q: 'UA 解析工具主要看什么？', a: '主要用来看请求来自什么浏览器、操作系统、设备类型，以及大概的客户端版本信息。' },
      { q: '适合哪些排查场景？', a: '适合分析日志来源、处理浏览器兼容问题、识别移动端和桌面端差异，以及核对爬虫请求。' },
      { q: 'User Agent 信息一定可靠吗？', a: '不一定，因为 UA 可以被伪造，所以更适合作为辅助判断，而不是安全校验依据。' },
      { q: '为什么同一浏览器 UA 很长？', a: '现代浏览器为了兼容旧站点和生态，通常会保留很多历史字段，因此 UA 字符串看起来会比较复杂。' }
    ],
    howTo: {
      steps: [
        { name: '获取 UA 字符串', text: '从浏览器开发者工具、访问日志或抓包结果中复制完整的 User Agent 文本。' },
        { name: '粘贴进行解析', text: '把字符串放入工具中，等待浏览器、系统和设备信息自动拆分。' },
        { name: '结合日志排查问题', text: '根据解析结果继续判断兼容性异常、设备适配问题或访问来源特征。' }
      ]
    }
  },
  'docker-convert': {
    name: 'Docker 转换',
    description: '免费在线 Docker 命令与 Compose 配置互转工具，适合把 docker run 快速整理成 docker-compose.yml，或反向生成命令。',
    keywords: 'docker run转compose,docker compose转换,Docker命令转换,在线Docker工具,docker-compose生成,compose怎么写',
    category: '开发调试',
    faq: [
      { q: 'docker run 转 compose 适合什么场景？', a: '适合把临时测试命令整理成可维护的配置文件，便于团队协作、版本管理和多环境部署。' },
      { q: '转换后还能直接运行吗？', a: '多数常见参数都可以直接映射，但卷路径、网络名和环境变量仍建议按实际环境再核对一次。' },
      { q: '支持哪些 Docker 参数？', a: '常见的端口映射、卷挂载、环境变量、网络、重启策略等参数都很适合做日常转换。' },
      { q: '反向把 compose 转成命令有什么用？', a: '适合快速生成一条可复制的测试命令，方便本地临时启动和验证配置。' }
    ],
    howTo: {
      steps: [
        { name: '输入命令或配置', text: '把 docker run 命令或 docker-compose.yml 内容粘贴到输入区。' },
        { name: '选择转换方向', text: '根据当前需求选择 run 转 compose，或 compose 转 run。' },
        { name: '检查并复制结果', text: '确认卷、端口、环境变量等映射正确后，再复制到项目或终端中使用。' }
      ]
    }
  },
  'qrcode': {
    name: '二维码生成',
    description: '免费在线二维码生成器，支持文本、网址等内容快速生成二维码，并可自定义尺寸、颜色、Logo 和下载格式。',
    keywords: '二维码生成,在线二维码生成器,QR Code生成,自定义二维码,二维码下载,带Logo二维码,二维码怎么生成',
    category: '实用工具',
    faq: [
      { q: '二维码生成器适合哪些内容？', a: '适合生成网址、文案、联系方式、活动海报跳转链接、下载地址以及简单文本信息。' },
      { q: '可以自定义二维码样式吗？', a: '可以，常见的尺寸、颜色和 Logo 添加需求通常都能满足。' },
      { q: '二维码会过期吗？', a: '如果内容本身不变，静态二维码一般不会过期；真正失效的通常是二维码里承载的网址或业务链接。' },
      { q: '下载 PNG 和 SVG 有什么区别？', a: 'PNG 适合直接分享和插入文档，SVG 更适合放大使用或做二次设计。' }
    ],
    howTo: {
      steps: [
        { name: '输入二维码内容', text: '把网址、文本或联系方式等需要编码的信息输入到工具中。' },
        { name: '调整样式参数', text: '按需设置尺寸、颜色、Logo 或容错等级，让二维码更适合实际使用场景。' },
        { name: '下载并投放使用', text: '确认扫码无误后下载 PNG 或 SVG，继续用于海报、页面或文档中。' }
      ]
    }
  },
  'color': {
    name: '颜色转换',
    description: '免费在线颜色转换工具，支持 HEX、RGB、HSL 等常用颜色格式互转，适合前端开发、设计协作和样式调试。',
    keywords: '颜色转换,HEX转RGB,RGB转HSL,在线取色器,颜色代码转换,CSS颜色工具,颜色格式怎么转',
    category: '实用工具',
    faq: [
      { q: 'HEX、RGB、HSL 分别适合什么场景？', a: 'HEX 常用于前端样式书写，RGB 适合更直观地看三通道数值，HSL 更适合做亮度和饱和度调整。' },
      { q: '为什么设计稿和代码里的颜色看起来不一样？', a: '可能是颜色空间、透明度、深浅模式或复制格式不一致导致，建议统一用同一颜色格式核对。' },
      { q: '适合做哪些开发工作？', a: '适合写 CSS、调色板配置、设计交付核对，以及快速生成同色系样式。' },
      { q: '可以直接复制结果到 CSS 吗？', a: '可以，把目标格式复制到样式文件或组件变量中即可继续使用。' }
    ],
    howTo: {
      steps: [
        { name: '输入或选择颜色', text: '通过颜色选择器、HEX、RGB 或 HSL 任一种方式输入颜色值。' },
        { name: '查看多格式结果', text: '工具会同步显示各类颜色格式，方便你在设计和开发之间切换。' },
        { name: '复制到样式代码', text: '选中最适合当前项目的颜色格式，复制到 CSS、Tailwind 配置或设计文档中。' }
      ]
    }
  },
  'number-base': {
    name: '进制转换',
    description: '免费在线进制转换工具，支持二进制、八进制、十进制、十六进制互转，适合调试位运算、颜色值、权限值和协议数据。',
    keywords: '进制转换,二进制转换,十六进制转换,八进制转换,十进制转换,在线进制工具,0x转换,进制怎么换算',
    category: '实用工具',
    faq: [
      { q: '进制转换工具适合哪些开发场景？', a: '适合调试位运算、查看十六进制数据、处理颜色值、解析协议字段和核对文件权限数值。' },
      { q: '可以输入 0x、0b 这类前缀吗？', a: '可以，常见前缀格式通常都能直接识别，适合从代码或日志中原样复制进来。' },
      { q: '负数也能转换吗？', a: '可以，带负号的数值也适合做常见进制互转。' },
      { q: '十六进制字母大小写有影响吗？', a: '一般没有，A-F 和 a-f 通常都会按同样的十六进制值处理。' }
    ],
    howTo: {
      steps: [
        { name: '输入任意进制数值', text: '把待转换的二进制、八进制、十进制或十六进制内容输入到对应框中。' },
        { name: '自动查看其它进制', text: '工具会同步计算其余进制结果，方便你横向比对。' },
        { name: '复制到代码或文档', text: '把需要的进制格式复制到脚本、配置、接口文档或调试记录中继续使用。' }
      ]
    }
  }
};

const domain = 'https://toolstack.juvvv.com';
const distDir = path.resolve(__dirname, '../dist');
const clientDir = path.join(distDir, 'client');
const toolDir = path.join(clientDir, 'tool');
const ogDir = path.join(clientDir, 'og');
const buildDate = new Date().toISOString().split('T')[0];

// 读取 index.html 模板
const indexHtml = fs.readFileSync(path.join(clientDir, 'index.html'), 'utf-8');

// 确保 tool 目录存在
if (!fs.existsSync(toolDir)) {
  fs.mkdirSync(toolDir, { recursive: true });
}

if (!fs.existsSync(ogDir)) {
  fs.mkdirSync(ogDir, { recursive: true });
}

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function stripHtml(value = '') {
  return String(value).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function replaceTemplatePlaceholders(html, replacements) {
  return html
    .replace('<!-- TITLE_PLACEHOLDER -->', replacements.title || '')
    .replace('<!-- DESC_PLACEHOLDER -->', replacements.description || '')
    .replace('<!-- KEYWORDS_PLACEHOLDER -->', replacements.keywords || '')
    .replace('<!-- CANONICAL_PLACEHOLDER -->', replacements.canonical || '')
    .replace('<!-- OG_PLACEHOLDER -->', replacements.og || '')
    .replace('<!-- TWITTER_PLACEHOLDER -->', replacements.twitter || '')
    .replace('<!-- JSONLD_PLACEHOLDER -->', replacements.jsonLd || '');
}

function buildKeywordSet(items) {
  return Array.from(
    new Set(
      items
        .flatMap((item) => String(item).split(','))
        .map((item) => item.trim())
        .filter(Boolean)
    )
  );
}

const categoryIntentKeywords = {
  '格式化': ['在线格式化工具', '数据格式化', '开发调试工具', '怎么格式化', '格式校验'],
  '编解码': ['在线编解码工具', '编码解码', '字符串转换', '参数处理', '怎么解码'],
  '安全加密': ['在线安全工具', '加密解密', '哈希校验', '认证调试', '安全开发'],
  '开发调试': ['在线调试工具', '开发辅助工具', '接口调试', '开发效率工具', '怎么测试'],
  '实用工具': ['在线实用工具', '开发小工具', '效率工具', '格式转换', '常用工具'],
};

function expandToolKeywords(config) {
  const baseKeywords = buildKeywordSet([
    config.keywords,
    config.name,
    `${config.name}在线工具`,
    `免费${config.name}`,
    `${config.name}怎么用`,
    `${config.name}教程`,
    `${config.category}工具`,
    ...(categoryIntentKeywords[config.category] || []),
    'ToolStack',
    '开发者工具',
    '在线工具',
  ]);

  return baseKeywords.join(',');
}

function createOgImageSvg({ title, subtitle, accentFrom, accentTo, badge }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-label="${escapeHtml(title)}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#1e293b"/>
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${accentFrom}"/>
      <stop offset="100%" stop-color="${accentTo}"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="24" stdDeviation="24" flood-color="#020617" flood-opacity="0.28"/>
    </filter>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <circle cx="1030" cy="88" r="220" fill="${accentTo}" opacity="0.18"/>
  <circle cx="180" cy="560" r="240" fill="${accentFrom}" opacity="0.14"/>
  <rect x="64" y="54" width="1072" height="522" rx="32" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.12)" filter="url(#shadow)"/>
  <rect x="96" y="92" width="170" height="40" rx="20" fill="url(#accent)"/>
  <text x="181" y="118" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="20" font-weight="700" fill="#ffffff">${escapeHtml(badge)}</text>
  <text x="96" y="214" font-family="Arial, Helvetica, sans-serif" font-size="66" font-weight="800" fill="#f8fafc">${escapeHtml(title)}</text>
  <text x="96" y="278" font-family="Arial, Helvetica, sans-serif" font-size="30" font-weight="500" fill="#cbd5e1">${escapeHtml(subtitle)}</text>
  <rect x="96" y="328" width="330" height="10" rx="5" fill="url(#accent)"/>
  <text x="96" y="410" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="600" fill="#e2e8f0">ToolStack</text>
  <text x="96" y="454" font-family="Arial, Helvetica, sans-serif" font-size="24" font-weight="400" fill="#94a3b8">免费在线开发者工具箱</text>
  <text x="96" y="516" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="400" fill="#94a3b8">JSON · SQL · Base64 · Hash · JWT · QR Code</text>
</svg>`;
}

function writeOgImage(fileName, options) {
  const outputPath = path.join(ogDir, fileName);
  fs.writeFileSync(outputPath, createOgImageSvg(options));
  return `${domain}/og/${fileName}`;
}

function getBaseSchemas() {
  return [
    {
      '@type': 'Organization',
      '@id': `${domain}/#organization`,
      name: 'ToolStack',
      url: domain,
      logo: {
        '@type': 'ImageObject',
        url: `${domain}/logo.svg`,
      },
    },
    {
      '@type': 'WebSite',
      '@id': `${domain}/#website`,
      name: 'ToolStack',
      alternateName: 'ToolStack 开发者工具箱',
      url: domain,
      description: 'ToolStack 是免费的开发者在线工具箱，提供 JSON、SQL、Base64、哈希、JWT、二维码等开发常用工具。',
      publisher: {
        '@id': `${domain}/#organization`,
      },
      inLanguage: 'zh-CN',
      potentialAction: {
        '@type': 'SearchAction',
        target: `${domain}/?search={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    },
  ];
}

/**
 * 生成 SEO meta 标签
 */
function generateSeoMeta(config, toolUrl) {
  const pageTitle = `${config.name} - ${config.category} | ToolStack`;
  const pageDesc = config.description;
  const keywords = expandToolKeywords(config);
  const ogImageUrl = writeOgImage(`${toolUrl.split('/').pop()}.svg`, {
    title: config.name,
    subtitle: pageDesc.length > 34 ? `${pageDesc.slice(0, 34)}...` : pageDesc,
    accentFrom: '#22c55e',
    accentTo: '#6366f1',
    badge: config.category,
  });
  const cleanFaq = (config.faq || []).map((item) => ({
    q: stripHtml(item.q),
    a: stripHtml(item.a),
  }));

  const schemaGraph = [
    ...getBaseSchemas(),
    {
      '@type': 'WebPage',
      '@id': `${toolUrl}#webpage`,
      name: config.name,
      description: config.description,
      url: toolUrl,
      inLanguage: 'zh-CN',
      datePublished: '2024-01-01',
      dateModified: buildDate,
      breadcrumb: {
        '@id': `${toolUrl}#breadcrumb`,
      },
      isPartOf: {
        '@id': `${domain}/#website`,
      },
      about: {
        '@id': `${toolUrl}#software`,
      },
      primaryImageOfPage: {
        '@type': 'ImageObject',
        url: ogImageUrl,
      },
    },
    {
      '@type': 'SoftwareApplication',
      '@id': `${toolUrl}#software`,
      name: config.name,
      description: config.description,
      applicationCategory: 'DeveloperApplication',
      operatingSystem: 'Any',
      browserRequirements: 'Requires JavaScript. Works in modern browsers.',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'CNY',
      },
      featureList: [
        config.name,
        ...((config.howTo?.steps || []).map((step) => step.name)),
      ],
      publisher: {
        '@id': `${domain}/#organization`,
      },
      isAccessibleForFree: true,
      url: toolUrl,
    },
    {
      '@type': 'BreadcrumbList',
      '@id': `${toolUrl}#breadcrumb`,
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: '首页',
          item: domain,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: config.category,
          item: `${domain}/#${encodeURIComponent(config.category)}`,
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: config.name,
          item: toolUrl,
        },
      ],
    },
  ];

  // 添加 HowTo Schema（如果有步骤）
  if (config.howTo && config.howTo.steps) {
    schemaGraph.push({
      '@type': 'HowTo',
      '@id': `${toolUrl}#howto`,
      name: `如何使用 ${config.name}`,
      description: `${config.name}的使用步骤`,
      totalTime: 'PT1M',
      inLanguage: 'zh-CN',
      step: config.howTo.steps.map((step, index) => ({
        '@type': 'HowToStep',
        position: index + 1,
        name: step.name,
        text: stripHtml(step.text),
        url: `${toolUrl}#step-${index + 1}`,
      })),
    });
  }

  // 添加 FAQPage Schema（如果有 FAQ）
  if (cleanFaq.length > 0) {
    schemaGraph.push({
      '@type': 'FAQPage',
      '@id': `${toolUrl}#faq`,
      mainEntity: cleanFaq.map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.a,
        },
      })),
    });
  }

  // 合并为 @graph 格式
  const finalJsonLd = {
    "@context": "https://schema.org",
    "@graph": schemaGraph
  };

  // SEO Meta 标签
  return {
    titleTag: `<title>${escapeHtml(pageTitle)}</title>`,
    descriptionTag: `<meta name="description" content="${escapeHtml(pageDesc)}" />`,
    keywordsTag: `<meta name="keywords" content="${escapeHtml(keywords)}" />`,
    canonicalTag: `<link rel="canonical" href="${toolUrl}" />
    <link rel="alternate" hreflang="zh-CN" href="${toolUrl}" />
    <link rel="alternate" hreflang="x-default" href="${toolUrl}" />`,
    extraMetaTags: `
    <meta name="application-name" content="ToolStack" />
    <meta name="article:section" content="${escapeHtml(config.category)}" />`,
    ogTags: `
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="ToolStack" />
    <meta property="og:title" content="${escapeHtml(pageTitle)}" />
    <meta property="og:description" content="${escapeHtml(pageDesc)}" />
    <meta property="og:url" content="${toolUrl}" />
    <meta property="og:image" content="${ogImageUrl}" />
    <meta property="og:image:alt" content="${escapeHtml(config.name)} 页面预览图" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:locale" content="zh_CN" />`,
    twitterTags: `
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(pageTitle)}" />
    <meta name="twitter:description" content="${escapeHtml(pageDesc)}" />
    <meta name="twitter:image" content="${ogImageUrl}" />
    <meta name="twitter:image:alt" content="${escapeHtml(config.name)} 页面预览图" />`,
    jsonLdTag: `<script type="application/ld+json">
${JSON.stringify(finalJsonLd, null, 2)}
    </script>`,
  };
}

/**
 * 生成 FAQ HTML 内容（对 AI 可见）
 */
function generateFaqHtml(config) {
  const faq = config.faq || [];
  const steps = config.howTo?.steps || [];
  if (faq.length === 0 && steps.length === 0) return '';
  
  return `
<section class="seo-content-block" style="max-width:960px;margin:32px auto 0;padding:0 16px 32px;">
  <div style="border:1px solid #e2e8f0;border-radius:16px;background:#fff;padding:20px;box-shadow:0 8px 24px rgba(15,23,42,0.06);">
    <h2 style="font-size:20px;line-height:1.4;margin-bottom:12px;color:#0f172a;">${escapeHtml(config.name)}使用说明</h2>
    <p style="font-size:14px;line-height:1.8;color:#475569;margin-bottom:16px;">${escapeHtml(config.description)}</p>
    ${steps.length > 0 ? `
    <div style="margin-bottom:16px;">
      <h3 style="font-size:16px;margin-bottom:10px;color:#0f172a;">使用步骤</h3>
      <ol style="padding-left:20px;color:#475569;line-height:1.8;">
        ${steps.map((step, index) => `<li id="step-${index + 1}" style="margin-bottom:8px;"><strong>${escapeHtml(step.name)}：</strong>${escapeHtml(stripHtml(step.text))}</li>`).join('')}
      </ol>
    </div>
    ` : ''}
    ${faq.length > 0 ? `
    <div>
      <h3 style="font-size:16px;margin-bottom:10px;color:#0f172a;">常见问题</h3>
      <div style="display:grid;gap:10px;">
        ${faq.map(item => `
        <details style="border:1px solid #e2e8f0;border-radius:12px;padding:12px 14px;background:#f8fafc;">
          <summary style="cursor:pointer;font-weight:600;color:#0f172a;">${escapeHtml(stripHtml(item.q))}</summary>
          <p style="margin-top:10px;color:#475569;line-height:1.8;">${escapeHtml(stripHtml(item.a))}</p>
        </details>
        `).join('')}
      </div>
    </div>
    ` : ''}
  </div>
</section>
`;
}

// 生成每个工具的SEO页面
Object.entries(toolsConfig).forEach(([toolId, config]) => {
  const toolUrl = `${domain}/tool/${toolId}`;
  const seo = generateSeoMeta(config, toolUrl);
  let toolHtml = replaceTemplatePlaceholders(indexHtml, {
    title: seo.titleTag,
    description: `${seo.descriptionTag}${seo.extraMetaTags}`,
    keywords: seo.keywordsTag,
    canonical: seo.canonicalTag,
    og: seo.ogTags,
    twitter: seo.twitterTags,
    jsonLd: seo.jsonLdTag,
  });

  // 添加 FAQ HTML 内容（在 </body> 前）
  const faqHtml = generateFaqHtml(config);
  toolHtml = toolHtml.replace('</body>', `${faqHtml}\n  </body>`);

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
const homeTitle = 'ToolStack - 开发者在线工具箱 | JSON格式化 SQL优化 Base64编解码等25+工具';
const homeDesc = 'ToolStack 是现代化开发者工具集合，包含25+实用工具：JSON/SQL格式化、Base64编解码、哈希计算、RSA加密、二维码生成等。界面简洁，支持深色模式，免费在线使用。';
const homeKeywords = buildKeywordSet([
  '开发者工具,在线工具,JSON格式化,SQL格式化,SQL优化,Base64编解码,哈希计算,RSA加密,二维码生成,JWT解码,时间戳转换',
  ...Object.values(toolsConfig).flatMap((tool) => [tool.name, tool.keywords, `免费${tool.name}`, `${tool.name}在线工具`]),
]).join(',');

const homeJsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    ...getBaseSchemas(),
    {
      '@type': 'CollectionPage',
      '@id': `${domain}/#collection`,
      name: 'ToolStack 开发者在线工具箱',
      description: homeDesc,
      url: `${domain}/`,
      inLanguage: 'zh-CN',
      isPartOf: {
        '@id': `${domain}/#website`,
      },
      about: {
        '@id': `${domain}/#organization`,
      },
      mainEntity: {
        '@id': `${domain}/#tool-list`,
      },
    },
    {
      '@type': 'ItemList',
      '@id': `${domain}/#tool-list`,
      name: 'ToolStack 工具列表',
      itemListOrder: 'https://schema.org/ItemListOrderAscending',
      numberOfItems: Object.keys(toolsConfig).length,
      itemListElement: Object.entries(toolsConfig).map(([id, tool], index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: `${domain}/tool/${id}`,
        name: tool.name,
        description: tool.description,
      })),
    },
  ],
};

const homeOgImageUrl = writeOgImage('home.svg', {
  title: 'ToolStack',
  subtitle: '开发者在线工具箱',
  accentFrom: '#06b6d4',
  accentTo: '#6366f1',
  badge: '25+ 实用工具',
});

let homeHtml = replaceTemplatePlaceholders(indexHtml, {
  title: `<title>${escapeHtml(homeTitle)}</title>`,
  description: `<meta name="description" content="${escapeHtml(homeDesc)}" />
  <meta name="application-name" content="ToolStack" />`,
  keywords: `<meta name="keywords" content="${escapeHtml(homeKeywords)}" />`,
  canonical: `<link rel="canonical" href="${domain}/" />
  <link rel="alternate" hreflang="zh-CN" href="${domain}/" />
  <link rel="alternate" hreflang="x-default" href="${domain}/" />`,
  og: `
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="ToolStack" />
  <meta property="og:title" content="ToolStack - 开发者在线工具箱 | JSON/SQL格式化 Base64编解码等" />
  <meta property="og:description" content="${escapeHtml(homeDesc)}" />
  <meta property="og:url" content="${domain}/" />
  <meta property="og:image" content="${homeOgImageUrl}" />
  <meta property="og:image:alt" content="ToolStack 开发者工具箱首页预览图" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:locale" content="zh_CN" />`,
  twitter: `
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="ToolStack - 开发者在线工具箱 | 25+实用工具集合" />
  <meta name="twitter:description" content="${escapeHtml(homeDesc)}" />
  <meta name="twitter:image" content="${homeOgImageUrl}" />
  <meta name="twitter:image:alt" content="ToolStack 开发者工具箱首页预览图" />`,
  jsonLd: `<script type="application/ld+json">
${JSON.stringify(homeJsonLd, null, 2)}
  </script>`,
});

homeHtml = homeHtml.replace('</body>', `
<section class="seo-home-directory" style="max-width:1120px;margin:40px auto 0;padding:0 16px 40px;">
  <div style="border:1px solid #e2e8f0;border-radius:20px;background:#fff;padding:24px;box-shadow:0 10px 30px rgba(15,23,42,0.06);">
    <h2 style="font-size:24px;line-height:1.4;margin-bottom:10px;color:#0f172a;">ToolStack 工具目录</h2>
    <p style="font-size:14px;line-height:1.8;color:#475569;margin-bottom:18px;">${escapeHtml(homeDesc)}</p>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px;">
      ${Object.entries(toolsConfig).map(([id, tool]) => `
      <a href="${domain}/tool/${id}" style="display:block;border:1px solid #e2e8f0;border-radius:14px;padding:14px 16px;text-decoration:none;background:#f8fafc;">
        <strong style="display:block;color:#0f172a;margin-bottom:6px;">${escapeHtml(tool.name)}</strong>
        <span style="display:block;color:#475569;font-size:13px;line-height:1.7;">${escapeHtml(tool.description)}</span>
      </a>
      `).join('')}
    </div>
  </div>
</section>
</body>`);

fs.writeFileSync(path.join(clientDir, 'index.html'), homeHtml);
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
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${sitemapEntries.map(entry => `  <url>
    <loc>${entry.url}</loc>
    <lastmod>${buildDate}</lastmod>
    <xhtml:link rel="alternate" hreflang="zh-CN" href="${entry.url}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${entry.url}" />
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

fs.writeFileSync(path.join(clientDir, 'sitemap.xml'), sitemap);
console.log(`✓ Generated: sitemap.xml`);

// 生成 robots.txt - 针对 AI 爬虫优化
const robots = `# 通用爬虫规则
User-agent: *
Allow: /
Disallow: /api/

# AI 爬虫规则 - 允许主流 AI 搜索引擎抓取
User-agent: GPTBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: Claude-Web
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: anthropic-ai
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: BingPreview
Allow: /

User-agent: DuckDuckBot
Allow: /

User-agent: Baiduspider
Allow: /

# 抓取频率限制
Crawl-delay: 1

# 站点地图
Sitemap: ${domain}/sitemap.xml
`;
fs.writeFileSync(path.join(clientDir, 'robots.txt'), robots);
console.log(`✓ Generated: robots.txt`);

console.log(`\n✅ SSR SEO优化完成！共生成 ${Object.keys(toolsConfig).length * 2 + 1} 个页面`);
console.log(`   - ${Object.keys(toolsConfig).length} 个工具页面（HTML + index）`);
console.log(`   - 1 个首页`);
console.log(`   - 1 个 Sitemap`);
console.log(`   - 1 个 Robots.txt`);
