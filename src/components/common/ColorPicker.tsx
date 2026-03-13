import { useState, useRef, useEffect } from 'react';
import { HexColorPicker, HexColorInput } from 'react-colorful';
import { Copy, Check } from 'lucide-react';
import { useClipboard } from '../../hooks/useLocalStorage';

interface ColorPickerProps {
  id?: string;
  label?: string;
  color: string;
  onChange: (color: string) => void;
  presetColors?: string[];
  showCopy?: boolean;
}

export function ColorPicker({ 
  id,
  label, 
  color, 
  onChange, 
  presetColors = [],
  showCopy = false
}: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const { copied, copy } = useClipboard();

  // 点击外部关闭弹窗
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="w-full">
      {label && (
        <div className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label}
        </div>
      )}
      
      <div className="flex items-center gap-2">
        {/* 颜色预览按钮 */}
        <div className="relative" ref={pickerRef}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-10 h-10 rounded-lg border-2 border-gray-200 dark:border-slate-600 shadow-sm flex items-center justify-center transition-transform hover:scale-105"
            style={{ backgroundColor: color }}
            title="点击选择颜色"
          />
          
          {/* 弹出式颜色选择器 */}
          {isOpen && (
            <div className="absolute z-50 top-full left-0 mt-2 p-3 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-200 dark:border-slate-700">
              <HexColorPicker 
                color={color} 
                onChange={onChange}
                style={{ width: '200px', height: '200px' }}
              />
              
              {/* 预设颜色 */}
              {presetColors.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-slate-700">
                  <div className="flex flex-wrap gap-1.5">
                    {presetColors.map((presetColor) => (
                      <button
                        key={presetColor}
                        onClick={() => onChange(presetColor)}
                        className={`w-5 h-5 rounded border-2 transition-all ${
                          color.toLowerCase() === presetColor.toLowerCase()
                            ? 'border-blue-500 scale-110'
                            : 'border-gray-200 dark:border-slate-600 hover:scale-105'
                        }`}
                        style={{ backgroundColor: presetColor }}
                        title={presetColor}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* HEX 输入框 */}
        <div className="flex-1 relative">
          <HexColorInput
            id={id ? `${id}-hex` : undefined}
            name={id ? `${id}-hex` : undefined}
            color={color}
            onChange={onChange}
            prefixed
            className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-sm font-mono dark:text-white uppercase focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
          {showCopy && (
            <button
              onClick={() => copy(color)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              title="复制颜色值"
            >
              {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// 独立预设颜色选择器（用于颜色转换工具）
interface ColorSwatchProps {
  colors: string[];
  selectedColor: string;
  onSelect: (color: string) => void;
}

export function ColorSwatch({ colors, selectedColor, onSelect }: ColorSwatchProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {colors.map((color) => (
        <button
          key={color}
          onClick={() => onSelect(color)}
          className={`w-6 h-6 rounded-md border-2 transition-all ${
            selectedColor.toLowerCase() === color.toLowerCase()
              ? 'border-blue-500 scale-110'
              : 'border-gray-200 dark:border-slate-600 hover:scale-105'
          }`}
          style={{ backgroundColor: color }}
          title={color}
        />
      ))}
    </div>
  );
}
