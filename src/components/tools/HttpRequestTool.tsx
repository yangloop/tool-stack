import { useState, useEffect } from 'react';
import { 
  Send, Globe, Copy, Check, AlertCircle, 
  Clock, Hash, Code, Type, Trash2, History
} from 'lucide-react';
import { useClipboard, useLocalStorage } from '../../hooks/useLocalStorage';
import { 
  KeyValueEditor, BodyEditor, type BodyType, 
  CodeGenerator, CurlImporter, type CurlParseResult,
  sendHttpRequest, cancelCurrentRequest,
  type HttpResponse 
} from './http-request';
import { AdFooter } from '../ads';

const httpMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'] as const;
type HttpMethod = typeof httpMethods[number];

interface Header {
  key: string;
  value: string;
  enabled: boolean;
}

interface Param {
  key: string;
  value: string;
  enabled: boolean;
}

interface FormDataItem {
  key: string;
  value: string;
  type: 'text' | 'file';
  enabled: boolean;
}

interface RequestHistory {
  id: string;
  method: HttpMethod;
  url: string;
  baseUrl: string;
  params: Param[];
  headers: Header[];
  bodyType: BodyType;
  jsonBody: string;
  xmlBody: string;
  rawBody: string;
  formData: FormDataItem[];
  urlEncodedData: Param[];
  timestamp: number;
}



// URL 参数解析与构建
function parseUrlParams(url: string): { baseUrl: string; params: Param[] } {
  try {
    const urlObj = new URL(url);
    const params: Param[] = [];
    urlObj.searchParams.forEach((value, key) => {
      params.push({ key, value, enabled: true });
    });
    urlObj.search = '';
    return { baseUrl: urlObj.toString(), params };
  } catch {
    const qIndex = url.indexOf('?');
    if (qIndex === -1) return { baseUrl: url, params: [] };
    
    const baseUrl = url.slice(0, qIndex);
    const queryString = url.slice(qIndex + 1);
    const params: Param[] = [];
    
    queryString.split('&').forEach(pair => {
      const [key, ...valueParts] = pair.split('=');
      if (key) {
        params.push({
          key: decodeURIComponent(key),
          value: valueParts.length > 0 ? decodeURIComponent(valueParts.join('=')) : '',
          enabled: true
        });
      }
    });
    
    return { baseUrl, params };
  }
}

function buildUrlWithParams(baseUrl: string, params: Param[]): string {
  const enabledParams = params.filter(p => p.enabled && p.key.trim());
  if (enabledParams.length === 0) return baseUrl;
  
  const queryString = enabledParams
    .map(p => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`)
    .join('&');
  
  const separator = baseUrl.includes('?') ? '&' : '?';
  return `${baseUrl}${separator}${queryString}`;
}

// 构建请求体
function buildRequestBody(
  bodyType: BodyType,
  jsonBody: string,
  xmlBody: string,
  rawBody: string,
  formData: FormDataItem[],
  urlEncodedData: Param[]
): string | null {
  switch (bodyType) {
    case 'none':
      return null;
    case 'json':
      return jsonBody;
    case 'xml':
      return xmlBody;
    case 'raw':
      return rawBody;
    case 'x-www-form-urlencoded': {
      const enabled = urlEncodedData.filter(p => p.enabled && p.key.trim());
      return enabled.map(p => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`).join('&');
    }
    case 'form-data': {
      const enabled = formData.filter(p => p.enabled && p.key.trim());
      return enabled.map(p => `${p.key}=${p.value}`).join('&');
    }
    default:
      return null;
  }
}

