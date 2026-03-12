import { useState, useEffect } from 'react';
import { 
  Link, Copy, Check, Globe, Search, 
  AlertCircle, ExternalLink, Code, Layers,
  FileJson, Eye, EyeOff
} from 'lucide-react';
import { useClipboard } from '../../hooks/useLocalStorage';
import { AdFooter } from '../ads';

interface ParsedURL {
  href: string;
  protocol: string;
  host: string;
  hostname: string;
  port: string;
  pathname: string;
  search: string;
  hash: string;
  username: string;
  password: string;
  origin: string;
}

interface QueryParam {
  key: string;
  value: string;
  decodedKey: string;
  decodedValue: string;
}

// 解析查询参数
function parseQueryParams(search: string): QueryParam[] {
  if (!search || search === '?') return [];
  
  const params: QueryParam[] = [];
  const queryString = search.startsWith('?') ? search.slice(1) : search;
  
  // 处理特殊格式如 URL 编码的 JSON
  const pairs = queryString.split('&');
  
  for (const pair of pairs) {
    if (!pair) continue;
    
    const eqIndex = pair.indexOf('=');
    let key: string;
    let value: string;
    
    if (eqIndex === -1) {
      key = pair;
      value = '';
    } else {
      key = pair.slice(0, eqIndex);
      value = pair.slice(eqIndex + 1);
    }
    
    params.push({
      key,
      value,
      decodedKey: decodeURIComponent(key),
      decodedValue: decodeURIComponent(value),
    });
  }
  
  return params;
}

