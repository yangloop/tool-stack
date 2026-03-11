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
import { useClipboard } from '../../hooks/useLocalStorage';
import { AdFooter } from '../ads';

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
      '\\s*#if\\s+(\\w+)\\s*' + 
      close.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + 
      '([\\s\\S]*?)' +
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
        <div className="tool-icon w-10 h-10 sm:w-12 sm:h-12">
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
      <div className="card mb-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 sm:gap-4">
          {/* 分隔符选择 */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-surface-600 dark:text-surface-400">分隔符:</span>
            <select
              value={useCustomDelimiter ? 'custom' : delimiterIndex}
              onChange={(e) => {
                if (e.target.value === 'custom') {
                  setUseCustomDelimiter(true);
                } else {
                  setUseCustomDelimiter(false);
                  setDelimiterIndex(Number(e.target.value));
                }
              }}
              className="select text-sm py-1.5"
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
              <span className="text-sm text-surface-500">格式:</span>
              <input
                type="text"
                value={customDelimiter}
                onChange={(e) => setCustomDelimiter(e.target.value)}
                placeholder="例如: {{}}"
                className="input text-sm py-1.5 w-24"
              />
            </div>
          )}

          <div className="flex-1" />

          {/* 操作按钮 */}
          <div className="flex gap-2 sm:gap-3">
            <button
              onClick={syncVariables}
              className="btn-secondary text-xs sm:text-sm flex-1 sm:flex-none"
              disabled={extractedVars.length === 0}
            >
              <Variable className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">同步变量</span>
              <span className="sm:hidden">同步</span>
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="btn-ghost text-xs sm:text-sm flex-1 sm:flex-none"
            >
              <Settings className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">设置</span>
              <span className="sm:hidden">设置</span>
            </button>
          </div>
        </div>

        {/* 展开设置 */}
        {showSettings && (
          <div className="pt-4 border-t border-surface-200 dark:border-surface-700 space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5 block">
                  批量分隔符（用于分隔多条结果）
                </label>
                <input
                  type="text"
                  value={separator}
                  onChange={(e) => setSeparator(e.target.value)}
                  className="w-full input"
                  placeholder="\n---\n"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5 block">
                  从 CSV 导入数据
                </label>
                <textarea
                  placeholder="name,age,city&#10;张三,25,北京&#10;李四,30,上海"
                  onChange={(e) => importFromCsv(e.target.value)}
                  className="w-full h-20 input text-xs"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tab 切换 */}
      <div className="flex gap-1 border-b border-surface-200 dark:border-surface-700 mb-5 overflow-x-auto">
        <button
          onClick={() => setActiveTab('single')}
          className={`px-3 sm:px-4 py-2.5 sm:py-3 text-sm font-medium border-b-2 transition-all flex items-center gap-1.5 sm:gap-2 -mb-px whitespace-nowrap ${
            activeTab === 'single'
              ? 'border-primary-500 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'
          }`}
        >
          <Type className="w-4 h-4" />
          单条预览
        </button>
        <button
          onClick={() => setActiveTab('batch')}
          className={`px-3 sm:px-4 py-2.5 sm:py-3 text-sm font-medium border-b-2 transition-all flex items-center gap-1.5 sm:gap-2 -mb-px whitespace-nowrap ${
            activeTab === 'batch'
              ? 'border-primary-500 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'
          }`}
        >
          <Table2 className="w-4 h-4" />
          批量处理
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        {/* 左侧：模板和变量 */}
        <div className="space-y-5">
          {/* 模板编辑 */}
          <div className="card space-y-2 sm:space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-sm sm:text-base text-surface-900 dark:text-surface-100 flex items-center gap-1.5 sm:gap-2">
                <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary-500" />
                模板
              </h3>
              <div className="flex gap-2">
                <button onClick={() => setTemplate('')} className="btn-ghost text-xs">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
            <textarea
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              placeholder="输入模板，使用变量如 {{name}}..."
              className="w-full h-40 sm:h-48 p-3 sm:p-4 font-mono text-sm bg-surface-50 dark:bg-surface-900/50 border border-surface-200 dark:border-surface-700 rounded-xl resize-none focus:ring-2 focus:ring-primary-500/50"
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
          <div className="card space-y-2 sm:space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-sm sm:text-base text-surface-900 dark:text-surface-100 flex items-center gap-1.5 sm:gap-2">
                <Variable className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500" />
                变量定义
              </h3>
              <button onClick={addVariable} className="btn-secondary text-[10px] sm:text-xs px-2 sm:px-3">
                <Plus className="w-3 h-3" />
                添加
              </button>
            </div>
            
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {variables.map((variable, index) => (
                <div key={index} className="flex items-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 bg-surface-50 dark:bg-surface-900/50 rounded-lg">
                  <GripVertical className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-surface-300 flex-shrink-0" />
                  <input
                    type="text"
                    value={variable.name}
                    onChange={(e) => updateVariable(index, 'name', e.target.value)}
                    placeholder="变量名"
                    className="flex-1 input py-1 sm:py-1.5 text-xs sm:text-sm min-w-0"
                  />
                  <input
                    type="text"
                    value={variable.defaultValue}
                    onChange={(e) => updateVariable(index, 'defaultValue', e.target.value)}
                    placeholder="默认值"
                    className="flex-1 input py-1 sm:py-1.5 text-xs sm:text-sm min-w-0"
                  />
                  <button
                    onClick={() => removeVariable(index)}
                    className="text-surface-400 hover:text-red-500 p-1 flex-shrink-0"
                  >
                    <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                </div>
              ))}
              {variables.length === 0 && (
                <p className="text-sm text-surface-400 text-center py-4">暂无变量，点击添加或同步模板中的变量</p>
              )}
            </div>
          </div>
        </div>

        {/* 右侧：数据表格和结果 */}
        <div className="space-y-5">
          {activeTab === 'batch' && (
            <div className="card space-y-2 sm:space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-sm sm:text-base text-surface-900 dark:text-surface-100 flex items-center gap-1.5 sm:gap-2">
                  <Table2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500" />
                  数据表格
                </h3>
                <div className="flex gap-2">
                  <button onClick={addDataRow} className="btn-secondary text-[10px] sm:text-xs px-2 sm:px-3">
                    <Plus className="w-3 h-3" />
                    添加行
                  </button>
                </div>
              </div>

              {/* 数据表格 */}
              <div className="overflow-x-auto max-h-64 -mx-3 sm:mx-0">
                <table className="w-full text-sm">
                  <thead className="bg-surface-50 dark:bg-surface-900/50">
                    <tr>
                      <th className="px-2 py-2 text-left text-xs font-medium text-surface-500 w-10">#</th>
                      {variables.map(v => (
                        <th key={v.name} className="px-2 py-2 text-left text-xs font-medium text-surface-500">
                          {v.name}
                        </th>
                      ))}
                      <th className="px-2 py-2 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
                    {dataRows.map((row, idx) => (
                      <tr key={row.id} className="hover:bg-surface-50 dark:hover:bg-surface-900/30">
                        <td className="px-2 py-2 text-xs text-surface-400">{idx + 1}</td>
                        {variables.map(v => (
                          <td key={v.name} className="px-2 py-1">
                            <input
                              type="text"
                              value={row.values[v.name] || ''}
                              onChange={(e) => updateDataRow(row.id, v.name, e.target.value)}
                              className="w-full bg-transparent border-none p-1 text-sm focus:ring-1 focus:ring-primary-500 rounded"
                            />
                          </td>
                        ))}
                        <td className="px-2 py-1">
                          <button
                            onClick={() => removeDataRow(row.id)}
                            className="text-surface-400 hover:text-red-500"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {dataRows.length === 0 && (
                  <p className="text-sm text-surface-400 text-center py-4">暂无数据，点击添加行或使用 CSV 导入</p>
                )}
              </div>
            </div>
          )}

          {/* 结果预览 */}
          <div className="card space-y-2 sm:space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-sm sm:text-base text-surface-900 dark:text-surface-100 flex items-center gap-1.5 sm:gap-2">
                <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500" />
                生成结果
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => copy(activeTab === 'single' ? defaultResult : batchResult)}
                  className="btn-secondary text-xs"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? '已复制' : '复制'}
                </button>
                <button onClick={exportResult} className="btn-secondary text-xs">
                  <Download className="w-3.5 h-3.5" />
                  导出
                </button>
                <button onClick={clearAll} className="btn-ghost text-xs text-red-500">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            
            <textarea
              readOnly
              value={activeTab === 'single' ? defaultResult : batchResult}
              className="w-full h-48 sm:h-64 p-3 sm:p-4 font-mono text-xs sm:text-sm bg-surface-50 dark:bg-surface-900/50 border border-surface-200 dark:border-surface-700 rounded-xl resize-none"
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

      {/* 使用说明 */}
      <div className="card mt-4 sm:mt-5 space-y-3">
        <h3 className="font-medium text-surface-900 dark:text-surface-100 text-sm sm:text-base">使用说明</h3>
        <div className="grid sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm text-surface-600 dark:text-surface-400">
          <div className="space-y-1.5 sm:space-y-2">
            <p>1. 编写模板 - 使用变量占位符，如 name</p>
            <p>2. 定义变量 - 设置变量名和默认值</p>
            <p>3. 选择分隔符 - 支持双大括号、Dollar符号、百分号等多种格式</p>
          </div>
          <div className="space-y-1.5 sm:space-y-2">
            <p>4. 批量处理 - 在数据表格中填入多行数据</p>
            <p>5. 生成结果 - 一键复制或导出为文本文件</p>
            <p>6. CSV 导入 - 支持从 CSV 格式快速导入数据</p>
          </div>
        </div>
      </div>

      <AdFooter />
    </div>
  );
}
