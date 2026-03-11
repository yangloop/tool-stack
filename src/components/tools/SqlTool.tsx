import { useState, useEffect, useRef } from 'react';
import { 
  Copy, Check, Download, Upload, Trash2, 
  Database, AlertCircle, AlignLeft, Minimize2
} from 'lucide-react';
import { downloadFile, readFile } from '../../utils/helpers';
import { useClipboard } from '../../hooks/useLocalStorage';
import { AdInArticle, AdFooter } from '../ads';

// SQL 关键字
const sqlKeywords = [
  'SELECT', 'FROM', 'WHERE', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'DROP',
  'TABLE', 'DATABASE', 'INDEX', 'VIEW', 'JOIN', 'LEFT', 'RIGHT', 'INNER', 'OUTER',
  'ON', 'GROUP', 'BY', 'ORDER', 'HAVING', 'LIMIT', 'OFFSET', 'UNION', 'ALL',
  'AND', 'OR', 'NOT', 'NULL', 'IS', 'IN', 'EXISTS', 'BETWEEN', 'LIKE',
  'AS', 'DISTINCT', 'COUNT', 'SUM', 'AVG', 'MAX', 'MIN', 'VALUES', 'INTO',
  'ALTER', 'ADD', 'COLUMN', 'PRIMARY', 'KEY', 'FOREIGN', 'REFERENCES',
  'COMMIT', 'ROLLBACK', 'TRANSACTION', 'BEGIN', 'END'
];

// SQL 数据类型
const sqlTypes = [
  'INT', 'INTEGER', 'BIGINT', 'SMALLINT', 'TINYINT', 'DECIMAL', 'NUMERIC',
  'FLOAT', 'DOUBLE', 'REAL', 'VARCHAR', 'CHAR', 'TEXT', 'STRING',
  'DATE', 'TIME', 'DATETIME', 'TIMESTAMP', 'BOOLEAN', 'BOOL',
  'BLOB', 'BINARY', 'VARBINARY', 'JSON', 'XML'
];

// SQL 函数
const sqlFunctions = [
  'COUNT', 'SUM', 'AVG', 'MAX', 'MIN', 'CONCAT', 'SUBSTRING', 'LENGTH',
  'UPPER', 'LOWER', 'TRIM', 'LTRIM', 'RTRIM', 'REPLACE', 'NOW', 'CURDATE',
  'CURTIME', 'DATE', 'YEAR', 'MONTH', 'DAY', 'HOUR', 'MINUTE', 'SECOND',
  'ROUND', 'FLOOR', 'CEILING', 'ABS', 'COALESCE', 'NULLIF', 'CASE', 'WHEN',
  'THEN', 'ELSE', 'END', 'IF', 'IFNULL', 'ISNULL'
];

