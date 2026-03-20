import { useState, useEffect } from 'react';
import { 
  Copy, Check, Download, Upload, Trash2, 
  Database, AlertCircle, AlignLeft, Minimize2, Maximize2
} from 'lucide-react';
import { downloadFile, readFile } from '../../../utils/helpers';
import { useClipboard } from '../../../hooks/useLocalStorage';
import { AdInArticle, AdFooter } from '../../../components/ads';
import { ToolInfoAuto } from './ToolInfoSection';
import { CodeEditor } from '../../../components/CodeEditor';
import { ToolHeader } from '../../../components/common';

// SQL 统计
function SqlStats({ sql }: { sql: string }) {
  const lines = sql.split('\n').length;
  const words = sql.split(/\s+/).filter(w => w.length > 0).length;
  const chars = sql.length;
  
  return (
    <div className="flex flex-wrap gap-2 sm:gap-4 text-xs text-surface-500">
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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { copied, copy } = useClipboard();

  const formatSql = async (sql: string) => {
    const { format } = await import('sql-formatter');
    return format(sql, {
      language: 'sql',
      tabWidth: 2,
      keywordCase: 'upper',
    });
  };

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
    let cancelled = false;

    if (!input.trim()) {
      setOutput('');
      setError('');
      return;
    }

    const run = async () => {
      try {
        if (viewMode === 'formatted') {
          const formatted = await formatSql(input);
          if (!cancelled) {
            setOutput(formatted);
            setError('');
          }
        } else if (!cancelled) {
          setOutput(input.replace(/\s+/g, ' ').trim());
          setError('');
        }
      } catch (e) {
        if (!cancelled) {
          const errorMsg = e instanceof Error ? e.message : '未知错误';
          setError(simplifyError(errorMsg));
          setOutput(input);
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [input, viewMode]);

  useEffect(() => {
    if (!isFullscreen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsFullscreen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  const handleFormat = () => {
    if (!input.trim()) return;
    setViewMode('formatted');
    void (async () => {
      try {
        const formatted = await formatSql(input);
        setOutput(formatted);
        setError('');
      } catch (e) {
        const errorMsg = e instanceof Error ? e.message : '未知错误';
        setError(simplifyError(errorMsg));
      }
    })();
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

  const handleClear = () => {
    setInput('');
    setOutput('');
    setError('');
  };

  const toolbar = (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <button onClick={handleFormat} className="btn-primary btn-tool">
        <AlignLeft className="w-3.5 h-3.5 flex-shrink-0" />
        格式化
      </button>
      <button onClick={handleCompress} className="btn-secondary btn-tool">
        <Minimize2 className="w-3.5 h-3.5 flex-shrink-0" />
        压缩
      </button>
      <div className="mx-1 hidden h-5 w-px bg-surface-300 dark:bg-surface-600 sm:block sm:h-6" />
      <label className="btn-secondary btn-tool cursor-pointer">
        <Upload className="w-3.5 h-3.5 flex-shrink-0" />
        导入
        <input type="file" accept=".sql,.txt" onChange={handleFileUpload} className="hidden" />
      </label>
      <button onClick={handleDownload} disabled={!output} className="btn-secondary btn-tool disabled:opacity-50">
        <Download className="w-3.5 h-3.5 flex-shrink-0" />
        下载
      </button>
      <button onClick={handleClear} className="btn-ghost-danger btn-tool">
        <Trash2 className="w-3.5 h-3.5 flex-shrink-0" />
        清空
      </button>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto">
      {!isFullscreen && (
        <>
          <ToolHeader
            icon={Database}
            title="SQL 格式化"
            description="SQL 语句美化、压缩和语法高亮"
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

          {toolbar}

          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400 sm:p-3 sm:text-sm">
              <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 sm:h-4 sm:w-4" />
              {error}
            </div>
          )}

          <div className="grid gap-3 sm:gap-4 lg:grid-cols-2">
            <div className="card flex flex-col p-4 sm:p-6">
              <div className="mb-3 flex min-h-[36px] items-center justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-medium text-surface-700 dark:text-surface-300 sm:text-sm">输入 SQL</span>
                  {input && <SqlStats sql={input} />}
                </div>
              </div>
              <CodeEditor
                value={input}
                onChange={setInput}
                language="sql"
                placeholder="在此粘贴 SQL 语句...\n\n例如:\nSELECT * FROM users WHERE id = 1;"
                height="400px"
                variant="embedded"
              />
            </div>

            <div className="card flex flex-col p-4 sm:p-6">
              <div className="mb-3 flex min-h-[36px] items-center justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-medium text-surface-700 dark:text-surface-300 sm:text-sm">输出</span>
                  {output && (
                    <span className="text-xs text-surface-400">
                      {output.length.toLocaleString()} 字符
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {output && (
                    <>
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
                      <button
                        onClick={handleCopy}
                        className={`btn-tool ${copied ? 'btn-ghost-success' : 'btn-ghost'}`}
                      >
                        {copied ? <Check className="w-3.5 h-3.5 flex-shrink-0" /> : <Copy className="w-3.5 h-3.5 flex-shrink-0" />}
                        {copied ? '已复制' : '复制'}
                      </button>
                    </>
                  )}
                </div>
              </div>

              {output ? (
                <CodeEditor
                  value={output}
                  onChange={() => {}}
                  language="sql"
                  placeholder=""
                  height="400px"
                  variant="embedded"
                  readOnly={true}
                  showLineNumbers={false}
                />
              ) : (
                <div className="flex h-[400px] items-center justify-center rounded-lg border border-surface-200 bg-surface-50 text-xs text-surface-400 dark:border-surface-700 dark:bg-surface-900 sm:text-sm">
                  格式化后的 SQL 将显示在这里
                </div>
              )}
            </div>
          </div>

          <AdInArticle />
          <ToolInfoAuto toolId="sql" />
          <AdFooter />
        </>
      )}

      {isFullscreen && (
        <div className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-surface-0 dark:bg-surface-900">
          <div className="flex h-14 flex-shrink-0 items-center justify-between border-b border-surface-200 bg-surface-0 px-4 dark:border-surface-700 dark:bg-surface-800">
            <div className="flex items-center gap-3">
              <Database className="w-5 h-5 text-primary-500" />
              <span className="font-medium text-surface-900 dark:text-surface-100">SQL 格式化</span>
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

          <div className="flex-shrink-0 border-b border-surface-200 px-4 pt-4 dark:border-surface-700">
            {toolbar}
          </div>

          {error && (
            <div className="border-b border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            </div>
          )}

          <div className="grid flex-1 min-h-0 gap-0 lg:grid-cols-2">
            <div className="flex min-h-0 flex-col border-b border-surface-200 bg-surface-0 dark:border-surface-700 dark:bg-surface-800 lg:border-b-0 lg:border-r">
              <div className="flex h-12 flex-shrink-0 items-center justify-between border-b border-surface-200 px-4 dark:border-surface-700">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-surface-700 dark:text-surface-300">输入 SQL</span>
                  {input && <SqlStats sql={input} />}
                </div>
              </div>
              <div className="min-h-0 flex-1 p-4">
                <CodeEditor
                  value={input}
                  onChange={setInput}
                  language="sql"
                  placeholder="在此粘贴 SQL 语句...\n\n例如:\nSELECT * FROM users WHERE id = 1;"
                  height="100%"
                  variant="embedded"
                  wrapperClassName="h-full"
                />
              </div>
            </div>

            <div className="flex min-h-0 flex-col bg-surface-0 dark:bg-surface-800">
              <div className="flex h-12 flex-shrink-0 items-center justify-between border-b border-surface-200 px-4 dark:border-surface-700">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-surface-700 dark:text-surface-300">输出</span>
                  {output && <span className="text-xs text-surface-400">{output.length.toLocaleString()} 字符</span>}
                </div>
                <div className="flex items-center gap-2">
                  {output && (
                    <>
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
                      <button
                        onClick={handleCopy}
                        className={`btn-tool ${copied ? 'btn-ghost-success' : 'btn-ghost'}`}
                      >
                        {copied ? <Check className="w-3.5 h-3.5 flex-shrink-0" /> : <Copy className="w-3.5 h-3.5 flex-shrink-0" />}
                        {copied ? '已复制' : '复制'}
                      </button>
                    </>
                  )}
                </div>
              </div>
              <div className="min-h-0 flex-1 p-4">
                {output ? (
                  <CodeEditor
                    value={output}
                    onChange={() => {}}
                    language="sql"
                    placeholder=""
                    height="100%"
                    variant="embedded"
                    readOnly={true}
                    showLineNumbers={false}
                    wrapperClassName="h-full"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center rounded-lg border border-surface-200 bg-surface-50 text-sm text-surface-400 dark:border-surface-700 dark:bg-surface-900">
                    格式化后的 SQL 将显示在这里
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
