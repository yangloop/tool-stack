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
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">HTML 实体</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 text-xs sm:text-sm">
          HTML 实体编码和解码工具
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
            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {mode === 'encode' ? '原文' : 'HTML 实体'}
            </label>
            <textarea
              id="htmlentity-input"
              name="htmlentity-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={mode === 'encode' ? '输入 HTML 内容...' : '输入 HTML 实体...'}
              className="w-full h-32 sm:h-40 p-3 sm:p-4 font-mono text-xs sm:text-sm bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 dark:text-white"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                {mode === 'encode' ? 'HTML 实体' : '原文'}
              </label>
              {output && (
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
              id="htmlentity-output"
              name="htmlentity-output"
              value={output}
              readOnly
              placeholder="结果..."
              className="w-full h-32 sm:h-40 p-3 sm:p-4 font-mono text-xs sm:text-sm bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg resize-none dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* 底部广告 */}
      <AdFooter />
    </div>
  );
}