// SQL 语法高亮组件
function SqlHighlighter({ sql, isDark }: { sql: string; isDark: boolean }) {
  const highlight = (text: string) => {
    const tokens: Array<{ type: string; value: string }> = [];
    let i = 0;
    
    while (i < text.length) {
      const char = text[i];
      
      // 字符串（单引号）
      if (char === "'") {
        let str = char;
        i++;
        while (i < text.length && text[i] !== "'") {
          if (text[i] === '\\' && i + 1 < text.length) {
            str += text[i] + text[i + 1];
            i += 2;
          } else {
            str += text[i];
            i++;
          }
        }
        if (i < text.length) str += text[i];
        tokens.push({ type: 'string', value: str });
        i++;
        continue;
      }
      
      // 注释 --
      if (char === '-' && text[i + 1] === '-') {
        let comment = '';
        while (i < text.length && text[i] !== '\n') {
          comment += text[i];
          i++;
        }
        tokens.push({ type: 'comment', value: comment });
        continue;
      }
      
      // 注释 /* */
      if (char === '/' && text[i + 1] === '*') {
        let comment = '';
        while (i < text.length && !(text[i] === '*' && text[i + 1] === '/')) {
          comment += text[i];
          i++;
        }
        if (i < text.length) {
          comment += '*/';
          i += 2;
        }
        tokens.push({ type: 'comment', value: comment });
        continue;
      }
      
      // 数字
      if (/\d/.test(char)) {
        let num = '';
        while (i < text.length && (/\d/.test(text[i]) || text[i] === '.')) {
          num += text[i];
          i++;
        }
        tokens.push({ type: 'number', value: num });
        continue;
      }
      
      // 标识符或关键字
      if (/[a-zA-Z_]/.test(char)) {
        let word = '';
        while (i < text.length && /[a-zA-Z0-9_]/.test(text[i])) {
          word += text[i];
          i++;
        }
        
        const upperWord = word.toUpperCase();
        if (sqlKeywords.includes(upperWord)) {
          tokens.push({ type: 'keyword', value: word });
        } else if (sqlTypes.includes(upperWord)) {
          tokens.push({ type: 'type', value: word });
        } else if (sqlFunctions.includes(upperWord)) {
          tokens.push({ type: 'function', value: word });
        } else {
          tokens.push({ type: 'identifier', value: word });
        }
        continue;
      }
      
      // 运算符
      if (/[+\-*/=<>!%&|]/.test(char)) {
        let op = char;
        if (i + 1 < text.length && /[=<>]/.test(text[i + 1])) {
          op += text[i + 1];
          i++;
        }
        tokens.push({ type: 'operator', value: op });
        i++;
        continue;
      }
      
      // 标点符号
      if (/[(),;.]/.test(char)) {
        tokens.push({ type: 'punctuation', value: char });
        i++;
        continue;
      }
      
      // 其他字符（空白等）
      tokens.push({ type: 'plain', value: char });
      i++;
    }
    
    return tokens;
  };

  const tokens = highlight(sql);
  
  const colors: Record<string, string> = {
    keyword: isDark ? '#f472b6' : '#db2777',
    type: isDark ? '#60a5fa' : '#2563eb',
    function: isDark ? '#a78bfa' : '#7c3aed',
    string: isDark ? '#34d399' : '#059669',
    number: isDark ? '#fb923c' : '#ea580c',
    comment: isDark ? '#6b7280' : '#9ca3af',
    operator: isDark ? '#f87171' : '#dc2626',
    punctuation: isDark ? '#9ca3af' : '#6b7280',
    identifier: isDark ? '#e5e7eb' : '#374151',
    plain: isDark ? '#e5e7eb' : '#374151',
  };

  return (
    <pre className="m-0 whitespace-pre-wrap break-words font-mono text-sm leading-relaxed">
      {tokens.map((token, index) => (
        <span key={index} style={{ color: colors[token.type] || colors.plain }}>
          {token.value}
        </span>
      ))}
    </pre>
  );
}

// 简单的 SQL 格式化
function formatSQL(sql: string): string {
  let formatted = sql.replace(/\s+/g, ' ').trim();
  
  const keywords = [
    'SELECT', 'FROM', 'WHERE', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'DROP',
    'TABLE', 'JOIN', 'LEFT', 'RIGHT', 'INNER', 'OUTER', 'ON', 'GROUP', 'BY',
    'ORDER', 'HAVING', 'LIMIT', 'OFFSET', 'UNION', 'VALUES', 'SET', 'AND', 'OR'
  ];
  
  // 关键字前加换行
  keywords.forEach(kw => {
    const regex = new RegExp(`\\b${kw}\\b`, 'gi');
    formatted = formatted.replace(regex, match => `\n${match}`);
  });
  
  // 处理逗号后的换行
  formatted = formatted.replace(/,\s*/g, ',\n  ');
  
  // 处理括号
  formatted = formatted.replace(/\(/g, '(');
  formatted = formatted.replace(/\)/g, ')');
  
  // 缩进处理
  const lines = formatted.split('\n');
  let indent = 0;
  const result: string[] = [];
  
  lines.forEach(line => {
    line = line.trim();
    if (!line) return;
    
    if (/^\)/.test(line)) indent = Math.max(0, indent - 1);
    
    result.push('  '.repeat(indent) + line);
    
    if (/\($/.test(line)) indent++;
  });
  
  return result.join('\n').trim();
}

// SQL 统计
function SqlStats({ sql }: { sql: string }) {
  const lines = sql.split('\n').length;
  const words = sql.split(/\s+/).filter(w => w.length > 0).length;
  const chars = sql.length;
  
  return (
    <div className="flex flex-wrap gap-4 text-xs text-gray-500">
      <span>{lines} 行</span>
      <span>{words} 词</span>
      <span>{chars} 字符</span>
    </div>
  );
}

