import { Image, ArrowRight } from 'lucide-react';

interface AdInArticleProps {
  className?: string;
}

export function AdInArticle({ className = '' }: AdInArticleProps) {
  return (
    <div className={`my-8 ${className}`}>
      <div className="relative overflow-hidden rounded-2xl bg-surface-0 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 shadow-soft">
        {/* 广告标签 */}
        <div className="absolute top-3 right-3">
          <span className="text-[10px] font-medium text-surface-400 bg-surface-100 dark:bg-surface-700 px-2 py-0.5 rounded-full">
            广告
          </span>
        </div>
        
        <div className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* 左侧图标 */}
            <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-primary-50 to-indigo-50 dark:from-primary-900/20 dark:to-indigo-900/20 rounded-2xl flex items-center justify-center">
              <Image className="w-8 h-8 text-primary-500" />
            </div>
            
            {/* 中间内容 */}
            <div className="flex-1 text-center sm:text-left">
              <h4 className="font-semibold text-surface-900 dark:text-surface-100">
                内容内嵌广告位
              </h4>
              <p className="text-sm text-surface-500 mt-1">
                728 x 90 / 自适应尺寸，完美融入内容流
              </p>
            </div>
            
            {/* 右侧按钮 */}
            <button className="flex-shrink-0 inline-flex items-center gap-2 px-4 py-2 bg-surface-100 dark:bg-surface-700 text-surface-700 dark:text-surface-300 rounded-xl text-sm font-medium hover:bg-surface-200 dark:hover:bg-surface-600 transition-colors">
              了解更多
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* 底部装饰线 */}
        <div className="h-1 bg-gradient-to-r from-primary-500 via-indigo-500 to-primary-500" />
      </div>
    </div>
  );
}
