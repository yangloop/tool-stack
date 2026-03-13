import { useState, useEffect } from 'react';
import { Copy, Check, Key, Sparkles } from 'lucide-react';
import { useClipboard } from '../../hooks/useLocalStorage';
import { AdFooter } from '../ads';
import { CodeEditor } from '../CodeEditor';
import { ToolInfoAuto } from './ToolInfoSection';

interface JwtPayload {
  header: object;
  payload: object;
  signature: string;
  valid: boolean;
  error?: string;
}

// 示例 JWT token
const EXAMPLE_JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyNDkwMjIsInJvbGUiOiJhZG1pbiIsImVtYWlsIjoiam9obi5kb2VAZXhhbXBsZS5jb20ifQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

export function JwtTool() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<JwtPayload | null>(null);
  const { copied: copiedHeader, copy: copyHeader } = useClipboard();
  const { copied: copiedPayload, copy: copyPayload } = useClipboard();
  const { copied: copiedSignature, copy: copySignature } = useClipboard();

  useEffect(() => {
    if (!input.trim()) {
      setResult(null);
      return;
    }

    try {
      const parts = input.split('.');
      if (parts.length !== 3) {
        setResult({ header: {}, payload: {}, signature: '', valid: false, error: '无效的 JWT 格式，需要包含 Header.Payload.Signature 三部分' });
        return;
      }

      const base64UrlDecode = (str: string) => {
        const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
        const pad = 4 - (base64.length % 4);
        const padded = pad !== 4 ? base64 + '='.repeat(pad) : base64;
        return JSON.parse(atob(padded));
      };

      const header = base64UrlDecode(parts[0]);
      const payload = base64UrlDecode(parts[1]);

      setResult({
        header,
        payload,
        signature: parts[2],
        valid: true,
      });
    } catch (e) {
      setResult({ header: {}, payload: {}, signature: '', valid: false, error: '解析失败，请检查 JWT 格式是否正确' });
    }
  }, [input]);

  const loadExample = () => {
    setInput(EXAMPLE_JWT);
  };

  const clearInput = () => {
    setInput('');
    setResult(null);
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      {/* 工具标题 */}
      <div className="tool-header">
        <div className="tool-icon w-9 h-9 sm:w-10 sm:h-10">
          <Key className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg sm:text-xl font-semibold text-surface-900 dark:text-surface-100">
            JWT 解码
          </h1>
          <p className="text-xs sm:text-sm text-surface-500 mt-0.5">
            解析和验证 JWT 令牌，查看 Header、Payload 和 Signature
          </p>
        </div>
        <button
          onClick={loadExample}
          className="btn-secondary btn-tool"
        >
          <Sparkles className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="hidden sm:inline">加载示例</span>
          <span className="sm:hidden">示例</span>
        </button>
      </div>

      {/* 输入区域 */}
      <div className="card p-4 sm:p-6 mb-4 sm:mb-5">
        <div className="flex items-center justify-between mb-3">
          <label className="text-xs sm:text-sm font-medium text-surface-700 dark:text-surface-300">
            JWT Token
          </label>
          <div className="flex items-center gap-2">
            {input && (
              <button
                onClick={clearInput}
                className="btn-ghost-danger btn-tool"
              >
                清空
              </button>
            )}
            <span className="text-xs text-surface-400">
              {input ? `${input.length} 字符` : '粘贴 JWT 令牌'}
            </span>
          </div>
        </div>
        <CodeEditor
          value={input}
          onChange={setInput}
          language="text"
          height={112}
          placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
          variant="embedded"
        />
        

      </div>

      {/* 解析结果 */}
      {result && (
        <div className="space-y-3 sm:space-y-4">
          {result.error ? (
            <div className="p-3 sm:p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 text-red-600 dark:text-red-400 rounded-xl flex items-center gap-2 text-xs sm:text-sm">
              <span className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0" />
              {result.error}
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="card p-4 sm:p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 text-[9px] sm:text-[10px] font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded">Header</span>
                    <span className="text-xs sm:text-sm font-medium text-surface-700 dark:text-surface-300">头部信息</span>
                  </div>
                  <button
                    onClick={() => copyHeader(JSON.stringify(result.header, null, 2))}
                    className={`btn-tool ${copiedHeader ? 'btn-ghost-success' : 'btn-ghost'}`}
                  >
                    {copiedHeader ? <Check className="w-3.5 h-3.5 flex-shrink-0" /> : <Copy className="w-3.5 h-3.5 flex-shrink-0" />}
                    {copiedHeader ? '已复制' : '复制'}
                  </button>
                </div>
                <pre className="p-3 sm:p-4 bg-surface-50 dark:bg-surface-900/50 rounded-xl overflow-x-auto text-xs sm:text-sm font-mono text-surface-700 dark:text-surface-300">
                  {JSON.stringify(result.header, null, 2)}
                </pre>
              </div>

              {/* Payload */}
              <div className="card p-4 sm:p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 text-[9px] sm:text-[10px] font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded">Payload</span>
                    <span className="text-xs sm:text-sm font-medium text-surface-700 dark:text-surface-300">载荷数据</span>
                  </div>
                  <button
                    onClick={() => copyPayload(JSON.stringify(result.payload, null, 2))}
                    className={`btn-tool ${copiedPayload ? 'btn-ghost-success' : 'btn-ghost'}`}
                  >
                    {copiedPayload ? <Check className="w-3.5 h-3.5 flex-shrink-0" /> : <Copy className="w-3.5 h-3.5 flex-shrink-0" />}
                    {copiedPayload ? '已复制' : '复制'}
                  </button>
                </div>
                <pre className="p-3 sm:p-4 bg-surface-50 dark:bg-surface-900/50 rounded-xl overflow-x-auto text-xs sm:text-sm font-mono text-surface-700 dark:text-surface-300">
                  {JSON.stringify(result.payload, null, 2)}
                </pre>
                
                {/* 常用字段解析 */}
                {'exp' in result.payload && (
                  <div className="mt-3 p-2 sm:p-3 bg-surface-100 dark:bg-surface-800 rounded-lg">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-xs">
                      <span className="text-surface-500">过期时间 (exp)</span>
                      <span className="font-mono text-surface-700 dark:text-surface-300">
                        {new Date((result.payload as { exp: number }).exp * 1000).toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}
                {'iat' in result.payload && (
                  <div className="mt-2 p-2 sm:p-3 bg-surface-100 dark:bg-surface-800 rounded-lg">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-xs">
                      <span className="text-surface-500">签发时间 (iat)</span>
                      <span className="font-mono text-surface-700 dark:text-surface-300">
                        {new Date((result.payload as { iat: number }).iat * 1000).toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Signature */}
              <div className="card p-4 sm:p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 text-[9px] sm:text-[10px] font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded">Signature</span>
                    <span className="text-xs sm:text-sm font-medium text-surface-700 dark:text-surface-300">签名</span>
                  </div>
                  <button
                    onClick={() => copySignature(result.signature)}
                    className={`btn-tool ${copiedSignature ? 'btn-ghost-success' : 'btn-ghost'}`}
                  >
                    {copiedSignature ? <Check className="w-3.5 h-3.5 flex-shrink-0" /> : <Copy className="w-3.5 h-3.5 flex-shrink-0" />}
                    {copiedSignature ? '已复制' : '复制'}
                  </button>
                </div>
                <div className="p-3 sm:p-4 bg-surface-50 dark:bg-surface-900/50 rounded-xl font-mono text-xs break-all text-surface-600 dark:text-surface-400">
                  {result.signature}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      <ToolInfoAuto toolId="jwt" />

      {/* 底部广告 */}
      <AdFooter />
    </div>
  );
}
