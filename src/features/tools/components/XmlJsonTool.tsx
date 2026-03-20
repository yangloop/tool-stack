import { useState, useEffect } from 'react';
import {
  Copy, Check, ArrowRightLeft, FileCode,
  Upload, Download, Trash2, AlertCircle, Maximize2, Minimize2
} from 'lucide-react';
import { useClipboard } from '../../../hooks/useLocalStorage';
import { AdInArticle, AdFooter } from '../../../components/ads';
import { ToolInfoAuto } from './ToolInfoSection';
import { ToolHeader } from '../../../components/common';
import { downloadFile, readFile } from '../../../utils/helpers';
import { CodeEditor } from '../../../components/CodeEditor';

type ConversionMode = 'xml-to-json' | 'json-to-xml';

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
    
    if (token.match(/^<\w[^>]*[^\/]>$/) && !token.match(/<\?xml/) && !token.match(/<!/) && !token.match(/<\/\w/)) {
      indent++;
    }
  });
  
  return formatted.trim();
}

async function loadXmlTools() {
  const { XMLParser, XMLBuilder, XMLValidator } = await import('fast-xml-parser');
  return { XMLParser, XMLBuilder, XMLValidator };
}

export function XmlJsonTool() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState<ConversionMode>('xml-to-json');
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<'formatted' | 'compressed'>('formatted');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { copied, copy } = useClipboard();

  // 执行转换
  const convert = async (inputValue: string, currentMode: ConversionMode): Promise<string> => {
    if (!inputValue.trim()) return '';

    if (currentMode === 'xml-to-json') {
      const { XMLParser, XMLValidator } = await loadXmlTools();

      const validation = XMLValidator.validate(inputValue);
      if (validation !== true) {
        throw new Error(`XML 格式错误: ${validation.err.msg}`);
      }

      const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: '@_',
        textNodeName: '#text',
        parseAttributeValue: false,
        parseTagValue: true,
        trimValues: true,
      });

      const result = parser.parse(inputValue);

      return viewMode === 'compressed'
        ? JSON.stringify(result)
        : JSON.stringify(result, null, 2);
    }

    const { XMLBuilder } = await loadXmlTools();

    let jsonObj;
    try {
      jsonObj = JSON.parse(inputValue);
    } catch {
      throw new Error('无效的 JSON 格式');
    }

    if (typeof jsonObj !== 'object' || jsonObj === null) {
      jsonObj = { root: jsonObj };
    } else if (!Array.isArray(jsonObj) && Object.keys(jsonObj).length > 1) {
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
    const xmlDeclaration = '<?xml version="1.0" encoding="UTF-8"?>\n';
    return xmlDeclaration + (viewMode === 'formatted' ? formatXml(xml) : xml);
  };

  // 监听输入变化并实时转换
  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        const result = await convert(input, mode);
        if (cancelled) return;
        setOutput(result);
        setError('');
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : '转换失败');
        setOutput('');
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [input, mode, viewMode]);

  useEffect(() => {
    if (!isFullscreen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsFullscreen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

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

  const handleClear = () => {
    setInput('');
    setOutput('');
    setError('');
  };

  const toolbar = (
    <div className="flex flex-wrap items-center gap-2 mb-4">
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

      <button
        onClick={switchMode}
        disabled={!output}
        className="btn-icon"
        title="交换输入输出"
      >
        <ArrowRightLeft className="w-5 h-5" />
      </button>

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

      <button
        onClick={loadExample}
        className="btn-tool text-surface-700 dark:text-surface-300 hover:bg-white dark:hover:bg-surface-700"
      >
        加载示例
      </button>

      <button
        onClick={handleClear}
        className="btn-ghost-danger btn-tool"
      >
        <Trash2 className="w-3.5 h-3.5 flex-shrink-0" />
        <span>清空</span>
      </button>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto">
      {!isFullscreen && (
        <>
          <ToolHeader
            icon={FileCode}
            title="XML / JSON 互转"
            description="XML 与 JSON 格式互相转换，支持属性、格式化和高亮显示"
            iconColorClass="text-primary-500"
            actions={
              <button
                onClick={() => setIsFullscreen(true)}
                className="btn-tool-sm sm:btn-tool btn-ghost flex-shrink-0"
                title="全屏使用"
              >
                <Maximize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">全屏使用</span>
              </button>
            }
          />

          {toolbar}

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="grid lg:grid-cols-2 gap-3 sm:gap-4">
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

              <CodeEditor
                value={output}
                onChange={() => {}}
                language={mode === 'xml-to-json' ? 'json' : 'xml'}
                placeholder="转换结果将显示在这里"
                height="400px"
                variant="embedded"
                readOnly={true}
              />
            </div>
          </div>

          <AdInArticle />
          <ToolInfoAuto toolId="xml-json" />
          <AdFooter />
        </>
      )}

      {isFullscreen && (
        <div className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-surface-0 dark:bg-surface-900">
          <div className="flex h-14 flex-shrink-0 items-center justify-between border-b border-surface-200 bg-surface-0 px-4 dark:border-surface-700 dark:bg-surface-800">
            <div className="flex items-center gap-3">
              <FileCode className="w-5 h-5 text-primary-500" />
              <span className="font-medium text-surface-900 dark:text-surface-100">XML / JSON 互转</span>
              <span className="text-xs text-surface-400">按 ESC 退出全屏</span>
            </div>
            <button
              onClick={() => setIsFullscreen(false)}
              className="btn-tool-sm sm:btn-tool btn-ghost flex-shrink-0"
              title="退出全屏"
            >
              <Minimize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">退出全屏</span>
            </button>
          </div>

          <div className="flex-shrink-0 border-b border-surface-200 px-4 pt-4 dark:border-surface-700">
            {toolbar}
          </div>

          {error && (
            <div className="border-b border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            </div>
          )}

          <div className="grid flex-1 min-h-0 gap-0 lg:grid-cols-2">
            <div className="flex min-h-0 flex-col border-b border-surface-200 bg-surface-0 dark:border-surface-700 dark:bg-surface-800 lg:border-b-0 lg:border-r">
              <div className="flex h-12 flex-shrink-0 items-center justify-between border-b border-surface-200 px-4 dark:border-surface-700">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-surface-700 dark:text-surface-300">
                    {mode === 'xml-to-json' ? 'XML 输入' : 'JSON 输入'}
                  </span>
                  {input && <span className="text-xs text-surface-400">{input.length.toLocaleString()} 字符</span>}
                </div>
                <div className="invisible">
                  <button className="btn-tool btn-ghost">
                    <Copy className="w-3.5 h-3.5 flex-shrink-0" />
                    复制
                  </button>
                </div>
              </div>
              <div className="min-h-0 flex-1 p-4">
                <CodeEditor
                  value={input}
                  onChange={setInput}
                  language={mode === 'xml-to-json' ? 'xml' : 'json'}
                  placeholder={mode === 'xml-to-json' ? '在此粘贴 XML 数据...' : '在此粘贴 JSON 数据...'}
                  height="100%"
                  variant="embedded"
                  wrapperClassName="h-full"
                />
              </div>
            </div>

            <div className="flex min-h-0 flex-col bg-surface-0 dark:bg-surface-800">
              <div className="flex h-12 flex-shrink-0 items-center justify-between border-b border-surface-200 px-4 dark:border-surface-700">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-surface-700 dark:text-surface-300">
                    {mode === 'xml-to-json' ? 'JSON 输出' : 'XML 输出'}
                  </span>
                  {output && <span className="text-xs text-surface-400">{output.length.toLocaleString()} 字符</span>}
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
              <div className="min-h-0 flex-1 p-4">
                <CodeEditor
                  value={output}
                  onChange={() => {}}
                  language={mode === 'xml-to-json' ? 'json' : 'xml'}
                  placeholder="转换结果将显示在这里"
                  height="100%"
                  variant="embedded"
                  readOnly={true}
                  wrapperClassName="h-full"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
