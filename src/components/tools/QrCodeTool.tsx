import { useState, useRef, useEffect, useCallback } from 'react';
import { Download, QrCode, Image as ImageIcon, RefreshCw, AlertTriangle, Upload, X } from 'lucide-react';
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
  const [logoImage, setLogoImage] = useState<HTMLImageElement | null>(null);
  const [logoSizePercent, setLogoSizePercent] = useState(20);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 绘制二维码（包含Logo）
  const drawQRCode = useCallback(() => {
    if (!text.trim() || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 先生成基础二维码到临时 canvas
    const tempCanvas = document.createElement('canvas');
    
    QRCodeLib.toCanvas(tempCanvas, text, {
      width: size,
      margin: 2,
      color: {
        dark: fgColor,
        light: bgColor,
      },
      errorCorrectionLevel: errorCorrection,
    }, (err) => {
      if (err) {
        console.error(err);
        return;
      }

      // 设置目标 canvas 尺寸
      canvas.width = size;
      canvas.height = size;

      // 绘制基础二维码
      ctx.drawImage(tempCanvas, 0, 0);

      // 如果有 Logo，绘制在中心
      if (logoImage) {
        const logoSize = Math.floor(size * (logoSizePercent / 100));
        const x = (size - logoSize) / 2;
        const y = (size - logoSize) / 2;

        // 绘制白色背景（确保 Logo 区域清晰）
        ctx.fillStyle = bgColor;
        ctx.fillRect(x - 4, y - 4, logoSize + 8, logoSize + 8);

        // 绘制 Logo
        ctx.drawImage(logoImage, x, y, logoSize, logoSize);
      }
    });
  }, [text, size, fgColor, bgColor, errorCorrection, logoImage, logoSizePercent]);

  useEffect(() => {
    drawQRCode();
  }, [drawQRCode]);

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = `qrcode-${Date.now()}.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  // 处理 Logo 上传
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      alert('请上传图片文件');
      return;
    }

    // 验证文件大小（最大 2MB）
    if (file.size > 2 * 1024 * 1024) {
      alert('图片大小不能超过 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        setLogoImage(img);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // 删除 Logo
  const removeLogo = () => {
    setLogoImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <QrCode className="w-6 h-6 sm:w-7 sm:h-7 text-blue-500" />
          二维码生成
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          生成自定义颜色和大小的二维码图片
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
        {/* 设置区域 */}
        <div className="card p-4 sm:p-6 space-y-4 sm:space-y-5">
          {/* 内容输入 */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              内容
            </label>
            <textarea
              id="qrcode-content"
              name="qrcode-content"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="输入文本、URL 或任何内容..."
              className="w-full h-24 sm:h-28 p-2 sm:p-3 text-xs sm:text-sm bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 dark:text-white"
            />
          </div>

          {/* 尺寸和纠错级别 */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                尺寸
              </label>
              <select
                value={size}
                onChange={(e) => setSize(Number(e.target.value))}
                className="w-full px-2 sm:px-3 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-xs sm:text-sm dark:text-white"
              >
                <option value={128}>128 x 128</option>
                <option value={256}>256 x 256</option>
                <option value={512}>512 x 512</option>
                <option value={1024}>1024 x 1024</option>
              </select>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                纠错级别
              </label>
              <select
                value={errorCorrection}
                onChange={(e) => setErrorCorrection(e.target.value as typeof errorCorrection)}
                className="w-full px-2 sm:px-3 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-xs sm:text-sm dark:text-white"
              >
                <option value="L">L - 低 (7%)</option>
                <option value="M">M - 中 (15%)</option>
                <option value="Q">Q - 高 (25%)</option>
                <option value="H">H - 最高 (30%)</option>
              </select>
            </div>
          </div>

          {/* Logo 设置 */}
          <div className="border border-gray-200 dark:border-slate-700 rounded-lg p-3 sm:p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Logo</span>
              {logoImage && (
                <button
                  onClick={removeLogo}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                  title="删除 Logo"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {logoImage ? (
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden flex-shrink-0">
                  <img
                    src={logoImage.src}
                    alt="Logo预览"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">已上传 Logo</p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs text-blue-500 hover:text-blue-600"
                  >
                    重新上传
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg p-4 text-center cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
              >
                <Upload className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                <p className="text-xs text-gray-500 dark:text-gray-400">点击上传 Logo</p>
                <p className="text-xs text-gray-400 mt-1">支持 JPG、PNG、GIF，最大 2MB</p>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="hidden"
            />

            {/* Logo 大小调节 */}
            {logoImage && (
              <div className="pt-2 border-t border-gray-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs text-gray-600 dark:text-gray-400">尺寸</label>
                  <span className="text-xs text-gray-500">{logoSizePercent}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="20"
                  value={logoSizePercent}
                  onChange={(e) => setLogoSizePercent(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>小</span>
                  <span>大</span>
                </div>
                
                {/* Logo 尺寸提示 */}
                {logoSizePercent >= 18 && errorCorrection !== 'H' && (
                  <div className="mt-2 flex items-start gap-1.5 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
                    <span>
                      建议将纠错级别设为「H - 最高」以获得最佳扫描效果
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 颜色选择器 */}
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">颜色设置</span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={swapColors}
                  className="btn-secondary btn-tool"
                  title="反转颜色"
                >
                  <RefreshCw className="w-3.5 h-3.5 flex-shrink-0" />
                  反转
                </button>
                <button
                  onClick={randomizeColors}
                  className="btn-secondary btn-tool"
                  title="随机颜色"
                >
                  🎲 随机
                </button>
                <button
                  onClick={resetColors}
                  className="btn-secondary btn-tool"
                  title="重置默认"
                >
                  重置
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
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
        <div className="card p-4 sm:p-6 flex flex-col items-center justify-center min-h-[300px] sm:min-h-[400px]">
          {text.trim() ? (
            <>
              <div className="max-w-full overflow-auto flex justify-center">
                <canvas
                  ref={canvasRef}
                  className="border border-gray-200 dark:border-slate-700 rounded-lg shadow-sm"
                  style={{ maxWidth: '100%', maxHeight: '50vh', objectFit: 'contain' }}
                />
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={handleDownload}
                  className="btn-primary btn-action"
                >
                  <Download className="w-4 h-4 flex-shrink-0" />
                  下载 PNG
                </button>
              </div>
              <p className="mt-3 text-xs text-gray-400">
                {size} x {size} 像素
                {logoImage && ' (含 Logo)'}
              </p>
            </>
          ) : (
            <div className="text-center text-gray-400">
              <ImageIcon className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 opacity-50" />
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
