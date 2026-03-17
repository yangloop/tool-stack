import { useState, useEffect } from 'react';
import { 
  Copy, Check, Download, Upload, Trash2, 
  Database, AlertCircle, AlignLeft, Minimize2
} from 'lucide-react';
import { format } from 'sql-formatter';
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
  const { copied, copy } = useClipboard();

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
      <ToolHeader
        icon={Database}
        title="SQL 格式化"
        description="SQL 语句美化、压缩和语法高亮"
        iconColorClass="text-primary-500"
      />

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
        <div className="w-px h-5 sm:h-6 bg-surface-300 dark:bg-surface-600 mx-1 hidden sm:block" />
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
          <div className="flex items-center justify-between mb-3 min-h-[36px]">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs sm:text-sm font-medium text-surface-700 dark:text-surface-300">输入 SQL</span>
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

        {/* 输出区域 */}
        <div className="card p-4 sm:p-6 flex flex-col">
          <div className="flex items-center justify-between mb-3 min-h-[36px]">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs sm:text-sm font-medium text-surface-700 dark:text-surface-300">输出</span>
              {output && (
                <span className="text-xs text-surface-400">
                  {output.length.toLocaleString()} 字符
                </span>
              )}
            </div>
            {/* 按钮组 */}
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
              onChange={() => {}} // 只读，不响应变更
              language="sql"
              placeholder=""
              height="400px"
              variant="embedded"
              readOnly={true}
              showLineNumbers={false}
            />
          ) : (
            <div className="h-[400px] bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-lg flex items-center justify-center text-surface-400 text-xs sm:text-sm">
              格式化后的 SQL 将显示在这里
            </div>
          )}
        </div>
      </div>

      <AdInArticle />

      <ToolInfoAuto toolId="sql" />

      {/* 底部广告 */}
      <AdFooter />
    </div>
  );
}
