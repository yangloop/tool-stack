import { useState, useEffect } from 'react';
import { Copy, Check, Key, Sparkles, Shield } from 'lucide-react';
import { useClipboard } from '../../hooks/useLocalStorage';
import { AdFooter } from '../ads';

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
        <div className="tool-icon">
          <Key className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-semibold text-surface-900 dark:text-surface-100">
            JWT 解码
          </h1>
          <p className="text-sm text-surface-500 mt-0.5">
            解析和验证 JWT 令牌，查看 Header、Payload 和 Signature
          </p>
        </div>
        <button
          onClick={loadExample}
          className="btn-secondary text-sm"
        >
          <Sparkles className="w-4 h-4" />
          加载示例
        </button>
      </div>

      {/* 输入区域 */}
      <div className="card mb-5">
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium text-surface-700 dark:text-surface-300">
            JWT Token
          </label>
          <div className="flex items-center gap-2">
            {input && (
              <button
                onClick={clearInput}
                className="text-xs text-surface-400 hover:text-red-500 transition-colors"
              >
                清空
              </button>
            )}
            <span className="text-xs text-surface-400">
              {input ? `${input.length} 字符` : '粘贴 JWT 令牌'}
            </span>
          </div>
        </div>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
          className="w-full h-28 p-4 font-mono text-sm bg-surface-50 dark:bg-surface-900/50 border border-surface-200 dark:border-surface-700 rounded-xl resize-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
          spellCheck={false}
        />
        
        {/* JWT 结构说明 */}
        {!input && (
          <div className="mt-4 p-4 bg-surface-50 dark:bg-surface-900/30 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-surface-400" />
              <span className="text-xs font-medium text-surface-500">JWT 结构</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
              <span className="px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded">Header</span>
              <span className="text-surface-400">.</span>
              <span className="px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded">Payload</span>
              <span className="text-surface-400">.</span>
              <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded">Signature</span>
            </div>
          </div>
        )}
      </div>

      {/* 解析结果 */}
      {result && (
        <div className="space-y-4">
          {result.error ? (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 text-red-600 dark:text-red-400 rounded-xl flex items-center gap-2">
              <span className="w-2 h-2 bg-red-500 rounded-full" />
              {result.error}
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="card">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 text-[10px] font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded">Header</span>
                    <span className="text-sm font-medium text-surface-700 dark:text-surface-300">头部信息</span>
                  </div>
                  <button
                    onClick={() => copyHeader(JSON.stringify(result.header, null, 2))}
                    className="btn-ghost text-xs"
                  >
                    {copiedHeader ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedHeader ? '已复制' : '复制'}
                  </button>
                </div>
                <pre className="p-4 bg-surface-50 dark:bg-surface-900/50 rounded-xl overflow-x-auto text-sm font-mono text-surface-700 dark:text-surface-300">
                  {JSON.stringify(result.header, null, 2)}
                </pre>
              </div>

              {/* Payload */}
              <div className="card">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 text-[10px] font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded">Payload</span>
                    <span className="text-sm font-medium text-surface-700 dark:text-surface-300">载荷数据</span>
                  </div>
                  <button
                    onClick={() => copyPayload(JSON.stringify(result.payload, null, 2))}
                    className="btn-ghost text-xs"
                  >
                    {copiedPayload ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedPayload ? '已复制' : '复制'}
                  </button>
                </div>
                <pre className="p-4 bg-surface-50 dark:bg-surface-900/50 rounded-xl overflow-x-auto text-sm font-mono text-surface-700 dark:text-surface-300">
                  {JSON.stringify(result.payload, null, 2)}
                </pre>
                
                {/* 常用字段解析 */}
                {'exp' in result.payload && (
                  <div className="mt-3 p-3 bg-surface-100 dark:bg-surface-800 rounded-lg">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-surface-500">过期时间 (exp)</span>
                      <span className="font-mono text-surface-700 dark:text-surface-300">
                        {new Date((result.payload as { exp: number }).exp * 1000).toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}
                {'iat' in result.payload && (
                  <div className="mt-2 p-3 bg-surface-100 dark:bg-surface-800 rounded-lg">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-surface-500">签发时间 (iat)</span>
                      <span className="font-mono text-surface-700 dark:text-surface-300">
                        {new Date((result.payload as { iat: number }).iat * 1000).toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Signature */}
              <div className="card">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 text-[10px] font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded">Signature</span>
                    <span className="text-sm font-medium text-surface-700 dark:text-surface-300">签名</span>
                  </div>
                  <button
                    onClick={() => copySignature(result.signature)}
                    className="btn-ghost text-xs"
                  >
                    {copiedSignature ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedSignature ? '已复制' : '复制'}
                  </button>
                </div>
                <div className="p-4 bg-surface-50 dark:bg-surface-900/50 rounded-xl font-mono text-xs break-all text-surface-600 dark:text-surface-400">
                  {result.signature}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* 底部广告 */}
      <AdFooter />
    </div>
  );
}
