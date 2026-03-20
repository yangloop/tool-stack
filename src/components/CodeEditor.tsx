import { useMemo } from 'react';
import { MonacoCodeEditor } from './MonacoCodeEditor';

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
  extensions?: unknown[];
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
  extensions: _customExtensions = [],
  padding,
}: CodeEditorProps) {
  const heightStyle = useMemo(() => {
    return typeof height === 'number' ? `${height}px` : height;
  }, [height]);

  const containerClasses = useMemo(() => {
    const baseClasses = 'code-editor-wrapper';
    const variantClass =
      variant === 'minimal' ? 'rounded-lg' : variant === 'embedded' ? 'rounded-xl' : 'rounded-2xl';

    return `${baseClasses} ${variantClass} ${wrapperClassName}`.trim();
  }, [variant, wrapperClassName]);

  return (
    <div id={id} className={containerClasses}>
      <MonacoCodeEditor
        value={value}
        onChange={onChange}
        language={language}
        placeholder={placeholder}
        height={heightStyle}
        className={className}
        readOnly={readOnly}
        fontSize={fontSize}
        showLineNumbers={showLineNumbers}
        padding={padding}
      />
    </div>
  );
}

export default CodeEditor;