export function HttpRequestTool() {
  const [method, setMethod] = useState<HttpMethod>('GET');
  const [baseUrl, setBaseUrl] = useState('https://api.github.com/users/github');
  const [params, setParams] = useState<Param[]>([]);
  const [headers, setHeaders] = useState<Header[]>([
    { key: 'Content-Type', value: 'application/json', enabled: true },
  ]);
  
  // Body 状态
  const [bodyType, setBodyType] = useState<BodyType>('none');
  const [rawBody, setRawBody] = useState('');
  const [jsonBody, setJsonBody] = useState('{}');
  const [xmlBody, setXmlBody] = useState('');
  const [formData, setFormData] = useState<FormDataItem[]>([{ key: '', value: '', type: 'text', enabled: true }]);
  const [urlEncodedData, setUrlEncodedData] = useState<Param[]>([{ key: '', value: '', enabled: true }]);
  
  // 响应状态
  const [response, setResponse] = useState<HttpResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'params' | 'headers' | 'body'>('params');
  const [responseTab, setResponseTab] = useState<'body' | 'headers'>('body');
  
  const { copied, copy } = useClipboard();
  const [history, setHistory] = useLocalStorage<RequestHistory[]>('http-request-history', []);

  // 解析 URL 参数
  useEffect(() => {
    const { baseUrl: parsedBase, params: parsedParams } = parseUrlParams(baseUrl);
    if (parsedParams.length > 0) {
      setBaseUrl(parsedBase);
      setParams(parsedParams);
    }
  }, []);

  // 自动更新 Content-Type
  useEffect(() => {
    const contentTypeMap: Record<BodyType, string> = {
      'none': '',
      'form-data': 'multipart/form-data',
      'x-www-form-urlencoded': 'application/x-www-form-urlencoded',
      'json': 'application/json',
      'xml': 'application/xml',
      'raw': 'text/plain',
    };

    if (bodyType !== 'none') {
      const newHeaders = [...headers];
      const contentTypeIndex = newHeaders.findIndex(h => h.key.toLowerCase() === 'content-type');
      const newContentType = contentTypeMap[bodyType];
      
      if (contentTypeIndex >= 0) {
        newHeaders[contentTypeIndex].value = newContentType;
      } else {
        newHeaders.push({ key: 'Content-Type', value: newContentType, enabled: true });
      }
      setHeaders(newHeaders);
    }
  }, [bodyType]);

  const sendRequest = async () => {
    if (!baseUrl.trim()) {
      setError('请输入 URL');
      return;
    }

    setLoading(true);
    setError('');
    setResponse(null);

    const fullUrl = buildUrlWithParams(baseUrl, params);

    try {
      const requestHeaders: Record<string, string> = {};
      headers.forEach(h => {
        if (h.enabled && h.key.trim()) {
          requestHeaders[h.key] = h.value;
        }
      });

      const requestBody = method !== 'GET' && method !== 'HEAD' 
        ? buildRequestBody(bodyType, jsonBody, xmlBody, rawBody, formData, urlEncodedData)
        : null;

      // 使用新的 HTTP 服务发送请求
      const responseData = await sendHttpRequest({
        method,
        url: fullUrl,
        headers: requestHeaders,
        body: requestBody,
      });

      setResponse(responseData);

      // 保存到历史记录（包含所有参数）
      const newHistoryItem: RequestHistory = {
        id: Date.now().toString(),
        method,
        url: fullUrl,
        baseUrl,
        params: [...params],
        headers: [...headers],
        bodyType,
        jsonBody,
        xmlBody,
        rawBody,
        formData: [...formData],
        urlEncodedData: [...urlEncodedData],
        timestamp: Date.now(),
      };
      setHistory(prev => [newHistoryItem, ...prev].slice(0, 20));

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '未知错误';
      
      // 判断是否为 CORS 错误
      if (errorMessage.toLowerCase().includes('cors') || 
          errorMessage.toLowerCase().includes('network error') ||
          errorMessage.toLowerCase().includes('blocked')) {
        setError('请求失败: 遇到跨域(CORS)限制。请使用支持 CORS 的 API。');
      } else {
        setError(`请求失败: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRequest = () => {
    cancelCurrentRequest();
    setLoading(false);
    setError('请求已取消');
  };

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'text-emerald-500 dark:text-emerald-400';
    if (status >= 300 && status < 400) return 'text-amber-500 dark:text-amber-400';
    if (status >= 400 && status < 500) return 'text-orange-500 dark:text-orange-400';
    return 'text-red-500 dark:text-red-400';
  };

  const clearHistory = () => {
    setHistory([]);
  };

  // 处理 cURL 导入
  const handleCurlImport = (result: CurlParseResult) => {
    // 设置方法
    if (httpMethods.includes(result.method as HttpMethod)) {
      setMethod(result.method as HttpMethod);
    }
    
    // 解析 URL 参数
    const { baseUrl: parsedBase, params: parsedParams } = parseUrlParams(result.url);
    setBaseUrl(parsedBase);
    if (parsedParams.length > 0) {
      setParams(parsedParams);
    }
    
    // 设置请求头
    const newHeaders: Header[] = Object.entries(result.headers).map(([key, value]) => ({
      key,
      value,
      enabled: true,
    }));
    setHeaders(newHeaders.length > 0 ? newHeaders : [{ key: '', value: '', enabled: true }]);
    
    // 设置请求体
    if (result.body) {
      const contentType = result.headers['Content-Type'] || result.headers['content-type'] || '';
      if (contentType.includes('application/json')) {
        setBodyType('json');
        setJsonBody(result.body);
      } else if (contentType.includes('application/xml') || contentType.includes('text/xml')) {
        setBodyType('xml');
        setXmlBody(result.body);
      } else if (contentType.includes('application/x-www-form-urlencoded')) {
        setBodyType('x-www-form-urlencoded');
        // 解析 URL 编码的数据
        const pairs = result.body.split('&').map(pair => {
          const [key, ...valueParts] = pair.split('=');
          return {
            key: key ? decodeURIComponent(key) : '',
            value: valueParts.length > 0 ? decodeURIComponent(valueParts.join('=')) : '',
            enabled: true,
          };
        });
        setUrlEncodedData(pairs.length > 0 ? pairs : [{ key: '', value: '', enabled: true }]);
      } else {
        setBodyType('raw');
        setRawBody(result.body);
      }
      setActiveTab('body');
    } else {
      setBodyType('none');
    }
  };

  const fullUrl = buildUrlWithParams(baseUrl, params);

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      {/* 工具标题栏 */}
      <div className="tool-header">
        <div className="tool-icon">
          <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:w-5 sm:h-5 sm:w-6 sm:h-6" />
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-semibold text-surface-900 dark:text-surface-100">
            HTTP 快捷请求
          </h1>
          <p className="text-sm text-surface-500 mt-0.5">
            支持多种请求体格式的 API 测试工具
          </p>
        </div>
        <CurlImporter onImport={handleCurlImport} />
      </div>

      {/* URL 输入区域 */}
      <div className="card p-3 sm:p-4 sm:p-6 mb-4 sm:mb-4 sm:mb-5">
        <div className="flex gap-2 sm:gap-3">
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value as HttpMethod)}
            className="select w-28 font-medium"
          >
            {httpMethods.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <input
            type="text"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder="输入 URL..."
            className="input flex-1 font-mono text-sm"
          />
          {loading ? (
            <button
              onClick={handleCancelRequest}
              className="btn-danger btn-tool sm:btn-action"
            >
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin flex-shrink-0" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              取消
            </button>
          ) : (
            <button
              onClick={sendRequest}
              disabled={loading}
              className="btn-primary btn-tool sm:btn-action"
            >
              <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
              发送
            </button>
          )}
        </div>

        {params.filter(p => p.enabled && p.key).length > 0 && (
          <div className="mt-4 p-3 bg-primary-50/50 dark:bg-primary-900/10 rounded-xl">
            <div className="text-xs text-surface-500 mb-1">完整请求 URL:</div>
            <div className="font-mono text-xs text-primary-600 dark:text-primary-400 break-all">
              {fullUrl}
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 rounded-xl text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
            {error}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-0 sm:gap-1 border-b border-surface-200 dark:border-surface-700 mb-4 sm:mb-5 overflow-x-auto scrollbar-hide">
        <TabButton 
          active={activeTab === 'params'} 
          onClick={() => setActiveTab('params')}
          icon={<Hash className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
          label="参数"
          count={params.filter(p => p.enabled && p.key).length}
        />
        <TabButton 
          active={activeTab === 'headers'} 
          onClick={() => setActiveTab('headers')}
          icon={<Code className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
          label="请求头"
          count={headers.filter(h => h.enabled && h.key).length}
        />
        <TabButton 
          active={activeTab === 'body'} 
          onClick={() => setActiveTab('body')}
          icon={<Type className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
          label="请求体"
          badge={bodyType !== 'none' ? bodyType : undefined}
        />
      </div>

      {/* Tab Content */}
      <div className="mb-4 sm:mb-5">
        {activeTab === 'params' && (
          <div className="card p-3 sm:p-4 sm:p-6">
            <KeyValueEditor
              items={params}
              onChange={setParams}
              keyPlaceholder="参数名"
              valuePlaceholder="参数值"
              addButtonText="添加参数"
            />
          </div>
        )}

        {activeTab === 'headers' && (
          <div className="card p-3 sm:p-4 sm:p-6">
            <KeyValueEditor
              items={headers}
              onChange={setHeaders}
              keyPlaceholder="Header 名"
              valuePlaceholder="Header 值"
              addButtonText="添加请求头"
            />
          </div>
        )}

        {activeTab === 'body' && (
          <BodyEditor
            bodyType={bodyType}
            onBodyTypeChange={setBodyType}
            jsonBody={jsonBody}
            onJsonBodyChange={setJsonBody}
            xmlBody={xmlBody}
            onXmlBodyChange={setXmlBody}
            rawBody={rawBody}
            onRawBodyChange={setRawBody}
            formData={formData}
            onFormDataChange={setFormData}
            urlEncodedData={urlEncodedData}
            onUrlEncodedDataChange={setUrlEncodedData}
          />
        )}
      </div>

      {/* Code Generator */}
      <div className="mb-3 sm:mb-4">
        <CodeGenerator
          method={method}
          url={fullUrl}
          headers={headers.filter(h => h.enabled && h.key.trim()).reduce((acc, h) => ({ ...acc, [h.key]: h.value }), {})}
          body={buildRequestBody(bodyType, jsonBody, xmlBody, rawBody, formData, urlEncodedData)}
        />
      </div>

      {/* Response */}
      {response && (
        <div className="card p-0 overflow-hidden mb-4 sm:mb-4 sm:mb-5">
          {/* 响应头部 */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-surface-200 dark:border-surface-700 bg-surface-50/50 dark:bg-surface-800/50">
            <div className="flex items-center gap-2 sm:gap-3">
              <span className={`text-2xl font-bold ${getStatusColor(response.status)}`}>
                {response.status}
              </span>
              <span className="text-sm text-surface-600 dark:text-surface-400">{response.statusText}</span>
            </div>
            <div className="flex items-center gap-3 sm:p-4 text-xs text-surface-500">
              <span className="flex items-center gap-1.5 px-2.5 py-1 bg-surface-100 dark:bg-surface-700 rounded-lg">
                <Clock className="w-3.5 h-3.5" />
                {response.time}ms
              </span>
              <span className="px-2.5 py-1 bg-surface-100 dark:bg-surface-700 rounded-lg">
                {(response.size / 1024).toFixed(2)} KB
              </span>
            </div>
          </div>

          {/* 响应 Tabs */}
          <div className="flex border-b border-surface-200 dark:border-surface-700 px-5">
            <TabButton 
              active={responseTab === 'body'} 
              onClick={() => setResponseTab('body')}
              label="响应体"
            />
            <TabButton 
              active={responseTab === 'headers'} 
              onClick={() => setResponseTab('headers')}
              label="响应头"
            />
          </div>

          {/* 响应内容 */}
          <div className="p-3 sm:p-4 sm:p-5">
            {responseTab === 'body' ? (
              <div className="space-y-3">
                <div className="flex justify-end">
                  <button
                    onClick={() => copy(response.body)}
                    className={`btn-tool ${copied ? 'btn-ghost-success' : 'btn-ghost'}`}
                  >
                    {copied ? <Check className="w-3.5 h-3.5 flex-shrink-0" /> : <Copy className="w-3.5 h-3.5 flex-shrink-0" />}
                    {copied ? '已复制' : '复制'}
                  </button>
                </div>
                <pre className="p-3 sm:p-4 bg-surface-900 text-surface-100 rounded-xl overflow-auto max-h-72 sm:h-96 text-sm font-mono">
                  {response.body}
                </pre>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-auto">
                {Object.entries(response.headers).map(([key, value]) => (
                  <div key={key} className="flex gap-3 sm:p-4 text-sm py-2 border-b border-surface-100 dark:border-surface-700/50 last:border-0">
                    <span className="font-medium text-surface-700 dark:text-surface-300 min-w-[180px] flex-shrink-0">{key}:</span>
                    <span className="text-surface-600 dark:text-surface-400 break-all font-mono text-xs">{value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div className="card mb-4 sm:mb-5">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="flex items-center gap-2">
              <History className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:w-5 sm:h-5 text-surface-500" />
              <h3 className="font-semibold text-surface-900 dark:text-surface-100">历史记录</h3>
            </div>
            <button
              onClick={clearHistory}
              className="btn-ghost-danger btn-tool"
            >
              <Trash2 className="w-3.5 h-3.5 flex-shrink-0" />
              清空
            </button>
          </div>
          <div className="space-y-1">
            {history.slice(0, 8).map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setMethod(item.method);
                  setBaseUrl(item.baseUrl || item.url);
                  if (item.params) setParams(item.params);
                  if (item.headers) setHeaders(item.headers);
                  if (item.bodyType) setBodyType(item.bodyType);
                  if (item.jsonBody !== undefined) setJsonBody(item.jsonBody);
                  if (item.xmlBody !== undefined) setXmlBody(item.xmlBody);
                  if (item.rawBody !== undefined) setRawBody(item.rawBody);
                  if (item.formData) setFormData(item.formData);
                  if (item.urlEncodedData) setUrlEncodedData(item.urlEncodedData);
                }}
                className="w-full flex items-center gap-3 p-3 hover:bg-surface-100 dark:hover:bg-surface-700/50 rounded-xl text-left transition-all active:scale-[0.99] touch-manipulation"
              >
                <MethodBadge method={item.method} />
                <span className="flex-1 text-xs text-surface-600 dark:text-surface-400 truncate font-mono">
                  {item.url}
                </span>
                <span className="text-[10px] text-surface-400">
                  {new Date(item.timestamp).toLocaleTimeString()}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 底部广告 */}
      <AdFooter />
    </div>
  );
}

// Tab 按钮组件
interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
  label: string;
  count?: number;
  badge?: string;
}

function TabButton({ active, onClick, icon, label, count, badge }: TabButtonProps) {
  // 移动端缩短过长的 badge
  const shortenedBadge = badge ? shortenBadge(badge) : undefined;
  
  return (
    <button
      onClick={onClick}
      className={`px-2 sm:px-3 py-2 sm:py-3 text-xs sm:text-sm font-medium border-b-2 transition-all flex items-center gap-1.5 sm:gap-2 -mb-px whitespace-nowrap ${
        active
          ? 'border-primary-500 text-primary-600 dark:text-primary-400'
          : 'border-transparent text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'
      }`}
    >
      {icon}
      <span>{label}</span>
      {count !== undefined && count > 0 && (
        <span className="ml-0.5 px-1.5 sm:px-2 py-0.5 text-[10px] bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-300 rounded-full">
          {count}
        </span>
      )}
      {shortenedBadge && (
        <span className="ml-0.5 px-1.5 sm:px-2 py-0.5 text-[10px] bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full hidden sm:inline">
          {badge}
        </span>
      )}
    </button>
  );
}

// 缩短 badge 文字（移动端不显示过长内容）
function shortenBadge(badge: string): string {
  if (!badge) return '';
  // 移动端只返回简单的标识，实际显示在 PC 端
  return badge;
}

// 方法标签
function MethodBadge({ method }: { method: string }) {
  const colorMap: Record<string, string> = {
    'GET': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    'POST': 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400',
    'PUT': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    'DELETE': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    'PATCH': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    'HEAD': 'bg-surface-100 text-surface-700 dark:bg-surface-700 dark:text-surface-300',
    'OPTIONS': 'bg-surface-100 text-surface-700 dark:bg-surface-700 dark:text-surface-300',
  };
  
  return (
    <span className={`px-2 py-1 text-[10px] font-semibold rounded-lg ${colorMap[method] || colorMap['GET']}`}>
      {method}
    </span>
  );
}
