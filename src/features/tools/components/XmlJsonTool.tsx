import { useState, useEffect } from 'react';
import { 
  Copy, Check, ArrowRightLeft, FileCode, 
  Upload, Download, Trash2, AlertCircle 
} from 'lucide-react';
import { XMLParser, XMLBuilder, XMLValidator } from 'fast-xml-parser';
import { useClipboard } from '../../../hooks/useLocalStorage';
import { AdInArticle, AdFooter } from '../../../components/ads';
import { ToolInfoAuto } from './ToolInfoSection';
import { downloadFile, readFile } from '../../../utils/helpers';
import ReactJson from 'react-json-view';
import { CodeEditor } from '../../../components/CodeEditor';

type ConversionMode = 'xml-to-json' | 'json-to-xml';

// 自定义 slate 主题 - 匹配项目 dark 主题
const slateTheme = {
  base00: '#0f172a', // 背景 slate-900
  base01: '#1e293b', // 对象/数组背景 slate-800
  base02: '#334155', // 边框/分隔线 slate-700
  base03: '#64748b', // 次要文字 slate-500
  base04: '#94a3b8', // 括号等 slate-400
  base05: '#e2e8f0', // 主要文字 slate-200
  base06: '#f1f5f9', // 高亮 slate-100
  base07: '#ffffff', // 最亮文字
  base08: '#38bdf8', // key颜色 (sky-400) - 蓝色系
  base09: '#a5f3fc', // 字符串 (cyan-200) - 青色系
  base0A: '#fde047', // 数字 (yellow-300) - 黄色系
  base0B: '#4ade80', // 布尔值 true (green-400) - 绿色系
  base0C: '#94a3b8', // null (slate-400) - 灰色
  base0D: '#60a5fa', // 折叠图标 (blue-400)
  base0E: '#c084fc', // 数组索引 (purple-400)
  base0F: '#f472b6', // 特殊字符 (pink-400)
};

// XML 格式化
function formatXml(xml: string): string {
  const PADDING = '  ';
  let formatted = '';
  let indent = 0;
  
  xml = xml.replace(/>\s*</g, '><');
  
  const tokens = xml.split(/(<[^>]+>)/g).filter(t => t.trim() !== '');
  
  tokens.forEach(token => {
    if (token.match(/^<\/\w/)) {
      indent--;
    }
    
    formatted += PADDING.repeat(Math.max(0, indent)) + token + '\n';
    
    if (token.match(/^<\w[^>]*[^\/]>$/) && !token.match(/<\?xml/) && !token.match(/<\!/) && !token.match(/<\/\w/)) {
      indent++;
    }
  });
  
  return formatted.trim();
}

