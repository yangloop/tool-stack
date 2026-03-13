import { useMemo, useEffect, useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';
import { sql } from '@codemirror/lang-sql';
import { xml } from '@codemirror/lang-xml';
import { html } from '@codemirror/lang-html';
import { yaml } from '@codemirror/lang-yaml';
import { EditorView } from '@codemirror/view';
import { StreamLanguage } from '@codemirror/language';
import type { Extension } from '@codemirror/state';
import { shell } from '@codemirror/legacy-modes/mode/shell';
import { lightTheme, darkTheme } from '../styles/codemirror-theme';

// 支持的语言类型
type Language = 'sql' | 'xml' | 'json' | 'html' | 'yaml' | 'shell' | 'text';

interface CodeEditorProps {
  id?: string;
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
  /**
   * 样式变体
   * - default: 独立使用，带边框和阴影
   * - embedded: 嵌入卡片中使用，无边框和阴影，与卡片融合
   * - minimal: 极简风格，无边框、无背景
   */
  variant?: 'default' | 'embedded' | 'minimal';
  /**
   * 是否显示行号
   */
  showLineNumbers?: boolean;
  /**
   * 自定义扩展
   */
  extensions?: Extension[];
}

// 获取语言扩展
const getLanguageExtension = (language: Language): Extension => {
  switch (language) {
    case 'json':
      return json();
    case 'sql':
      return sql();
    case 'xml':
      return xml();
    case 'html':
      return html();
    case 'yaml':
      return yaml();
    case 'shell':
      return StreamLanguage.define(shell);
    default:
      return [];
  }
};

export function CodeEditor({
  id,
  value,
  onChange,
  language,
  placeholder = '',
  height = '250px',
  className = '',
  wrapperClassName = '',
  readOnly = false,
  fontSize = '13px',
  variant = 'default',
  showLineNumbers = false,
  extensions: customExtensions = [],
  padding,
}: CodeEditorProps) {
  const [isDark, setIsDark] = useState(false);

  // 监听深色模式变化
  useEffect(() => {
    const checkDarkMode = () => {
      const isDarkMode = document.documentElement.classList.contains('dark');
      setIsDark(isDarkMode);
    };
    
    checkDarkMode();
    
    // 创建 MutationObserver 监听 class 变化
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          checkDarkMode();
        }
      });
    });
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    
    return () => observer.disconnect();
  }, []);

  // 计算高度
  const heightStyle = useMemo(() => {
    if (typeof height === 'number') {
      return `${height}px`;
    }
    return height;
  }, [height]);

  // 组合扩展
  const extensions = useMemo(() => {
    const base: Extension[] = [
      getLanguageExtension(language),
      EditorView.lineWrapping,
      // 应用主题
      isDark ? darkTheme : lightTheme,
      // 自定义字体大小
      EditorView.theme({
        '.cm-content': { 
          fontSize,
          ...(padding !== undefined && { padding: `${padding}px` }),
        },
        '.cm-gutters': { fontSize },
      }),
      ...customExtensions,
    ];

    return base;
  }, [isDark, language, fontSize, padding, customExtensions]);

  // 根据变体确定容器样式
  const containerClasses = useMemo(() => {
    const baseClasses = 'overflow-hidden';
    
    switch (variant) {
      case 'minimal':
        return `${baseClasses} rounded-lg`;
      case 'embedded':
        return `${baseClasses} rounded-xl border ${isDark ? 'bg-surface-900/50 border-surface-700' : 'bg-surface-50 border-surface-200'}`;
      case 'default':
      default:
        return `${baseClasses} rounded-2xl border-2 shadow-soft transition-all hover:shadow-lg ${
          isDark 
            ? 'border-surface-600 bg-surface-900 hover:border-surface-500' 
            : 'border-surface-300 bg-surface-50 hover:border-surface-400'
        }`;
    }
  }, [variant, isDark]);

  return (
    <div id={id} className={`code-editor-wrapper ${wrapperClassName}`}>
      <div className={containerClasses}>
        <CodeMirror
          key={isDark ? 'dark' : 'light'}  // 强制重新创建编辑器以应用主题变化
          value={value}
          height={heightStyle}
          placeholder={placeholder}
          editable={!readOnly}
          readOnly={readOnly}
          extensions={extensions}
          onChange={onChange}
          className={`code-editor-content ${className}`}
          basicSetup={{
            lineNumbers: showLineNumbers,
            highlightActiveLineGutter: showLineNumbers,
            highlightActiveLine: true,
            foldGutter: false,
            dropCursor: true,
            allowMultipleSelections: true,
            indentOnInput: true,
            bracketMatching: true,
            closeBrackets: true,
            autocompletion: true,
            highlightSelectionMatches: true,
            searchKeymap: true,
            tabSize: 2,
          }}
        />
      </div>
    </div>
  );
}

export default CodeEditor;