export function SqlTool() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<'formatted' | 'compressed'>('formatted');
  const [isDark, setIsDark] = useState(false);
  const { copied, copy } = useClipboard();
  const outputRef = useRef<HTMLDivElement>(null);

  // 检测主题
  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  // 自动格式化
  useEffect(() => {
    if (!input.trim()) {
      setOutput('');
      setError('');
      return;
    }
    
    try {
      if (viewMode === 'formatted') {
        setOutput(formatSQL(input));
      } else {
        setOutput(input.replace(/\s+/g, ' ').trim());
      }
      setError('');
    } catch (e) {
      setError('格式化失败');
    }
  }, [input, viewMode]);

  const handleFormat = () => {
    if (!input.trim()) return;
    setViewMode('formatted');
    setOutput(formatSQL(input));
  };

  const handleCompress = () => {
    if (!input.trim()) return;
    setViewMode('compressed');
    setOutput(input.replace(/\s+/g, ' ').trim());
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const content = await readFile(file);
      setInput(content);
    } catch {
      setError('文件读取失败');
    }
  };

  const handleCopy = async () => {
    if (output) {
      await copy(output);
    }
  };

  const handleDownload = () => {
    if (!output) return;
    const ext = viewMode === 'formatted' ? 'sql' : 'min.sql';
    downloadFile(output, `query.${ext}`, 'text/plain');
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* 标题 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Database className="w-7 h-7 text-blue-500" />
          SQL 格式化
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          SQL 语句美化、压缩和语法高亮
        </p>
      </div>

      {/* 工具栏 */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <button onClick={handleFormat} className="btn-primary text-sm">
          <AlignLeft className="w-4 h-4" />
          格式化
        </button>
        <button onClick={handleCompress} className="btn-secondary text-sm">
          <Minimize2 className="w-4 h-4" />
          压缩
        </button>
        <div className="w-px h-6 bg-gray-300 dark:bg-slate-600 mx-1" />
        <label className="btn-secondary text-sm cursor-pointer">
          <Upload className="w-4 h-4" />
          导入
          <input type="file" accept=".sql,.txt" onChange={handleFileUpload} className="hidden" />
        </label>
        <button onClick={handleDownload} disabled={!output} className="btn-secondary text-sm disabled:opacity-50">
          <Download className="w-4 h-4" />
          下载
        </button>
        <button onClick={() => { setInput(''); setOutput(''); }} className="btn-danger text-sm">
          <Trash2 className="w-4 h-4" />
          清空
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* 输入输出区域 */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* 输入区域 */}
        <div className="card flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">输入 SQL</span>
              {input && <SqlStats sql={input} />}
            </div>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="在此粘贴 SQL 语句...\n\n例如:\nSELECT * FROM users WHERE id = 1;"
            className="flex-1 min-h-[400px] p-4 font-mono text-sm bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 dark:text-white"
            spellCheck={false}
          />
        </div>

        {/* 输出区域 */}
        <div className="card flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">输出</span>
              {output && (
                <>
                  <span className="text-xs text-gray-400">
                    {output.length.toLocaleString()} 字符
                  </span>
                  <div className="flex bg-gray-100 dark:bg-slate-800 rounded p-0.5">
                    <button
                      onClick={() => setViewMode('formatted')}
                      className={`px-2 py-0.5 text-xs rounded transition-colors ${
                        viewMode === 'formatted' 
                          ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' 
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      格式化
                    </button>
                    <button
                      onClick={() => setViewMode('compressed')}
                      className={`px-2 py-0.5 text-xs rounded transition-colors ${
                        viewMode === 'compressed' 
                          ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' 
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      压缩
                    </button>
                  </div>
                </>
              )}
            </div>
            {output && (
              <button 
                onClick={handleCopy} 
                className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? '已复制' : '复制'}
              </button>
            )}
          </div>
          
          <div 
            ref={outputRef}
            className="flex-1 min-h-[400px] p-4 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg overflow-auto"
          >
            {output ? (
              viewMode === 'formatted' ? (
                <SqlHighlighter sql={output} isDark={isDark} />
              ) : (
                <pre className="font-mono text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-all">
                  {output}
                </pre>
              )
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                格式化后的 SQL 将显示在这里
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 图例 */}
      <div className="mt-4 card">
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <span className="text-gray-500">语法高亮图例:</span>
          <span className="text-pink-600 dark:text-pink-400">关键字 (SELECT)</span>
          <span className="text-blue-600 dark:text-blue-400">数据类型 (INT)</span>
          <span className="text-violet-600 dark:text-violet-400">函数 (COUNT)</span>
          <span className="text-green-600 dark:text-green-400">字符串 ('text')</span>
          <span className="text-orange-600 dark:text-orange-400">数字 (123)</span>
          <span className="text-red-600 dark:text-red-400">运算符 (=)</span>
          <span className="text-gray-500">-- 注释</span>
        </div>
      </div>

      <AdInArticle />

      {/* 底部广告 */}
      <AdFooter />
    </div>
  );
}
