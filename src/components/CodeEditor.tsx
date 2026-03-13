import { useEffect, useState } from 'react';
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-yaml';

// 支持的语言类型
type Language = 'sql' | 'xml' | 'json' | 'javascript' | 'typescript' | 'css' | 'yaml' | 'markup' | 'text';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: Language;
  placeholder?: string;
  height?: string | number;
  className?: string;
  wrapperClassName?: string;
  readOnly?: boolean;
  padding?: number;
  fontSize?: string;
}

// 代码编辑器样式 - 支持多语言
const editorStyles = `
  /* 基础文本颜色 */
  .code-editor-wrapper pre,
  .code-editor-wrapper code {
    color: #374151 !important;
  }
  
  .code-editor-wrapper .token {
    color: #374151;
  }
  
  /* 通用 token 类型 */
  .code-editor-wrapper .token.comment,
  .code-editor-wrapper .token.prolog,
  .code-editor-wrapper .token.doctype,
  .code-editor-wrapper .token.cdata {
    color: #9ca3af;
    font-style: italic;
  }
  
  .code-editor-wrapper .token.string,
  .code-editor-wrapper .token.char,
  .code-editor-wrapper .token.attr-value {
    color: #059669;
  }
  
  .code-editor-wrapper .token.number {
    color: #ea580c;
  }
  
  .code-editor-wrapper .token.boolean,
  .code-editor-wrapper .token.keyword {
    color: #dc2626;
    font-weight: 600;
  }
  
  .code-editor-wrapper .token.punctuation {
    color: #6b7280;
  }
  
  .code-editor-wrapper .token.operator {
    color: #6b7280;
  }
  
  .code-editor-wrapper .token.function {
    color: #7c3aed;
  }
  
  /* XML/Markup 特定 */
  .code-editor-wrapper .token.tag {
    color: #2563eb;
    font-weight: 600;
  }
  
  .code-editor-wrapper .token.tag .punctuation {
    color: #2563eb;
  }
  
  .code-editor-wrapper .token.attr-name {
    color: #7c3aed;
  }
  
  /* JSON 特定 */
  .code-editor-wrapper .token.property {
    color: #2563eb;
  }
  
  /* SQL 特定 */
  .code-editor-wrapper .token.builtin {
    color: #2563eb;
  }
  
  /* 深色模式 - 通用 */
  .dark .code-editor-wrapper pre,
  .dark .code-editor-wrapper code {
    color: #e5e7eb !important;
  }
  
  .dark .code-editor-wrapper .token {
    color: #e5e7eb;
  }
  
  .dark .code-editor-wrapper .token.comment,
  .dark .code-editor-wrapper .token.prolog,
  .dark .code-editor-wrapper .token.doctype,
  .dark .code-editor-wrapper .token.cdata {
    color: #6b7280;
  }
  
  .dark .code-editor-wrapper .token.string,
  .dark .code-editor-wrapper .token.char,
  .dark .code-editor-wrapper .token.attr-value {
    color: #34d399;
  }
  
  .dark .code-editor-wrapper .token.number {
    color: #fb923c;
  }
  
  .dark .code-editor-wrapper .token.boolean,
  .dark .code-editor-wrapper .token.keyword {
    color: #f87171;
    font-weight: 600;
  }
  
  .dark .code-editor-wrapper .token.punctuation {
    color: #9ca3af;
  }
  
  .dark .code-editor-wrapper .token.operator {
    color: #9ca3af;
  }
  
  .dark .code-editor-wrapper .token.function {
    color: #a78bfa;
  }
  
  /* XML/Markup 特定 - 深色 */
  .dark .code-editor-wrapper .token.tag {
    color: #60a5fa;
    font-weight: 600;
  }
  
  .dark .code-editor-wrapper .token.tag .punctuation {
    color: #60a5fa;
  }
  
  .dark .code-editor-wrapper .token.attr-name {
    color: #a78bfa;
  }
  
  /* JSON 特定 - 深色 */
  .dark .code-editor-wrapper .token.property {
    color: #60a5fa;
  }
  
  /* SQL 特定 - 深色 */
  .dark .code-editor-wrapper .token.builtin {
    color: #60a5fa;
  }
`;

// 语言映射到 Prism 语法
const languageMap: Record<Language, string> = {
  sql: 'sql',
  xml: 'markup',
  json: 'json',
  javascript: 'javascript',
  typescript: 'typescript',
  css: 'css',
  yaml: 'yaml',
  markup: 'markup',
  text: 'text',
};

export function CodeEditor({
  value,
  onChange,
  language,
  placeholder = '',
  height = '250px',
  className = '',
  wrapperClassName = '',
  readOnly = false,
  padding = 16,
  fontSize = '13px',
}: CodeEditorProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const highlight = (code: string) => {
    // 普通文本不进行高亮
    if (language === 'text') {
      return code;
    }
    const prismLanguage = languageMap[language];
    const grammar = Prism.languages[prismLanguage];
    if (!grammar) return code;
    try {
      return Prism.highlight(code, grammar, prismLanguage);
    } catch {
      return code;
    }
  };

  // 判断 height 是否是 Tailwind 类名
  // 如果包含响应式前缀 (sm:, md:, lg:, xl:) 或者是 h- 开头的类名，则视为 Tailwind 类
  const isTailwindClass = typeof height === 'string' && (
    /^(sm:|md:|lg:|xl:|h-|min-h-|max-h-)/.test(height) || 
    /\s+(sm:|md:|lg:|xl:|h-|min-h-|max-h-)/.test(height)
  );
  
  // 如果不是 Tailwind 类名，则转为 style 高度
  const styleHeight = isTailwindClass ? undefined : (typeof height === 'number' ? `${height}px` : height);
  // 如果是 Tailwind 类名，添加到 className
  const heightClass = isTailwindClass ? `h-auto ${height}` : '';

  if (!mounted) {
    return (
      <div
        className={`code-editor-wrapper font-mono bg-gray-50 dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700 ${heightClass} ${wrapperClassName}`}
        style={styleHeight ? { height: styleHeight, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' } : { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' }}
      >
        <div style={{ padding, fontSize }}>{placeholder}</div>
      </div>
    );
  }

  return (
    <>
      <style>{editorStyles}</style>
      <div
        className={`code-editor-wrapper w-full rounded-lg overflow-auto border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 ${heightClass} ${wrapperClassName}`}
        style={styleHeight ? { height: styleHeight } : undefined}
      >
        <Editor
          value={value}
          onValueChange={onChange}
          highlight={highlight}
          padding={padding}
          className={`font-mono text-sm min-h-full ${className}`}
          style={{
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
            fontSize,
            lineHeight: '1.6',
            minHeight: '100%',
          }}
          placeholder={placeholder}
          readOnly={readOnly}
        />
      </div>
    </>
  );
}

export default CodeEditor;