export function XmlJsonTool() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState<ConversionMode>('xml-to-json');
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<'formatted' | 'compressed'>('formatted');
  const [isDark, setIsDark] = useState(false);
  const { copied, copy } = useClipboard();

  // 监听主题变化
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    checkDarkMode();
    
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    
    return () => observer.disconnect();
  }, []);

  // 执行转换
  const convert = (inputValue: string, currentMode: ConversionMode): string => {
    if (!inputValue.trim()) return '';
    
    try {
      if (currentMode === 'xml-to-json') {
        // 验证 XML
        const validation = XMLValidator.validate(inputValue);
        if (validation !== true) {
          throw new Error(`XML 格式错误: ${validation.err.msg}`);
        }
        
        const parser = new XMLParser({
          ignoreAttributes: false,
          attributeNamePrefix: '@_',
          textNodeName: '#text',
          parseAttributeValue: false,  // 保持属性值为字符串，避免 "1.0" 变成 1
          parseTagValue: true,
          trimValues: true,
        });
        
        const result = parser.parse(inputValue);
        
        if (viewMode === 'compressed') {
          return JSON.stringify(result);
        }
        return JSON.stringify(result, null, 2);
      } else {
        // JSON to XML
        let jsonObj;
        try {
          jsonObj = JSON.parse(inputValue);
        } catch {
          throw new Error('无效的 JSON 格式');
        }
        
        // 如果 JSON 不是对象或数组，或者有多个顶层字段，包装它
        // XML 必须有且只有一个根元素
        if (typeof jsonObj !== 'object' || jsonObj === null) {
          jsonObj = { root: jsonObj };
        } else if (!Array.isArray(jsonObj) && Object.keys(jsonObj).length > 1) {
          // 普通对象且有多个顶层字段，需要包装
          jsonObj = { root: jsonObj };
        }
        
        const builder = new XMLBuilder({
          ignoreAttributes: false,
          attributeNamePrefix: '@_',
          textNodeName: '#text',
          format: viewMode === 'formatted',
          indentBy: '  ',
          suppressUnpairedNode: false,
          suppressBooleanAttributes: false,
        });
        
        const xml = builder.build(jsonObj);
        
        // 添加 XML 声明
        const xmlDeclaration = '<?xml version="1.0" encoding="UTF-8"?>\n';
        return xmlDeclaration + (viewMode === 'formatted' ? formatXml(xml) : xml);
      }
    } catch (e) {
      throw e;
    }
  };

  // 监听输入变化并实时转换
  useEffect(() => {
    try {
      const result = convert(input, mode);
      setOutput(result);
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : '转换失败');
      setOutput('');
    }
  }, [input, mode, viewMode]);

  // 切换模式时交换输入输出
  const switchMode = () => {
    const newMode = mode === 'xml-to-json' ? 'json-to-xml' : 'xml-to-json';
    
    // 如果从 JSON→XML 切换回 XML→JSON，需要移除 XML 声明避免重复
    let newInput = output;
    if (newMode === 'xml-to-json' && output) {
      // 移除 XML 声明
      newInput = output.replace(/^<\?xml[^?]*\?>\s*/i, '');
    }
    
    setMode(newMode);
    setInput(newInput);
    setOutput('');
    setError('');
  };

  // 获取示例数据
  const loadExample = () => {
    if (mode === 'xml-to-json') {
      setInput(`<?xml version="1.0" encoding="UTF-8"?>
<catalog>
  <book id="bk101">
    <author>Gambardella, Matthew</author>
    <title>XML Developer's Guide</title>
    <genre>Computer</genre>
    <price currency="USD">44.95</price>
    <publish_date>2000-10-01</publish_date>
    <description>An in-depth look at creating applications with XML.</description>
  </book>
  <book id="bk102">
    <author>Ralls, Kim</author>
    <title>Midnight Rain</title>
    <genre>Fantasy</genre>
    <price currency="USD">5.95</price>
    <publish_date>2000-12-16</publish_date>
    <description>A former architect battles corporate zombies.</description>
  </book>
</catalog>`);
    } else {
      setInput(JSON.stringify({
        catalog: {
          book: [
            {
              "@_id": "bk101",
              author: "Gambardella, Matthew",
              title: "XML Developer's Guide",
              genre: "Computer",
              price: {
                "@_currency": "USD",
                "#text": "44.95"
              },
              publish_date: "2000-10-01",
              description: "An in-depth look at creating applications with XML."
            },
            {
              "@_id": "bk102",
              author: "Ralls, Kim",
              title: "Midnight Rain",
              genre: "Fantasy",
              price: {
                "@_currency": "USD",
                "#text": "5.95"
              },
              publish_date: "2000-12-16",
              description: "A former architect battles corporate zombies."
            }
          ]
        }
      }, null, 2));
    }
  };

  // 文件上传
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const content = await readFile(file);
      setInput(content);
    } catch {
      setError('文件读取失败');
    }
  };

  // 下载结果
  const handleDownload = () => {
    if (!output) return;
    const extension = mode === 'xml-to-json' ? 'json' : 'xml';
    const mimeType = mode === 'xml-to-json' ? 'application/json' : 'application/xml';
    downloadFile(output, `converted.${extension}`, mimeType);
  };

  // 复制结果
  const handleCopy = async () => {
    if (!output) return;
    
    // JSON→XML 模式下，移除 XML 声明使复制内容与显示内容一致
    let contentToCopy = output;
    if (mode === 'json-to-xml') {
      contentToCopy = output.replace(/^<\?xml[^?]*\?>\n?/i, '');
    }
    
    await copy(contentToCopy);
  };

  // 解析 JSON 用于可视化展示
  const parsedJsonData = (() => {
    if (mode === 'xml-to-json' && output) {
      try {
        return JSON.parse(output);
      } catch {
        return null;
      }
    }
    return null;
  })();

  return (
    <div className="max-w-7xl mx-auto">
      {/* 标题 */}
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-surface-900 dark:text-surface-100 flex items-center gap-2">
          <FileCode className="w-6 h-6 sm:w-7 sm:h-7 text-primary-500" />
          XML / JSON 互转
        </h1>
        <p className="text-sm sm:text-base text-surface-500 dark:text-surface-400 mt-1">
          XML 与 JSON 格式互相转换，支持属性、格式化和高亮显示
        </p>
      </div>

      {/* 工具栏 */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {/* 模式切换 */}
        <div className="inline-flex bg-surface-100 dark:bg-surface-800 p-1 rounded-lg">
          <button
            onClick={() => setMode('xml-to-json')}
            className={`btn-group-item ${mode === 'xml-to-json' ? 'btn-group-item-active' : ''}`}
          >
            XML → JSON
          </button>
          <button
            onClick={() => setMode('json-to-xml')}
            className={`btn-group-item ${mode === 'json-to-xml' ? 'btn-group-item-active' : ''}`}
          >
            JSON → XML
          </button>
        </div>

        {/* 交换按钮 */}
        <button
          onClick={switchMode}
          disabled={!output}
          className="btn-icon"
          title="交换输入输出"
        >
          <ArrowRightLeft className="w-5 h-5" />
        </button>

        {/* 视图模式 */}
        <div className="inline-flex bg-surface-100 dark:bg-surface-800 p-1 rounded-lg">
          <button
            onClick={() => setViewMode('formatted')}
            className={`btn-group-item ${viewMode === 'formatted' ? 'btn-group-item-active' : ''}`}
          >
            格式化
          </button>
          <button
            onClick={() => setViewMode('compressed')}
            className={`btn-group-item ${viewMode === 'compressed' ? 'btn-group-item-active' : ''}`}
          >
            压缩
          </button>
        </div>

        {/* 文件操作 */}
        <div className="inline-flex bg-surface-100 dark:bg-surface-800 p-1 rounded-lg">
          <label className="btn-tool text-surface-700 dark:text-surface-300 hover:bg-white dark:hover:bg-surface-700 cursor-pointer">
            <Upload className="w-3.5 h-3.5 flex-shrink-0" />
            <span>导入</span>
            <input type="file" accept=".xml,.json,.txt" onChange={handleFileUpload} className="hidden" />
          </label>
          <button
            onClick={handleDownload}
            disabled={!output}
            className="btn-tool text-surface-700 dark:text-surface-300 hover:bg-white dark:hover:bg-surface-700 disabled:opacity-40"
          >
            <Download className="w-3.5 h-3.5 flex-shrink-0" />
            <span>下载</span>
          </button>
        </div>

        {/* 示例按钮 */}
        <button
          onClick={loadExample}
          className="btn-tool text-surface-700 dark:text-surface-300 hover:bg-white dark:hover:bg-surface-700"
        >
          加载示例
        </button>

        {/* 清空 */}
        <button
          onClick={() => { setInput(''); setOutput(''); setError(''); }}
          className="btn-ghost-danger btn-tool"
        >
          <Trash2 className="w-3.5 h-3.5 flex-shrink-0" />
          <span>清空</span>
        </button>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* 输入输出区域 */}
      <div className="grid lg:grid-cols-2 gap-3 sm:gap-4">
        {/* 输入区域 */}
        <div className="card p-4 sm:p-6 min-w-0">
          <div className="flex items-center justify-between mb-2 sm:mb-3 min-h-[36px]">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-surface-700 dark:text-surface-300">
                {mode === 'xml-to-json' ? 'XML 输入' : 'JSON 输入'}
              </span>
              {input && (
                <span className="text-xs text-surface-400">
                  {input.length.toLocaleString()} 字符
                </span>
              )}
            </div>
            {/* 占位元素，保持与输出区域按钮高度一致 */}
            <div className="invisible">
              <button className="btn-tool btn-ghost">
                <Copy className="w-3.5 h-3.5 flex-shrink-0" />
                复制
              </button>
            </div>
          </div>
          <CodeEditor
            value={input}
            onChange={setInput}
            language={mode === 'xml-to-json' ? 'xml' : 'json'}
            placeholder={mode === 'xml-to-json' ? '在此粘贴 XML 数据...' : '在此粘贴 JSON 数据...'}
            height="400px"
            variant="embedded"
          />
        </div>

        {/* 输出区域 */}
        <div className="card p-4 sm:p-6 min-w-0 overflow-hidden">
          <div className="flex items-center justify-between mb-2 sm:mb-3 min-h-[36px]">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-surface-700 dark:text-surface-300">
                {mode === 'xml-to-json' ? 'JSON 输出' : 'XML 输出'}
              </span>
              {output && (
                <span className="text-xs text-surface-400">
                  {output.length.toLocaleString()} 字符
                </span>
              )}
            </div>
            {output && (
              <button
                onClick={handleCopy}
                className={`btn-tool ${copied ? 'btn-ghost-success' : 'btn-ghost'}`}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? '已复制' : '复制'}
              </button>
            )}
          </div>
          
          {mode === 'xml-to-json' && viewMode === 'formatted' && parsedJsonData ? (
            // XML → JSON 格式化视图使用 ReactJson
            <div className="h-[400px] border border-surface-200 dark:border-surface-700 rounded-lg overflow-auto bg-[#fafafa] dark:bg-[#282c34] min-w-0">
              <div className="p-2 sm:p-4 min-w-0" style={{ maxWidth: '100%' }}>
                <ReactJson
                  src={parsedJsonData}
                  theme={isDark ? slateTheme : 'rjv-default'}
                  displayDataTypes={false}
                  enableClipboard={true}
                  collapsed={false}
                  style={{
                    background: 'transparent',
                    fontSize: '13px',
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                    maxWidth: '100%',
                    overflow: 'hidden',
                  }}
                  iconStyle="triangle"
                  indentWidth={2}
                  collapseStringsAfterLength={80}
                />
              </div>
            </div>
          ) : (
            // 其他情况使用 CodeEditor
            <CodeEditor
              value={output}
              onChange={() => {}}
              language={mode === 'xml-to-json' ? 'json' : 'xml'}
              placeholder="转换结果将显示在这里"
              height="400px"
              variant="embedded"
              readOnly={true}
            />
          )}
        </div>
      </div>

      <AdInArticle />

      <ToolInfoAuto toolId="xml-json" />

      <AdFooter />
    </div>
  );
}
