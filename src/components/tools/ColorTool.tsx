import { useState } from 'react';
import { Copy, Check, Palette } from 'lucide-react';
import { useClipboard } from '../../hooks/useLocalStorage';
import { AdFooter } from '../ads';
import { ToolInfoAuto } from './ToolInfoSection';
import { ColorPicker, ColorSwatch } from '../common';

// 预设颜色
const presetColors = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e',
  '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
  '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e',
  '#78716c', '#52525b', '#171717', '#ffffff', '#000000'
];

export function ColorTool() {
  const [hex, setHex] = useState('#3B82F6');
  const [rgb, setRgb] = useState({ r: 59, g: 130, b: 246 });
  const [hsl, setHsl] = useState({ h: 217, s: 91, l: 60 });
  const { copied, copy } = useClipboard();

  const hexToRgb = (h: string): { r: number; g: number; b: number } | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(h);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16),
    } : null;
  };

  const rgbToHex = (r: number, g: number, b: number): string => {
    return '#' + [r, g, b].map(x => {
      const hex = Math.max(0, Math.min(255, x)).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  };

  const rgbToHsl = (r: number, g: number, b: number): { h: number; s: number; l: number } => {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }

    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
  };

  const hslToRgb = (h: number, s: number, l: number): { r: number; g: number; b: number } => {
    h /= 360;
    s /= 100;
    l /= 100;
    let r, g, b;

    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }

    return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
  };

  const handleHexChange = (value: string) => {
    setHex(value);
    const rgbVal = hexToRgb(value);
    if (rgbVal) {
      setRgb(rgbVal);
      setHsl(rgbToHsl(rgbVal.r, rgbVal.g, rgbVal.b));
    }
  };

  const handleRgbChange = (key: keyof typeof rgb, value: number) => {
    const newRgb = { ...rgb, [key]: Math.max(0, Math.min(255, value)) };
    setRgb(newRgb);
    setHex(rgbToHex(newRgb.r, newRgb.g, newRgb.b));
    setHsl(rgbToHsl(newRgb.r, newRgb.g, newRgb.b));
  };

  const handleHslChange = (key: keyof typeof hsl, value: number) => {
    const newHsl = { ...hsl, [key]: value };
    if (key === 'h') newHsl.h = Math.max(0, Math.min(360, value));
    else newHsl[key] = Math.max(0, Math.min(100, value));
    setHsl(newHsl);
    const newRgb = hslToRgb(newHsl.h, newHsl.s, newHsl.l);
    setRgb(newRgb);
    setHex(rgbToHex(newRgb.r, newRgb.g, newRgb.b));
  };

  const colorValue = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Palette className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />
          颜色转换
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 text-xs sm:text-sm">
          HEX、RGB、HSL 颜色格式互转
        </p>
      </div>

      {/* 颜色预览 */}
      <div className="card p-4 sm:p-6 mb-4">
        <div
          className="w-full h-24 sm:h-32 rounded-lg border border-gray-200 dark:border-slate-700"
          style={{ backgroundColor: colorValue }}
        />
        <div className="mt-3 sm:mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => copy(hex)}
            className={`btn-tool ${copied ? 'btn-ghost-success' : 'btn-secondary'}`}
          >
            {copied ? <Check className="w-3.5 h-3.5 flex-shrink-0" /> : <Copy className="w-3.5 h-3.5 flex-shrink-0" />}
            {hex}
          </button>
          <button
            onClick={() => copy(`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`)}
            className="btn-secondary btn-tool"
          >
            <Copy className="w-3.5 h-3.5 flex-shrink-0" />
            rgb({rgb.r}, {rgb.g}, {rgb.b})
          </button>
          <button
            onClick={() => copy(`hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`)}
            className="btn-secondary btn-tool"
          >
            <Copy className="w-3.5 h-3.5 flex-shrink-0" />
            hsl({hsl.h}, {hsl.s}%, {hsl.l}%)
          </button>
        </div>
      </div>

      {/* 预设颜色 */}
      <div className="card p-4 sm:p-6 mb-4">
        <div className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 sm:mb-3">
          预设颜色
        </div>
        <ColorSwatch 
          colors={presetColors}
          selectedColor={hex}
          onSelect={handleHexChange}
        />
      </div>

      {/* 输入区域 */}
      <div className="grid md:grid-cols-3 gap-3 sm:gap-4">
        {/* HEX */}
        <div className="card p-4 sm:p-6 space-y-3">
          <ColorPicker 
            id="color-tool-hex"
            label="HEX"
            color={hex}
            onChange={handleHexChange}
            showCopy
          />
        </div>

        {/* RGB */}
        <div className="card p-4 sm:p-6 space-y-3">
          <div className="font-medium text-sm sm:text-base text-gray-700 dark:text-gray-300">RGB</div>
          <div className="space-y-2">
            {(['r', 'g', 'b'] as const).map((key) => (
              <div key={key} className="flex items-center gap-2">
                <span className="w-4 text-xs sm:text-sm text-gray-500 uppercase">{key}</span>
                <input
                  type="number"
                  id={`color-rgb-${key}`}
                  name={`color-rgb-${key}`}
                  min={0}
                  max={255}
                  value={rgb[key]}
                  onChange={(e) => handleRgbChange(key, parseInt(e.target.value) || 0)}
                  className="flex-1 px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg dark:text-white"
                />
              </div>
            ))}
          </div>
        </div>

        {/* HSL */}
        <div className="card p-4 sm:p-6 space-y-3">
          <div className="font-medium text-sm sm:text-base text-gray-700 dark:text-gray-300">HSL</div>
          <div className="space-y-2">
            {(['h', 's', 'l'] as const).map((key) => (
              <div key={key} className="flex items-center gap-2">
                <span className="w-4 text-xs sm:text-sm text-gray-500 uppercase">{key}</span>
                <input
                  type="number"
                  id={`color-hsl-${key}`}
                  name={`color-hsl-${key}`}
                  min={0}
                  max={key === 'h' ? 360 : 100}
                  value={hsl[key]}
                  onChange={(e) => handleHslChange(key, parseInt(e.target.value) || 0)}
                  className="flex-1 px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg dark:text-white"
                />
                <span className="text-xs sm:text-sm text-gray-400">{key === 'h' ? '°' : '%'}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <ToolInfoAuto toolId="color" />

      {/* 底部广告 */}
      <AdFooter />
    </div>
  );
}
