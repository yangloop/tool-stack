import { Plus, Trash2, FileJson, FileText, Hash, AlignLeft, FileCode, AlignLeft as FormatIcon } from 'lucide-react';
import { CodeEditor } from '../../CodeEditor';

export type BodyType = 'none' | 'form-data' | 'x-www-form-urlencoded' | 'json' | 'xml' | 'raw';

interface FormDataItem {
  key: string;
  value: string;
  type: 'text' | 'file';
  enabled: boolean;
}

interface BodyEditorProps {
  bodyType: BodyType;
  onBodyTypeChange: (type: BodyType) => void;
  jsonBody: string;
  onJsonBodyChange: (value: string) => void;
  xmlBody: string;
  onXmlBodyChange: (value: string) => void;
  rawBody: string;
  onRawBodyChange: (value: string) => void;
  formData: FormDataItem[];
  onFormDataChange: (items: FormDataItem[]) => void;
  urlEncodedData: { key: string; value: string; enabled: boolean }[];
  onUrlEncodedDataChange: (items: { key: string; value: string; enabled: boolean }[]) => void;
}

const bodyTypes = [
  { value: 'none' as BodyType, label: 'none', desc: '无请求体' },
  { value: 'form-data' as BodyType, label: 'form-data', desc: '多部分表单' },
  { value: 'x-www-form-urlencoded' as BodyType, label: 'x-www-form', desc: 'URL 编码' },
  { value: 'json' as BodyType, label: 'JSON', desc: 'JSON 格式' },
  { value: 'xml' as BodyType, label: 'XML', desc: 'XML 格式' },
  { value: 'raw' as BodyType, label: 'raw', desc: '纯文本' },
];

