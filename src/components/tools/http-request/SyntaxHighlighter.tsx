import { useState, useEffect } from 'react';
import Editor from 'react-simple-code-editor';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json';
import markup from 'react-syntax-highlighter/dist/esm/languages/prism/markup';
import { oneLight, oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

// 注册语言
SyntaxHighlighter.registerLanguage('json', json);
SyntaxHighlighter.registerLanguage('xml', markup);

interface CodeEditorProps {
  code: string;
  language: 'json' | 'xml';
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function CodeEditor({
  code,
  language,
  onChange,
  placeholder,
  className = ''
}: CodeEditorProps) {
  const [isDark, setIsDark] = useState(false);
  const [lineCount, setLineCount] = useState(1);

  // 监听主题变化
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    checkDarkMode();
    
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    
    return () => observer.disconnect();
  }, []);

  // 计算行数
  useEffect(() => {
    setLineCount(code.split('\n').length);
  }, [code]);

  // 高亮函数
  const highlight = (text: string) => {
    if (!text.trim() && placeholder) {
      return (
        <span className="text-gray-400 dark:text-slate-500 italic">{placeholder}</span>
      );
    }
    return (
      <SyntaxHighlighter
        language={language}
        style={isDark ? oneDark : oneLight}
        customStyle={{
          margin: 0,
          padding: 0,
          background: 'transparent',
          fontSize: 'inherit',
          fontFamily: 'inherit',
          lineHeight: 'inherit',
        }}
        codeTagProps={{
          style: {
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
            fontSize: 'inherit',
            lineHeight: 'inherit',
          }
        }}
      >
        {text || ' '}
      </SyntaxHighlighter>
    );
  };

  // 计算高度
  const minHeight = Math.max(250, lineCount * 20 + 24);

  return (
    <div className={`relative rounded-lg overflow-hidden border border-gray-200 dark:border-slate-700 ${className}`}>
      {/* 编辑器主体 */}
      <div 
        className="bg-[#fafafa] dark:bg-[#282c34]"
        style={{ minHeight: `${minHeight}px` }}
      >
        <Editor
          value={code}
          onValueChange={onChange}
          highlight={highlight}
          padding={16}
          placeholder={placeholder}
          className="font-mono text-xs sm:text-sm"
          style={{
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
            fontSize: '0.75rem',
            lineHeight: '1.25rem',
            minHeight: `${minHeight}px`,
          }}
          textareaClassName="focus:outline-none"
          textareaId={`code-editor-${language}`}
        />
      </div>
      
      {/* 底部信息栏 */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-gray-100 dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 text-[10px] text-gray-400 dark:text-slate-500">
        <div className="flex items-center gap-3">
          <span>{lineCount} 行</span>
          <span>{code.length} 字符</span>
        </div>
        <span className="uppercase">{language}</span>
      </div>
    </div>
  );
}

// 为了保持向后兼容，导出同名组件
export { CodeEditor as SyntaxHighlighter };
