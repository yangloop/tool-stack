import { useState } from 'react';
import { X, Megaphone, ExternalLink } from 'lucide-react';

interface AdBannerProps {
  position?: 'top' | 'bottom';
  className?: string;
}

export function AdBanner({ position = 'top', className = '' }: AdBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  return (
    <div 
      className={`
        relative w-full bg-gradient-to-r from-primary-50/80 to-indigo-50/80 
        dark:from-surface-800/80 dark:to-surface-900/80
        backdrop-blur-sm
        border-surface-200 dark:border-surface-700
        ${position === 'bottom' ? 'border-t' : 'border-b'}
        ${className}
      `}
    >
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-2">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="flex-shrink-0 w-7 h-7 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center shadow-sm">
              <Megaphone className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="flex-1 min-w-0 flex items-center gap-2">
              <span className="badge-primary text-[10px]">广告</span>
              <p className="text-sm text-surface-700 dark:text-surface-300 truncate">
                <span className="font-medium text-primary-600 dark:text-primary-400">ToolStack Pro</span>
                {' '}—— 解锁更多高级功能，提升开发效率
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              className="hidden sm:flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors"
            >
              了解更多
              <ExternalLink className="w-3 h-3" />
            </button>
            <button
              onClick={() => setIsDismissed(true)}
              className="p-1.5 text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg transition-colors"
              title="关闭广告"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
