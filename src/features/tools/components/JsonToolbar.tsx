import { FileJson, Minimize2, Upload, Download, Trash2 } from 'lucide-react';

interface JsonToolbarProps {
  onFormat: () => void;
  onCompress: () => void;
  onEscape: () => void;
  onUnescape: () => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDownload: () => void;
  onClear: () => void;
  canDownload: boolean;
  variant?: 'default' | 'fullscreen';
}

export function JsonToolbar({
  onFormat,
  onCompress,
  onEscape,
  onUnescape,
  onFileUpload,
  onDownload,
  onClear,
  canDownload,
  variant = 'default',
}: JsonToolbarProps) {
  const isFullscreen = variant === 'fullscreen';

  // 按钮样式：移动端更紧凑
  const buttonClass = 'btn-tool-sm sm:btn-tool flex-shrink-0 whitespace-nowrap';
  const groupClass = isFullscreen
    ? 'inline-flex bg-surface-100 dark:bg-surface-800 p-0.5 rounded-lg'
    : 'inline-flex bg-surface-100 dark:bg-surface-800 p-0.5 rounded-lg sm:rounded-xl';
  const containerClass = isFullscreen
    ? 'flex items-center gap-1.5 sm:gap-2 px-4 border-b border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/50 overflow-x-auto flex-shrink-0 box-border'
    : 'flex flex-wrap items-center gap-1.5 sm:gap-2 mb-4';

  const containerStyle = isFullscreen ? { height: '57px' } : undefined;

  return (
    <div className={containerClass} style={containerStyle}>
      <div className={groupClass}>
        <button onClick={onFormat} className={`${buttonClass} btn-primary`}>
          <FileJson className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          <span>格式化</span>
        </button>
        <button onClick={onCompress} className={`${buttonClass} text-surface-700 dark:text-surface-300 hover:bg-white dark:hover:bg-surface-700`}>
          <Minimize2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          <span>压缩</span>
        </button>
      </div>
      <div className={groupClass}>
        <button onClick={onEscape} className={`${buttonClass} text-surface-700 dark:text-surface-300 hover:bg-white dark:hover:bg-surface-700`}>
          转义
        </button>
        <button onClick={onUnescape} className={`${buttonClass} text-surface-700 dark:text-surface-300 hover:bg-white dark:hover:bg-surface-700`}>
          去转
        </button>
      </div>
      <div className={groupClass}>
        <label className={`${buttonClass} text-surface-700 dark:text-surface-300 hover:bg-white dark:hover:bg-surface-700 cursor-pointer`}>
          <Upload className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          <span>导入</span>
          <input type="file" accept=".json,.txt" onChange={onFileUpload} className="hidden" />
        </label>
        <button onClick={onDownload} disabled={!canDownload} className={`${buttonClass} text-surface-700 dark:text-surface-300 hover:bg-white dark:hover:bg-surface-700 disabled:opacity-40`}>
          <Download className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          <span>下载</span>
        </button>
      </div>
      <button onClick={onClear} className="btn-ghost-danger btn-tool-sm sm:btn-tool flex-shrink-0 whitespace-nowrap">
        <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
        <span>清空</span>
      </button>
    </div>
  );
}
