import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Copy, Check, 
  Minimize2, FileJson, Braces, Type, Hash, List, AlertCircle,
  Maximize2
} from 'lucide-react';
import { downloadFile, readFile } from '../../../utils/helpers';
import { useClipboard } from '../../../hooks/useLocalStorage';
import { AdInArticle, AdFooter } from '../../../components/ads';
import { CodeEditor } from '../../../components/CodeEditor';
import { ToolInfoAuto } from './ToolInfoSection';
import { ToolHeader } from '../../../components/common';
import { JsonToolbar } from './JsonToolbar';

// JSON 统计信息
function JsonStats({ json }: { json: string }) {
  try {
    const parsed = JSON.parse(json);
    const stats = analyzeJson(parsed);
    
    return (
      <div className="flex flex-wrap gap-4 text-xs text-surface-500 dark:text-surface-400">
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
        <span className="flex items-center gap-1">布尔: {stats.booleans}</span>
        <span className="flex items-center gap-1">Null: {stats.nulls}</span>
        <span className="flex items-center gap-1">总节点: {stats.total}</span>
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
  const [viewMode, setViewMode] = useState<'formatted' | 'compressed'>('formatted');
  const [isDark, setIsDark] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { copied, copy } = useClipboard();

  // ESC 退出全屏
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  // 全屏时禁止 body 滚动
  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isFullscreen]);

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

  // 解析输入的 JSON
  const parseResult = useMemo(() => {
    if (!input.trim()) {
      return { data: null, error: null, formatted: '', compressed: '' };
    }
    try {
      const parsed = JSON.parse(input);
      const isObject = typeof parsed === 'object' && parsed !== null;
      return {
        data: isObject ? parsed : null,
        error: null,
        formatted: JSON.stringify(parsed, null, 2),
        compressed: JSON.stringify(parsed),
      };
    } catch (e) {
      return {
        data: null,
        error: `无效的 JSON 格式: ${e instanceof Error ? e.message : '未知错误'}`,
        formatted: '',
        compressed: '',
      };
    }
  }, [input]);

  // 更新输出和错误
  useEffect(() => {
    if (!input.trim()) {
      setOutput('');
      setError('');
      return;
    }
    setError(parseResult.error || '');
    setOutput(viewMode === 'compressed' ? parseResult.compressed : parseResult.formatted);
  }, [input, viewMode, parseResult]);

  const handleFormat = useCallback(() => {
    if (!input.trim()) return;
    try {
      const parsed = JSON.parse(input);
      setOutput(JSON.stringify(parsed, null, 2));
      setViewMode('formatted');
      setError('');
    } catch (e) {
      setError(`无效的 JSON 格式: ${e instanceof Error ? e.message : '未知错误'}`);
    }
  }, [input]);

  const handleCompress = useCallback(() => {
    if (!input.trim()) return;
    try {
      const parsed = JSON.parse(input);
      setOutput(JSON.stringify(parsed));
      setViewMode('compressed');
      setError('');
    } catch (e) {
      setError(`无效的 JSON 格式: ${e instanceof Error ? e.message : '未知错误'}`);
    }
  }, [input]);

  const handleEscape = useCallback(() => {
    if (!input.trim()) return;
    setOutput(JSON.stringify(input));
    setViewMode('formatted');
  }, [input]);

  const handleUnescape = useCallback(() => {
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
  }, [input]);

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const content = await readFile(file);
      setInput(content);
    } catch {
      setError('文件读取失败');
    }
  }, []);

  const handleDownload = useCallback(() => {
    if (!output) return;
    downloadFile(output, 'formatted.json', 'application/json');
  }, [output]);

  const handleCopy = useCallback(async () => {
    if (!output) return;
    await copy(output);
  }, [output, copy]);

  const handleClear = useCallback(() => {
    setInput('');
    setOutput('');
  }, []);

  // 非全屏输入面板
  const inputPanel = useMemo(() => (
    <div className="card p-4 sm:p-6 min-w-0">
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-surface-700 dark:text-surface-300">输入</span>
          {input && <span className="text-xs text-surface-400">{input.length.toLocaleString()} 字符</span>}
        </div>
      </div>
      <CodeEditor
        value={input}
        onChange={setInput}
        language="json"
        placeholder="在此粘贴 JSON 数据..."
        height="400px"
        variant="embedded"
      />
    </div>
  ), [input]);

  // 非全屏输出面板
  const outputPanel = useMemo(() => (
    <div className="card p-4 sm:p-6 min-w-0">
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-surface-700 dark:text-surface-300">输出</span>
          {output && (
            <>
              <span className="text-xs text-surface-400">{output.length.toLocaleString()} 字符</span>
              <div className="flex bg-surface-100 dark:bg-surface-700 rounded p-0.5">
                <button
                  onClick={() => setViewMode('formatted')}
                  className={`px-2 py-0.5 text-xs rounded ${viewMode === 'formatted' ? 'bg-white dark:bg-surface-600 text-surface-900 dark:text-surface-100 shadow-sm' : 'text-surface-500 dark:text-surface-400'}`}
                >
                  格式化
                </button>
                <button
                  onClick={() => setViewMode('compressed')}
                  className={`px-2 py-0.5 text-xs rounded ${viewMode === 'compressed' ? 'bg-white dark:bg-surface-600 text-surface-900 dark:text-surface-100 shadow-sm' : 'text-surface-500 dark:text-surface-400'}`}
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
      {output ? (
        <CodeEditor
          value={output}
          onChange={() => {}}
          language="json"
          height="400px"
          variant="embedded"
          readOnly={true}
          showLineNumbers={true}
        />
      ) : (
        <div className="h-[400px] flex items-center justify-center text-surface-400 text-sm bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-lg">
          格式化后的 JSON 将显示在这里
        </div>
      )}
    </div>
  ), [output, viewMode, copied, handleCopy, isDark]);

  return (
    <div className="max-w-7xl mx-auto">
      {!isFullscreen && (
        <>
          <ToolHeader
            icon={FileJson}
            title="JSON 工具"
            description="JSON 格式化、压缩、验证、转义和高亮查看"
            iconColorClass="text-primary-500"
            actions={
              <button 
                onClick={() => setIsFullscreen(true)}
                className="btn-tool-sm sm:btn-tool btn-ghost flex-shrink-0"
                title="全屏使用"
              >
                <Maximize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">全屏使用</span>
              </button>
            }
          />

          {/* 工具栏 */}
          <JsonToolbar
            onFormat={handleFormat}
            onCompress={handleCompress}
            onEscape={handleEscape}
            onUnescape={handleUnescape}
            onFileUpload={handleFileUpload}
            onDownload={handleDownload}
            onClear={handleClear}
            canDownload={!!output}
          />

          {/* 错误提示 */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span className="break-all">{error}</span>
            </div>
          )}



          {/* 输入输出区域 */}
          <div className="grid lg:grid-cols-2 gap-3 sm:gap-4">
            {inputPanel}
            {outputPanel}
          </div>

          {/* 统计信息 */}
          {output && !error && (
            <div className="mt-3 sm:mt-4 card p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <span className="text-sm font-medium text-surface-700 dark:text-surface-300">JSON 统计</span>
                <JsonStats json={output} />
              </div>
            </div>
          )}

          <AdInArticle />
          <ToolInfoAuto toolId="json" />
          <AdFooter />
        </>
      )}

      {/* 全屏模式 */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-surface-0 dark:bg-surface-900 flex flex-col overflow-hidden">
          {/* 顶部栏 - 固定高度 57px 含边框 */}
          <div className="flex items-center justify-between px-4 border-b border-surface-200 dark:border-surface-700 bg-surface-0 dark:bg-surface-800 flex-shrink-0 box-border" style={{ height: '3.5rem' }}>
            <div className="flex items-center gap-3">
              <FileJson className="w-5 h-5 text-primary-500" />
              <span className="font-medium text-surface-900 dark:text-surface-100">JSON 工具</span>
              <span className="text-xs text-surface-400">按 ESC 退出全屏</span>
            </div>
            <button
              onClick={() => setIsFullscreen(false)}
              className="btn-tool-sm sm:btn-tool btn-ghost flex-shrink-0"
              title="退出全屏"
            >
              <Minimize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">退出全屏</span>
            </button>
          </div>
          
          {/* 全屏工具栏 */}
          <JsonToolbar
            onFormat={handleFormat}
            onCompress={handleCompress}
            onEscape={handleEscape}
            onUnescape={handleUnescape}
            onFileUpload={handleFileUpload}
            onDownload={handleDownload}
            onClear={handleClear}
            canDownload={!!output}
            variant="fullscreen"
          />

          {/* 错误提示 */}
          {error && (
            <div className="px-4 py-2 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800 flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span className="break-all">{error}</span>
            </div>
          )}
          
          {/* 全屏输入输出区域 */}
          <div className="flex" style={{ height: output && !error ? 'calc(100vh - 154px)' : 'calc(100vh - 112px)' }}>
            {/* 输入区域 */}
            <div className="w-1/2 border-r border-surface-200 dark:border-surface-700 bg-surface-0 dark:bg-surface-800">
              <div className="flex items-center justify-between px-4 border-b border-surface-200 dark:border-surface-700 box-border" style={{ height: '46px' }}>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-surface-700 dark:text-surface-300">输入</span>
                  {input && <span className="text-xs text-surface-400">{input.length.toLocaleString()} 字符</span>}
                </div>
              </div>
              <CodeEditor
                value={input}
                onChange={setInput}
                language="json"
                placeholder="在此粘贴 JSON 数据..."
                height={output && !error ? 'calc(100vh - 200px)' : 'calc(100vh - 159px)'}
                variant="embedded"
              />
            </div>
            {/* 输出区域 */}
            <div className="w-1/2 bg-surface-0 dark:bg-surface-800">
              <div className="flex items-center justify-between px-4 border-b border-surface-200 dark:border-surface-700 box-border" style={{ height: '46px' }}>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-surface-700 dark:text-surface-300">输出</span>
                  {output && (
                    <>
                      <span className="text-xs text-surface-400">{output.length.toLocaleString()} 字符</span>
                      <div className="flex bg-surface-100 dark:bg-surface-700 rounded p-0.5">
                        <button
                          onClick={() => setViewMode('formatted')}
                          className={`px-2 py-0.5 text-xs rounded ${viewMode === 'formatted' ? 'bg-white dark:bg-surface-600 text-surface-900 dark:text-surface-100 shadow-sm' : 'text-surface-500 dark:text-surface-400'}`}
                        >
                          格式化
                        </button>
                        <button
                          onClick={() => setViewMode('compressed')}
                          className={`px-2 py-0.5 text-xs rounded ${viewMode === 'compressed' ? 'bg-white dark:bg-surface-600 text-surface-900 dark:text-surface-100 shadow-sm' : 'text-surface-500 dark:text-surface-400'}`}
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
                    className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${copied ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20' : 'text-surface-500 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700'}`}
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? '已复制' : '复制'}
                  </button>
                )}
              </div>
              {output ? (
                <CodeEditor
                  value={output}
                  onChange={() => {}}
                  language="json"
                  height={output && !error ? 'calc(100vh - 200px)' : 'calc(100vh - 159px)'}
                  variant="embedded"
                  readOnly={true}
                  showLineNumbers={true}
                />
              ) : (
                <div style={{ height: output && !error ? 'calc(100vh - 200px)' : 'calc(100vh - 159px)' }} className="flex items-center justify-center text-surface-400 text-sm bg-surface-50 dark:bg-surface-900">
                  格式化后的 JSON 将显示在这里
                </div>
              )}
            </div>
          </div>
          
          {/* 全屏模式统计信息 - 固定高度 41px */}
          {output && !error && (
            <div className="px-4 border-t border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 flex items-center justify-between gap-4" style={{ height: '41px' }}>
              <span className="text-sm font-medium text-surface-700 dark:text-surface-300">JSON 统计</span>
              <JsonStats json={output} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
