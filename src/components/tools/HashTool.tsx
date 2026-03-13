import { useState, useEffect } from 'react';
import { Copy, Check, Upload, Hash } from 'lucide-react';
import CryptoJS from 'crypto-js';
import { useClipboard } from '../../hooks/useLocalStorage';
import { readFile } from '../../utils/helpers';
import { AdFooter } from '../ads';
import { ToolInfoAuto } from './ToolInfoSection';
import { CodeEditor } from '../CodeEditor';

const algorithms = [
  { id: 'MD5', name: 'MD5', bit: 128 },
  { id: 'SHA1', name: 'SHA-1', bit: 160 },
  { id: 'SHA256', name: 'SHA-256', bit: 256 },
  { id: 'SHA512', name: 'SHA-512', bit: 512 },
] as const;



export function HashTool() {
  const [input, setInput] = useState('');
  const [hmacKey, setHmacKey] = useState('');
  const [results, setResults] = useState<Record<string, string>>({});
  const { copied, copy } = useClipboard();

  useEffect(() => {
    if (!input.trim()) {
      setResults({});
      return;
    }

    const newResults: Record<string, string> = {};

    algorithms.forEach(({ id }) => {
      let hash;
      switch (id) {
        case 'MD5':
          hash = CryptoJS.MD5(input).toString();
          break;
        case 'SHA1':
          hash = CryptoJS.SHA1(input).toString();
          break;
        case 'SHA256':
          hash = CryptoJS.SHA256(input).toString();
          break;
        case 'SHA512':
          hash = CryptoJS.SHA512(input).toString();
          break;
      }
      newResults[id] = hash;

      if (hmacKey) {
        let hmac;
        switch (id) {
          case 'MD5':
            hmac = CryptoJS.HmacMD5(input, hmacKey).toString();
            break;
          case 'SHA1':
            hmac = CryptoJS.HmacSHA1(input, hmacKey).toString();
            break;
          case 'SHA256':
            hmac = CryptoJS.HmacSHA256(input, hmacKey).toString();
            break;
          case 'SHA512':
            hmac = CryptoJS.HmacSHA512(input, hmacKey).toString();
            break;
        }
        newResults[`${id}_HMAC`] = hmac;
      }
    });

    setResults(newResults);
  }, [input, hmacKey]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const content = await readFile(file);
      setInput(content);
    } catch {
      alert('文件读取失败');
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Hash className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />
          哈希计算
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          MD5、SHA 系列哈希计算，支持 HMAC
        </p>
      </div>

      <div className="card p-4 sm:p-6 mb-4 space-y-3 sm:space-y-4">
        <div>
          <div className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            输入文本
          </div>
          <CodeEditor
            value={input}
            onChange={setInput}
            language="text"
            height={224}
            placeholder="输入要计算哈希的文本..."
            variant="embedded"
          />
        </div>

        <div className="flex flex-wrap gap-3 sm:gap-4">
          <label className="btn-secondary btn-tool cursor-pointer">
            <Upload className="w-3.5 h-3.5 flex-shrink-0" />
            从文件导入
            <input type="file" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>

        <div>
          <label htmlFor="hmac-key" className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            HMAC 密钥（可选）
          </label>
          <input
            type="text"
            id="hmac-key"
            name="hmac-key"
            value={hmacKey}
            onChange={(e) => setHmacKey(e.target.value)}
            placeholder="输入 HMAC 密钥..."
            className="w-full px-3 sm:px-4 py-2 font-mono text-xs sm:text-sm bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:text-white"
          />
        </div>
      </div>

      {Object.keys(results).length > 0 && (
        <div className="space-y-2 sm:space-y-3">
          {algorithms.map(({ id, name, bit }) => (
            <div key={id} className="card p-4 sm:p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900 dark:text-white">{name}</span>
                  <span className="text-xs text-gray-400">({bit} bit)</span>
                </div>
                <button
                  onClick={() => copy(results[id])}
                  className={`btn-tool ${copied ? 'btn-ghost-success' : 'btn-ghost'}`}
                >
                  {copied ? <Check className="w-3.5 h-3.5 flex-shrink-0" /> : <Copy className="w-3.5 h-3.5 flex-shrink-0" />}
                  复制
                </button>
              </div>
              <div className="p-2 sm:p-3 bg-gray-50 dark:bg-slate-900 rounded-lg font-mono text-xs sm:text-sm break-all dark:text-white">
                {results[id]}
              </div>
              
              {hmacKey && results[`${id}_HMAC`] && (
                <>
                  <div className="mt-2 sm:mt-3 flex items-center gap-2">
                    <span className="font-medium text-gray-700 dark:text-gray-300">HMAC-{name}</span>
                    <button
                      onClick={() => copy(results[`${id}_HMAC`])}
                      className={`btn-tool ${copied ? 'btn-ghost-success' : 'btn-ghost'}`}
                    >
                      {copied ? <Check className="w-3 h-3 flex-shrink-0" /> : <Copy className="w-3 h-3 flex-shrink-0" />}
                      复制
                    </button>
                  </div>
                  <div className="mt-1 p-2 sm:p-3 bg-gray-50 dark:bg-slate-900 rounded-lg font-mono text-xs sm:text-sm break-all dark:text-white">
                    {results[`${id}_HMAC`]}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 功能说明 */}
      <ToolInfoAuto toolId="hash" />

      {/* 底部广告 */}
      <AdFooter />
    </div>
  );
}
