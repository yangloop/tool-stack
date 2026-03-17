import { useState, useMemo } from 'react';
import { Copy, Check, ArrowRightLeft } from 'lucide-react';
import { useClipboard } from '../../../hooks/useLocalStorage';
import { AdFooter } from '../../../components/ads';
import { CodeEditor } from '../../../components/CodeEditor';
import { ToolInfoAuto } from './ToolInfoSection';
import { ToolHeader } from '../../../components/common';

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

  const output = useMemo(() => {
    if (!input.trim()) return '';
    
    if (mode === 'encode') {
      return input.replace(/[&<>"'\/]/g, (char) => htmlEntities[char] || char);
    } else {
      return input.replace(/&(?:amp|lt|gt|quot|#x27|#39|#x2F);/g, (entity) => reverseEntities[entity] || entity);
    }
  }, [input, mode]);

  const switchMode = () => {
    setMode(mode === 'encode' ? 'decode' : 'encode');
    setInput(output);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <ToolHeader
        title="HTML 实体编解码"
        description="HTML Entity 编码和解码工具"
      />

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
              {mode === 'encode' ? '原文' : 'HTML 实体'}
            </label>
            <CodeEditor
              value={input}
              onChange={setInput}
              language="html"
              height={224}
              placeholder={mode === 'encode' ? '输入 HTML 内容...' : '输入 HTML 实体...'}
              variant="embedded"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs sm:text-sm font-medium text-surface-700 dark:text-surface-300">
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
            <CodeEditor
              value={output}
              onChange={() => {}}
              language="html"
              height={224}
              readOnly
              placeholder="结果..."
              variant="embedded"
            />
          </div>
        </div>
      </div>

      <ToolInfoAuto toolId="html" />

      {/* 底部广告 */}
      <AdFooter />
    </div>
  );
}
