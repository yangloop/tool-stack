import { useMemo, useEffect, useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { EditorView } from '@codemirror/view';
import type { Extension } from '@codemirror/state';
import { lightTheme, darkTheme } from '../styles/codemirror-theme';

type Language = 'sql' | 'xml' | 'json' | 'html' | 'yaml' | 'shell' | 'text';

interface CodeEditorInnerProps {
  value: string;
  onChange: (value: string) => void;
  language: Language;
  placeholder?: string;
  height: string;
  className?: string;
  readOnly?: boolean;
  fontSize: string;
  variant: 'default' | 'embedded' | 'minimal';
  showLineNumbers: boolean;
  customExtensions: Extension[];
  padding?: number;
  isDark: boolean;
}

// 语言包动态导入映射
const languageImports: Record<Language, () => Promise<Extension>> = {
  json: async () => {
    const { json } = await import('@codemirror/lang-json');
    return json();
  },
  sql: async () => {
    const { sql } = await import('@codemirror/lang-sql');
    return sql();
  },
  xml: async () => {
    const { xml } = await import('@codemirror/lang-xml');
    return xml();
  },
  html: async () => {
    const { html } = await import('@codemirror/lang-html');
    return html();
  },
  yaml: async () => {
    const { yaml } = await import('@codemirror/lang-yaml');
    return yaml();
  },
  shell: async () => {
    const { StreamLanguage } = await import('@codemirror/language');
    const { shell } = await import('@codemirror/legacy-modes/mode/shell');
    return StreamLanguage.define(shell);
  },
  text: async () => [],
};

export default function CodeEditorInner({
  value,
  onChange,
  language,
  placeholder = '',
  height,
  className = '',
  readOnly = false,
  fontSize,
  variant,
  showLineNumbers,
  customExtensions,
  padding,
  isDark,
}: CodeEditorInnerProps) {
  const [languageExtension, setLanguageExtension] = useState<Extension>([]);

  // 动态加载语言包
  useEffect(() => {
    let mounted = true;
    languageImports[language]().then((ext) => {
      if (mounted) {
        setLanguageExtension(ext);
      }
    });
    return () => {
      mounted = false;
    };
  }, [language]);

  // 组合扩展
  const extensions = useMemo(() => {
    const base: Extension[] = [
      languageExtension,
      EditorView.lineWrapping,
      EditorView.theme({
        '.cm-content': { 
          fontSize,
          ...(padding !== undefined && { padding: `${padding}px` }),
        },
        '.cm-gutters': { fontSize },
      }),
      isDark ? darkTheme : lightTheme,
      ...customExtensions,
    ];
    return base;
  }, [isDark, languageExtension, fontSize, padding, customExtensions]);

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
    <div className={containerClasses}>
      <CodeMirror
        value={value}
        height={height}
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
          foldGutter: true,
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
  );
}
