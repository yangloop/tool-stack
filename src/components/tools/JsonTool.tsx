import { useState, useEffect, useRef } from 'react';
import { 
  Copy, Check, Download, Upload, Trash2, 
  Minimize2, FileJson, ChevronDown, ChevronRight,
  Braces, Type, Hash, List, AlertCircle
} from 'lucide-react';
import { downloadFile, readFile } from '../../utils/helpers';
import { useClipboard } from '../../hooks/useLocalStorage';
import { AdInArticle, AdFooter } from '../ads';

// JSON 语法高亮样式
const jsonStyles: Record<string, React.CSSProperties> = {
  root: { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace', fontSize: '14px', lineHeight: '1.6' },
  key: { color: '#2563eb' }, // blue-600
  string: { color: '#059669' }, // emerald-600
  number: { color: '#dc2626' }, // red-600
  boolean: { color: '#7c3aed' }, // violet-600
  null: { color: '#7c3aed' },
  punctuation: { color: '#6b7280' }, // gray-500
};

// JSON 语法高亮组件
function JsonHighlighter({ json, isDark }: { json: string; isDark: boolean }) {
  const renderValue = (value: unknown, _key?: string, depth = 0): React.ReactNode => {
    const indent = '  '.repeat(depth);
    
    if (value === null) {
      return <span style={jsonStyles.null}>null</span>;
    }
    
    if (typeof value === 'boolean') {
      return <span style={jsonStyles.boolean}>{String(value)}</span>;
    }
    
    if (typeof value === 'number') {
      return <span style={jsonStyles.number}>{value}</span>;
    }
    
    if (typeof value === 'string') {
      return <span style={jsonStyles.string}>"{value}"</span>;
    }
    
    if (Array.isArray(value)) {
      if (value.length === 0) return <span style={jsonStyles.punctuation}>[]</span>;
      return (
        <span>
          <span style={jsonStyles.punctuation}>[
          {'\n'}</span>
          {value.map((item, idx) => (
            <span key={idx}>
              <span style={jsonStyles.punctuation}>{indent}  </span>
              {renderValue(item, undefined, depth + 1)}
              {idx < value.length - 1 && <span style={jsonStyles.punctuation}>,</span>}
              {'\n'}
            </span>
          ))}
          <span style={jsonStyles.punctuation}>{indent}]</span>
        </span>
      );
    }
    
    if (typeof value === 'object') {
      const entries = Object.entries(value);
      if (entries.length === 0) return <span style={jsonStyles.punctuation}>{}</span>;
      return (
        <span>
          <span style={jsonStyles.punctuation}>{'{'}
          {'\n'}</span>
          {entries.map(([k, v], idx) => (
            <span key={k}>
              <span style={jsonStyles.punctuation}>{indent}  </span>
              <span style={jsonStyles.key}>"{k}"</span>
              <span style={jsonStyles.punctuation}>: </span>
              {renderValue(v, k, depth + 1)}
              {idx < entries.length - 1 && <span style={jsonStyles.punctuation}>,</span>}
              {'\n'}
            </span>
          ))}
          <span style={jsonStyles.punctuation}>{indent}{'}'}</span>
        </span>
      );
    }
    
    return null;
  };

  try {
    const parsed = JSON.parse(json);
    return (
      <pre style={{ 
        ...jsonStyles.root, 
        margin: 0, 
        whiteSpace: 'pre-wrap', 
        wordBreak: 'break-word',
        color: isDark ? '#e5e7eb' : '#1f2937'
      }}>
        {renderValue(parsed)}
      </pre>
    );
  } catch {
    return <pre style={{ color: '#dc2626' }}>{json}</pre>;
  }
}

// JSON 树形视图组件
interface JsonTreeProps {
  data: unknown;
  name?: string;
  depth?: number;
  isLast?: boolean;
  isDark: boolean;
}

function JsonTree({ data, name, depth = 0, isLast = true, isDark }: JsonTreeProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const isObject = data !== null && typeof data === 'object';
  const isArray = Array.isArray(data);
  const indent = depth * 16;
  
  const getTypeColor = (value: unknown): string => {
    if (value === null) return isDark ? '#a78bfa' : '#7c3aed';
    if (typeof value === 'boolean') return isDark ? '#a78bfa' : '#7c3aed';
    if (typeof value === 'number') return isDark ? '#f87171' : '#dc2626';
    if (typeof value === 'string') return isDark ? '#34d399' : '#059669';
    return isDark ? '#9ca3af' : '#6b7280';
  };

  const renderValue = (value: unknown): string => {
    if (value === null) return 'null';
    if (typeof value === 'string') return `"${value}"`;
    return String(value);
  };

  if (!isObject) {
    return (
      <div className="flex items-center py-0.5 font-mono text-sm" style={{ paddingLeft: indent }}>
        {name !== undefined && (
          <>
            <span className="text-blue-600 dark:text-blue-400">"{name}"</span>
            <span className="text-gray-500 mx-1">:</span>
          </>
        )}
        <span style={{ color: getTypeColor(data) }}>{renderValue(data)}</span>
        {!isLast && <span className="text-gray-500">,</span>}
      </div>
    );
  }

  const entries = isArray ? data.map((v, i) => [String(i), v] as const) : Object.entries(data as object);
  const isEmpty = entries.length === 0;
  const preview = isArray ? `Array[${entries.length}]` : `Object{${entries.length}}`;

  return (
    <div>
      <div 
        className="flex items-center py-0.5 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-800 rounded font-mono text-sm"
        style={{ paddingLeft: indent }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className="text-gray-400 w-4">
          {!isEmpty && (isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />)}
        </span>
        {name !== undefined && (
          <>
            <span className="text-blue-600 dark:text-blue-400">"{name}"</span>
            <span className="text-gray-500 mx-1">:</span>
          </>
        )}
        {!isExpanded || isEmpty ? (
          <span className="text-gray-400 italic">{isArray ? '[]' : '{}'} {preview}</span>
        ) : (
          <span className="text-gray-500">{isArray ? '[' : '{'}</span>
        )}
        {!isExpanded && !isLast && <span className="text-gray-500">,</span>}
      </div>
      
      {isExpanded && !isEmpty && (
        <div>
          {entries.map(([key, value], idx) => (
            <JsonTree
              key={key}
              data={value}
              name={isArray ? undefined : key}
              depth={depth + 1}
              isLast={idx === entries.length - 1}
              isDark={isDark}
            />
          ))}
          <div className="flex items-center py-0.5 font-mono text-sm" style={{ paddingLeft: indent + 16 }}>
            <span className="text-gray-500">{isArray ? ']' : '}'}</span>
            {!isLast && <span className="text-gray-500">,</span>}
          </div>
        </div>
      )}
    </div>
  );
}

// JSON 统计信息
function JsonStats({ json }: { json: string }) {
  try {
    const parsed = JSON.parse(json);
    const stats = analyzeJson(parsed);
    
    return (
      <div className="flex flex-wrap gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <Braces className="w-3.5 h-3.5" />
          对象: {stats.objects}
        </span>
        <span className="flex items-center gap-1">
          <List className="w-3.5 h-3.5" />
          数组: {stats.arrays}
        </span>
        <span className="flex items-center gap-1">
          <Type className="w-3.5 h-3.5" />
          字符串: {stats.strings}
        </span>
        <span className="flex items-center gap-1">
          <Hash className="w-3.5 h-3.5" />
          数字: {stats.numbers}
        </span>
        <span className="flex items-center gap-1">
          布尔: {stats.booleans}
        </span>
        <span className="flex items-center gap-1">
          Null: {stats.nulls}
        </span>
        <span className="flex items-center gap-1">
          总节点: {stats.total}
        </span>
      </div>
    );
  } catch {
    return null;
  }
}

function analyzeJson(data: unknown): Record<string, number> {
  const stats = { objects: 0, arrays: 0, strings: 0, numbers: 0, booleans: 0, nulls: 0, total: 0 };
  
  const traverse = (value: unknown) => {
    stats.total++;
    if (value === null) stats.nulls++;
    else if (typeof value === 'boolean') stats.booleans++;
    else if (typeof value === 'number') stats.numbers++;
    else if (typeof value === 'string') stats.strings++;
    else if (Array.isArray(value)) {
      stats.arrays++;
      value.forEach(traverse);
    } else if (typeof value === 'object') {
      stats.objects++;
      Object.values(value).forEach(traverse);
    }
  };
  
  traverse(data);
  return stats;
}

export function JsonTool() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<'formatted' | 'tree' | 'compressed'>('formatted');
  const [isDark] = useState(document.documentElement.classList.contains('dark'));
  const { copied, copy } = useClipboard();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!input.trim()) {
      setOutput('');
      setError('');
      return;
    }
    try {
      const parsed = JSON.parse(input);
      // 只有在非压缩模式下才自动格式化
      if (viewMode !== 'compressed') {
        setOutput(JSON.stringify(parsed, null, 2));
      }
      setError('');
    } catch (e) {
      setError(`无效的 JSON 格式: ${e instanceof Error ? e.message : '未知错误'}`);
      setOutput('');
    }
  }, [input, viewMode]);

  const handleFormat = () => {
    if (!input.trim()) return;
    try {
      const parsed = JSON.parse(input);
      setOutput(JSON.stringify(parsed, null, 2));
      setViewMode('formatted');
      setError('');
    } catch (e) {
      setError(`无效的 JSON 格式: ${e instanceof Error ? e.message : '未知错误'}`);
    }
  };

  const handleCompress = () => {
    if (!input.trim()) return;
    try {
      const parsed = JSON.parse(input);
      setOutput(JSON.stringify(parsed));
      setViewMode('compressed');
      setError('');
    } catch (e) {
      setError(`无效的 JSON 格式: ${e instanceof Error ? e.message : '未知错误'}`);
    }
  };

  const handleEscape = () => {
    if (!input.trim()) return;
    setOutput(JSON.stringify(input));
  };

  const handleUnescape = () => {
    if (!input.trim()) return;
    try {
      const unescaped = JSON.parse(input);
      setOutput(typeof unescaped === 'string' ? unescaped : JSON.stringify(unescaped, null, 2));
    } catch {
      setError('无效的转义字符串');
    }
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

  const handleDownload = () => {
    if (!output) return;
    downloadFile(output, 'formatted.json', 'application/json');
  };

  const handleCopy = async () => {
    if (!output) return;
    await copy(output);
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* 标题 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <FileJson className="w-7 h-7 text-blue-500" />
          JSON 工具
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          JSON 格式化、压缩、验证、转义和高亮查看
        </p>
      </div>

      {/* 工具栏 */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <button onClick={handleFormat} className="btn-primary text-sm">
          格式化
        </button>
        <button onClick={handleCompress} className="btn-secondary text-sm">
          <Minimize2 className="w-4 h-4" />
          压缩
        </button>
        <button onClick={handleEscape} className="btn-secondary text-sm">
          转义
        </button>
        <button onClick={handleUnescape} className="btn-secondary text-sm">
          去转义
        </button>
        <div className="w-px h-6 bg-gray-300 dark:bg-slate-600 mx-1"></div>
        <label className="btn-secondary text-sm cursor-pointer">
          <Upload className="w-4 h-4" />
          导入
          <input type="file" accept=".json,.txt" onChange={handleFileUpload} className="hidden" />
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

      {/* 错误提示 */}
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
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">输入</span>
              {input && (
                <span className="text-xs text-gray-400">
                  {input.length.toLocaleString()} 字符
                </span>
              )}
            </div>
          </div>
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="在此粘贴 JSON 数据..."
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
                      onClick={() => setViewMode('tree')}
                      className={`px-2 py-0.5 text-xs rounded transition-colors ${
                        viewMode === 'tree' 
                          ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' 
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      树形
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
          
          <div className="flex-1 min-h-[400px] bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg overflow-auto">
            {output ? (
              <div className="p-4">
                {viewMode === 'formatted' ? (
                  <JsonHighlighter json={output} isDark={isDark} />
                ) : viewMode === 'tree' ? (
                  <JsonTree data={JSON.parse(output)} isDark={isDark} />
                ) : (
                  <pre className="font-mono text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-all">
                    {output}
                  </pre>
                )}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                格式化后的 JSON 将显示在这里
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 统计信息 */}
      {output && !error && (
        <div className="mt-4 card">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">JSON 统计</span>
            <JsonStats json={output} />
          </div>
        </div>
      )}

      <AdInArticle />

      {/* 底部广告 */}
      <AdFooter />
    </div>
  );
}
