import { useState } from 'react';
import { Copy, Check, ArrowRightLeft } from 'lucide-react';
import { useClipboard } from '../../hooks/useLocalStorage';
import { AdFooter } from '../ads';

export function UrlTool() {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');
  const { copied, copy } = useClipboard();

  const handleConvert = () => {
    if (!input.trim()) return '';
    try {
      if (mode === 'encode') {
        return encodeURIComponent(input);
      } else {
        return decodeURIComponent(input);
      }
    } catch (e) {
      return '转换失败：无效的 URL 编码';
    }
  };

  const output = handleConvert();

  const switchMode = () => {
    setMode(mode === 'encode' ? 'decode' : 'encode');
    setInput(output === '转换失败：无效的 URL 编码' ? '' : output);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">URL 编解码</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          URL 编码和解码工具
        </p>
      </div>

      <div className="card mb-4">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => setMode('encode')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              mode === 'encode'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            编码
          </button>
          <button
            onClick={() => setMode('decode')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              mode === 'decode'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            解码
          </button>
          <button
            onClick={switchMode}
            className="p-2 text-gray-500 hover:text-blue-500 transition-colors"
          >
            <ArrowRightLeft className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {mode === 'encode' ? '原文' : '编码后的 URL'}
            </label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={mode === 'encode' ? '输入要编码的文本...' : '输入要解码的 URL...'}
              className="w-full h-40 p-4 font-mono text-sm bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 dark:text-white"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {mode === 'encode' ? '编码后的 URL' : '原文'}
              </label>
              {output && output !== '转换失败：无效的 URL 编码' && (
                <button
                  onClick={() => copy(output)}
                  className="flex items-center gap-1 text-sm text-blue-500 hover:text-blue-600"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? '已复制' : '复制'}
                </button>
              )}
            </div>
            <textarea
              value={output}
              readOnly
              placeholder="结果..."
              className={`w-full h-40 p-4 font-mono text-sm border rounded-lg resize-none dark:text-white ${
                output === '转换失败：无效的 URL 编码'
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
