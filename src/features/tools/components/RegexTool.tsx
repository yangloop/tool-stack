import { useState, useEffect, useRef } from 'react';
import { Search, AlertCircle } from 'lucide-react';
import { AdFooter } from '../../../components/ads';
import { ToolInfoAuto } from './ToolInfoSection';
import { CodeEditor } from '../../../components/CodeEditor';
import { ToolHeader } from '../../../components/common';

const commonPatterns = [
  { name: '邮箱', pattern: '^[\\w.-]+@[\\w.-]+\\.\\w+$' },
  { name: '手机号（中国）', pattern: '^1[3-9]\\d{9}$' },
  { name: 'URL', pattern: '^https?://[^\\s/$.?#].[^\\s]*$' },
  { name: 'IP 地址', pattern: '^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$' },
  { name: '身份证', pattern: '^[1-9]\\d{5}(?:18|19|20)\\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\\d|3[01])\\d{3}[\\dXx]$' },
  { name: '数字', pattern: '^-?\\d+$' },
  { name: '汉字', pattern: '^[\\u4e00-\\u9fa5]+$' },
];

// 正则语法高亮组件
interface RegexHighlighterProps {
  pattern: string;
  isDark: boolean;
}

function RegexHighlighter({ pattern, isDark }: RegexHighlighterProps) {
  if (!pattern) {
    return (
      <span className="text-surface-400">输入正则表达式...</span>
    );
  }

  // 正则语法元素定义
  const tokenize = (input: string): Array<{ type: string; value: string }> => {
    const tokens: Array<{ type: string; value: string }> = [];
    let i = 0;
    
    while (i < input.length) {
      const char = input[i];
      const nextChar = input[i + 1];
      
      // 锚点和特殊字符
      if (['^', '$', '\\b', '\\B'].includes(char + (nextChar || ''))) {
        if (char === '\\' && (nextChar === 'b' || nextChar === 'B')) {
          tokens.push({ type: 'anchor', value: '\\' + nextChar });
          i += 2;
          continue;
        }
      }
      
      if (char === '^' || char === '$') {
        tokens.push({ type: 'anchor', value: char });
        i++;
        continue;
      }
      
      // 量词
      if (['*', '+', '?', '{'].includes(char)) {
        if (char === '{') {
          // 匹配 {n}, {n,}, {n,m}
          const match = input.slice(i).match(/^\{\d*,?\d*\}/);
          if (match) {
            tokens.push({ type: 'quantifier', value: match[0] });
            i += match[0].length;
            continue;
          }
        }
        tokens.push({ type: 'quantifier', value: char });
        i++;
        continue;
      }
      
      // 字符类 []
      if (char === '[') {
        const closeIndex = input.indexOf(']', i);
        if (closeIndex !== -1) {
          tokens.push({ type: 'charClass', value: input.slice(i, closeIndex + 1) });
          i = closeIndex + 1;
          continue;
        }
      }
      
      // 分组 ()
      if (char === '(') {
        const closeIndex = findMatchingParen(input, i);
        if (closeIndex !== -1) {
          tokens.push({ type: 'group', value: input.slice(i, closeIndex + 1) });
          i = closeIndex + 1;
          continue;
        }
      }
      
      // 或运算符
      if (char === '|') {
        tokens.push({ type: 'alternation', value: char });
        i++;
        continue;
      }
      
      // 转义序列
      if (char === '\\') {
        if (nextChar) {
          tokens.push({ type: 'escape', value: '\\' + nextChar });
          i += 2;
          continue;
        }
      }
      
      // 点号
      if (char === '.') {
        tokens.push({ type: 'dot', value: char });
        i++;
        continue;
      }
      
      // 普通字符
      tokens.push({ type: 'literal', value: char });
      i++;
    }
    
    return tokens;
  };

  // 查找匹配的右括号
  const findMatchingParen = (str: string, openIndex: number): number => {
    let count = 1;
    for (let i = openIndex + 1; i < str.length; i++) {
      if (str[i] === '\\') {
        i++; // 跳过转义字符
        continue;
      }
      if (str[i] === '(') count++;
      if (str[i] === ')') count--;
      if (count === 0) return i;
    }
    return -1;
  };

  // 颜色映射
  const colors: Record<string, string> = {
    anchor: isDark ? '#f472b6' : '#db2777', // pink
    quantifier: isDark ? '#fb923c' : '#ea580c', // orange
    charClass: isDark ? '#60a5fa' : '#2563eb', // blue
    group: isDark ? '#a78bfa' : '#7c3aed', // violet
    alternation: isDark ? '#f87171' : '#dc2626', // red
    escape: isDark ? '#34d399' : '#059669', // green
    dot: isDark ? '#fbbf24' : '#d97706', // amber
    literal: isDark ? '#e5e7eb' : '#374151', // gray
  };

  const tokens = tokenize(pattern);

  return (
    <>
      {tokens.map((token, index) => (
        <span key={index} style={{ color: colors[token.type] }}>
          {token.value}
        </span>
      ))}
    </>
  );
}

