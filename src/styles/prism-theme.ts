// SQL 语法高亮共享主题配置
// 用于 SqlTool 和 SqlAdvisorTool 等需要 SQL 语法高亮的组件

import type { CSSProperties } from 'react';

// 浅色模式主题
export const customLightTheme: { [key: string]: CSSProperties } = {
  'code[class*="language-"]': {
    color: '#374151',
    background: 'transparent',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    fontSize: '13px',
    lineHeight: '1.6',
  },
  'pre[class*="language-"]': {
    color: '#374151',
    background: 'transparent',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    fontSize: '13px',
    lineHeight: '1.6',
    padding: '1rem',
    margin: 0,
  },
  'comment': {
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  'prolog': {
    color: '#9ca3af',
  },
  'doctype': {
    color: '#9ca3af',
  },
  'cdata': {
    color: '#9ca3af',
  },
  'punctuation': {
    color: '#6b7280',
  },
  'property': {
    color: '#2563eb',
  },
  'tag': {
    color: '#2563eb',
  },
  'boolean': {
    color: '#2563eb',
  },
  'number': {
    color: '#ea580c',
  },
  'constant': {
    color: '#2563eb',
  },
  'symbol': {
    color: '#2563eb',
  },
  'deleted': {
    color: '#dc2626',
  },
  'selector': {
    color: '#059669',
  },
  'attr-name': {
    color: '#ea580c',
  },
  'string': {
    color: '#059669',
  },
  'char': {
    color: '#059669',
  },
  'builtin': {
    color: '#7c3aed',
  },
  'inserted': {
    color: '#059669',
  },
  'operator': {
    color: '#6b7280',
  },
  'entity': {
    color: '#6b7280',
    cursor: 'help',
  },
  'url': {
    color: '#6b7280',
  },
  'variable': {
    color: '#374151',
  },
  'atrule': {
    color: '#2563eb',
    fontWeight: 600,
  },
  'attr-value': {
    color: '#059669',
  },
  'keyword': {
    color: '#2563eb',
    fontWeight: 600,
  },
  'function': {
    color: '#7c3aed',
  },
  'class-name': {
    color: '#2563eb',
    fontWeight: 600,
  },
  'regex': {
    color: '#ea580c',
  },
  'important': {
    color: '#2563eb',
    fontWeight: 'bold',
  },
  'bold': {
    fontWeight: 'bold',
  },
  'italic': {
    fontStyle: 'italic',
  },
};

// 深色模式主题
export const customDarkTheme: { [key: string]: CSSProperties } = {
  'code[class*="language-"]': {
    color: '#e5e7eb',
    background: 'transparent',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    fontSize: '13px',
    lineHeight: '1.6',
  },
  'pre[class*="language-"]': {
    color: '#e5e7eb',
    background: 'transparent',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    fontSize: '13px',
    lineHeight: '1.6',
    padding: '1rem',
    margin: 0,
  },
  'comment': {
    color: '#6b7280',
    fontStyle: 'italic',
  },
  'prolog': {
    color: '#6b7280',
  },
  'doctype': {
    color: '#6b7280',
  },
  'cdata': {
    color: '#6b7280',
  },
  'punctuation': {
    color: '#9ca3af',
  },
  'property': {
    color: '#60a5fa',
  },
  'tag': {
    color: '#60a5fa',
  },
  'boolean': {
    color: '#60a5fa',
  },
  'number': {
    color: '#fb923c',
  },
  'constant': {
    color: '#60a5fa',
  },
  'symbol': {
    color: '#60a5fa',
  },
  'deleted': {
    color: '#f87171',
  },
  'selector': {
    color: '#34d399',
  },
  'attr-name': {
    color: '#fb923c',
  },
  'string': {
    color: '#34d399',
  },
  'char': {
    color: '#34d399',
  },
  'builtin': {
    color: '#a78bfa',
  },
  'inserted': {
    color: '#34d399',
  },
  'operator': {
    color: '#9ca3af',
  },
  'entity': {
    color: '#9ca3af',
    cursor: 'help',
  },
  'url': {
    color: '#9ca3af',
  },
  'variable': {
    color: '#e5e7eb',
  },
  'atrule': {
    color: '#60a5fa',
    fontWeight: 600,
  },
  'attr-value': {
    color: '#34d399',
  },
  'keyword': {
    color: '#60a5fa',
    fontWeight: 600,
  },
  'function': {
    color: '#a78bfa',
  },
  'class-name': {
    color: '#60a5fa',
    fontWeight: 600,
  },
  'regex': {
    color: '#fb923c',
  },
  'important': {
    color: '#60a5fa',
    fontWeight: 'bold',
  },
  'bold': {
    fontWeight: 'bold',
  },
  'italic': {
    fontStyle: 'italic',
  },
};

// CSS 字符串形式的主题（用于 react-simple-code-editor）
export const sqlEditorStyles = `
  /* 基础文本颜色 - 编辑器内容 */
  .sql-editor-container pre,
  .sql-editor-container code {
    color: #374151 !important;
  }
  /* 所有 token 默认颜色 */
  .sql-editor-container .token {
    color: #374151;
  }
  /* 标识符（表名、字段名等） */
  .sql-editor-container .token.identifier,
  .sql-editor-container .token.variable,
  .sql-editor-container .token.property,
  .sql-editor-container .token.symbol,
  .sql-editor-container .token.constant,
  .sql-editor-container .token.parameter {
    color: #1f2937;
  }
  .sql-editor-container .token.comment,
  .sql-editor-container .token.prolog,
  .sql-editor-container .token.doctype,
  .sql-editor-container .token.cdata {
    color: #9ca3af;
    font-style: italic;
  }
  .sql-editor-container .token.string,
  .sql-editor-container .token.char,
  .sql-editor-container .token.attr-value {
    color: #059669;
  }
  .sql-editor-container .token.keyword,
  .sql-editor-container .token.operator,
  .sql-editor-container .token.atrule {
    color: #2563eb;
    font-weight: 600;
  }
  .sql-editor-container .token.function {
    color: #7c3aed;
  }
  .sql-editor-container .token.number,
  .sql-editor-container .token.attr-name {
    color: #ea580c;
  }
  .sql-editor-container .token.punctuation {
    color: #6b7280;
  }
  .sql-editor-container .token.builtin {
    color: #2563eb;
  }
  /* 深色模式 */
  .dark .sql-editor-container pre,
  .dark .sql-editor-container code {
    color: #e5e7eb !important;
  }
  .dark .sql-editor-container .token {
    color: #e5e7eb;
  }
  .dark .sql-editor-container .token.identifier,
  .dark .sql-editor-container .token.variable,
  .dark .sql-editor-container .token.property,
  .dark .sql-editor-container .token.symbol,
  .dark .sql-editor-container .token.constant,
  .dark .sql-editor-container .token.parameter {
    color: #f3f4f6;
  }
  .dark .sql-editor-container .token.comment,
  .dark .sql-editor-container .token.prolog,
  .dark .sql-editor-container .token.doctype,
  .dark .sql-editor-container .token.cdata {
    color: #6b7280;
  }
  .dark .sql-editor-container .token.string,
  .dark .sql-editor-container .token.char,
  .dark .sql-editor-container .token.attr-value {
    color: #34d399;
  }
  .dark .sql-editor-container .token.keyword,
  .dark .sql-editor-container .token.operator,
  .dark .sql-editor-container .token.atrule {
    color: #60a5fa;
  }
  .dark .sql-editor-container .token.function {
    color: #a78bfa;
  }
  .dark .sql-editor-container .token.number,
  .dark .sql-editor-container .token.attr-name {
    color: #fb923c;
  }
  .dark .sql-editor-container .token.punctuation {
    color: #9ca3af;
  }
  .dark .sql-editor-container .token.builtin {
    color: #60a5fa;
  }
`;
