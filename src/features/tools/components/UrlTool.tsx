import { useState, useMemo } from 'react';
import { Copy, Check, ArrowRightLeft } from 'lucide-react';
import { useClipboard } from '../../../hooks/useLocalStorage';
import { AdFooter } from '../../../components/ads';
import { CodeEditor } from '../../../components/CodeEditor';
import { ToolInfoAuto } from './ToolInfoSection';

export function UrlTool() {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');
  const { copied, copy } = useClipboard();

  const output = useMemo(() => {
    if (!input.trim()) return '';
    try {
      if (mode === 'encode') {
        return encodeURIComponent(input);
      } else {
        return decodeURIComponent(input);
      }
    } catch {
      return '转换失败：无效的 URL 编码';
    }
  }, [input, mode]);

  const switchMode = () => {
    setMode(mode === 'encode' ? 'decode' : 'encode');
    setInput(output === '转换失败：无效的 URL 编码' ? '' : output);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-surface-900 dark:text-surface-100">URL 编解码</h1>
        <p className="text-surface-500 dark:text-surface-400 mt-1 text-xs sm:text-sm">
          URL 编码和解码工具
        </p>
      </div>

      <div className="card p-4 sm:p-6 mb-4">
        <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-4">
          <button
            onClick={() => setMode('encode')}
            className={`btn-group-item ${mode === 'encode' ? 'btn-group-item-active' : ''}`}
          >
            编码
          </button>
          <button
            onClick={() => setMode('decode')}
            className={`btn-group-item ${mode === 'decode' ? 'btn-group-item-active' : ''}`}
          >
            解码
          </button>
          <button
            onClick={switchMode}
            className="btn-icon"
          >
            <ArrowRightLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
              {mode === 'encode' ? '原文' : '编码后的 URL'}
            </label>
            <CodeEditor
              value={input}
              onChange={setInput}
              language="text"
              height={224}
              placeholder={mode === 'encode' ? '输入要编码的文本...' : '输入要解码的 URL...'}
              variant="embedded"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs sm:text-sm font-medium text-surface-700 dark:text-surface-300">
                {mode === 'encode' ? '编码后的 URL' : '原文'}
              </label>
              {output && output !== '转换失败：无效的 URL 编码' && (
                <button
                  onClick={() => copy(output)}
                  className={`btn-tool ${copied ? 'btn-ghost-success' : 'btn-ghost'}`}
                >
                  {copied ? <Check className="w-3.5 h-3.5 flex-shrink-0" /> : <Copy className="w-3.5 h-3.5 flex-shrink-0" />}
                  {copied ? '已复制' : '复制'}
                </button>
              )}
            </div>
            <CodeEditor
              value={output}
              onChange={() => {}}
              language="text"
              height={224}
              readOnly
              placeholder="结果..."
              variant="embedded"
            />
          </div>
        </div>
      </div>

      <ToolInfoAuto toolId="url" />

      {/* 底部广告 */}
      <AdFooter />
    </div>
  );
}
