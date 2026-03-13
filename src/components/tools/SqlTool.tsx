import { useState, useEffect, useRef } from 'react';
import { 
  Copy, Check, Download, Upload, Trash2, 
  Database, AlertCircle, AlignLeft, Minimize2
} from 'lucide-react';
import { format } from 'sql-formatter';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import sql from 'react-syntax-highlighter/dist/esm/languages/prism/sql';

// 注册 SQL 语言
SyntaxHighlighter.registerLanguage('sql', sql);
import type { CSSProperties } from 'react';
import { downloadFile, readFile } from '../../utils/helpers';
import { useClipboard } from '../../hooks/useLocalStorage';
import { AdInArticle, AdFooter } from '../ads';
import { customLightTheme, customDarkTheme } from '../../styles/prism-theme';
import { CodeEditor } from '../CodeEditor';

// SQL 格式化工具使用 14px 字体（共享主题使用 13px）
const sqlLightTheme: { [key: string]: CSSProperties } = {
  ...customLightTheme,
  'code[class*="language-"]': { ...customLightTheme['code[class*="language-"]'], fontSize: '14px' },
  'pre[class*="language-"]': { ...customLightTheme['pre[class*="language-"]'], fontSize: '14px' },
};
const sqlDarkTheme: { [key: string]: CSSProperties } = {
  ...customDarkTheme,
  'code[class*="language-"]': { ...customDarkTheme['code[class*="language-"]'], fontSize: '14px' },
  'pre[class*="language-"]': { ...customDarkTheme['pre[class*="language-"]'], fontSize: '14px' },
};

