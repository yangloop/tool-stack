import { useState, useCallback } from 'react';
import { Copy, Check, Binary, RefreshCw } from 'lucide-react';
import { useClipboard } from '../../../hooks/useLocalStorage';
import { AdFooter } from '../../../components/ads';
import { ToolInfoAuto } from './ToolInfoSection';

type BaseType = 'bin' | 'oct' | 'dec' | 'hex';

interface BaseConfig {
  id: BaseType;
  name: string;
  prefix: string;
  base: number;
  placeholder: string;
  example: string;
}

const baseConfigs: BaseConfig[] = [
  { id: 'bin', name: '二进制', prefix: '0b', base: 2, placeholder: '101010', example: '101010' },
  { id: 'oct', name: '八进制', prefix: '0o', base: 8, placeholder: '52', example: '52' },
  { id: 'dec', name: '十进制', prefix: '', base: 10, placeholder: '42', example: '42' },
  { id: 'hex', name: '十六进制', prefix: '0x', base: 16, placeholder: '2A', example: '2A' },
];

export function NumberBaseTool() {
  const [values, setValues] = useState<Record<BaseType, string>>({
    bin: '',
    oct: '',
    dec: '',
    hex: '',
  });
  const [lastEdited, setLastEdited] = useState<BaseType>('dec');
  const { copied, copy } = useClipboard();

  const convertFromDecimal = useCallback((decimal: number): Record<BaseType, string> => {
    if (isNaN(decimal) || !isFinite(decimal)) {
      return { bin: '', oct: '', dec: '', hex: '' };
    }
    
    // Handle negative numbers
    const isNegative = decimal < 0;
    const absDecimal = Math.abs(decimal);
    
    const bin = (isNegative ? '-' : '') + absDecimal.toString(2);
    const oct = (isNegative ? '-' : '') + absDecimal.toString(8);
    const dec = decimal.toString(10);
    const hex = (isNegative ? '-' : '') + absDecimal.toString(16).toUpperCase();
    
    return { bin, oct, dec, hex };
  }, []);

  const parseToDecimal = useCallback((value: string, base: number): number | null => {
    const trimmed = value.trim();
    if (!trimmed) return null;
    
    // Handle negative numbers
    const isNegative = trimmed.startsWith('-');
    const absValue = isNegative ? trimmed.slice(1) : trimmed;
    
    // Remove prefix if present
    let cleanValue = absValue;
    if (base === 2 && cleanValue.toLowerCase().startsWith('0b')) {
      cleanValue = cleanValue.slice(2);
    } else if (base === 8 && cleanValue.toLowerCase().startsWith('0o')) {
      cleanValue = cleanValue.slice(2);
    } else if (base === 16 && cleanValue.toLowerCase().startsWith('0x')) {
      cleanValue = cleanValue.slice(2);
    }
    
    if (!cleanValue) return null;
    
    // Validate characters
    const validChars = '0123456789ABCDEF';
    for (const char of cleanValue.toUpperCase()) {
      if (!validChars.includes(char) || validChars.indexOf(char) >= base) {
        return null;
      }
    }
    
    const decimal = parseInt(cleanValue, base);
    return isNegative ? -decimal : decimal;
  }, []);

  const handleValueChange = useCallback((baseType: BaseType, value: string) => {
    setLastEdited(baseType);
    
    if (!value.trim()) {
      setValues({ bin: '', oct: '', dec: '', hex: '' });
      return;
    }

    const config = baseConfigs.find(b => b.id === baseType)!;
    const decimal = parseToDecimal(value, config.base);
    
    if (decimal !== null) {
      const newValues = convertFromDecimal(decimal);
      setValues(newValues);
    } else {
      // Invalid input - only update the current field
      setValues(prev => ({ ...prev, [baseType]: value }));
    }
  }, [parseToDecimal, convertFromDecimal]);

  const handleClear = useCallback(() => {
    setValues({ bin: '', oct: '', dec: '', hex: '' });
  }, []);

  const getDisplayValue = (baseType: BaseType, value: string): string => {
    if (!value) return '';
    const config = baseConfigs.find(b => b.id === baseType)!;
    // Don't add prefix if user is typing in this field
    if (lastEdited === baseType) return value;
    // Add prefix for display in other fields
    if (config.prefix && !value.startsWith('-')) {
      return config.prefix + value;
    }
    if (config.prefix && value.startsWith('-')) {
      return '-' + config.prefix + value.slice(1);
    }
    return value;
  };

  const copyWithPrefix = (baseType: BaseType, value: string) => {
    const config = baseConfigs.find(b => b.id === baseType)!;
    if (!value) return;
    
    let copyValue = value;
    if (config.prefix && !value.startsWith('-')) {
      copyValue = config.prefix + value;
    } else if (config.prefix && value.startsWith('-')) {
      copyValue = '-' + config.prefix + value.slice(1);
    }
    copy(copyValue);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-surface-900 dark:text-surface-100 flex items-center gap-2">
          <Binary className="w-5 h-5 sm:w-6 sm:h-6 text-primary-500" />
          进制转换
        </h1>
        <p className="text-surface-500 dark:text-surface-400 mt-1 text-xs sm:text-sm">
          二进制、八进制、十进制、十六进制互转，支持前缀显示
        </p>
      </div>

      {/* 输入区域 */}
      <div className="card p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm sm:text-base font-medium text-surface-900 dark:text-surface-100">
            数值转换
          </h2>
          <button
            onClick={handleClear}
            className="btn-secondary btn-sm flex items-center gap-1.5 text-xs"
            title="清空所有"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            清空
          </button>
        </div>

        <div className="grid gap-4">
          {baseConfigs.map((config) => (
            <div
              key={config.id}
              className={`relative rounded-lg border transition-colors ${
                lastEdited === config.id
                  ? 'border-primary-500 bg-primary-50/30 dark:bg-primary-900/10'
                  : 'border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900'
              }`}
            >
              <div className="flex items-center gap-3 p-3">
                <label
                  htmlFor={`base-${config.id}`}
                  className="w-16 sm:w-20 text-sm font-medium text-surface-700 dark:text-surface-300 shrink-0"
                >
                  {config.name}
                </label>
                <div className="flex-1 relative">
                  <input
                    type="text"
                    id={`base-${config.id}`}
                    name={`base-${config.id}`}
                    value={getDisplayValue(config.id, values[config.id])}
                    onChange={(e) => handleValueChange(config.id, e.target.value)}
                    placeholder={config.placeholder}
                    className="w-full px-3 py-2 text-sm sm:text-base bg-transparent border-0 focus:ring-0 dark:text-white font-mono"
                    spellCheck={false}
                    autoComplete="off"
                  />
                </div>
                <button
                  onClick={() => copyWithPrefix(config.id, values[config.id])}
                  disabled={!values[config.id]}
                  className="btn-secondary btn-sm p-2 disabled:opacity-40"
                  title={`复制 ${config.name} 值`}
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
              {config.prefix && (
                <div className="absolute right-14 bottom-1 text-[10px] text-surface-400 dark:text-surface-600 pointer-events-none">
                  前缀: {config.prefix}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 提示信息 */}
        <div className="text-xs text-surface-500 dark:text-surface-400 bg-surface-50 dark:bg-surface-800/50 rounded-lg p-3">
          <p className="font-medium mb-1">💡 使用提示：</p>
          <ul className="space-y-1 ml-4 list-disc">
            <li>支持输入带前缀格式（如 0b1010、0xFF、0o77）</li>
            <li>支持负数的进制转换</li>
            <li>十六进制字母不区分大小写</li>
            <li>当前编辑的输入框会高亮显示</li>
          </ul>
        </div>
      </div>

      {/* 常用数值参考表 */}
      <div className="card p-4 sm:p-6 mt-4">
        <h2 className="text-sm sm:text-base font-medium text-surface-900 dark:text-surface-100 mb-4">
          常用数值对照表
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-200 dark:border-surface-700">
                <th className="text-left py-2 px-3 font-medium text-surface-700 dark:text-surface-300">十进制</th>
                <th className="text-left py-2 px-3 font-medium text-surface-700 dark:text-surface-300">二进制</th>
                <th className="text-left py-2 px-3 font-medium text-surface-700 dark:text-surface-300">八进制</th>
                <th className="text-left py-2 px-3 font-medium text-surface-700 dark:text-surface-300">十六进制</th>
              </tr>
            </thead>
            <tbody className="text-surface-600 dark:text-surface-400 font-mono">
              {[0, 1, 2, 8, 10, 16, 32, 64, 100, 128, 255, 256, 512, 1024, 2048, 4096].map((num) => (
                <tr
                  key={num}
                  className="border-b border-surface-100 dark:border-surface-800 hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors"
                >
                  <td className="py-2 px-3">{num}</td>
                  <td className="py-2 px-3">0b{num.toString(2)}</td>
                  <td className="py-2 px-3">0o{num.toString(8)}</td>
                  <td className="py-2 px-3">0x{num.toString(16).toUpperCase()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ToolInfoAuto toolId="number-base" />

      {/* 底部广告 */}
      <AdFooter />
    </div>
  );
}
