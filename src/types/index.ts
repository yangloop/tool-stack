// 工具分类
type ToolCategory = 'format' | 'encode' | 'hash' | 'security' | 'dev' | 'util';

// 工具定义
export interface Tool {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: ToolCategory;
  component: React.ComponentType;
  hot?: boolean;
  new?: boolean;
}

// 广告位配置
export interface AdConfig {
  enabled: boolean;
  position: 'top' | 'sidebar' | 'inline' | 'bottom';
  content?: string;
  height?: number;
}

// 导航项
export interface NavItem {
  id: string;
  name: string;
  icon: string;
  children?: { id: string; name: string }[];
}

// 代码语言
export type CodeLanguage = 'json' | 'xml' | 'sql' | 'html' | 'javascript' | 'css';

// 哈希算法
export type HashAlgorithm = 'MD5' | 'SHA1' | 'SHA256' | 'SHA512';
