import { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Copy, Check, Download, Upload, Trash2, 
  Minimize2, FileJson, Braces, Type, Hash, List, AlertCircle
} from 'lucide-react';
import JsonView from '@uiw/react-json-view';
import { lightTheme } from '@uiw/react-json-view/light';
import { darkTheme } from '@uiw/react-json-view/dark';
import { downloadFile, readFile } from '../../utils/helpers';
import { useClipboard } from '../../hooks/useLocalStorage';
import { AdInArticle, AdFooter } from '../ads';

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

// 压缩视图组件
function CompressedView({ data, isDark }: { data: object; isDark: boolean }) {
  const compressed = useMemo(() => JSON.stringify(data), [data]);
  
  return (
    <div className="h-full overflow-auto p-4">
      <pre 
        className={`font-mono text-sm whitespace-pre-wrap break-all bg-transparent ${
          isDark ? 'text-gray-200' : 'text-gray-800'
        }`}
      >
        {compressed}
      </pre>
    </div>
  );
}

// 格式化视图组件
function FormattedView({ data, isDark }: { data: object; isDark: boolean }) {
  return (
    <div className="h-full overflow-auto p-4">
      <JsonView
        value={data}
        style={isDark ? darkTheme : lightTheme}
        displayDataTypes={false}
        enableClipboard={false}
        collapsed={false}
      />
    </div>
  );
}

export function JsonTool() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<'formatted' | 'compressed'>('formatted');
  const [isDark, setIsDark] = useState(false);
  const { copied, copy } = useClipboard();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // 监听主题变化
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    checkDarkMode();
    
    // 监听主题变化
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    
    return () => observer.disconnect();
  }, []);

  // 解析输入的 JSON
  const parsedData = useMemo(() => {
    if (!input.trim()) return null;
    try {
      const parsed = JSON.parse(input);
      // 确保返回的是对象类型
      return typeof parsed === 'object' && parsed !== null ? parsed : null;
    } catch {
      return null;
    }
  }, [input]);

  // 更新输出
  useEffect(() => {
    if (!input.trim()) {
      setOutput('');
      setError('');
      return;
    }
    try {
      const parsed = JSON.parse(input);
      if (viewMode === 'compressed') {
        setOutput(JSON.stringify(parsed));
      } else {
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
      const compressed = JSON.stringify(parsed);
      setOutput(compressed);
      setViewMode('compressed');
      setError('');
    } catch (e) {
      setError(`无效的 JSON 格式: ${e instanceof Error ? e.message : '未知错误'}`);
    }
  };

  const handleEscape = () => {
    if (!input.trim()) return;
    setOutput(JSON.stringify(input));
    setViewMode('formatted');
  };

  const handleUnescape = () => {
    if (!input.trim()) return;
    try {
      const unescaped = JSON.parse(input);
      const result = typeof unescaped === 'string' ? unescaped : JSON.stringify(unescaped, null, 2);
      setInput(result);
      setOutput(result);
      setViewMode('formatted');
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
          
          <div className="flex-1 min-h-[400px] bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden">
            {parsedData ? (
              viewMode === 'formatted' ? (
                <FormattedView data={parsedData as object} isDark={isDark} />
              ) : (
                <CompressedView data={parsedData as object} isDark={isDark} />
              )
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
