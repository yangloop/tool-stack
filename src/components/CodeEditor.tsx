import { useMemo, useEffect, useState, Suspense, lazy } from 'react';
import type { Extension } from '@codemirror/state';

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



// 动态导入 CodeMirror 组件
const LazyCodeMirrorEditor = lazy(() => import('./CodeEditorInner'));

// 简单的加载占位符
function EditorSkeleton({ height, variant }: { height: string; variant: string }) {
  const containerClasses = useMemo(() => {
    const baseClasses = 'overflow-hidden';
    switch (variant) {
      case 'minimal':
        return `${baseClasses} rounded-lg`;
      case 'embedded':
        return `${baseClasses} rounded-xl border bg-surface-50 dark:bg-surface-900/50 border-surface-200 dark:border-surface-700`;
      default:
        return `${baseClasses} rounded-2xl border-2 shadow-soft border-surface-300 dark:border-surface-600 bg-surface-50 dark:bg-surface-900`;
    }
  }, [variant]);

  return (
    <div className={containerClasses} style={{ height }}>
      <div className="w-full h-full flex items-center justify-center text-surface-400">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">加载编辑器...</span>
        </div>
      </div>
    </div>
  );
}

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
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    
    checkDarkMode();
    
    let rafId: number | null = null;
    const observer = new MutationObserver(() => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(checkDarkMode);
    });
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    
    return () => {
      observer.disconnect();
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  const heightStyle = useMemo(() => {
    return typeof height === 'number' ? `${height}px` : height;
  }, [height]);

  return (
    <div id={id} className={`code-editor-wrapper ${wrapperClassName}`}>
      <Suspense fallback={<EditorSkeleton height={heightStyle} variant={variant} />}>
        <LazyCodeMirrorEditor
          value={value}
          onChange={onChange}
          language={language}
          placeholder={placeholder}
          height={heightStyle}
          className={className}
          readOnly={readOnly}
          fontSize={fontSize}
          variant={variant}
          showLineNumbers={showLineNumbers}
          customExtensions={customExtensions}
          padding={padding}
          isDark={isDark}
        />
      </Suspense>
    </div>
  );
}

export default CodeEditor;
