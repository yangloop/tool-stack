import type { ToolInfoData } from '../types';

// ============================================================
// 工具信息数据 - 功能说明和图例
// 集中管理所有工具的辅助信息
// ============================================================

export const toolInfoData: Record<string, ToolInfoData> = {
  // ==================== 格式化工具 ====================
  json: {
    description: {
      items: [
        'JSON 格式化、压缩、验证功能',
        '支持语法高亮和错误提示',
        '支持 JSON 转义和去转义',
        '支持文件导入导出',
      ],
    },
  },
  sql: {
    description: {
      items: [
        'SQL 语句格式化和压缩',
        '支持语法高亮显示',
        '支持导入和导出 SQL 文件',
        '提供语法错误提示',
      ],
    },
    legend: {
      title: '语法高亮',
      items: [
        { color: '#3b82f6', label: '关键字 (SELECT)' },
        { color: '#8b5cf6', label: '函数 (COUNT)' },
        { color: '#22c55e', label: '字符串 (\'text\')' },
        { color: '#f97316', label: '数字 (123)' },
        { color: '#6b7280', label: '注释 (--)' },
      ],
    },
  },
  'sql-advisor': {
    description: {
      items: [
        '智能分析 SQL 语句性能',
        '支持多种数据库类型',
        '检查索引使用情况',
        '提供优化建议和 DDL 验证',
      ],
    },
    legend: {
      title: '结果类型',
      variant: 'colorful',
      items: [
        { bgColor: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400', text: '严重', label: '' },
        { bgColor: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400', text: '警告', label: '' },
        { bgColor: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400', text: '提示', label: '' },
        { bgColor: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400', text: '优化', label: '' },
        { bgColor: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400', text: '通过', label: '' },
      ],
    },
  },
  'xml-json': {
    description: {
      items: [
        '支持 XML 与 JSON 格式互相转换',
        '属性使用 @_ 前缀标识',
        '支持格式化或压缩输出',
        '支持文件导入导出',
      ],
    },
  },
  'text-diff': {
    description: {
      items: [
        '对比两段文本的差异',
        '支持行内字符级高亮',
        '支持显示/隐藏相同行',
        '支持复制差异结果',
      ],
    },
    legend: {
      title: '差异标识',
      items: [
        { color: '#ef4444', label: '删除' },
        { color: '#22c55e', label: '新增' },
        { color: '#f59e0b', label: '修改' },
      ],
    },
  },

  // ==================== 编解码工具 ====================
  base64: {
    description: {
      items: [
        '支持 Base64 编码和解码',
        '支持编码后内容一键复制',
        '支持切换编码方向',
      ],
    },
  },
  'base64-file': {
    description: {
      items: [
        '支持文件转 Base64 编码',
        '支持 Base64 转回文件',
        '支持图片预览功能',
        '支持拖拽上传文件',
      ],
    },
  },
  url: {
    description: {
      items: [
        'URL 编码和解码',
        '支持特殊字符处理',
        '支持一键交换编码方向',
      ],
    },
  },
  'url-parser': {
    description: {
      items: [
        '解析 URL 各组成部分',
        '提取协议、主机、路径、参数',
        '支持查询参数表格展示',
        '支持复制各项值',
      ],
    },
    legend: {
      title: 'URL 结构',
      variant: 'colorful',
      items: [
        { bgColor: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300', text: '协议', label: '' },
        { bgColor: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300', text: '认证', label: '' },
        { bgColor: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300', text: '主机', label: '' },
        { bgColor: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300', text: '端口', label: '' },
        { bgColor: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300', text: '路径', label: '' },
        { bgColor: 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300', text: '查询', label: '' },
      ],
    },
  },
  html: {
    description: {
      items: [
        'HTML 实体编码和解码',
        '支持常见特殊字符',
        '支持一键切换编码方向',
      ],
    },
  },
  jwt: {
    description: {
      items: [
        '解析 JWT Token 的三段结构',
        '自动解码 Header 和 Payload',
        '显示过期时间和签发时间',
        '支持标准 JWT 格式验证',
      ],
    },
    legend: {
      title: 'JWT 结构',
      variant: 'colorful',
      items: [
        { bgColor: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400', text: 'Header', label: '头部' },
        { text: '.', label: '' },
        { bgColor: 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400', text: 'Payload', label: '载荷' },
        { text: '.', label: '' },
        { bgColor: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400', text: 'Signature', label: '签名' },
      ],
    },
  },

  // ==================== 安全加密 ====================
  hash: {
    description: {
      items: [
        '支持 MD5、SHA1、SHA256、SHA512 算法',
        '支持 HMAC 密钥加密',
        '支持从文件计算哈希值',
        '显示哈希值位数信息',
      ],
    },
  },
  rsa: {
    description: {
      items: [
        '生成 RSA 公钥和私钥对',
        '支持 512-4096 位密钥长度',
        '支持加解密功能测试',
        '支持下载密钥文件',
      ],
    },
    legend: {
      title: '密钥标识',
      items: [
        { color: '#10b981', label: '公钥' },
        { color: '#ef4444', label: '私钥' },
      ],
    },
  },
  otp: {
    description: {
      items: [
        '生成 TOTP 双因素认证码',
        '兼容 Google Authenticator',
        '支持二维码显示和扫描',
        '支持账户导入导出备份',
      ],
    },
    legend: {
      title: '倒计时状态',
      items: [
        { color: '#3b82f6', label: '充足时间' },
        { color: '#ef4444', label: '即将过期' },
      ],
    },
  },
  password: {
    description: {
      items: [
        '生成安全随机密码',
        '支持自定义密码长度',
        '密码强度实时检测',
        '支持多种字符类型组合',
      ],
    },
    legend: {
      title: '密码强度',
      items: [
        { color: '#ef4444', label: '弱' },
        { color: '#eab308', label: '中等' },
        { color: '#3b82f6', label: '强' },
        { color: '#22c55e', label: '极强' },
      ],
    },
  },

  // ==================== 开发调试 ====================
  timestamp: {
    description: {
      items: [
        'Unix 时间戳与日期互转',
        '支持秒和毫秒时间戳',
        '显示当前时间戳',
        '支持日期选择器',
      ],
    },
  },
  uuid: {
    description: {
      items: [
        '生成标准 UUID v4 标识符',
        '支持批量生成',
        '支持多种输出格式',
        '支持一键复制',
      ],
    },
  },
  regex: {
    description: {
      items: [
        '在线测试正则表达式',
        '支持常用模式预设',
        '支持全局、忽略大小写等标志',
        '支持语法高亮',
      ],
    },
    legend: {
      title: '正则语法',
      items: [
        { color: '#ec4899', label: '锚点 ^$' },
        { color: '#f97316', label: '量词 *+?' },
        { color: '#3b82f6', label: '字符类 []' },
        { color: '#8b5cf6', label: '分组 ()' },
        { color: '#22c55e', label: '转义 \\' },
        { color: '#f59e0b', label: '点号 .' },
        { color: '#ef4444', label: '或 |' },
      ],
    },
  },
  'ua-parser': {
    description: {
      items: [
        '解析浏览器 User Agent',
        '获取设备、系统、浏览器信息',
        '显示屏幕分辨率',
        '检测浏览器特性支持',
      ],
    },
  },
  crontab: {
    description: {
      title: 'Cron 表达式格式说明',
      items: [
        '可视化生成 Cron 表达式',
        '支持常用预设选择',
        '实时解析为可读文本',
        '提供格式说明文档',
      ],
      icon: 'book',
    },
  },
  'http-request': {
    description: {
      items: [
        '在线 API 测试工具',
        '支持多种 HTTP 方法',
        '支持自定义请求头',
        '支持 JSON、表单等多种请求体',
      ],
    },
    legend: {
      title: '状态码',
      items: [
        { color: '#10b981', label: '2xx 成功' },
        { color: '#f59e0b', label: '3xx 重定向' },
        { color: '#f97316', label: '4xx 客户端错误' },
        { color: '#ef4444', label: '5xx 服务器错误' },
      ],
    },
  },
  'docker-convert': {
    description: {
      items: [
        'docker run 与 docker-compose 互转',
        '支持表单可视化配置',
        '支持反向解析',
        '支持导出配置文件',
      ],
    },
  },
  'text-template': {
    description: {
      items: [
        '使用变量模板批量生成文本',
        '支持自定义分隔符',
        '支持批量数据处理',
        '支持 CSV 导入',
      ],
    },
  },
  chmod: {
    description: {
      items: [
        'Linux 文件权限计算',
        '数字权限与符号权限互转',
        '可视化权限设置',
        '提供常用命令参考',
      ],
    },
    legend: {
      title: '权限值',
      items: [
        { color: '#10b981', label: '读 r = 4' },
        { color: '#f59e0b', label: '写 w = 2' },
        { color: '#3b82f6', label: '执行 x = 1' },
      ],
    },
  },
  websocket: {
    description: {
      items: [
        '在线 WebSocket 客户端',
        '支持发送和接收消息',
        '支持自动心跳检测',
        '支持自动重连',
      ],
    },
    legend: {
      title: '连接状态',
      items: [
        { color: '#10b981', label: '已连接' },
        { color: '#f59e0b', label: '连接中' },
        { color: '#6b7280', label: '已断开' },
        { color: '#ef4444', label: '错误' },
      ],
    },
  },

  // ==================== 实用工具 ====================
  qrcode: {
    description: {
      items: [
        '生成自定义样式二维码',
        '支持设置前景和背景颜色',
        '支持添加 Logo 图片',
        '支持多种尺寸和纠错级别',
        '可导出 PNG 格式图片',
      ],
    },
    legend: {
      title: '纠错级别',
      items: [
        { label: 'L - 低 (7%)' },
        { label: 'M - 中 (15%)' },
        { label: 'Q - 高 (25%)' },
        { label: 'H - 最高 (30%)' },
      ],
    },
  },
  color: {
    description: {
      items: [
        '支持 HEX、RGB、HSL 三种格式互转',
        '实时预览颜色效果',
        '提供常用预设颜色选择',
        '一键复制各种格式颜色值',
      ],
    },
    legend: {
      title: '颜色格式',
      items: [
        { label: 'HEX - #RRGGBB' },
        { label: 'RGB - rgb(r,g,b)' },
        { label: 'HSL - hsl(h,s%,l%)' },
      ],
    },
  },
};

// 获取工具信息数据的辅助函数
export function getToolInfoData(toolId: string): ToolInfoData | undefined {
  return toolInfoData[toolId];
}

// 判断工具是否有信息数据
export function hasToolInfoData(toolId: string): boolean {
  return toolId in toolInfoData;
}
