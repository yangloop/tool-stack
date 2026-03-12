import { useState } from 'react';
import { Copy, Check, ArrowRightLeft } from 'lucide-react';
import { Base64 } from 'js-base64';
import { useClipboard } from '../../hooks/useLocalStorage';
import { AdFooter } from '../ads';

export function Base64Tool() {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');
  const { copied, copy } = useClipboard();

  const handleConvert = () => {
    if (!input.trim()) return '';
    try {
      if (mode === 'encode') {
        return Base64.encode(input);
      } else {
        return Base64.decode(input);
      }
    } catch (e) {
      return '转换失败：无效的输入';
    }
  };

  const output = handleConvert();

  const switchMode = () => {
    setMode(mode === 'encode' ? 'decode' : 'encode');
    setInput(output === '转换失败：无效的输入' ? '' : output);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Base64 编解码</h1>
        <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-1">
          Base64 编码和解码工具
        </p>
      </div>

      <div className="card mb-4 p-4 sm:p-6">
        <div className="flex items-center gap-2 sm:gap-4 mb-4">
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
            title="交换"
            aria-label="交换输入输出"
          >
            <ArrowRightLeft className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {mode === 'encode' ? '原文' : 'Base64'}
            </label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={mode === 'encode' ? '输入要编码的文本...' : '输入要解码的 Base64...'}
              className="w-full h-32 sm:h-40 p-3 sm:p-4 font-mono text-xs sm:text-sm bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 dark:text-white"
              enterKeyHint="done"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {mode === 'encode' ? 'Base64' : '原文'}
              </label>
              {output && output !== '转换失败：无效的输入' && (
                <button
                  onClick={() => copy(output)}
                  className={`btn-tool ${copied ? 'btn-ghost-success' : 'btn-ghost'}`}
                >
                  {copied ? <Check className="w-3.5 h-3.5 flex-shrink-0" /> : <Copy className="w-3.5 h-3.5 flex-shrink-0" />}
                  {copied ? '已复制' : '复制'}
                </button>
              )}
            </div>
            <textarea
              value={output}
              readOnly
              placeholder="结果..."
              className={`w-full h-32 sm:h-40 p-3 sm:p-4 font-mono text-xs sm:text-sm border rounded-lg resize-none dark:text-white ${
                output === '转换失败：无效的输入'
                  ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600'
                  : 'bg-gray-50 dark:bg-slate-900 border-gray-200 dark:border-slate-700'
              }`}
            />
          </div>
        </div>
      </div>

      {/* 底部广告 */}
      <AdFooter />
    </div>
  );
}