// 分析 URL
function analyzeURL(urlString: string): { parsed: ParsedURL | null; error: string | null } {
  try {
    // 如果没有协议，添加 https://
    let urlToParse = urlString;
    if (urlString && !urlString.match(/^[a-zA-Z]+:\/\//)) {
      urlToParse = 'https://' + urlString;
    }
    
    const url = new URL(urlToParse);
    
    return {
      parsed: {
        href: url.href,
        protocol: url.protocol,
        host: url.host,
        hostname: url.hostname,
        port: url.port,
        pathname: url.pathname,
        search: url.search,
        hash: url.hash,
        username: url.username,
        password: url.password,
        origin: url.origin,
      },
      error: null,
    };
  } catch (e) {
    return {
      parsed: null,
      error: '无效的 URL 格式',
    };
  }
}

// 信息项组件
function InfoItem({ 
  label, 
  value, 
  copyable = true,
  highlight = false,
  link = false
}: { 
  label: string; 
  value: string; 
  copyable?: boolean;
  highlight?: boolean;
  link?: boolean;
}) {
  const { copied, copy } = useClipboard();
  
  if (!value) return null;
  
  return (
    <div className={`p-2 sm:p-3 rounded-lg ${highlight ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-gray-50 dark:bg-slate-800'}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500 uppercase tracking-wider">{label}</span>
        {copyable && (
          <button
            onClick={() => copy(value)}
            className={`btn-icon ${copied ? 'text-emerald-500' : ''}`}
            title="复制"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>
      <div className="mt-1 flex items-center gap-2">
        {link ? (
          <a 
            href={value} 
            target="_blank" 
            rel="noopener noreferrer"
            className="font-mono text-xs sm:text-sm text-blue-600 dark:text-blue-400 hover:underline break-all"
          >
            {value}
          </a>
        ) : (
          <code className={`font-mono text-xs sm:text-sm break-all ${highlight ? 'text-blue-700 dark:text-blue-300' : 'text-gray-800 dark:text-gray-200'}`}>
            {value}
          </code>
        )}
        {link && <ExternalLink className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-gray-400 flex-shrink-0" />}
      </div>
    </div>
  );
}

export function UrlParserTool() {
  const [input, setInput] = useState('');
  const [parsed, setParsed] = useState<ParsedURL | null>(null);
  const [params, setParams] = useState<QueryParam[]>([]);
  const [error, setError] = useState('');
  const [showDecoded, setShowDecoded] = useState(true);
  const [showRaw, setShowRaw] = useState(false);
  
  const { copied, copy } = useClipboard();

  // 获取当前页面 URL
  useEffect(() => {
    setInput(window.location.href);
  }, []);

  // 解析 URL
  useEffect(() => {
    if (!input.trim()) {
      setParsed(null);
      setParams([]);
      setError('');
      return;
    }

    const result = analyzeURL(input);
    if (result.error) {
      setError(result.error);
      setParsed(null);
      setParams([]);
    } else {
      setParsed(result.parsed);
      setParams(parseQueryParams(result.parsed?.search || ''));
      setError('');
    }
  }, [input]);

  const handleCopyAll = async () => {
    if (parsed) {
      const data = JSON.stringify(parsed, null, 2);
      await copy(data);
    }
  };

  const sampleUrls = [
    'https://www.example.com/path/to/page?name=value&foo=bar#section',
    'https://api.github.com/users/octocat/repos?page=1&per_page=10',
    'mysql://user:pass@localhost:3306/mydb?charset=utf8',
    'ftp://files.example.com:21/public/documents/report.pdf',
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6">
      {/* 标题 */}
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Link className="w-5 h-5 sm:w-7 sm:h-7 text-blue-500" />
          URL 分析器
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 text-xs sm:text-sm">
          解析 URL 结构，提取协议、主机、路径、查询参数等信息
        </p>
      </div>

      {/* 输入区域 */}
      <div className="card p-4 sm:p-6 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
            URL 地址
          </label>
          <button
            onClick={handleCopyAll}
            disabled={!parsed}
            className={`btn-tool disabled:opacity-50 ${copied ? 'btn-ghost-success' : 'btn-secondary'}`}
          >
            {copied ? <Check className="w-3.5 h-3.5 flex-shrink-0" /> : <FileJson className="w-3.5 h-3.5 flex-shrink-0" />}
            {copied ? '已复制' : '复制 JSON'}
          </button>
        </div>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="输入 URL 地址..."
          className="w-full px-3 sm:px-4 py-2 sm:py-3 font-mono text-xs sm:text-sm bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:text-white"
        />
        
        {error && (
          <div className="flex items-center gap-2 text-red-500 text-xs sm:text-sm">
            <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            {error}
          </div>
        )}

        {/* 示例 URL */}
        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-gray-500">示例:</span>
          {sampleUrls.map((url, idx) => (
            <button
              key={idx}
              onClick={() => setInput(url)}
              className="btn-tool btn-ghost text-primary-500 hover:text-primary-600"
            >
              示例 {idx + 1}
            </button>
          ))}
        </div>
      </div>

      {parsed && (
        <>
          {/* URL 结构概览 */}
          <div className="card p-4 sm:p-6">
            <h3 className="font-medium text-sm sm:text-base text-gray-900 dark:text-white mb-3 sm:mb-4 flex items-center gap-2">
              <Layers className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
              URL 结构
            </h3>
            
            {/* 可视化分解 */}
            <div className="p-2 sm:p-4 bg-gray-50 dark:bg-slate-900 rounded-lg font-mono text-xs sm:text-sm overflow-x-auto">
              <div className="flex flex-wrap items-center gap-1">
                {/* 协议 */}
                <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded text-xs sm:text-sm">
                  {parsed.protocol}
                </span>
                <span className="text-gray-400">//</span>
                
                {/* 认证信息 */}
                {parsed.username && (
                  <>
                    <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded text-xs sm:text-sm">
                      {parsed.username}
                      {parsed.password && `:${parsed.password}`}
                    </span>
                    <span className="text-gray-400">@</span>
                  </>
                )}
                
                {/* 主机 */}
                <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs sm:text-sm">
                  {parsed.hostname}
                </span>
                
                {/* 端口 */}
                {parsed.port && (
                  <>
                    <span className="text-gray-400">:</span>
                    <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded text-xs sm:text-sm">
                      {parsed.port}
                    </span>
                  </>
                )}
                
                {/* 路径 */}
                {parsed.pathname !== '/' && (
                  <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded text-xs sm:text-sm">
                    {parsed.pathname}
                  </span>
                )}
                
                {/* 查询参数 */}
                {parsed.search && (
                  <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 rounded text-xs sm:text-sm">
                    ?{parsed.search.slice(1)}
                  </span>
                )}
                
                {/* 锚点 */}
                {parsed.hash && (
                  <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs sm:text-sm">
                    #{parsed.hash.slice(1)}
                  </span>
                )}
              </div>
            </div>

            {/* 图例 */}
            <div className="mt-3 flex flex-wrap gap-2 sm:gap-3 text-xs">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-purple-100 dark:bg-purple-900/30 rounded"></span>
                协议
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-orange-100 dark:bg-orange-900/30 rounded"></span>
                认证
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-blue-100 dark:bg-blue-900/30 rounded"></span>
                主机
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-100 dark:bg-green-900/30 rounded"></span>
                端口
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-yellow-100 dark:bg-yellow-900/30 rounded"></span>
                路径
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-pink-100 dark:bg-pink-900/30 rounded"></span>
                查询参数
              </span>
            </div>
          </div>

          {/* 详细信息 */}
          <div className="grid md:grid-cols-2 gap-3 sm:gap-4">
            {/* 基本信息 */}
            <div className="card p-4 sm:p-6 space-y-2 sm:space-y-3">
              <h3 className="font-medium text-sm sm:text-base text-gray-900 dark:text-white flex items-center gap-2">
                <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                基本信息
              </h3>
              
              <InfoItem label="完整 URL" value={parsed.href} link />
              <InfoItem label="来源 (Origin)" value={parsed.origin} />
              <InfoItem label="协议 (Protocol)" value={parsed.protocol} highlight />
              <InfoItem label="主机 (Host)" value={parsed.host} highlight />
              <InfoItem label="主机名 (Hostname)" value={parsed.hostname} />
              {parsed.port && (
                <InfoItem label="端口 (Port)" value={parsed.port} highlight />
              )}
            </div>

            {/* 路径和额外信息 */}
            <div className="card p-4 sm:p-6 space-y-2 sm:space-y-3">
              <h3 className="font-medium text-sm sm:text-base text-gray-900 dark:text-white flex items-center gap-2">
                <Code className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" />
                路径与资源
              </h3>
              
              <InfoItem label="路径 (Pathname)" value={parsed.pathname || '/'} />
              {parsed.search && (
                <InfoItem label="查询字符串 (Search)" value={parsed.search} />
              )}
              {parsed.hash && (
                <InfoItem label="锚点 (Hash)" value={parsed.hash} />
              )}
              {parsed.username && (
                <InfoItem label="用户名" value={parsed.username} />
              )}
              {parsed.password && (
                <InfoItem label="密码" value={'*'.repeat(parsed.password.length)} />
              )}
            </div>
          </div>

          {/* 查询参数 */}
          {params.length > 0 && (
            <div className="card p-4 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3 sm:mb-4">
                <h3 className="font-medium text-sm sm:text-base text-gray-900 dark:text-white flex items-center gap-2">
                  <Search className="w-4 h-4 sm:w-5 sm:h-5 text-pink-500" />
                  查询参数
                  <span className="text-xs sm:text-sm text-gray-500">({params.length} 个)</span>
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowDecoded(!showDecoded)}
                    className="btn-secondary btn-tool"
                  >
                    {showDecoded ? <Eye className="w-3.5 h-3.5 flex-shrink-0" /> : <EyeOff className="w-3.5 h-3.5 flex-shrink-0" />}
                    {showDecoded ? '显示编码' : '显示解码'}
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-slate-700">
                      <th className="text-left py-2 px-2 sm:px-3 text-gray-500 font-medium">序号</th>
                      <th className="text-left py-2 px-2 sm:px-3 text-gray-500 font-medium">参数名</th>
                      <th className="text-left py-2 px-2 sm:px-3 text-gray-500 font-medium">值</th>
                      <th className="text-right py-2 px-2 sm:px-3 text-gray-500 font-medium">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {params.map((param, idx) => (
                      <tr key={idx} className="border-b border-gray-100 dark:border-slate-800 last:border-0">
                        <td className="py-2 px-2 sm:px-3 text-gray-400">{idx + 1}</td>
                        <td className="py-2 px-2 sm:px-3">
                          <code className="bg-gray-100 dark:bg-slate-800 px-1.5 sm:px-2 py-0.5 rounded text-blue-600 dark:text-blue-400 text-xs">
                            {showDecoded ? param.decodedKey : param.key}
                          </code>
                        </td>
                        <td className="py-2 px-2 sm:px-3">
                          <code className="bg-gray-100 dark:bg-slate-800 px-1.5 sm:px-2 py-0.5 rounded break-all text-xs">
                            {showDecoded ? param.decodedValue : param.value}
                          </code>
                        </td>
                        <td className="py-2 px-2 sm:px-3 text-right">
                          <button
                            onClick={() => copy(`${param.decodedKey}=${param.decodedValue}`)}
                            className={`btn-icon ${copied ? 'text-emerald-500' : ''}`}
                            title="复制"
                          >
                            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 原始数据 */}
          <div className="card p-4 sm:p-6">
            <button
              onClick={() => setShowRaw(!showRaw)}
              className="flex items-center justify-between w-full text-left touch-manipulation"
            >
              <span className="font-medium text-sm sm:text-base text-gray-900 dark:text-white flex items-center gap-2">
                <Code className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                原始数据 (JSON)
              </span>
              {showRaw ? (
                <span className="text-xs text-blue-500">收起</span>
              ) : (
                <span className="text-xs text-blue-500">展开</span>
              )}
            </button>
            {showRaw && (
              <pre className="mt-3 p-2 sm:p-3 bg-gray-50 dark:bg-slate-900 rounded-lg text-xs font-mono text-gray-700 dark:text-gray-300 overflow-x-auto">
                {JSON.stringify(parsed, null, 2)}
              </pre>
            )}
          </div>
        </>
      )}

      {/* 底部广告 */}
      <AdFooter />
    </div>
  );
}