export function BodyEditor({
  bodyType,
  onBodyTypeChange,
  jsonBody,
  onJsonBodyChange,
  xmlBody,
  onXmlBodyChange,
  rawBody,
  onRawBodyChange,
  formData,
  onFormDataChange,
  urlEncodedData,
  onUrlEncodedDataChange,
}: BodyEditorProps) {
  const formatJSON = () => {
    try {
      const parsed = JSON.parse(jsonBody);
      onJsonBodyChange(JSON.stringify(parsed, null, 2));
    } catch {
      // Not valid JSON
    }
  };

  const formatXML = () => {
    try {
      const formatted = formatXml(xmlBody);
      onXmlBodyChange(formatted);
    } catch {
      // Not valid XML
    }
  };

  // XML 格式化函数
  function formatXml(xml: string): string {
    if (!xml.trim()) return xml;
    
    const PADDING = '  ';
    let formatted = '';
    let indent = 0;
    
    // 先移除多余的空白
    let cleaned = xml.replace(/>\s+</g, '><').trim();
    
    const tokens = cleaned.split(/(<[^>]+>)/g).filter(t => t.trim() !== '');
    
    tokens.forEach(token => {
      // 结束标签 - 减少缩进
      if (token.match(/^<\/\w/)) {
        indent--;
      }
      
      formatted += PADDING.repeat(Math.max(0, indent)) + token + '\n';
      
      // 开始标签（非自闭合）- 增加缩进
      if (token.match(/^<\w[^>]*[^/]>$/) && !token.match(/<\?xml/) && !token.match(/<!/) && !token.match(/^<\/\w/)) {
        indent++;
      }
    });
    
    return formatted.trim();
  }

  const addFormDataItem = () => {
    onFormDataChange([...formData, { key: '', value: '', type: 'text', enabled: true }]);
  };

  const updateFormDataItem = (index: number, field: keyof FormDataItem, value: unknown) => {
    const newItems = [...formData];
    newItems[index] = { ...newItems[index], [field]: value };
    onFormDataChange(newItems);
  };

  const removeFormDataItem = (index: number) => {
    onFormDataChange(formData.filter((_, i) => i !== index));
  };

  const addUrlEncodedItem = () => {
    onUrlEncodedDataChange([...urlEncodedData, { key: '', value: '', enabled: true }]);
  };

  const updateUrlEncodedItem = (index: number, field: 'key' | 'value' | 'enabled', value: unknown) => {
    const newItems = [...urlEncodedData];
    newItems[index] = { ...newItems[index], [field]: value };
    onUrlEncodedDataChange(newItems);
  };

  const removeUrlEncodedItem = (index: number) => {
    onUrlEncodedDataChange(urlEncodedData.filter((_, i) => i !== index));
  };

  const renderBodyInput = () => {
    switch (bodyType) {
      case 'none':
        return (
          <div className="text-center py-10 text-gray-400">
            <FileText className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-xs">此请求没有请求体</p>
          </div>
        );

      case 'json':
        return (
          <div className="space-y-2">
            <div className="flex justify-end">
              <button 
                onClick={formatJSON} 
                className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded transition-colors"
              >
                <FileJson className="w-3 h-3" />
                格式化
              </button>
            </div>
            <CodeEditor
              value={jsonBody}
              onChange={onJsonBodyChange}
              language="json"
              placeholder={'{"key": "value"}'}
              height={224}
              variant="embedded"
            />
          </div>
        );

      case 'xml':
        return (
          <div className="space-y-2">
            <div className="flex justify-end">
              <button 
                onClick={formatXML} 
                className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded transition-colors"
              >
                <FormatIcon className="w-3 h-3" />
                格式化
              </button>
            </div>
            <CodeEditor
              value={xmlBody}
              onChange={onXmlBodyChange}
              language="xml"
              placeholder={'<?xml version="1.0"?>\n<root>\n</root>'}
              height={224}
              variant="embedded"
            />
          </div>
        );

      case 'raw':
        return (
          <CodeEditor
            value={rawBody}
            onChange={onRawBodyChange}
            language="text"
            placeholder="输入原始文本..."
            height={224}
            variant="embedded"
          />
        );

      case 'x-www-form-urlencoded':
        return (
          <div className="space-y-2">
            <div className="flex justify-end">
              <button 
                onClick={addUrlEncodedItem} 
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                添加字段
              </button>
            </div>
            {urlEncodedData.map((item, index) => (
              <div key={index} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-1.5 group bg-gray-50/50 dark:bg-slate-800/50 sm:bg-transparent dark:sm:bg-transparent p-2 sm:p-0 rounded-lg sm:rounded-none">
                <div className="flex items-center gap-1.5 flex-1">
                  <input
                    type="checkbox"
                    checked={item.enabled}
                    onChange={(e) => updateUrlEncodedItem(index, 'enabled', e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-gray-300 text-blue-500 focus:ring-blue-500 flex-shrink-0"
                  />
                  <input
                    type="text"
                    value={item.key}
                    onChange={(e) => updateUrlEncodedItem(index, 'key', e.target.value)}
                    placeholder="字段名"
                    className="flex-1 min-w-0 px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-md text-xs dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex items-center gap-1.5 flex-1 pl-5 sm:pl-0">
                  <input
                    type="text"
                    value={item.value}
                    onChange={(e) => updateUrlEncodedItem(index, 'value', e.target.value)}
                    placeholder="字段值"
                    className="flex-1 min-w-0 px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-md text-xs dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button 
                    onClick={() => removeUrlEncodedItem(index)} 
                    className="p-1.5 text-gray-400 hover:text-red-500 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all flex-shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        );

      case 'form-data':
        return (
          <div className="space-y-2">
            <div className="flex justify-end">
              <button 
                onClick={addFormDataItem} 
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                添加字段
              </button>
            </div>
            {formData.map((item, index) => (
              <div key={index} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-1.5 group bg-gray-50/50 dark:bg-slate-800/50 sm:bg-transparent dark:sm:bg-transparent p-2 sm:p-0 rounded-lg sm:rounded-none">
                {/* 移动端：第一行 - checkbox + key + type */}
                <div className="flex items-center gap-1.5 flex-1">
                  <input
                    type="checkbox"
                    checked={item.enabled}
                    onChange={(e) => updateFormDataItem(index, 'enabled', e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-gray-300 text-blue-500 focus:ring-blue-500 flex-shrink-0"
                  />
                  <input
                    type="text"
                    value={item.key}
                    onChange={(e) => updateFormDataItem(index, 'key', e.target.value)}
                    placeholder="字段名"
                    className="flex-1 min-w-0 px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-md text-xs dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <select
                    value={item.type}
                    onChange={(e) => updateFormDataItem(index, 'type', e.target.value as 'text' | 'file')}
                    className="px-2 py-1.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-md text-xs dark:text-white flex-shrink-0"
                  >
                    <option value="text">Text</option>
                    <option value="file">File</option>
                  </select>
                </div>
                {/* 移动端：第二行 - value + delete */}
                <div className="flex items-center gap-1.5 flex-1 pl-5 sm:pl-0">
                  {item.type === 'text' ? (
                    <input
                      type="text"
                      value={item.value}
                      onChange={(e) => updateFormDataItem(index, 'value', e.target.value)}
                      placeholder="字段值"
                      className="flex-1 min-w-0 px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-md text-xs dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <div className="flex-1 min-w-0 px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-md">
                      <input
                        type="file"
                        className="w-full text-xs min-w-0"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            updateFormDataItem(index, 'value', file.name);
                          }
                        }}
                      />
                    </div>
                  )}
                  <button 
                    onClick={() => removeFormDataItem(index)} 
                    className="p-1.5 text-gray-400 hover:text-red-500 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all flex-shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
      {/* Body 类型选择 */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {bodyTypes.map((type) => (
          <button
            key={type.value}
            onClick={() => onBodyTypeChange(type.value)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 ${
              bodyType === type.value
                ? 'bg-blue-500 text-white shadow-sm'
                : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
            }`}
            title={type.desc}
          >
            {type.value === 'none' && <FileText className="w-3 h-3" />}
            {type.value === 'json' && <FileJson className="w-3 h-3" />}
            {type.value === 'xml' && <FileCode className="w-3 h-3" />}
            {type.value === 'raw' && <AlignLeft className="w-3 h-3" />}
            {(type.value === 'form-data' || type.value === 'x-www-form-urlencoded') && <Hash className="w-3 h-3" />}
            <span>{type.label}</span>
          </button>
        ))}
      </div>

      {/* Body 输入区域 */}
      {renderBodyInput()}
    </div>
  );
}

export { bodyTypes };
