import { useState, useCallback } from 'react';
import { Copy, Check, RefreshCw, Fingerprint, Settings2 } from 'lucide-react';
import { useClipboard } from '../../hooks/useLocalStorage';
import { AdFooter } from '../ads';
import { ToolInfoAuto } from './ToolInfoSection';

export function UuidTool() {
  const [uuids, setUuids] = useState<string[]>([]);
  const [count, setCount] = useState(5);
  const [format, setFormat] = useState<'standard' | 'no-dash' | 'upper'>('standard');
  const { copied, copy } = useClipboard();

  const generateUUID = useCallback(() => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }, []);

  const formatUUID = (uuid: string) => {
    switch (format) {
      case 'no-dash':
        return uuid.replace(/-/g, '');
      case 'upper':
        return uuid.toUpperCase();
      default:
        return uuid;
    }
  };

  const generateBulk = () => {
    const newUuids: string[] = [];
    for (let i = 0; i < count; i++) {
      newUuids.push(formatUUID(generateUUID()));
    }
    setUuids(newUuids);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Fingerprint className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />
          UUID 生成
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          生成标准 UUID v4 唯一标识符
        </p>
      </div>

      <div className="card p-4 sm:p-6 mb-4 space-y-3 sm:space-y-4">
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-gray-400" />
            <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">生成数量</span>
            <input
              type="number"
              id="uuid-count"
              name="uuid-count"
              min={1}
              max={100}
              value={count}
              onChange={(e) => setCount(Math.min(100, Math.max(1, parseInt(e.target.value) || 1)))}
              className="w-16 sm:w-20 px-2 sm:px-3 py-1.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-xs sm:text-sm dark:text-white"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">格式</span>
            <select
              id="uuid-format"
              name="uuid-format"
              value={format}
              onChange={(e) => setFormat(e.target.value as typeof format)}
              className="px-2 sm:px-3 py-1.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-xs sm:text-sm dark:text-white"
            >
              <option value="standard">标准 (xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx)</option>
              <option value="no-dash">无横线</option>
              <option value="upper">大写</option>
            </select>
          </div>

          <button
            onClick={generateBulk}
            className="btn-primary btn-tool ml-auto"
          >
            <RefreshCw className="w-3.5 h-3.5 flex-shrink-0" />
            生成
          </button>
        </div>
      </div>

      {uuids.length > 0 && (
        <div className="card p-4 sm:p-6 space-y-2">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
              生成结果 ({uuids.length})
            </span>
            <button
              onClick={() => copy(uuids.join('\n'))}
              className={`btn-tool ${copied ? 'btn-ghost-success' : 'btn-ghost'}`}
            >
              {copied ? <Check className="w-3.5 h-3.5 flex-shrink-0" /> : <Copy className="w-3.5 h-3.5 flex-shrink-0" />}
              复制全部
            </button>
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {uuids.map((uuid, index) => (
              <div
                key={index}
                className="flex items-center gap-2 p-2 sm:p-3 bg-gray-50 dark:bg-slate-900 rounded-lg group"
              >
                <code className="flex-1 font-mono text-xs sm:text-sm text-gray-800 dark:text-gray-200 break-all">
                  {uuid}
                </code>
                <button
                  onClick={() => copy(uuid)}
                  className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 btn-icon p-1"
                  title="复制"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 功能说明 */}
      <ToolInfoAuto toolId="uuid" />

      {/* 底部广告 */}
      <AdFooter />
    </div>
  );
}
