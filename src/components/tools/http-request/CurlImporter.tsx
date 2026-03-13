import { useState } from 'react';
import { Import, AlertCircle, Check, Terminal } from 'lucide-react';
import { CodeEditor } from '../../CodeEditor';

interface CurlParseResult {
  method: string;
  url: string;
  headers: Record<string, string>;
  body: string | null;
}

interface CurlImporterProps {
  onImport: (result: CurlParseResult) => void;
}

function parseCurl(curlCommand: string): CurlParseResult | null {
  const result: CurlParseResult = {
    method: 'GET',
    url: '',
    headers: {},
    body: null,
  };
  
  // 清理命令
  let cmd = curlCommand.trim();
  
  // 移除开头的 curl
  if (!cmd.toLowerCase().startsWith('curl')) {
    return null;
  }
  
  cmd = cmd.substring(4).trim();
  
  // 将命令按行分割并合并，处理续行符
  cmd = cmd.replace(/\\\s*\n/g, ' ');
  
  // 解析方法（支持 -X 和 --request）
  const methodMatch = cmd.match(/(?:-X|--request)\s+(['"]?)([A-Za-z]+)\1/);
  if (methodMatch) {
    result.method = methodMatch[2].toUpperCase();
  }
  
  // 解析请求体（支持 -d, --data, --data-raw, --data-binary）
  const dataPattern = /(?:-d|--data|--data-raw|--data-binary)\s+(['"])([\s\S]*?)\1/g;
  
  const dataParts: string[] = [];
  const matches = [...cmd.matchAll(dataPattern)];
  for (const match of matches) {
    if (match[2] && match[2].trim()) {
      dataParts.push(match[2]);
    }
  }
  
  if (dataParts.length > 0) {
    result.body = dataParts.join('&');
    // 如果方法是 GET，但有 body，默认改为 POST
    if (result.method === 'GET') {
      result.method = 'POST';
    }
  }
  
  // 解析 headers（支持 -H 和 --header）
  const headerPattern = /(?:-H|--header)\s+(['"])([^:]+):\s*(.+?)\1/g;
  const headerMatches = [...cmd.matchAll(headerPattern)];
  for (const match of headerMatches) {
    const key = match[2].trim();
    const value = match[3].trim();
    if (key) {
      result.headers[key] = value;
    }
  }
  
  // 解析 URL
  // 先移除所有已解析的选项和 cURL 特定选项
  let remainingCmd = cmd
    .replace(/(?:-X|--request)\s+(['"]?)[A-Za-z]+\1/g, '')
    .replace(/(?:-d|--data|--data-raw|--data-binary)\s+(['"]).+?\1/g, '')
    .replace(/(?:-H|--header)\s+(['"]).+?:\s*.+?\1/g, '')
    .replace(/--location/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  // 剩余的应该是 URL，尝试提取
  let url = '';
  
  // 尝试匹配引号包围的 URL
  const quotedUrlMatch = remainingCmd.match(/['"](https?:\/\/[^'"]+)['"]/);
  if (quotedUrlMatch) {
    url = quotedUrlMatch[1];
  } else {
    // 尝试匹配未引号的 URL
    const unquotedUrlMatch = remainingCmd.match(/(https?:\/\/\S+)/);
    if (unquotedUrlMatch) {
      url = unquotedUrlMatch[1];
    } else {
      // 尝试匹配任何看起来像 URL 的内容
      const anyUrlMatch = remainingCmd.match(/['"]([^'"\s]+)['"]/);
      if (anyUrlMatch) {
        url = anyUrlMatch[1];
      }
    }
  }
  
  result.url = url;
  
  // 如果没有 URL，解析失败
  if (!result.url) {
    return null;
  }
  
  return result;
}

export function CurlImporter({ onImport }: CurlImporterProps) {
  const [curlCommand, setCurlCommand] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  
  const handleImport = () => {
    setError('');
    setSuccess(false);
    
    if (!curlCommand.trim()) {
      setError('请输入 cURL 命令');
      return;
    }
    
    const result = parseCurl(curlCommand);
    
    if (!result) {
      setError('无法解析 cURL 命令，请检查格式是否正确');
      return;
    }
    
    onImport(result);
    setSuccess(true);
    setCurlCommand('');
    
    setTimeout(() => {
      setIsOpen(false);
      setSuccess(false);
    }, 1000);
  };
  
  const handleClose = () => {
    setIsOpen(false);
    setError('');
    setSuccess(false);
    setCurlCommand('');
  };
  
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
      >
        <Import className="w-3.5 h-3.5" />
        导入 cURL
      </button>
    );
  }
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-xl w-full max-w-2xl">
        {/* 头部 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">导入 cURL</span>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* 内容 */}
        <div className="p-4 space-y-3">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            粘贴 cURL 命令，系统将自动解析 URL、方法、请求头和请求体
          </p>
          
          <CodeEditor
            value={curlCommand}
            onChange={setCurlCommand}
            language="shell"
            height={160}
            placeholder={`curl --location --request POST 'https://api.example.com/data' \\\n  --header 'Content-Type: application/json' \\\n  --data-raw '{"key": "value"}'`}
          />
          
          {error && (
            <div className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400">
              <AlertCircle className="w-3.5 h-3.5" />
              {error}
            </div>
          )}
          
          {success && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
              <Check className="w-3.5 h-3.5" />
              导入成功
            </div>
          )}
        </div>
        
        {/* 底部按钮 */}
        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-gray-200 dark:border-slate-700">
          <button
            onClick={handleClose}
            className="px-3 py-1.5 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleImport}
            className="px-3 py-1.5 text-xs font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
          >
            导入
          </button>
        </div>
      </div>
    </div>
  );
}

export { parseCurl };
export type { CurlParseResult };
