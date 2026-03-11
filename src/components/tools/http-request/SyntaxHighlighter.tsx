import { useRef, useEffect, useState } from 'react';

interface SyntaxHighlighterProps {
  code: string;
  language: 'json' | 'xml';
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

// JSON 语法高亮
function highlightJSON(code: string): string {
  if (!code) return '';
  
  const tokens: Array<{ type: string; value: string }> = [];
  let i = 0;
  
  while (i < code.length) {
    const char = code[i];
    
    // 字符串
    if (char === '"') {
      let str = char;
      i++;
      while (i < code.length && code[i] !== '"') {
        if (code[i] === '\\' && i + 1 < code.length) {
          str += code[i] + code[i + 1];
          i += 2;
        } else {
          str += code[i];
          i++;
        }
      }
      if (i < code.length) str += code[i];
      tokens.push({ type: 'string', value: str });
      i++;
      continue;
    }
    
    // 数字
    if (/\d/.test(char) || (char === '-' && /\d/.test(code[i + 1]))) {
      let num = '';
      if (char === '-') {
        num += char;
        i++;
      }
      while (i < code.length && (/\d/.test(code[i]) || code[i] === '.')) {
        num += code[i];
        i++;
      }
      tokens.push({ type: 'number', value: num });
      continue;
    }
    
    // 关键字 (true, false, null)
    if (/[a-z]/.test(char)) {
      let word = '';
      while (i < code.length && /[a-z]/.test(code[i])) {
        word += code[i];
        i++;
      }
      if (['true', 'false', 'null'].includes(word)) {
        tokens.push({ type: 'keyword', value: word });
      } else {
        tokens.push({ type: 'plain', value: word });
      }
      continue;
    }
    
    // 标点符号
    if (/[{}[\],:]/.test(char)) {
      tokens.push({ type: 'punctuation', value: char });
      i++;
      continue;
    }
    
    // 其他字符（空白等）
    tokens.push({ type: 'plain', value: char });
    i++;
  }
  
  const colors: Record<string, string> = {
    string: '#0ea5e9',
    number: '#f59e0b',
    keyword: '#8b5cf6',
    punctuation: '#64748b',
    plain: '#334155',
  };
  
  const darkColors: Record<string, string> = {
    string: '#7dd3fc',
    number: '#fbbf24',
    keyword: '#a78bfa',
    punctuation: '#94a3b8',
    plain: '#e2e8f0',
  };
  
  return tokens.map((token) => {
    const lightColor = colors[token.type] || colors.plain;
    const darkColor = darkColors[token.type] || darkColors.plain;
    const escapedValue = token.value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br>');
    return `<span style="color: ${lightColor};" data-dark-color="${darkColor}">${escapedValue}</span>`;
  }).join('');
}

// XML 语法高亮
function highlightXML(code: string): string {
  if (!code) return '';
  
  const tokens: Array<{ type: string; value: string }> = [];
  let i = 0;
  
  while (i < code.length) {
    const char = code[i];
    
    // 注释 <!-- -->
    if (code.slice(i, i + 4) === '<!--') {
      let comment = '<!--';
      i += 4;
      while (i < code.length && code.slice(i, i + 3) !== '-->') {
        comment += code[i];
        i++;
      }
      if (code.slice(i, i + 3) === '-->') {
        comment += '-->';
        i += 3;
      }
      tokens.push({ type: 'comment', value: comment });
      continue;
    }
    
    // CDATA
    if (code.slice(i, i + 9) === '<![CDATA[') {
      let cdata = '<![CDATA[';
      i += 9;
      while (i < code.length && code.slice(i, i + 3) !== ']]>') {
        cdata += code[i];
        i++;
      }
      if (code.slice(i, i + 3) === ']]>') {
        cdata += ']]>';
        i += 3;
      }
      tokens.push({ type: 'cdata', value: cdata });
      continue;
    }
    
    // XML 声明
    if (code.slice(i, i + 2) === '<?') {
      let decl = '<?';
      i += 2;
      while (i < code.length && code[i] !== '?') {
        decl += code[i];
        i++;
      }
      if (code[i] === '?') {
        decl += '?>';
        i += 2;
      }
      tokens.push({ type: 'decl', value: decl });
      continue;
    }
    
    // 标签
    if (char === '<') {
      let tag = '<';
      i++;
      
      if (code[i] === '/') {
        tag += '/';
        i++;
      }
      
      while (i < code.length && /[a-zA-Z0-9_-]/.test(code[i])) {
        tag += code[i];
        i++;
      }
      
      while (i < code.length && code[i] !== '>' && code[i] !== '/') {
        if (code[i] === '"' || code[i] === "'") {
          const quote = code[i];
          tag += quote;
          i++;
          while (i < code.length && code[i] !== quote) {
            tag += code[i];
            i++;
          }
          if (i < code.length) {
            tag += code[i];
            i++;
          }
        } else {
          tag += code[i];
          i++;
        }
      }
      
      if (code[i] === '/') {
        tag += '/';
        i++;
      }
      
      if (code[i] === '>') {
        tag += '>';
        i++;
      }
      
      tokens.push({ type: 'tag', value: tag });
      continue;
    }
    
    // 文本内容
    let text = '';
    while (i < code.length && code[i] !== '<') {
      text += code[i];
      i++;
    }
    if (text) {
      tokens.push({ type: 'text', value: text });
    }
  }
  
  const colors: Record<string, string> = {
    tag: '#ec4899',
    attr: '#06b6d4',
    string: '#10b981',
    comment: '#9ca3af',
    cdata: '#f59e0b',
    decl: '#8b5cf6',
    text: '#334155',
  };
  
  const darkColors: Record<string, string> = {
    tag: '#f472b6',
    attr: '#22d3ee',
    string: '#34d399',
    comment: '#6b7280',
    cdata: '#fbbf24',
    decl: '#a78bfa',
    text: '#e2e8f0',
  };
  
  return tokens.map((token) => {
    const lightColor = colors[token.type] || colors.text;
    const darkColor = darkColors[token.type] || darkColors.text;
    
    const escapedValue = token.value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br>');
    
    return `<span style="color: ${lightColor};" data-dark-color="${darkColor}">${escapedValue}</span>`;
  }).join('');
}

export function SyntaxHighlighter({
  code,
  language,
  onChange,
  placeholder,
  className = ''
}: SyntaxHighlighterProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLPreElement>(null);
  const [lineCount, setLineCount] = useState(1);
  
  // 计算行数
  useEffect(() => {
    setLineCount(code.split('\n').length);
  }, [code]);
  
  // 滚动同步
  const handleScroll = () => {
    if (textareaRef.current && highlightRef.current) {
      highlightRef.current.scrollTop = textareaRef.current.scrollTop;
      highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };
  
  // 计算最小高度
  const minHeight = Math.max(200, lineCount * 20 + 24);
  
  const highlightedHTML = language === 'json' ? highlightJSON(code) : highlightXML(code);
  
  return (
    <div className={`relative rounded-lg overflow-hidden border border-gray-200 dark:border-slate-700 ${className}`}>
      {/* 编辑器主体 */}
      <div className="relative bg-gray-50 dark:bg-slate-900">
        {/* 高亮层 */}
        <pre
          ref={highlightRef}
          className="absolute inset-0 p-3 font-mono text-xs leading-5 overflow-hidden pointer-events-none"
          aria-hidden="true"
          style={{
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
            minHeight: `${minHeight}px`,
            margin: 0,
            whiteSpace: 'pre',
            wordWrap: 'normal',
            background: 'transparent',
          }}
          dangerouslySetInnerHTML={{ 
            __html: highlightedHTML || `<span class="text-gray-400 dark:text-slate-500 italic">${placeholder || '在此输入 ' + language.toUpperCase() + ' 内容...'}</span>` 
          }}
        />
        
        {/* 输入层 */}
        <textarea
          ref={textareaRef}
          value={code}
          onChange={(e) => onChange(e.target.value)}
          onScroll={handleScroll}
          placeholder={placeholder || `在此输入 ${language.toUpperCase()} 内容...`}
          className="w-full p-3 font-mono text-xs bg-transparent resize-y focus:outline-none relative z-10 text-gray-700 dark:text-gray-300 caret-blue-500 dark:caret-blue-400 selection:bg-blue-500/30 selection:text-blue-900 dark:selection:bg-blue-400/30 dark:selection:text-blue-100"
          spellCheck={false}
          style={{
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
            minHeight: `${minHeight}px`,
            lineHeight: '1.25rem',
          }}
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
