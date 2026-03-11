import { useState, useRef, useEffect } from 'react';
import { Download, QrCode, Image as ImageIcon, RefreshCw, AlertTriangle } from 'lucide-react';
import QRCodeLib from 'qrcode';
import { AdFooter } from '../ads';
import { ColorPicker } from '../common';

// 预设颜色
const presetColors = [
  '#000000', '#ffffff', '#ef4444', '#f97316', '#f59e0b', 
  '#84cc16', '#22c55e', '#14b8a6', '#06b6d4', '#0ea5e9',
  '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
  '#ec4899', '#f43f5e', '#78716c', '#52525b', '#171717'
];

// 计算颜色亮度
function getLuminance(hex: string): number {
  const rgb = parseInt(hex.slice(1), 16);
  const r = (rgb >> 16) & 0xff;
  const g = (rgb >> 8) & 0xff;
  const b = rgb & 0xff;
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

// 计算对比度
function getContrastRatio(color1: string, color2: string): number {
  const l1 = getLuminance(color1);
  const l2 = getLuminance(color2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

export function QrCodeTool() {
  const [text, setText] = useState('');
  const [size, setSize] = useState(256);
  const [fgColor, setFgColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [errorCorrection, setErrorCorrection] = useState<'L' | 'M' | 'Q' | 'H'>('M');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!text.trim() || !canvasRef.current) return;

    QRCodeLib.toCanvas(canvasRef.current, text, {
      width: size,
      margin: 2,
      color: {
        dark: fgColor,
        light: bgColor,
      },
      errorCorrectionLevel: errorCorrection,
    }, (err) => {
      if (err) console.error(err);
    });
  }, [text, size, fgColor, bgColor, errorCorrection]);

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = `qrcode-${Date.now()}.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  // 反转颜色
  const swapColors = () => {
    setFgColor(bgColor);
    setBgColor(fgColor);
  };

  // 随机颜色
  const randomizeColors = () => {
    const randomColor = () => {
      const letters = '0123456789ABCDEF';
      let color = '#';
      for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
      }
      return color;
    };
    setFgColor(randomColor());
    setBgColor(randomColor());
  };

  // 重置为默认
  const resetColors = () => {
    setFgColor('#000000');
    setBgColor('#ffffff');
  };

  // 计算对比度
  const contrastRatio = getContrastRatio(fgColor, bgColor);
  const isContrastWarning = contrastRatio < 2;
  const isPoorContrast = contrastRatio < 1.5;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <QrCode className="w-7 h-7 text-blue-500" />
          二维码生成器
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          生成自定义颜色和大小的二维码图片
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* 设置区域 */}
        <div className="card space-y-5">
          {/* 内容输入 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              内容
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="输入文本、URL 或任何内容..."
              className="w-full h-28 p-3 text-sm bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 dark:text-white"
            />
          </div>

          {/* 尺寸和纠错级别 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                尺寸
              </label>
              <select
                value={size}
                onChange={(e) => setSize(Number(e.target.value))}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-sm dark:text-white"
              >
                <option value={128}>128 x 128</option>
                <option value={256}>256 x 256</option>
                <option value={512}>512 x 512</option>
                <option value={1024}>1024 x 1024</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                纠错级别
              </label>
              <select
                value={errorCorrection}
                onChange={(e) => setErrorCorrection(e.target.value as typeof errorCorrection)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-sm dark:text-white"
              >
                <option value="L">L - 低 (7%)</option>
                <option value="M">M - 中 (15%)</option>
                <option value="Q">Q - 高 (25%)</option>
                <option value="H">H - 最高 (30%)</option>
              </select>
            </div>
          </div>

          {/* 颜色选择器 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">颜色设置</span>
              <div className="flex gap-2">
                <button
                  onClick={swapColors}
                  className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 rounded hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
                  title="反转颜色"
                >
                  <RefreshCw className="w-3 h-3" />
                  反转
                </button>
                <button
                  onClick={randomizeColors}
                  className="px-2 py-1 text-xs bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 rounded hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
                  title="随机颜色"
                >
                  🎲 随机
                </button>
                <button
                  onClick={resetColors}
                  className="px-2 py-1 text-xs bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 rounded hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
                  title="重置默认"
                >
                  重置
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ColorPicker
                label="前景色（二维码颜色）"
                color={fgColor}
                onChange={setFgColor}
                presetColors={presetColors}
              />
              <ColorPicker
                label="背景色"
                color={bgColor}
                onChange={setBgColor}
                presetColors={presetColors}
              />
            </div>

            {/* 对比度提示 */}
            <div className={`flex items-center gap-2 p-2 rounded-lg text-xs ${
              isPoorContrast 
                ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' 
                : isContrastWarning 
                  ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400'
                  : 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
            }`}>
              <AlertTriangle className={`w-4 h-4 ${!isPoorContrast && !isContrastWarning ? 'hidden' : ''}`} />
              <span>
                对比度: {contrastRatio.toFixed(2)} 
                {isPoorContrast && ' (对比度太低，可能无法扫描)'}
                {isContrastWarning && !isPoorContrast && ' (对比度偏低，建议提高)'}
                {!isContrastWarning && !isPoorContrast && ' ✓ 对比度良好'}
              </span>
            </div>
          </div>
        </div>

        {/* 预览区域 */}
        <div className="card flex flex-col items-center justify-center min-h-[400px]">
          {text.trim() ? (
            <>
              <canvas
                ref={canvasRef}
                className="max-w-full h-auto border border-gray-200 dark:border-slate-700 rounded-lg shadow-sm"
              />
              <div className="mt-4 flex gap-2">
                <button
                  onClick={handleDownload}
                  className="btn-primary"
                >
                  <Download className="w-4 h-4" />
                  下载 PNG
                </button>
              </div>
              <p className="mt-3 text-xs text-gray-400">
                {size} x {size} 像素
              </p>
            </>
          ) : (
            <div className="text-center text-gray-400">
              <ImageIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>输入内容生成二维码</p>
              <p className="text-xs mt-2">支持 URL、文本、联系方式等</p>
            </div>
          )}
        </div>
      </div>

      {/* 底部广告 */}
      <AdFooter />
    </div>
  );
}
