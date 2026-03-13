import { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Copy, Check, Download, Upload, Trash2, 
  Minimize2, FileJson, Braces, Type, Hash, List, AlertCircle
} from 'lucide-react';
import ReactJson from 'react-json-view';
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
    <div className={`p-3 sm:p-4 min-h-full ${isDark ? 'bg-slate-900' : 'bg-gray-50'}`} style={{ minWidth: 0 }}>
      <pre 
        className={`font-mono text-xs sm:text-sm whitespace-pre-wrap break-all ${
          isDark ? 'text-surface-200' : 'text-surface-800'
        }`}
        style={{ wordBreak: 'break-all', overflowWrap: 'break-word', margin: 0, background: 'transparent' }}
      >
        {compressed}
      </pre>
    </div>
  );
}

// 自定义 slate 主题 - 匹配项目 dark 主题
const slateTheme = {
  base00: '#0f172a', // 背景 slate-900
  base01: '#1e293b', // 对象/数组背景 slate-800
  base02: '#334155', // 边框/分隔线 slate-700
  base03: '#64748b', // 次要文字 slate-500
  base04: '#94a3b8', // 括号等 slate-400
  base05: '#e2e8f0', // 主要文字 slate-200
  base06: '#f1f5f9', // 高亮 slate-100
  base07: '#ffffff', // 最亮文字
  base08: '#38bdf8', // key颜色 (sky-400) - 蓝色系
  base09: '#a5f3fc', // 字符串 (cyan-200) - 青色系
  base0A: '#fde047', // 数字 (yellow-300) - 黄色系
  base0B: '#4ade80', // 布尔值 true (green-400) - 绿色系
  base0C: '#94a3b8', // null (slate-400) - 灰色
  base0D: '#60a5fa', // 折叠图标 (blue-400)
  base0E: '#c084fc', // 数组索引 (purple-400)
  base0F: '#f472b6', // 特殊字符 (pink-400)
};

// 格式化视图组件
function FormattedView({ data, isDark }: { data: object; isDark: boolean }) {
  return (
    <div className="p-2 sm:p-4" style={{ minWidth: 0 }}>
      <div style={{ maxWidth: '100%' }}>
        <ReactJson
          src={data}
          theme={isDark ? slateTheme : 'rjv-default'}
          displayDataTypes={false}
          enableClipboard={true}
          collapsed={false}
          style={{ 
            background: 'transparent',
            fontSize: '13px',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'
          }}
          iconStyle="triangle"
          indentWidth={2}
          collapseStringsAfterLength={80}
        />
      </div>
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
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <FileJson className="w-6 h-6 sm:w-7 sm:h-7 text-blue-500" />
          JSON 工具
        </h1>
        <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-1">
          JSON 格式化、压缩、验证、转义和高亮查看
        </p>
      </div>

      {/* 工具栏 */}
      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-4">
        {/* 主要操作组 */}
        <div className="inline-flex bg-surface-100 dark:bg-surface-800 p-0.5 sm:p-1 rounded-lg sm:rounded-xl">
          <button 
            onClick={handleFormat} 
            className="btn-primary btn-tool"
          >
            <FileJson className="w-3.5 h-3.5 flex-shrink-0" />
            <span>格式化</span>
          </button>
          <button 
            onClick={handleCompress} 
            className="btn-tool text-surface-700 dark:text-surface-300 hover:bg-white dark:hover:bg-surface-700"
          >
            <Minimize2 className="w-3.5 h-3.5 flex-shrink-0" />
            <span>压缩</span>
          </button>
        </div>

        {/* 次要操作组 */}
        <div className="inline-flex bg-surface-100 dark:bg-surface-800 p-0.5 sm:p-1 rounded-lg sm:rounded-xl">
          <button 
            onClick={handleEscape} 
            className="btn-tool text-surface-700 dark:text-surface-300 hover:bg-white dark:hover:bg-surface-700"
          >
            转义
          </button>
          <button 
            onClick={handleUnescape} 
            className="btn-tool text-surface-700 dark:text-surface-300 hover:bg-white dark:hover:bg-surface-700"
          >
            去转
          </button>
        </div>

        {/* 文件操作组 */}
        <div className="inline-flex bg-surface-100 dark:bg-surface-800 p-0.5 sm:p-1 rounded-lg sm:rounded-xl">
          <label className="btn-tool text-surface-700 dark:text-surface-300 hover:bg-white dark:hover:bg-surface-700 cursor-pointer">
            <Upload className="w-3.5 h-3.5 flex-shrink-0" />
            <span>导入</span>
            <input type="file" accept=".json,.txt" onChange={handleFileUpload} className="hidden" />
          </label>
          <button 
            onClick={handleDownload} 
            disabled={!output}
            className="btn-tool text-surface-700 dark:text-surface-300 hover:bg-white dark:hover:bg-surface-700 disabled:opacity-40"
          >
            <Download className="w-3.5 h-3.5 flex-shrink-0" />
            <span>下载</span>
          </button>
        </div>

        {/* 清空按钮 */}
        <button 
          onClick={() => { setInput(''); setOutput(''); }}
          className="btn-ghost-danger btn-tool"
        >
          <Trash2 className="w-3.5 h-3.5 flex-shrink-0" />
          <span>清空</span>
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
      <div className="grid lg:grid-cols-2 gap-3 sm:gap-4">
        {/* 输入区域 */}
        <div className="card p-4 sm:p-6 min-w-0">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
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
            className="w-full h-[250px] sm:h-[400px] p-3 sm:p-4 font-mono text-xs sm:text-sm bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg resize-y focus:ring-2 focus:ring-blue-500 dark:text-white whitespace-pre overflow-auto"
            spellCheck={false}
          />
        </div>

        {/* 输出区域 */}
        <div className="card p-4 sm:p-6 min-w-0">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
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
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? '已复制' : '复制'}
              </button>
            )}
          </div>
          
          <div className="h-[250px] sm:h-[400px] bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg overflow-auto">
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
        <div className="mt-3 sm:mt-4 card p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
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
