import { HelpCircle, BookOpen, Lightbulb, Info, Palette } from 'lucide-react';
import type { ToolLegendItem } from '../../types';
import { getToolInfoData } from '../../data/toolInfoData';

// ============================================================
// ToolInfoSection - 工具信息区域综合组件
// 用于统一展示工具的功能说明、使用指南、图例等信息
// ============================================================

interface ToolInfoSectionProps {
  children?: React.ReactNode;
  className?: string;
}

/**
 * 工具信息区域容器
 * 统一包裹功能说明、图例等内容，提供一致的卡片样式和间距
 */
export function ToolInfoSection({ children, className = '' }: ToolInfoSectionProps) {
  return (
    <div className={`mt-4 sm:mt-5 ${className}`}>
      {children}
    </div>
  );
}

// ============================================================
// ToolDescription - 功能说明组件
// ============================================================

interface ToolDescriptionProps {
  title?: string;
  children?: React.ReactNode;
  className?: string;
  icon?: 'help' | 'book' | 'tip';
}

/**
 * 工具功能说明组件
 * 用于在工具页面底部显示功能说明和使用提示
 */
export function ToolDescription({ 
  title = '功能说明', 
  children,
  className = '',
  icon = 'help'
}: ToolDescriptionProps) {
  const IconComponent = {
    help: HelpCircle,
    book: BookOpen,
    tip: Lightbulb
  }[icon];

  return (
    <div className={`card p-4 sm:p-6 ${className}`}>
      <h3 className="font-medium text-surface-900 dark:text-surface-100 mb-3 flex items-center gap-2">
        <IconComponent className="w-4 h-4 sm:w-5 sm:h-5 text-primary-500" />
        {title}
      </h3>
      <div className="text-sm text-surface-600 dark:text-surface-400">
        {children}
      </div>
    </div>
  );
}

interface ToolDescriptionItemProps {
  children: React.ReactNode;
}

/**
 * 功能说明列表项
 */
export function ToolDescriptionItem({ children }: ToolDescriptionItemProps) {
  return (
    <li className="flex items-start gap-2">
      <span className="text-primary-500 mt-0.5">•</span>
      <span className="leading-relaxed">{children}</span>
    </li>
  );
}

// ============================================================
// ToolLegend - 图例组件
// ============================================================

interface ToolLegendProps {
  title?: string;
  items: ToolLegendItem[];
  className?: string;
  variant?: 'default' | 'compact' | 'colorful';
  icon?: React.ReactNode;
}

/**
 * 工具图例组件
 * 用于展示语法高亮图例、颜色标识、状态说明等
 */
export function ToolLegend({ 
  title = '图例', 
  items,
  className = '',
  variant = 'default',
  icon
}: ToolLegendProps) {
  const getItemClasses = (item: ToolLegendItem) => {
    if (item.className) return item.className;
    if (variant === 'colorful' && item.bgColor) {
      return `${item.bgColor} px-2 py-0.5 rounded text-xs`;
    }
    return '';
  };

  return (
    <div className={`card p-3 sm:p-4 ${className}`}>
      <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs">
        <span className="text-surface-500 flex items-center gap-1 font-medium">
          {icon || <Info className="w-3 h-3" />}
          {title}:
        </span>
        {items.map((item, index) => (
          <span key={index} className={`flex items-center gap-1 ${getItemClasses(item)}`}>
            {item.color && (
              <span 
                className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded inline-block"
                style={{ backgroundColor: item.color }}
              />
            )}
            {item.text && (
              <span className="font-medium">{item.text}</span>
            )}
            <span className={variant === 'colorful' ? '' : 'text-surface-600 dark:text-surface-400'}>
              {item.label}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

interface ColorLegendProps {
  title?: string;
  colors: Array<{ hex: string; name: string }>;
  className?: string;
}

/**
 * 颜色图例组件
 */
export function ColorLegend({ 
  title = '颜色', 
  colors,
  className = ''
}: ColorLegendProps) {
  return (
    <div className={`card p-3 sm:p-4 ${className}`}>
      <div className="flex flex-wrap items-center gap-3">
        {title && (
          <span className="text-xs text-surface-500 flex items-center gap-1 font-medium">
            <Palette className="w-3 h-3" />
            {title}:
          </span>
        )}
        {colors.map((color, index) => (
          <span key={index} className="flex items-center gap-1.5">
            <span 
              className="w-4 h-4 rounded border border-surface-200 dark:border-surface-700"
              style={{ backgroundColor: color.hex }}
            />
            <span className="text-xs text-surface-600 dark:text-surface-400">{color.name}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// 便捷组合组件 - 通过工具ID自动获取数据
// ============================================================

interface ToolInfoAutoProps {
  toolId: string;
  className?: string;
  showLegend?: boolean;
  showDescription?: boolean;
}

/**
 * 自动工具信息组件
 * 根据工具ID自动从 toolInfoData 获取并展示图例和功能说明
 */
export function ToolInfoAuto({ 
  toolId, 
  className = '',
  showLegend = true,
  showDescription = true,
}: ToolInfoAutoProps) {
  const data = getToolInfoData(toolId);
  
  if (!data) return null;

  return (
    <ToolInfoSection className={className}>
      <div className="space-y-3">
        {showLegend && data.legend && (
          <ToolLegend 
            title={data.legend.title} 
            items={data.legend.items} 
            variant={data.legend.variant}
          />
        )}
        {showDescription && data.description && (
          <ToolDescription 
            title={data.description.title} 
            icon={data.description.icon}
          >
            <ul className="space-y-2">
              {data.description.items.map((item, index) => (
                <ToolDescriptionItem key={index}>{item}</ToolDescriptionItem>
              ))}
            </ul>
          </ToolDescription>
        )}
      </div>
    </ToolInfoSection>
  );
}

// ============================================================
// 便捷组合组件 - 手动传入数据
// ============================================================

interface ToolInfoProps {
  description?: {
    title?: string;
    items: string[];
    icon?: 'help' | 'book' | 'tip';
  };
  legend?: {
    title?: string;
    items: ToolLegendItem[];
    variant?: 'default' | 'compact' | 'colorful';
  };
  className?: string;
}

/**
 * 手动工具信息组件 - 同时展示图例和功能说明
 */
export function ToolInfo({ description, legend, className = '' }: ToolInfoProps) {
  return (
    <ToolInfoSection className={className}>
      <div className="space-y-3">
        {legend && (
          <ToolLegend 
            title={legend.title} 
            items={legend.items} 
            variant={legend.variant}
          />
        )}
        {description && (
          <ToolDescription title={description.title} icon={description.icon}>
            <ul className="space-y-2">
              {description.items.map((item, index) => (
                <ToolDescriptionItem key={index}>{item}</ToolDescriptionItem>
              ))}
            </ul>
          </ToolDescription>
        )}
      </div>
    </ToolInfoSection>
  );
}

export default ToolInfoSection;
