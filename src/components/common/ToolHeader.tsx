import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface ToolHeaderProps {
  /** 工具标题 */
  title: string;
  /** 工具描述 */
  description?: string;
  /** 图标组件 */
  icon?: LucideIcon;
  /** 图标颜色类名 */
  iconColorClass?: string;
  /** 是否使用紧凑样式（图标带背景） */
  compact?: boolean;
  /** 标题右侧的操作区域 */
  actions?: ReactNode;
  /** 额外的类名 */
  className?: string;
}

/**
 * 工具页面标题栏组件
 * 
 * 标准样式（默认）：大标题，可选图标在标题左侧
 * 紧凑样式：图标带背景色，适合工具栏风格的头部
 * 
 * @example
 * // 标准样式
 * <ToolHeader
 *   title="Base64 编解码"
 *   description="Base64 编码和解码工具"
 * />
 * 
 * @example
 * // 带图标的标准样式
 * <ToolHeader
 *   icon={Database}
 *   title="SQL 格式化"
 *   description="SQL 语句美化、压缩和语法高亮"
 *   iconColorClass="text-primary-500"
 * />
 * 
 * @example
 * // 紧凑样式（带操作按钮）
 * <ToolHeader
 *   icon={Key}
 *   title="JWT 解码"
 *   description="解析和验证 JWT 令牌"
 *   compact
 *   actions={<button>加载示例</button>}
 * />
 */
export function ToolHeader({
  title,
  description,
  icon: Icon,
  iconColorClass = 'text-primary-500',
  compact = false,
  actions,
  className = '',
}: ToolHeaderProps) {
  // 紧凑样式（工具栏风格）
  if (compact) {
    return (
      <div className={`tool-header ${className}`}>
        {Icon && (
          <div className="tool-icon w-9 h-9 sm:w-10 sm:h-10">
            <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h1 className="text-lg sm:text-xl font-semibold text-surface-900 dark:text-surface-100">
            {title}
          </h1>
          {description && (
            <p className="text-xs sm:text-sm text-surface-500 dark:text-surface-400 mt-0.5">
              {description}
            </p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
      </div>
    );
  }

  // 标准样式
  return (
    <div className={`mb-4 sm:mb-6 ${className}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-surface-900 dark:text-surface-100 flex items-center gap-2">
            {Icon && <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${iconColorClass}`} />}
            {title}
          </h1>
          {description && (
            <p className="text-surface-500 dark:text-surface-400 mt-1 text-xs sm:text-sm">
              {description}
            </p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
      </div>
    </div>
  );
}
