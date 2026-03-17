import { useState, useMemo, useCallback } from 'react';
import { 
  FileText, 
  Copy, 
  Check, 
  Trash2, 
  Download, 
  Settings,
  Variable,
  Table2,
  Type,
  Play,
  Plus,
  X,
  GripVertical
} from 'lucide-react';
import { useClipboard } from '../../../hooks/useLocalStorage';
import { AdFooter } from '../../../components/ads';
import { ToolInfoAuto } from './ToolInfoSection';
import { CodeEditor } from '../../../components/CodeEditor';

interface VariableDef {
  name: string;
  defaultValue: string;
}

interface DataRow {
  id: string;
  values: Record<string, string>;
}

interface DelimiterOption {
  name: string;
  pattern: string;
  example: string;
}

const delimiterOptions: DelimiterOption[] = [
  { name: '双大括号 {{}}', pattern: '{{\\s*([^}]+)\\s*}}', example: 'Hello {{name}}' },
  { name: 'Dollar ${}', pattern: '\\$\\{\\s*([^}]+)\\s*\\}', example: 'Hello ${name}' },
  { name: '百分号 %%', pattern: '%\\s*([^%]+)\\s*%', example: 'Hello %name%' },
  { name: '方括号 [[]]', pattern: '\\[\\[\\s*([^\\]]+)\\s*\\]\\]', example: 'Hello [[name]]' },
  { name: '尖括号 <%%>', pattern: '<%\\s*([^%]+)\\s*%>', example: 'Hello <%name%>' },
  { name: '井号 ##', pattern: '#\\s*([^#]+)\\s*#', example: 'Hello #name#' },
];