// SQL 统计
function SqlStats({ sql }: { sql: string }) {
  const lines = sql.split('\n').length;
  const words = sql.split(/\s+/).filter(w => w.length > 0).length;
  const chars = sql.length;
  
  return (
    <div className="flex flex-wrap gap-2 sm:gap-4 text-xs text-gray-500">
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

  // 简化错误信息
  const simplifyError = (errorMsg: string): string => {
    // 提取关键错误信息
    if (errorMsg.includes('Parse error')) {
      const match = errorMsg.match(/token:\s*([^\s]+).*?at line (\d+)/i);
      if (match) {
        return `SQL 语法错误: 第 ${match[2]} 行附近有错误，请检查符号 "${match[1]}"`;
      }
      return 'SQL 语法错误: 请检查语句格式';
    }
    return '格式化失败: 请检查 SQL 语法';
  };

  // 自动格式化
  useEffect(() => {
    if (!input.trim()) {
      setOutput('');
      setError('');
      return;
    }
    
    try {
      if (viewMode === 'formatted') {
        const formatted = format(input, {
          language: 'sql',
          tabWidth: 2,
          keywordCase: 'upper',
        });
        setOutput(formatted);
      } else {
        setOutput(input.replace(/\s+/g, ' ').trim());
      }
      setError('');
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : '未知错误';
      setError(simplifyError(errorMsg));
      setOutput(input);
    }
  }, [input, viewMode]);

  const handleFormat = () => {
    if (!input.trim()) return;
    setViewMode('formatted');
    try {
      const formatted = format(input, {
        language: 'sql',
        tabWidth: 2,
        keywordCase: 'upper',
      });
      setOutput(formatted);
      setError('');
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : '未知错误';
      setError(simplifyError(errorMsg));
    }
  };

  const handleCompress = () => {
    if (!input.trim()) return;
    setViewMode('compressed');
    const compressed = input.replace(/\s+/g, ' ').trim();
    setOutput(compressed);
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
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Database className="w-6 h-6 sm:w-7 sm:h-7 text-blue-500" />
          SQL 格式化
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 text-xs sm:text-sm">
          SQL 语句美化、压缩和语法高亮
        </p>
      </div>

      {/* 工具栏 */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <button onClick={handleFormat} className="btn-primary btn-tool">
          <AlignLeft className="w-3.5 h-3.5 flex-shrink-0" />
          格式化
        </button>
        <button onClick={handleCompress} className="btn-secondary btn-tool">
          <Minimize2 className="w-3.5 h-3.5 flex-shrink-0" />
          压缩
        </button>
        <div className="w-px h-5 sm:h-6 bg-gray-300 dark:bg-slate-600 mx-1 hidden sm:block" />
        <label className="btn-secondary btn-tool cursor-pointer">
          <Upload className="w-3.5 h-3.5 flex-shrink-0" />
          导入
          <input type="file" accept=".sql,.txt" onChange={handleFileUpload} className="hidden" />
        </label>
        <button onClick={handleDownload} disabled={!output} className="btn-secondary btn-tool disabled:opacity-50">
          <Download className="w-3.5 h-3.5 flex-shrink-0" />
          下载
        </button>
        <button onClick={() => { setInput(''); setOutput(''); }} className="btn-ghost-danger btn-tool">
          <Trash2 className="w-3.5 h-3.5 flex-shrink-0" />
          清空
        </button>
      </div>

      {error && (
        <div className="mb-4 p-2.5 sm:p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-600 dark:text-red-400 text-xs sm:text-sm">
          <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* 输入输出区域 */}
      <div className="grid lg:grid-cols-2 gap-3 sm:gap-4">
        {/* 输入区域 */}
        <div className="card p-4 sm:p-6 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">输入 SQL</span>
              {input && <SqlStats sql={input} />}
            </div>
          </div>
          <CodeEditor
            value={input}
            onChange={setInput}
            language="sql"
            placeholder="在此粘贴 SQL 语句...\n\n例如:\nSELECT * FROM users WHERE id = 1;"
            height="min-h-[300px] sm:min-h-[400px]"
          />
        </div>

        {/* 输出区域 */}
        <div className="card p-4 sm:p-6 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">输出</span>
              {output && (
                <>
                  <span className="text-xs text-gray-400">
                    {output.length.toLocaleString()} 字符
                  </span>
                  <div className="btn-group">
                    <button
                      onClick={() => setViewMode('formatted')}
                      className={`btn-group-item ${viewMode === 'formatted' ? 'btn-group-item-active' : ''}`}
                    >
                      格式化
                    </button>
                    <button
                      onClick={() => setViewMode('compressed')}
                      className={`btn-group-item ${viewMode === 'compressed' ? 'btn-group-item-active' : ''}`}
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
                className={`btn-tool ${copied ? 'btn-ghost-success' : 'btn-ghost'}`}
              >
                {copied ? <Check className="w-3.5 h-3.5 flex-shrink-0" /> : <Copy className="w-3.5 h-3.5 flex-shrink-0" />}
                {copied ? '已复制' : '复制'}
              </button>
            )}
          </div>
          
          <div 
            ref={outputRef}
            className="flex-1 min-h-[300px] sm:min-h-[400px] bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg overflow-auto"
          >
            {output ? (
              <SyntaxHighlighter
                language="sql"
                style={isDark ? sqlDarkTheme : sqlLightTheme}
                customStyle={{
                  margin: 0,
                  padding: '1rem',
                  background: 'transparent',
                }}
                wrapLines={true}
                wrapLongLines={true}
              >
                {output}
              </SyntaxHighlighter>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 text-xs sm:text-sm">
                格式化后的 SQL 将显示在这里
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 图例 */}
      <div className="mt-4 card p-4 sm:p-6">
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs">
          <span className="text-gray-500">语法高亮图例:</span>
          <span className={isDark ? 'text-blue-400 font-semibold' : 'text-blue-600 font-semibold'}>关键字 (SELECT)</span>
          <span className={isDark ? 'text-purple-400' : 'text-purple-600'}>函数 (COUNT)</span>
          <span className={isDark ? 'text-green-400' : 'text-green-600'}>字符串 ('text')</span>
          <span className={isDark ? 'text-orange-400' : 'text-orange-600'}>数字 (123)</span>
          <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>-- 注释</span>
        </div>
      </div>

      <AdInArticle />

      {/* 底部广告 */}
      <AdFooter />
    </div>
  );
}
