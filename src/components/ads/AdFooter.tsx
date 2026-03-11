import { Sparkles, ArrowRight } from 'lucide-react';

interface AdFooterProps {
  className?: string;
}

export function AdFooter({ className = '' }: AdFooterProps) {
  return (
    <div className={`mt-8 pt-6 border-t border-surface-200 dark:border-surface-700 ${className}`}>
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-surface-50 to-surface-100 dark:from-surface-800 dark:to-surface-700/50 border border-surface-200 dark:border-surface-700">
        {/* 装饰背景 */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary-500/10 rounded-full blur-3xl" />
          <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl" />
        </div>
        
        <div className="relative p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* 左侧内容 */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/25 flex-shrink-0">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div className="text-center sm:text-left">
                <h4 className="font-semibold text-surface-900 dark:text-surface-100">
                  ToolStack Pro
                </h4>
                <p className="text-sm text-surface-500 mt-0.5">
                  解锁全部高级功能，享受无广告体验
                </p>
              </div>
            </div>
            
            {/* 右侧按钮 */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <span className="text-xs text-surface-400 hidden sm:inline">
                限时优惠
              </span>
              <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-medium transition-colors shadow-lg shadow-primary-500/25">
                升级 Pro
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          {/* 特性标签 */}
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-4 pt-4 border-t border-surface-200/50 dark:border-surface-600/50">
            {['无广告体验', '高级工具', '优先支持', '云端同步'].map((feature) => (
              <span 
                key={feature}
                className="px-2.5 py-1 text-[10px] font-medium text-surface-600 dark:text-surface-400 bg-surface-200/50 dark:bg-surface-700/50 rounded-full"
              >
                {feature}
              </span>
            ))}
          </div>
        </div>
      </div>
      
      {/* 简单文字广告 */}
      <div className="mt-4 flex items-center justify-center gap-4 text-xs text-surface-400">
        <span>广告</span>
        <span className="w-1 h-1 bg-surface-300 rounded-full" />
        <a href="#" className="hover:text-primary-500 transition-colors">广告位招租</a>
        <span className="w-1 h-1 bg-surface-300 rounded-full" />
        <a href="#" className="hover:text-primary-500 transition-colors">联系我们</a>
      </div>
    </div>
  );
}
