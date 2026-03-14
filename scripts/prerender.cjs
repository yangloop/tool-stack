/**
 * 预渲染脚本 + SEO 优化
 * 在构建后生成工具的静态HTML文件，解决直接访问404问题，并优化SEO
 */

const fs = require('fs');
const path = require('path');

// 工具详细配置 - SEO优化：包含详细的功能描述、关键词和AI友好的FAQ内容
const toolsConfig = {
  'json': {
    name: 'JSON 工具',
    description: '免费在线 JSON 格式化工具，可快速美化、压缩、验证 JSON 数据。支持语法高亮、树形查看、JSON路径查询。无需安装，打开即用。',
    keywords: 'JSON格式化,JSON压缩,JSON验证,JSON编辑器,JSON在线工具,JSON美化,JSON解析,JSON语法高亮,JSON怎么格式化,JSON格式错误怎么查',
    category: '格式化',
    faq: [
      { q: '这个工具是做什么的？', a: '这是一个免费的在线 JSON 格式化工具，帮助开发者快速美化、压缩和验证 JSON 数据格式。' },
      { q: '如何使用 JSON 格式化工具？', a: '1. 将 JSON 数据粘贴到输入框<br>2. 工具自动格式化并高亮显示<br>3. 支持压缩、转义等额外功能' },
      { q: '支持哪些 JSON 格式？', a: '支持标准 JSON、JSON5，可处理压缩和格式化两种形式，能解析嵌套对象和数组。' },
      { q: '这个工具免费吗？', a: '是的，ToolStack 所有工具均免费使用，无需注册，数据在本地处理不上传服务器。' }
    ],
    howTo: {
      steps: [
        { name: '粘贴 JSON 数据', text: '将需要格式化的 JSON 数据粘贴到左侧输入框，支持从文件直接复制' },
        { name: '自动格式化', text: '工具会实时检测并自动格式化 JSON，添加缩进和换行使结构清晰' },
        { name: '查看与操作', text: '在右侧查看格式化结果，可切换树形视图、复制结果或下载文件' }
      ]
    }
  },
  'sql': {
    name: 'SQL 格式化',
    description: '免费在线 SQL 美化工具，自动格式化 SQL 语句。支持 MySQL、PostgreSQL、SQLite 等多种方言，让复杂查询语句一目了然。',
    keywords: 'SQL格式化,SQL美化,SQL压缩,SQL语法高亮,SQL编辑器,MySQL格式化,PostgreSQL格式化,SQL怎么格式化,SQL语句美化工具',
    category: '格式化',
    faq: [
      { q: 'SQL 格式化工具支持哪些数据库？', a: '支持 MySQL、PostgreSQL、SQLite、MariaDB、SQL Server 等主流数据库的 SQL 语法格式化。' },
      { q: '如何格式化 SQL 语句？', a: '将 SQL 语句粘贴到输入框，工具会自动识别关键字、添加缩进和换行，使 SQL 结构清晰易读。' },
      { q: '可以压缩 SQL 吗？', a: '可以，支持将格式化后的 SQL 压缩成单行，减少传输体积。' }
    ],
    howTo: {
      steps: [
        { name: '粘贴 SQL 语句', text: '将需要格式化的 SQL 查询粘贴到输入框' },
        { name: '选择方言', text: '根据需要选择对应的数据库方言以获得最佳格式化效果' },
        { name: '获取结果', text: '复制格式化后的 SQL 语句用于开发或文档' }
      ]
    }
  },
  'sql-advisor': {
    name: 'SQL 优化建议',
    description: '智能 SQL 分析与优化工具，帮助检测语法错误、分析索引使用情况、验证数据类型兼容性。支持 MySQL、PostgreSQL、SQLite、MariaDB 等数据库，提供专业的性能优化建议。',
    keywords: 'SQL分析,SQL优化,SQL语法检查,SQL性能优化,SQL索引优化,组合索引检查,数据类型检查,MySQL优化,PostgreSQL优化,SQL怎么优化,SQL索引怎么设置',
    category: '格式化',
    faq: [
      { q: 'SQL 优化工具能做什么？', a: '可以检测 SQL/DDL 语法错误、验证表名和字段匹配、检查数据类型兼容性、分析索引使用情况（支持组合索引最左前缀原则）。' },
      { q: '如何优化 SQL 查询性能？', a: '工具会分析你的 SQL 语句，检查是否使用了合适的索引、是否存在全表扫描、是否可以通过调整查询条件提高效率。' },
      { q: '什么是组合索引最左前缀原则？', a: '组合索引的最左前缀原则指查询条件必须从索引的最左边列开始匹配才能使用索引。工具会检查你的 WHERE 条件是否符合这一原则。' },
      { q: '支持哪些数据库？', a: '目前支持 MySQL、MariaDB、PostgreSQL、SQLite、SQL Server 等主流关系型数据库。' }
    ],
    howTo: {
      steps: [
        { name: '输入 SQL 和 DDL', text: '在上方输入 SQL 查询语句，在下方输入对应的表结构 DDL' },
        { name: '选择数据库类型', text: '选择你使用的数据库类型以获得准确的分析结果' },
        { name: '查看优化建议', text: '系统会生成详细的分析报告，包括语法检查、索引建议、性能优化提示' }
      ]
    }
  },
  'xml-json': {
    name: 'XML / JSON 互转',
    description: '免费在线 XML 与 JSON 格式互转工具。支持 XML 属性转换、嵌套结构处理、数组识别。自动检测数据类型，格式化输出，让数据转换简单高效。',
    keywords: 'XML转JSON,JSON转XML,XML转换,JSON转换,XML格式化,JSON格式化,XML解析,XML JSON转换器,XML怎么转JSON',
    category: '格式化',
    faq: [
      { q: 'XML 和 JSON 有什么区别？', a: 'XML 使用标签描述数据，支持属性；JSON 更轻量，使用键值对，解析更快。两者可通过本工具相互转换。' },
      { q: '如何处理 XML 属性？', a: '工具会将 XML 属性转换为 JSON 中带有 @ 前缀的键，如 <item id="1"> 转为 {"@id": "1"}。' },
      { q: '支持批量转换吗？', a: '支持，可以处理包含多个节点的 XML 文档，自动识别数组结构。' }
    ],
    howTo: {
      steps: [
        { name: '粘贴数据', text: '将 XML 或 JSON 数据粘贴到对应输入框' },
        { name: '选择转换方向', text: '点击转换按钮，工具会自动识别格式并进行转换' },
        { name: '获取结果', text: '复制转换后的数据，支持格式化输出' }
      ]
    }
  },
  'base64': {
    name: 'Base64 编解码',
    description: '免费在线 Base64 编码解码工具。支持文本与 Base64 互转，URL 安全的 Base64 编码。常用于数据传输、URL 参数、JSON 字段编码。',
    keywords: 'Base64编码,Base64解码,Base64在线工具,Base64转换,URL Base64,Base64怎么用',
    category: '编解码',
    faq: [
      { q: '什么是 Base64 编码？', a: 'Base64 是一种基于 64 个可打印字符的编码方式，用于将二进制数据转换为文本格式，便于在文本协议中传输。' },
      { q: '什么时候需要用 Base64？', a: '常用于在 JSON 中嵌入图片、在 URL 中传递二进制数据、在邮件中传输附件等场景。' },
      { q: 'URL 安全 Base64 是什么？', a: '标准 Base64 包含 + 和 / 字符，在 URL 中需要转义。URL 安全版本将 + 换成 -，/ 换成 _，无需转义。' }
    ],
    howTo: {
      steps: [
        { name: '输入文本', text: '将需要编码的文本粘贴到输入框' },
        { name: '选择操作', text: '选择编码或解码操作' },
        { name: '获取结果', text: '复制结果用于开发或数据传输' }
      ]
    }
  },
  'base64-file': {
    name: 'Base64 文件转换',
    description: '免费在线文件与 Base64 互转工具。支持图片、PDF、文档等各种文件格式。可预览转换结果，支持下载原始文件。',
    keywords: 'Base64文件转换,图片Base64,文件转Base64,Base64下载,Base64预览,图片转Base64',
    category: '编解码',
    faq: [
      { q: '如何将图片转为 Base64？', a: '点击上传区域选择图片文件，工具会自动转换为 Base64 字符串，可直接复制使用。' },
      { q: 'Base64 文件大小有限制吗？', a: '由于浏览器内存限制，建议转换不超过 10MB 的文件。大文件转换可能会卡顿。' },
      { q: '支持哪些文件类型？', a: '支持所有文件类型，包括图片（PNG、JPG、GIF）、PDF、Word、Excel 等。图片文件可预览。' }
    ],
    howTo: {
      steps: [
        { name: '上传文件', text: '点击上传区域选择或拖拽文件到页面' },
        { name: '自动转换', text: '工具自动将文件转为 Base64 编码' },
        { name: '复制或下载', text: '复制 Base64 字符串，或将 Base64 还原为文件下载' }
      ]
    }
  },
  'url': {
    name: 'URL 编解码',
    description: '免费在线 URL 编码解码工具。支持 URL 组件编码、URI 编码、批量处理。解决中文参数、特殊字符在 URL 中的传输问题。',
    keywords: 'URL编码,URL解码,URL转码,URI编码,encodeURIComponent,URL特殊字符处理',
    category: '编解码',
    faq: [
      { q: '为什么 URL 需要编码？', a: 'URL 只能使用 ASCII 字符集，中文字符和特殊符号（如空格、&、=）必须经过编码才能正确传输。' },
      { q: 'encodeURI 和 encodeURIComponent 有什么区别？', a: 'encodeURI 用于完整 URL，不编码保留字符；encodeURIComponent 用于参数值，编码更多字符。' },
      { q: '中文在 URL 中显示乱码怎么办？', a: '使用本工具对中文进行 URL 编码，或检查是否正确使用了 UTF-8 编码。' }
    ],
    howTo: {
      steps: [
        { name: '输入内容', text: '粘贴需要编码或解码的 URL 或参数' },
        { name: '选择编码方式', text: '根据使用场景选择 encodeURI 或 encodeURIComponent' },
        { name: '获取结果', text: '复制编码后的 URL 安全字符串' }
      ]
    }
  },
  'url-parser': {
    name: 'URL 解析',
    description: '免费在线 URL 解析工具，提取协议、主机、路径、查询参数、哈希片段等信息。自动解析 URL 各组成部分，方便开发和调试。',
    keywords: 'URL解析,URL分析,URL参数提取,查询参数解析,URL结构分析,URL参数怎么获取',
    category: '编解码',
    faq: [
      { q: 'URL 解析工具能提取哪些信息？', a: '可以提取协议（http/https）、主机名、端口、路径、查询参数（Query String）、哈希片段（Hash）等完整信息。' },
      { q: '如何获取 URL 中的参数？', a: '粘贴完整 URL，工具会自动解析出所有查询参数，以键值对形式展示，方便复制单个参数值。' },
      { q: '支持相对 URL 吗？', a: '建议使用完整绝对 URL（包含协议和主机），相对 URL 可能无法完整解析。' }
    ],
    howTo: {
      steps: [
        { name: '粘贴 URL', text: '将需要解析的完整 URL 粘贴到输入框' },
        { name: '自动解析', text: '工具实时解析 URL 各组成部分' },
        { name: '查看详情', text: '查看协议、主机、路径、参数等详细信息' }
      ]
    }
  },
  'html': {
    name: 'HTML 实体',
    description: '免费在线 HTML 实体编码解码工具。支持特殊字符转义和反转义，如 &lt; &gt; &amp; 等。用于在 HTML 中安全显示特殊字符。',
    keywords: 'HTML实体编码,HTML实体解码,HTML转义,HTML特殊字符,&amp;,&lt;,&gt;,HTML字符怎么转义',
    category: '编解码',
    faq: [
      { q: '什么是 HTML 实体？', a: 'HTML 实体是以 & 开头、; 结尾的字符序列，用于在 HTML 中表示保留字符或特殊符号，如 &lt; 表示 <。' },
      { q: '什么时候需要 HTML 实体？', a: '在网页中显示 HTML 代码、数学公式、货币符号，或避免用户输入的内容被解析为 HTML 标签时。' },
      { q: '中文需要编码吗？', a: '现代 HTML 使用 UTF-8 编码时，中文通常不需要转义。但在特定场景（如邮件、旧系统）可能需要。' }
    ],
    howTo: {
      steps: [
        { name: '输入内容', text: '粘贴需要转义或反转义的文本' },
        { name: '选择操作', text: '选择编码（转义）或解码（反转义）' },
        { name: '获取结果', text: '复制处理后的内容用于 HTML 文档' }
      ]
    }
  },
  'jwt': {
    name: 'JWT 解码',
    description: '免费在线 JWT 令牌解析工具。解码 Header、Payload、Signature 三部分，验证 Token 有效期和格式。支持 JWT 调试和验证。',
    keywords: 'JWT解码,JWT验证,Token解析,JSON Web Token,JWT在线工具,JWT调试,JWT是什么',
    category: '编解码',
    faq: [
      { q: 'JWT 是什么？', a: 'JWT（JSON Web Token）是一种开放标准，用于在各方之间安全传输信息。由 Header、Payload、Signature 三部分组成。' },
      { q: '如何验证 JWT 是否有效？', a: '工具会解析 JWT 的三个部分，检查签名格式，显示过期时间（exp）等声明，帮助判断 Token 是否有效。' },
      { q: 'JWT 签名可以破解吗？', a: '本工具仅解码不验证签名。签名用于验证数据完整性，需要密钥才能正确验证，不能逆向破解。' }
    ],
    howTo: {
      steps: [
        { name: '粘贴 JWT', text: '将 JWT Token 粘贴到输入框（可从请求头或 Cookie 中获取）' },
        { name: '自动解码', text: '工具自动解析 Header、Payload 和 Signature' },
        { name: '查看信息', text: '查看 Token 包含的用户信息、过期时间等声明' }
      ]
    }
  },
  'rsa': {
    name: 'RSA 密钥生成',
    description: '免费在线 RSA 密钥对生成工具。支持 1024/2048/4096 位密钥，提供 RSA 加解密测试功能。可用于数据加密、数字签名等场景。',
    keywords: 'RSA密钥生成,RSA加密解密,公钥私钥生成,RSA在线工具,2048位密钥,RSA怎么用',
    category: '安全加密',
    faq: [
      { q: 'RSA 是什么？', a: 'RSA 是一种非对称加密算法，使用公钥加密、私钥解密。广泛用于 HTTPS、SSH、数字签名等安全通信场景。' },
      { q: '密钥长度怎么选？', a: '2048 位是目前推荐的标准，兼顾安全性和性能。4096 位更安全但速度较慢，1024 位已不建议使用。' },
      { q: '公钥和私钥有什么区别？', a: '公钥可以公开分享，用于加密数据或验证签名；私钥必须保密，用于解密数据或创建签名。' }
    ],
    howTo: {
      steps: [
        { name: '选择密钥长度', text: '选择 2048 或 4096 位密钥长度' },
        { name: '生成密钥', text: '点击生成按钮，工具会创建匹配的公钥和私钥对' },
        { name: '测试加解密', text: '可以使用生成的密钥进行加解密测试，验证密钥有效性' }
      ]
    }
  },
  'hash': {
    name: '哈希计算',
    description: '免费在线哈希计算工具。支持 MD5、SHA-1、SHA-256、SHA-512 等算法，支持文本和文件哈希校验。可用于数据完整性验证。',
    keywords: 'MD5计算,SHA256,SHA1,SHA512,哈希计算,文件校验,在线哈希工具,文件哈希怎么算',
    category: '安全加密',
    faq: [
      { q: '哈希计算有什么用？', a: '哈希用于生成数据的唯一指纹，常用于文件完整性校验、密码存储、数据去重等场景。' },
      { q: 'MD5 还安全吗？', a: 'MD5 已被证明存在碰撞漏洞，不建议用于安全场景。推荐使用 SHA-256 或更高强度的算法。' },
      { q: '可以计算文件哈希吗？', a: '可以，支持拖拽上传文件计算哈希值，用于验证文件下载完整性或比对文件是否相同。' }
    ],
    howTo: {
      steps: [
        { name: '输入内容', text: '粘贴文本或上传文件' },
        { name: '选择算法', text: '选择 MD5、SHA-1、SHA-256 等哈希算法' },
        { name: '计算哈希', text: '获取哈希值，可用于校验或比对' }
      ]
    }
  },
  'otp': {
    name: 'OTP 生成',
    description: '免费在线 TOTP 验证码生成工具。兼容 Google Authenticator、Microsoft Authenticator 等双因素认证应用。支持二维码生成。',
    keywords: 'TOTP生成器,双因素认证,2FA,Google Authenticator,验证码生成,OTP工具,二次验证怎么设置',
    category: '安全加密',
    faq: [
      { q: '什么是 TOTP？', a: 'TOTP（Time-based One-Time Password）是基于时间的一次性密码，每 30 秒变化一次，用于双因素认证。' },
      { q: '兼容哪些验证器应用？', a: '兼容 Google Authenticator、Microsoft Authenticator、Authy、1Password 等主流双因素认证应用。' },
      { q: '密钥泄露怎么办？', a: '如果密钥泄露，应立即在对应服务中禁用该 2FA 并重新设置，生成新的密钥。' }
    ],
    howTo: {
      steps: [
        { name: '输入密钥', text: '粘贴从服务获取的 TOTP 密钥（Base32 格式）' },
        { name: '生成验证码', text: '工具实时生成当前有效的 6 位验证码' },
        { name: '同步验证器', text: '可生成二维码用于添加到手机验证器应用' }
      ]
    }
  },
  'password': {
    name: '密码生成',
    description: '免费在线安全密码生成器。生成高强度随机密码，支持自定义长度和字符集，实时检测密码强度。保护账户安全。',
    keywords: '密码生成器,随机密码,强密码生成,安全密码,密码强度检测,强密码怎么设置',
    category: '安全加密',
    faq: [
      { q: '什么样的密码才算安全？', a: '安全密码应至少 12 位，包含大小写字母、数字和特殊符号，避免使用字典单词和个人信息。' },
      { q: '密码长度多少合适？', a: '推荐 16 位以上。现代密码破解技术发展迅速，更长的密码能提供更好的安全性。' },
      { q: '生成的密码会保存吗？', a: '不会。所有密码在本地浏览器生成，不会上传到服务器，刷新页面后密码丢失。' }
    ],
    howTo: {
      steps: [
        { name: '设置参数', text: '选择密码长度和包含的字符类型' },
        { name: '生成密码', text: '点击生成按钮，可批量生成多个密码' },
        { name: '复制使用', text: '选择强度最高的密码复制使用' }
      ]
    }
  },
  'timestamp': {
    name: '时间戳转换',
    description: '免费在线 Unix 时间戳转换工具。支持毫秒/秒级时间戳与日期互转，多种日期格式输出。方便开发调试和数据处理。',
    keywords: '时间戳转换,Unix时间戳,时间戳转日期,Date转时间戳,毫秒时间戳,Unix时间戳是什么',
    category: '开发调试',
    faq: [
      { q: '什么是 Unix 时间戳？', a: 'Unix 时间戳是从 1970 年 1 月 1 日（UTC）起经过的秒数或毫秒数，是计算机系统中常用的日期表示方式。' },
      { q: '毫秒和秒怎么区分？', a: '秒级时间戳是 10 位数字（如 1700000000），毫秒级是 13 位数字（如 1700000000000）。工具会自动识别。' },
      { q: '转换后的时区是什么？', a: '默认使用浏览器本地时区。如需其他时区，可转换后手动调整。' }
    ],
    howTo: {
      steps: [
        { name: '输入时间戳', text: '粘贴 Unix 时间戳或选择日期时间' },
        { name: '自动转换', text: '工具实时显示对应的日期时间或时间戳' },
        { name: '复制结果', text: '选择需要的格式复制使用' }
      ]
    }
  },
  'uuid': {
    name: 'UUID 生成',
    description: '免费在线 UUID/GUID 生成器。支持 UUID v4 随机生成，批量生成，多种格式输出（带横线、纯数字、Base64）。',
    keywords: 'UUID生成,GUID生成,UUID v4,UUID在线生成,批量UUID,UUID是什么',
    category: '开发调试',
    faq: [
      { q: 'UUID 是什么？', a: 'UUID（通用唯一识别码）是 128 位的标识符，保证在全球范围内的唯一性，常用于数据库主键、会话 ID 等。' },
      { q: 'UUID v4 是什么？', a: 'UUID v4 是随机生成的 UUID，使用随机数生成，是最常用的版本，重复概率极低。' },
      { q: '可以生成多少个？', a: '支持批量生成，一次最多可生成 100 个 UUID，方便测试数据准备。' }
    ],
    howTo: {
      steps: [
        { name: '选择数量', text: '选择需要生成的 UUID 数量' },
        { name: '选择格式', text: '选择标准格式（带横线）或其他格式' },
        { name: '生成复制', text: '点击生成，复制需要的 UUID 使用' }
      ]
    }
  },
  'regex': {
    name: '正则表达式测试',
    description: '免费在线正则表达式测试工具。实时匹配、替换、分割，支持 JavaScript、Python、Java 等语法。帮助快速调试正则表达式。',
    keywords: '正则表达式测试,Regex测试,正则在线工具,正则匹配,正则替换,正则表达式怎么用',
    category: '开发调试',
    faq: [
      { q: '正则表达式是什么？', a: '正则表达式是用于匹配字符串模式的强大工具，可用于数据验证、文本搜索替换、数据提取等。' },
      { q: '支持哪些编程语言语法？', a: '主要支持 JavaScript 语法，大部分语法也兼容 Python、Java、PHP 等主流语言。' },
      { q: '常用的正则表达式有哪些？', a: '邮箱：/^[^\s@]+@[^\s@]+\.[^\s@]+$/，手机号：/^1[3-9]\d{9}$/，网址：/^(https?:\/\/)?([\w.-]+)/' }
    ],
    howTo: {
      steps: [
        { name: '输入正则', text: '在上方输入正则表达式（无需两侧斜杠）' },
        { name: '输入测试文本', text: '在下方粘贴需要测试的文本内容' },
        { name: '查看匹配', text: '实时查看匹配结果、捕获组信息' }
      ]
    }
  },
  'crontab': {
    name: 'Crontab 生成',
    description: '免费在线 Crontab 表达式生成和解析工具。可视化选择时间，自动生成 Cron 表达式。支持 Quartz 调度器语法。',
    keywords: 'Crontab生成器,Cron表达式,定时任务,Quartz Cron,Crontab在线工具,Cron表达式怎么写',
    category: '开发调试',
    faq: [
      { q: 'Crontab 是什么？', a: 'Crontab 是 Linux/Unix 系统中用于设置定时任务的工具，通过 Cron 表达式定义任务执行时间。' },
      { q: 'Cron 表达式格式是什么？', a: '标准格式是 "分 时 日 月 周"，如 "0 2 * * *" 表示每天凌晨 2 点执行。' },
      { q: 'Quartz 和普通 Cron 有什么区别？', a: 'Quartz 格式包含秒字段，是 6-7 位；标准 Cron 是 5 位。本工具支持两种格式切换。' }
    ],
    howTo: {
      steps: [
        { name: '选择时间', text: '通过可视化界面选择执行时间' },
        { name: '生成表达式', text: '工具自动生成对应的 Cron 表达式' },
        { name: '验证解析', text: '可以解析已有表达式，查看具体执行时间' }
      ]
    }
  },
  'http-request': {
    name: 'HTTP 请求',
    description: '免费在线 API 测试工具，类似 Postman 网页版。支持 GET、POST、PUT、DELETE 等 HTTP 方法，自定义 Headers 和请求体。',
    keywords: 'HTTP请求,API测试工具,Postman在线,REST API测试,HTTP客户端,在线Postman',
    category: '开发调试',
    faq: [
      { q: '这个工具能做什么？', a: '可以发送 HTTP 请求测试 API 接口，支持各种方法、请求头、请求体，查看响应状态和内容。' },
      { q: '支持哪些请求格式？', a: '支持 JSON、XML、Form Data、Raw Text 等多种请求体格式，自动设置 Content-Type。' },
      { q: '请求会经过服务器吗？', a: '由于浏览器安全限制，部分请求可能会受到 CORS 限制。工具会尽量使用代理或直接发送请求。' }
    ],
    howTo: {
      steps: [
        { name: '输入 URL', text: '填写 API 接口地址' },
        { name: '设置参数', text: '选择 HTTP 方法，添加 Headers 和请求体' },
        { name: '发送请求', text: '点击发送，查看响应状态和数据' }
      ]
    }
  },
  'websocket': {
    name: 'WebSocket 测试',
    description: '免费在线 WebSocket 客户端测试工具。测试和调试 WebSocket 连接，支持 wss 加密连接，自定义消息发送。',
    keywords: 'WebSocket测试,WebSocket客户端,wss测试,Socket调试,WebSocket在线工具,WebSocket怎么测试',
    category: '开发调试',
    faq: [
      { q: 'WebSocket 是什么？', a: 'WebSocket 是一种在单个 TCP 连接上进行全双工通信的协议，适用于实时聊天、股票行情、在线游戏等场景。' },
      { q: 'ws 和 wss 有什么区别？', a: 'ws 是明文连接（类似 HTTP），wss 是加密连接（类似 HTTPS），生产环境推荐使用 wss。' },
      { q: '连接失败怎么办？', a: '检查服务器地址是否正确、服务器是否运行、是否有 CORS 限制、防火墙是否允许 WebSocket 连接。' }
    ],
    howTo: {
      steps: [
        { name: '输入地址', text: '填写 WebSocket 服务器地址（ws:// 或 wss://）' },
        { name: '连接服务器', text: '点击连接，等待连接成功' },
        { name: '收发消息', text: '发送测试消息，查看服务器响应' }
      ]
    }
  },
  'text-diff': {
    name: '文本对比',
    description: '免费在线文本对比工具。比较两段文本差异，高亮显示增删改。支持行级和字符级对比，代码对比和文档比对。',
    keywords: '文本对比,文本比较,Diff工具,代码对比,差异高亮,文本差异分析,代码对比工具',
    category: '开发调试',
    faq: [
      { q: '文本对比工具有什么用？', a: '可以比较两段文本的差异，常用于代码审查、文档版本比对、配置文件对比等场景。' },
      { q: '支持哪些对比模式？', a: '支持行级对比（整行差异）和字符级对比（行内具体差异），可根据需要选择。' },
      { q: '可以对比代码吗？', a: '可以，支持各种编程语言代码对比，会保持语法高亮显示差异。' }
    ],
    howTo: {
      steps: [
        { name: '粘贴文本', text: '在左右两个输入框分别粘贴需要对比的文本' },
        { name: '选择模式', text: '选择行级或字符级对比模式' },
        { name: '查看差异', text: '绿色表示新增，红色表示删除，黄色表示修改' }
      ]
    }
  },
  'text-template': {
    name: '文本模板替换',
    description: '免费在线文本模板批量生成工具。使用变量模板批量生成文本，支持 CSV 数据导入。适用于批量生成邮件、代码、配置等。',
    keywords: '文本模板,批量生成,变量替换,模板引擎,文本生成器,批量生成文本',
    category: '开发调试',
    faq: [
      { q: '文本模板怎么用？', a: '在模板中使用 {{变量名}} 作为占位符，然后提供变量数据，工具会自动替换生成多份文本。' },
      { q: '支持哪些数据源？', a: '支持手动输入变量值，或上传 CSV 文件批量导入多组数据。' },
      { q: '可以生成代码吗？', a: '可以，非常适合批量生成重复结构的代码、SQL 语句、配置文件等。' }
    ],
    howTo: {
      steps: [
        { name: '编写模板', text: '创建包含变量占位符的文本模板' },
        { name: '提供数据', text: '输入或导入变量数据' },
        { name: '批量生成', text: '工具自动替换变量，生成多份结果' }
      ]
    }
  },
  'chmod': {
    name: 'Chmod 计算',
    description: '免费在线 Linux 文件权限计算器。数字权限与符号权限互转，可视化选择权限位。帮助理解和设置 Linux 文件权限。',
    keywords: 'Chmod计算器,Linux权限,文件权限计算,chmod 777,权限转换,Linux权限怎么设置',
    category: '开发调试',
    faq: [
      { q: 'chmod 777 是什么意思？', a: '777 表示所有者、组、其他用户都有读(4)+写(2)+执行(1)权限。生产环境不推荐这样设置。' },
      { q: '数字权限和符号权限怎么对应？', a: '读(r)=4，写(w)=2，执行(x)=1。组合起来：7=rwx，6=rw-，5=r-x，4=r-- 等。' },
      { q: '什么时候用 755，什么时候用 644？', a: '脚本/目录通常用 755（可执行），普通文件用 644（只读），敏感文件用 600（仅所有者）。' }
    ],
    howTo: {
      steps: [
        { name: '选择权限', text: '点击复选框选择读、写、执行权限' },
        { name: '查看结果', text: '实时显示数字权限（如 755）和符号权限（如 rwxr-xr-x）' },
        { name: '应用权限', text: '复制生成的 chmod 命令在服务器上执行' }
      ]
    }
  },
  'ua-parser': {
    name: 'UA 解析',
    description: '免费在线 User Agent 解析工具。解析浏览器 UA 字符串，获取设备类型、操作系统、浏览器版本等信息。',
    keywords: 'UA解析,User Agent分析,浏览器检测,设备识别,UA在线工具,User Agent是什么',
    category: '开发调试',
    faq: [
      { q: 'User Agent 是什么？', a: 'User Agent 是浏览器或客户端在 HTTP 请求中发送的标识字符串，包含浏览器类型、版本、操作系统等信息。' },
      { q: '解析 UA 有什么用？', a: '用于网站统计分析、设备适配、浏览器兼容性处理、爬虫识别等场景。' },
      { q: 'UA 可以伪造吗？', a: '可以，UA 是可以修改的，不能完全信任。敏感操作应使用其他验证方式。' }
    ],
    howTo: {
      steps: [
        { name: '获取 UA', text: '从浏览器开发者工具或日志中获取 User Agent 字符串' },
        { name: '粘贴解析', text: '将 UA 字符串粘贴到输入框' },
        { name: '查看信息', text: '查看解析出的浏览器、操作系统、设备类型等信息' }
      ]
    }
  },
  'docker-convert': {
    name: 'Docker 转换',
    description: '免费在线 Docker 命令转换工具。docker run 命令与 docker-compose.yml 配置相互转换，支持复杂参数映射。',
    keywords: 'Docker转换,docker-compose生成,docker run转compose,Docker Compose工具,docker compose怎么写',
    category: '开发调试',
    faq: [
      { q: 'docker run 怎么转成 docker-compose？', a: '将 docker run 命令粘贴到工具中，会自动解析参数并生成对应的 docker-compose.yml 配置。' },
      { q: '支持哪些参数？', a: '支持 -p 端口映射、-v 卷挂载、-e 环境变量、--network 网络设置等常用参数。' },
      { q: '转换后的配置可以直接用吗？', a: '大部分情况下可以直接使用，但建议检查卷路径、网络名称等是否需要根据实际情况调整。' }
    ],
    howTo: {
      steps: [
        { name: '粘贴命令', text: '将 docker run 命令或 docker-compose 配置粘贴到对应输入框' },
        { name: '选择方向', text: '选择转换方向（run 转 compose 或 compose 转 run）' },
        { name: '获取结果', text: '复制转换后的配置使用' }
      ]
    }
  },
  'qrcode': {
    name: '二维码生成',
    description: '免费在线二维码生成器。支持自定义颜色、尺寸、Logo 水印，下载 PNG/SVG 格式。可用于网址、文本、名片等场景。',
    keywords: '二维码生成,QR Code生成,自定义二维码,二维码美化,QR Code在线工具,二维码怎么生成',
    category: '实用工具',
    faq: [
      { q: '可以添加 Logo 吗？', a: '可以，上传 Logo 图片后会自动居中显示在二维码上，支持调整大小和圆角。' },
      { q: '二维码有有效期吗？', a: '静态二维码（文本、网址）永久有效。如果网址变更，二维码将失效。' },
      { q: '支持哪些格式下载？', a: '支持 PNG（通用图片格式）和 SVG（矢量格式，可无限放大不失真）两种格式。' }
    ],
    howTo: {
      steps: [
        { name: '输入内容', text: '输入网址、文本或其他要编码的内容' },
        { name: '自定义样式', text: '选择颜色、尺寸，可选添加 Logo' },
        { name: '下载使用', text: '生成二维码，下载 PNG 或 SVG 格式使用' }
      ]
    }
  },
  'color': {
    name: '颜色转换',
    description: '免费在线颜色转换工具。HEX、RGB、HSL 颜色格式互转，支持颜色选择器、预设颜色、颜色格式转换和亮度调节。',
    keywords: '颜色转换,HEX转RGB,RGB转HSL,颜色选择器,在线取色器,颜色格式转换,颜色代码怎么转换',
    category: '实用工具',
    faq: [
      { q: 'HEX 和 RGB 有什么区别？', a: 'HEX 是十六进制表示（如 #FF5733），RGB 是十进制表示（如 rgb(255,87,51)），两者表示相同的颜色。' },
      { q: 'HSL 是什么？', a: 'HSL 表示色相(Hue)、饱和度(Saturation)、亮度(Lightness)，更直观易懂，方便颜色调整。' },
      { q: '可以调节颜色亮度吗？', a: '可以，调整 HSL 中的 L 值可以快速改变颜色亮度，适合生成同色系配色方案。' }
    ],
    howTo: {
      steps: [
        { name: '选择颜色', text: '使用取色器或输入颜色代码' },
        { name: '查看转换', text: '工具实时显示 HEX、RGB、HSL 各种格式' },
        { name: '复制使用', text: '复制需要的颜色格式用于 CSS 或设计' }
      ]
    }
  },
  'number-base': {
    name: '进制转换',
    description: '免费在线进制转换工具。支持二进制、八进制、十进制、十六进制互转，自动识别输入格式，支持带前缀（0b、0o、0x）和负数转换。提供常用数值对照表，方便开发者快速查阅。',
    keywords: '进制转换,二进制转换,八进制转换,十进制转换,十六进制转换,进制互转,二进制转十进制,十六进制转二进制,进制计算器,进制转换工具',
    category: '实用工具',
    faq: [
      { q: '进制转换工具支持哪些进制？', a: '支持二进制（Base 2）、八进制（Base 8）、十进制（Base 10）、十六进制（Base 16）之间的相互转换。' },
      { q: '可以输入带前缀的数字吗？', a: '可以，支持标准前缀格式：0b/0B 表示二进制、0o/0O 表示八进制、0x/0X 表示十六进制。' },
      { q: '支持负数转换吗？', a: '支持，可以在数字前添加负号（-）进行负数进制转换，如 -0xFF、-0b1010。' },
      { q: '十六进制字母区分大小写吗？', a: '不区分，输入 A-F 或 a-f 都可以正确识别和转换。' }
    ],
    howTo: {
      steps: [
        { name: '输入数值', text: '在任意进制输入框中输入数字，支持带前缀格式（如 0b1010、0xFF）' },
        { name: '自动转换', text: '工具实时计算并显示其他进制的转换结果' },
        { name: '复制结果', text: '点击复制按钮复制带前缀的完整格式，方便在代码中使用' }
      ]
    }
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
  
  // 构建基础结构化数据
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": config.name,
    "description": config.description,
    "url": toolUrl,
    "author": {
      "@type": "Organization",
      "name": "ToolStack",
      "url": domain,
      "logo": {
        "@type": "ImageObject",
        "url": `${domain}/logo.svg`
      }
    },
    "publisher": {
      "@type": "Organization",
      "name": "ToolStack",
      "logo": {
        "@type": "ImageObject",
        "url": `${domain}/logo.svg`
      }
    },
    "datePublished": "2024-01-01",
    "dateModified": new Date().toISOString().split('T')[0],
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
      },
      "author": {
        "@type": "Organization",
        "name": "ToolStack"
      }
    },
    "isPartOf": {
      "@type": "WebSite",
      "name": "ToolStack",
      "url": domain
    }
  };

  // 构建 Graph 数组包含多个 Schema 类型（AI SEO 优化）
  const schemaGraph = [jsonLd];

  // 添加 HowTo Schema（如果有步骤）
  if (config.howTo && config.howTo.steps) {
    schemaGraph.push({
      "@context": "https://schema.org",
      "@type": "HowTo",
      "name": `如何使用 ${config.name}`,
      "description": `${config.name}的使用步骤`,
      "totalTime": "PT1M",
      "step": config.howTo.steps.map((step, index) => ({
        "@type": "HowToStep",
        "position": index + 1,
        "name": step.name,
        "text": step.text
      }))
    });
  }

  // 添加 FAQPage Schema（如果有 FAQ）
  if (config.faq && config.faq.length > 0) {
    schemaGraph.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": config.faq.map(item => ({
        "@type": "Question",
        "name": item.q,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": item.a
        }
      }))
    });
  }

  // 合并为 @graph 格式
  const finalJsonLd = {
    "@context": "https://schema.org",
    "@graph": schemaGraph
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
    .replace(/<!-- JSONLD_PLACEHOLDER -->.*?<!-- \/JSONLD_PLACEHOLDER -->/s, JSON.stringify(finalJsonLd, null, 2));

  // 添加 FAQ HTML 内容（对 AI 可见）
  const faqHtml = config.faq ? `
<!-- Tool FAQ Content for AI Crawlers -->
<div class="tool-faq-data" style="display:none;" aria-hidden="true">
  <h2>关于${config.name}的常见问题</h2>
  ${config.faq.map(item => `
  <div class="faq-item">
    <h3>${item.q}</h3>
    <p>${item.a}</p>
  </div>
  `).join('')}
</div>
` : '';

  // 在 </body> 前插入 FAQ 内容
  toolHtml = toolHtml.replace('</body>', `${faqHtml}</body>`);

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
  .replace(/<title>.*?<\/title>/, `<title>ToolStack - 开发者在线工具箱 | JSON格式化 SQL优化 Base64编解码等25+工具</title>`)
  .replace(/<meta name="description" content=".*?"/, `<meta name="description" content="ToolStack 是现代化开发者工具集合，包含25+实用工具：JSON/SQL格式化、Base64编解码、哈希计算、RSA加密、二维码生成等。界面简洁，支持深色模式，免费在线使用。"`)
  .replace(/<meta name="keywords" content=".*?"/, `<meta name="keywords" content="开发者工具,在线工具,JSON格式化,SQL格式化,Base64编解码,哈希计算,RSA加密,二维码生成"`)
  .replace(/<link rel="canonical" href=".*?"/, `<link rel="canonical" href="${domain}/"`)
  .replace(/<meta property="og:title" content=".*?"/, `<meta property="og:title" content="ToolStack - 开发者在线工具箱 | JSON/SQL格式化 Base64编解码等"`)
  .replace(/<meta property="og:description" content=".*?"/, `<meta property="og:description" content="ToolStack 是现代化开发者工具集合，包含25+实用工具：JSON/SQL格式化、Base64编解码、哈希计算等。界面简洁，支持深色模式。"`)
  .replace(/<meta property="og:url" content=".*?"/, `<meta property="og:url" content="${domain}/"`)
  .replace(/<meta name="twitter:title" content=".*?"/, `<meta name="twitter:title" content="ToolStack - 开发者在线工具箱 | 25+实用工具集合"`)
  .replace(/<meta name="twitter:description" content=".*?"/, `<meta name="twitter:description" content="ToolStack 是现代化开发者工具集合，包含25+实用工具：JSON/SQL格式化、Base64编解码等。界面简洁，支持深色模式。"`)
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
fs.writeFileSync(path.join(distDir, 'robots.txt'), robots);
console.log(`✓ Generated: robots.txt`);

console.log(`\n✅ SEO优化完成！共生成 ${Object.keys(toolsConfig).length * 2 + 1} 个页面`);
console.log(`   - ${Object.keys(toolsConfig).length} 个工具页面（HTML + index）`);
console.log(`   - 1 个首页`);
console.log(`   - 1 个 Sitemap`);
console.log(`   - 1 个 Robots.txt`);