export function TextTemplateTool() {
  const [template, setTemplate] = useState(
    '尊敬的 {{name}}：\n\n' +
    '您好！感谢您选择 {{company}}。\n' +
    '您的订单编号为 {{orderId}}，金额为 {{amount}} 元。\n\n' +
    '{{#if note}}备注：{{note}}\n\n{{/if}}' +
    '如有疑问，请联系客服：{{contact}}\n\n' +
    '{{company}} 团队'
  );
  
  const [delimiterIndex, setDelimiterIndex] = useState(0);
  const [customDelimiter, setCustomDelimiter] = useState('{{}}');
  const [useCustomDelimiter, setUseCustomDelimiter] = useState(false);
  
  const [variables, setVariables] = useState<VariableDef[]>([
    { name: 'name', defaultValue: '张三' },
    { name: 'company', defaultValue: '科技有限公司' },
    { name: 'orderId', defaultValue: 'ORD-2024-001' },
    { name: 'amount', defaultValue: '199.00' },
    { name: 'contact', defaultValue: '400-123-4567' },
    { name: 'note', defaultValue: '' },
  ]);
  
  const [dataRows, setDataRows] = useState<DataRow[]>([
    { 
      id: '1', 
      values: { 
        name: '张三', 
        company: '科技有限公司',
        orderId: 'ORD-2024-001',
        amount: '199.00',
        contact: '400-123-4567',
        note: '请尽快发货'
      } 
    },
    { 
      id: '2', 
      values: { 
        name: '李四', 
        company: '创新科技',
        orderId: 'ORD-2024-002',
        amount: '299.00',
        contact: '400-123-4567',
        note: ''
      } 
    },
  ]);
  
  const [activeTab, setActiveTab] = useState<'single' | 'batch'>('single');
  const [showSettings, setShowSettings] = useState(false);
  const [separator, setSeparator] = useState('\n---\n');
  const { copied, copy } = useClipboard();

  // 获取当前分隔符正则
  const getDelimiterRegex = useCallback((): RegExp | null => {
    try {
      if (useCustomDelimiter) {
        // 解析自定义分隔符，例如 {{}} -> {{(.*?)}}
        const match = customDelimiter.match(/^(.+?)(\w+)(.+?)$/);
        if (match) {
          const [, prefix, , suffix] = match;
          return new RegExp(`${prefix}\\s*([^${suffix[0]}]+)\\s*${suffix}`, 'g');
        }
        return null;
      }
      return new RegExp(delimiterOptions[delimiterIndex].pattern, 'g');
    } catch {
      return null;
    }
  }, [delimiterIndex, customDelimiter, useCustomDelimiter]);

  // 提取模板中的变量
  const extractedVars = useMemo(() => {
    const regex = getDelimiterRegex();
    if (!regex) return [];
    
    const vars = new Set<string>();
    let match;
    const regexCopy = new RegExp(regex.source, regex.flags);
    while ((match = regexCopy.exec(template)) !== null) {
      vars.add(match[1].trim());
    }
    return Array.from(vars);
  }, [template, getDelimiterRegex]);

  // 获取当前分隔符的打开和关闭标记
  const getDelimiterMarkers = useCallback((): { open: string; close: string } => {
    if (useCustomDelimiter) {
      const match = customDelimiter.match(/^(.+?)(\w+)(.+?)$/);
      if (match) {
        return { open: match[1], close: match[3] };
      }
      return { open: '{{', close: '}}' };
    }
    const opt = delimiterOptions[delimiterIndex];
    if (opt.pattern.includes('{{')) return { open: '{{', close: '}}' };
    if (opt.pattern.includes('${')) return { open: '${', close: '}' };
    if (opt.pattern.includes('%%')) return { open: '%', close: '%' };
    if (opt.pattern.includes('[[')) return { open: '[[', close: ']]' };
    if (opt.pattern.includes('<%')) return { open: '<%', close: '%>' };
    if (opt.pattern.includes('##')) return { open: '#', close: '#' };
    return { open: '{{', close: '}}' };
  }, [delimiterIndex, customDelimiter, useCustomDelimiter]);

  // 单条替换 - 先处理条件块，再处理变量
  const replaceSingle = useCallback((text: string, values: Record<string, string>): string => {
    const regex = getDelimiterRegex();
    if (!regex) return text;
    
    const { open, close } = getDelimiterMarkers();
    let result = text;
    
    // 处理 {{#if var}}...{{/if}} 条件块
    const ifPattern = new RegExp(
      open.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + 
      '\\s*#if\\s+(\w+)\\s*' + 
      close.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + 
      '([\s\S]*?)' +
      open.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + 
      '\\s*/if\\s*' + 
      close.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
      'g'
    );
    
    result = result.replace(ifPattern, (_, varName, content) => {
      const value = values[varName];
      // 变量有值（非空字符串）时显示内容，否则删除整个块
      return value && value.trim() !== '' ? content : '';
    });
    
    // 处理普通变量
    result = result.replace(regex, (match, varName) => {
      const key = varName.trim();
      return values[key] !== undefined ? values[key] : match;
    });
    
    return result;
  }, [getDelimiterRegex, getDelimiterMarkers]);

  // 批量替换结果
  const batchResult = useMemo(() => {
    return dataRows.map(row => replaceSingle(template, row.values)).join(separator);
  }, [dataRows, template, separator, replaceSingle]);

  // 默认值结果
  const defaultResult = useMemo(() => {
    const values: Record<string, string> = {};
    variables.forEach(v => {
      values[v.name] = v.defaultValue;
    });
    return replaceSingle(template, values);
  }, [variables, template, replaceSingle]);

  // 添加变量
  const addVariable = () => {
    setVariables([...variables, { name: `var${variables.length + 1}`, defaultValue: '' }]);
  };

  // 更新变量
  const updateVariable = (index: number, field: keyof VariableDef, value: string) => {
    const newVars = [...variables];
    newVars[index] = { ...newVars[index], [field]: value };
    setVariables(newVars);
  };

  // 删除变量
  const removeVariable = (index: number) => {
    setVariables(variables.filter((_, i) => i !== index));
  };

  // 同步提取的变量到变量列表
  const syncVariables = () => {
    const newVars = [...variables];
    extractedVars.forEach(varName => {
      if (!newVars.some(v => v.name === varName)) {
        newVars.push({ name: varName, defaultValue: '' });
      }
    });
    setVariables(newVars);
  };

  // 添加数据行
  const addDataRow = () => {
    const newRow: DataRow = {
      id: Date.now().toString(),
      values: {}
    };
    // 使用默认值填充
    variables.forEach(v => {
      newRow.values[v.name] = v.defaultValue;
    });
    setDataRows([...dataRows, newRow]);
  };

  // 更新数据行
  const updateDataRow = (rowId: string, varName: string, value: string) => {
    setDataRows(dataRows.map(row => 
      row.id === rowId 
        ? { ...row, values: { ...row.values, [varName]: value } }
        : row
    ));
  };

  // 删除数据行
  const removeDataRow = (rowId: string) => {
    setDataRows(dataRows.filter(row => row.id !== rowId));
  };

  // 清空
  const clearAll = () => {
    setTemplate('');
    setVariables([]);
    setDataRows([]);
  };

  // 导出结果
  const exportResult = () => {
    const content = activeTab === 'single' ? defaultResult : batchResult;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `template-result-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 导入 CSV 格式数据
  const importFromCsv = (csvText: string) => {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) return;
    
    const headers = lines[0].split(',').map(h => h.trim());
    const newRows: DataRow[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values: Record<string, string> = {};
      const cells = lines[i].split(',').map(c => c.trim());
      headers.forEach((header, idx) => {
        values[header] = cells[idx] || '';
      });
      newRows.push({ id: `${Date.now()}-${i}`, values });
    }
    
    setDataRows(newRows);
  };

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      {/* 标题 */}
      <div className="tool-header">
        <div className="tool-icon w-9 h-9 sm:w-12 sm:h-12">
          <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg sm:text-xl font-semibold text-surface-900 dark:text-surface-100">
            文本模板替换
          </h1>
          <p className="text-xs sm:text-sm text-surface-500 mt-0.5">
            使用变量模板批量生成文本，支持自定义分隔符和数据表格
          </p>
        </div>
      </div>

      {/* 设置栏 */}
      <div className="card p-4 sm:p-6 mb-4 sm:mb-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 sm:gap-4">
          {/* 分隔符选择 */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs sm:text-sm text-surface-600 dark:text-surface-400">分隔符:</span>
            <select
              id="template-delimiter"
              name="template-delimiter"
              value={useCustomDelimiter ? 'custom' : delimiterIndex}
              onChange={(e) => {
                if (e.target.value === 'custom') {
                  setUseCustomDelimiter(true);
                } else {
                  setUseCustomDelimiter(false);
                  setDelimiterIndex(Number(e.target.value));
                }
              }}
              className="select text-xs sm:text-sm py-1.5"
            >
              {delimiterOptions.map((opt, idx) => (
                <option key={idx} value={idx}>{opt.name} - {opt.example}</option>
              ))}
              <option value="custom">自定义...</option>
            </select>
          </div>

          {/* 自定义分隔符 */}
          {useCustomDelimiter && (
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm text-surface-500">格式:</span>
              <input
                type="text"
                id="template-custom-delimiter"
                name="template-custom-delimiter"
                value={customDelimiter}
                onChange={(e) => setCustomDelimiter(e.target.value)}
                placeholder="例如: {{}}"
                className="input text-xs sm:text-sm py-1.5 w-20 sm:w-24"
              />
            </div>
          )}

          <div className="flex-1" />

          {/* 操作按钮 */}
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <button
              onClick={syncVariables}
              className="btn-secondary btn-tool"
              disabled={extractedVars.length === 0}
            >
              <Variable className="w-3.5 h-3.5 flex-shrink-0" />
              同步变量
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="btn-ghost btn-tool"
            >
              <Settings className="w-3.5 h-3.5 flex-shrink-0" />
              设置
            </button>
          </div>
        </div>

        {/* 展开设置 */}
        {showSettings && (
          <div className="pt-4 border-t border-surface-200 dark:border-surface-700 space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="template-separator" className="text-xs sm:text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5 block">
                  批量分隔符（用于分隔多条结果）
                </label>
                <input
                  type="text"
                  id="template-separator"
                  name="template-separator"
                  value={separator}
                  onChange={(e) => setSeparator(e.target.value)}
                  className="w-full input text-sm"
                  placeholder="\n---\n"
                />
              </div>
              <div>
                <label className="text-xs sm:text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5 block">
                  从 CSV 导入数据
                </label>
                <CodeEditor
                  value=""
                  onChange={importFromCsv}
                  language="text"
                  height={80}
                  placeholder="name,age,city\n张三,25,北京\n李四,30,上海"
                  variant="embedded"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tab 切换 */}
      <div className="flex gap-1 border-b border-surface-200 dark:border-surface-700 mb-4 sm:mb-5 overflow-x-auto">
        <button
          onClick={() => setActiveTab('single')}
          className={`px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium border-b-2 transition-all flex items-center gap-1.5 sm:gap-2 -mb-px whitespace-nowrap touch-manipulation ${
            activeTab === 'single'
              ? 'border-primary-500 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'
          }`}
        >
          <Type className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          单条预览
        </button>
        <button
          onClick={() => setActiveTab('batch')}
          className={`px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium border-b-2 transition-all flex items-center gap-1.5 sm:gap-2 -mb-px whitespace-nowrap touch-manipulation ${
            activeTab === 'batch'
              ? 'border-primary-500 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'
          }`}
        >
          <Table2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          批量处理
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-5">
        {/* 左侧：模板和变量 */}
        <div className="space-y-4 sm:space-y-5">
          {/* 模板编辑 */}
          <div className="card p-4 sm:p-6 space-y-2 sm:space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-sm sm:text-base text-surface-900 dark:text-surface-100 flex items-center gap-1.5 sm:gap-2">
                <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary-500" />
                模板
              </h3>
              <div className="flex gap-2">
                <button onClick={() => setTemplate('')} className="btn-ghost-danger btn-icon">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <CodeEditor
              value={template}
              onChange={setTemplate}
              language="text"
              height={320}
              placeholder="输入模板，使用变量如 {{name}}..."
              variant="embedded"
            />
            
            {/* 检测到的变量 */}
            {extractedVars.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span className="text-[10px] sm:text-xs text-surface-500">检测到变量:</span>
                {extractedVars.map(v => (
                  <span key={v} className="badge-primary text-[9px] sm:text-[10px] px-1.5 py-0.5">{v}</span>
                ))}
              </div>
            )}
          </div>

          {/* 变量定义 */}
          <div className="card p-4 sm:p-6 space-y-2 sm:space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-sm sm:text-base text-surface-900 dark:text-surface-100 flex items-center gap-1.5 sm:gap-2">
                <Variable className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500" />
                变量定义
              </h3>
              <button onClick={addVariable} className="btn-secondary btn-tool">
                <Plus className="w-3.5 h-3.5 flex-shrink-0" />
                添加
              </button>
            </div>
            
            <div className="space-y-2 max-h-48 sm:max-h-64 overflow-y-auto">
              {variables.map((variable, index) => (
                <div key={index} className="flex items-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 bg-surface-50 dark:bg-surface-900/50 rounded-lg">
                  <GripVertical className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-surface-300 flex-shrink-0" />
                  <input
                    type="text"
                    id={`template-var-name-${index}`}
                    name={`template-var-name-${index}`}
                    value={variable.name}
                    onChange={(e) => updateVariable(index, 'name', e.target.value)}
                    placeholder="变量名"
                    className="flex-1 input py-1 sm:py-1.5 text-xs sm:text-sm min-w-0"
                  />
                  <input
                    type="text"
                    id={`template-var-default-${index}`}
                    name={`template-var-default-${index}`}
                    value={variable.defaultValue}
                    onChange={(e) => updateVariable(index, 'defaultValue', e.target.value)}
                    placeholder="默认值"
                    className="flex-1 input py-1 sm:py-1.5 text-xs sm:text-sm min-w-0"
                  />
                  <button
                    onClick={() => removeVariable(index)}
                    className="btn-ghost-danger btn-icon p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {variables.length === 0 && (
                <p className="text-xs sm:text-sm text-surface-400 text-center py-4">暂无变量，点击添加或同步模板中的变量</p>
              )}
            </div>
          </div>
        </div>

        {/* 右侧：数据表格和结果 */}
        <div className="space-y-4 sm:space-y-5">
          {activeTab === 'batch' && (
            <div className="card p-4 sm:p-6 space-y-2 sm:space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-sm sm:text-base text-surface-900 dark:text-surface-100 flex items-center gap-1.5 sm:gap-2">
                  <Table2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500" />
                  数据表格
                </h3>
                <div className="flex gap-2">
                  <button onClick={addDataRow} className="btn-secondary btn-tool">
                    <Plus className="w-3.5 h-3.5 flex-shrink-0" />
                    添加行
                  </button>
                </div>
              </div>

              {/* 数据表格 */}
              <div className="overflow-x-auto max-h-48 sm:max-h-64 -mx-3 sm:mx-0">
                <table className="w-full text-xs sm:text-sm">
                  <thead className="bg-surface-50 dark:bg-surface-900/50">
                    <tr>
                      <th className="px-2 py-2 text-left text-[10px] sm:text-xs font-medium text-surface-500 w-8 sm:w-10">#</th>
                      {variables.map(v => (
                        <th key={v.name} className="px-2 py-2 text-left text-[10px] sm:text-xs font-medium text-surface-500">
                          {v.name}
                        </th>
                      ))}
                      <th className="px-2 py-2 w-8 sm:w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
                    {dataRows.map((row, idx) => (
                      <tr key={row.id} className="hover:bg-surface-50 dark:hover:bg-surface-900/30">
                        <td className="px-2 py-2 text-[10px] sm:text-xs text-surface-400">{idx + 1}</td>
                        {variables.map(v => (
                          <td key={v.name} className="px-2 py-1">
                            <input
                              type="text"
                              id={`template-data-${row.id}-${v.name}`}
                              name={`template-data-${row.id}-${v.name}`}
                              value={row.values[v.name] || ''}
                              onChange={(e) => updateDataRow(row.id, v.name, e.target.value)}
                              className="w-full bg-transparent border-none p-1 text-xs sm:text-sm focus:ring-1 focus:ring-primary-500 rounded"
                            />
                          </td>
                        ))}
                        <td className="px-2 py-1">
                          <button
                            onClick={() => removeDataRow(row.id)}
                            className="btn-ghost-danger btn-icon"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {dataRows.length === 0 && (
                  <p className="text-xs sm:text-sm text-surface-400 text-center py-4">暂无数据，点击添加行或使用 CSV 导入</p>
                )}
              </div>
            </div>
          )}

          {/* 结果预览 */}
          <div className="card p-4 sm:p-6 space-y-2 sm:space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-sm sm:text-base text-surface-900 dark:text-surface-100 flex items-center gap-1.5 sm:gap-2">
                <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500" />
                生成结果
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => copy(activeTab === 'single' ? defaultResult : batchResult)}
                  className={`btn-tool ${copied ? 'btn-ghost-success' : 'btn-secondary'}`}
                >
                  {copied ? <Check className="w-3.5 h-3.5 flex-shrink-0" /> : <Copy className="w-3.5 h-3.5 flex-shrink-0" />}
                  {copied ? '已复制' : '复制'}
                </button>
                <button onClick={exportResult} className="btn-secondary btn-tool">
                  <Download className="w-3.5 h-3.5 flex-shrink-0" />
                  导出
                </button>
                <button onClick={clearAll} className="btn-ghost-danger btn-tool">
                  <Trash2 className="w-3.5 h-3.5 flex-shrink-0" />
                </button>
              </div>
            </div>
            
            <CodeEditor
              value={activeTab === 'single' ? defaultResult : batchResult}
              onChange={() => {}}
              language="text"
              height={256}
              readOnly
              variant="embedded"
            />

            {/* 统计 */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-surface-500">
              <span>字符数: {(activeTab === 'single' ? defaultResult : batchResult).length}</span>
              <span>行数: {(activeTab === 'single' ? defaultResult : batchResult).split('\n').length}</span>
              {activeTab === 'batch' && <span>数据行: {dataRows.length}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* 功能说明 */}
      <ToolInfoAuto toolId="text-template" />

      <AdFooter />
    </div>
  );
}
