import { Editor } from '@monaco-editor/react';
import type * as Monaco from 'monaco-editor';
import { memo, useCallback, useEffect, useState } from 'react';
import { useIsDarkMode } from '../hooks/useIsDarkMode';
import { ensureMonacoLoaderConfigured } from '../utils/monacoLoader';

interface MonacoCodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: string;
  height?: string | number;
  className?: string;
  placeholder?: string;
  readOnly?: boolean;
  wordWrap?: 'off' | 'on';
  minimap?: boolean;
  showLineNumbers?: boolean;
  fontSize?: string;
  padding?: number;
}

const lightThemeName = 'toolstack-editor-vs';
const darkThemeName = 'toolstack-editor-vs-dark';

ensureMonacoLoaderConfigured();

function defineEditorThemes(monaco: typeof Monaco) {
  monaco.editor.defineTheme(lightThemeName, {
    base: 'vs',
    inherit: true,
    rules: [],
    colors: {
      'editor.background': '#f8fafc',
      'editor.lineHighlightBackground': '#e2e8f033',
      'editorGutter.background': '#f8fafc',
    },
  });

  monaco.editor.defineTheme(darkThemeName, {
    base: 'vs-dark',
    inherit: true,
    rules: [],
    colors: {
      'editor.background': '#0f172a',
      'editor.lineHighlightBackground': '#1e293b66',
      'editorGutter.background': '#0f172a',
    },
  });
}

function MonacoCodeEditorInner({
  value,
  onChange,
  language,
  height = 320,
  className = '',
  placeholder = '',
  readOnly = false,
  wordWrap = 'off',
  minimap = false,
  showLineNumbers = true,
  fontSize = '13px',
  padding = 16,
}: MonacoCodeEditorProps) {
  const { isDark, isReady } = useIsDarkMode();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const normalizedLanguage = (() => {
    switch (language) {
      case 'yaml':
        return 'yaml';
      case 'shell':
        return 'shell';
      case 'sql':
        return 'sql';
      case 'xml':
        return 'xml';
      case 'json':
        return 'json';
      case 'html':
        return 'html';
      case 'css':
      case 'javascript':
      case 'typescript':
      case 'markdown':
        return language;
      case 'text':
      default:
        return 'plaintext';
    }
  })();

  const numericFontSize = Number.parseInt(fontSize, 10);

  const handleBeforeMount = useCallback((monaco: typeof Monaco) => {
    defineEditorThemes(monaco);
  }, []);

  const handleMount = useCallback((editor: Monaco.editor.IStandaloneCodeEditor, monaco: typeof Monaco) => {
    defineEditorThemes(monaco);
    monaco.editor.setTheme(isDark ? darkThemeName : lightThemeName);

    if (placeholder) {
      editor.updateOptions({
        renderValidationDecorations: 'on',
      });
    }
  }, [isDark, placeholder]);

  if (!isReady || !isMounted) {
    return (
      <div
        className={`code-editor-content flex h-full min-h-[320px] items-center justify-center overflow-hidden rounded-2xl border border-surface-200 bg-surface-50 text-surface-400 shadow-soft dark:border-surface-700 dark:bg-surface-900/60 ${className}`.trim()}
        style={{ height: typeof height === 'number' ? `${height}px` : height }}
      >
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
          <span className="text-sm">加载 Monaco Editor...</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`code-editor-content h-full min-h-0 overflow-hidden rounded-2xl border border-surface-200 shadow-soft dark:border-surface-700 ${className}`.trim()}
      style={{ height: typeof height === 'number' ? `${height}px` : height }}
    >
      <Editor
        height={height}
        value={value}
        language={normalizedLanguage}
        theme={isDark ? darkThemeName : lightThemeName}
        beforeMount={handleBeforeMount}
        onMount={handleMount}
        onChange={(nextValue) => onChange(nextValue ?? '')}
        options={{
          automaticLayout: true,
          readOnly,
          minimap: { enabled: minimap },
          fontSize: Number.isNaN(numericFontSize) ? 13 : numericFontSize,
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          scrollBeyondLastLine: false,
          lineNumbers: showLineNumbers ? 'on' : 'off',
          lineNumbersMinChars: showLineNumbers ? 3 : 0,
          glyphMargin: false,
          wordWrap,
          stickyScroll: { enabled: true },
          overviewRulerBorder: false,
          padding: { top: padding, bottom: padding + 8 },
          roundedSelection: true,
          cursorBlinking: 'smooth',
          smoothScrolling: true,
          scrollbar: {
            verticalScrollbarSize: 10,
            horizontalScrollbarSize: 10,
            alwaysConsumeMouseWheel: false,
          },
        }}
        loading=""
      />
    </div>
  );
}

export const MonacoCodeEditor = memo(MonacoCodeEditorInner);
