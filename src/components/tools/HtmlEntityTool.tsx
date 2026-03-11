import { useState } from 'react';
import { Copy, Check, ArrowRightLeft } from 'lucide-react';
import { useClipboard } from '../../hooks/useLocalStorage';
import { AdFooter } from '../ads';

const htmlEntities: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
};

const reverseEntities: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#x27;': "'",
  '&#x2F;': '/',
  '&#39;': "'",
};

export function HtmlEntityTool() {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');
  const { copied, copy } = useClipboard();

  const handleConvert = () => {
    if (!input.trim()) return '';
    
    if (mode === 'encode') {
      return input.replace(/[&<>"'\/]/g, (char) => htmlEntities[char] || char);
    } else {
      return input.replace(/&(?:amp|lt|gt|quot|#x27|#39|#x2F);/g, (entity) => reverseEntities[entity] || entity);
    }
  };

  const output = handleConvert();

  const switchMode = () => {
    setMode(mode === 'encode' ? 'decode' : 'encode');
    setInput(output);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">HTML 实体编解码</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          HTML 实体编码和解码工具
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
              {mode === 'encode' ? '原文' : 'HTML 实体'}
            </label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={mode === 'encode' ? '输入 HTML 内容...' : '输入 HTML 实体...'}
              className="w-full h-40 p-4 font-mono text-sm bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 dark:text-white"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {mode === 'encode' ? 'HTML 实体' : '原文'}
              </label>
              {output && (
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
              className="w-full h-40 p-4 font-mono text-sm bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg resize-none dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* 底部广告 */}
      <AdFooter />
    </div>
  );
}