export function RegexTool() {
  const [pattern, setPattern] = useState('');
  const [flags, setFlags] = useState({ global: true, ignoreCase: false, multiline: false });
  const [testText, setTestText] = useState('');
  const [matches, setMatches] = useState<RegExpMatchArray | null>(null);
  const [error, setError] = useState('');
  const [isDark, setIsDark] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 检测当前主题
    setIsDark(document.documentElement.classList.contains('dark'));
    
    // 监听主题变化
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    
    return () => observer.disconnect();
  }, []);

  // 同步滚动
  useEffect(() => {
    if (inputRef.current && highlightRef.current) {
      highlightRef.current.scrollLeft = inputRef.current.scrollLeft;
    }
  }, [pattern]);

  useEffect(() => {
    if (!pattern || !testText) {
      setMatches(null);
      setError('');
      return;
    }

    try {
      const flagStr = [
        flags.global ? 'g' : '',
        flags.ignoreCase ? 'i' : '',
        flags.multiline ? 'm' : '',
      ].join('');
      
      const regex = new RegExp(pattern, flagStr);
      const result = testText.match(regex);
      setMatches(result);
      setError('');
    } catch (e) {
      setError('无效的正则表达式');
      setMatches(null);
    }
  }, [pattern, flags, testText]);

  const getHighlightedText = () => {
    if (!matches || !pattern) return testText;
    
    const flagStr = [
      flags.global ? 'g' : '',
      flags.ignoreCase ? 'i' : '',
      flags.multiline ? 'm' : '',
    ].join('');
    
    const regex = new RegExp(`(${pattern})`, flagStr);
    const parts = testText.split(regex);
    
    return parts.map((part, i) => {
      if (regex.test(part)) {
        regex.lastIndex = 0;
        return (
          <mark key={i} className="bg-yellow-200 dark:bg-yellow-600 dark:text-white px-0.5 rounded">
            {part}
          </mark>
        );
      }
      return part;
    });
  };

  return (
    <div className="max-w-4xl mx-auto">
      <ToolHeader
        icon={Search}
        title="正则表达式测试"
        description="在线测试和验证正则表达式"
        iconColorClass="text-primary-500"
      />

      {/* 常用模式 */}
      <div className="card p-4 sm:p-6 mb-4">
        <div className="block text-xs sm:text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
          常用模式
        </div>
        <div className="flex flex-wrap gap-2">
          {commonPatterns.map(({ name, pattern: p }) => (
            <button
              key={name}
              onClick={() => setPattern(p)}
              className="btn-secondary btn-tool rounded-full text-xs"
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      {/* 正则输入 */}
      <div className="card p-4 sm:p-6 mb-4 space-y-4">
        <div>
          <label htmlFor="regex-pattern" className="block text-xs sm:text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
            正则表达式
          </label>
          <div className="flex flex-wrap sm:flex-nowrap gap-2">
            <span className="flex items-center px-2 sm:px-3 bg-surface-100 dark:bg-surface-800 text-surface-500 rounded-lg font-mono text-xs sm:text-sm">/</span>
            
            {/* 高亮输入框容器 */}
            <div className="flex-1 relative font-mono text-xs sm:text-sm min-w-0">
              {/* 高亮层 */}
              <div
                ref={highlightRef}
                className="absolute inset-0 px-3 sm:px-4 py-2 bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-lg overflow-hidden whitespace-pre pointer-events-none select-none text-xs sm:text-sm"
                aria-hidden="true"
              >
                <RegexHighlighter pattern={pattern} isDark={isDark} />
              </div>
              
              {/* 输入层 */}
              <input
                ref={inputRef}
                type="text"
                id="regex-pattern"
                name="regex-pattern"
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
                onScroll={() => {
                  if (inputRef.current && highlightRef.current) {
                    highlightRef.current.scrollLeft = inputRef.current.scrollLeft;
                  }
                }}
                placeholder="输入正则表达式..."
                className="w-full px-3 sm:px-4 py-2 bg-transparent border border-surface-200 dark:border-surface-700 rounded-lg focus:ring-2 focus:ring-primary-500 dark:text-white text-transparent caret-surface-900 dark:caret-white text-xs sm:text-sm"
                style={{ position: 'relative', zIndex: 1 }}
                spellCheck={false}
              />
            </div>
            
            <span className="flex items-center px-2 sm:px-3 bg-surface-100 dark:bg-surface-800 text-surface-500 rounded-lg font-mono text-xs sm:text-sm">/</span>
          </div>
          
          {error && (
            <div className="mt-2 flex items-center gap-2 text-red-500 text-xs sm:text-sm">
              <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              {error}
            </div>
          )}
          

        </div>

        <div className="flex flex-wrap gap-3 sm:gap-4">
          {Object.entries({
            global: '全局匹配 (g)',
            ignoreCase: '忽略大小写 (i)',
            multiline: '多行模式 (m)',
          }).map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                id={`regex-flag-${key}`}
                name={`regex-flag-${key}`}
                checked={flags[key as keyof typeof flags]}
                onChange={(e) => setFlags({ ...flags, [key]: e.target.checked })}
                className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary-500 rounded"
              />
              <span className="text-xs sm:text-sm text-surface-700 dark:text-surface-300">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* 测试文本 */}
      <div className="card p-4 sm:p-6 space-y-4">
        <div>
          <div className="block text-xs sm:text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
            测试文本
          </div>
          <CodeEditor
            value={testText}
            onChange={setTestText}
            language="text"
            height={240}
            placeholder="输入要测试的文本..."
            variant="embedded"
          />
        </div>

        {testText && pattern && matches && (
          <div className="p-3 sm:p-4 bg-surface-50 dark:bg-surface-900 rounded-lg">
            <div className="text-xs sm:text-sm text-surface-500 mb-2">匹配结果 ({matches.length}):</div>
            <div className="font-mono text-xs sm:text-sm text-surface-800 dark:text-surface-200">
              {getHighlightedText()}
            </div>
          </div>
        )}
      </div>

      {/* 功能说明 */}
      <ToolInfoAuto toolId="regex" />

      {/* 底部广告 */}
      <AdFooter />
    </div>
  );
}
