import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 
  | 'primary' 
  | 'secondary' 
  | 'success' 
  | 'warning' 
  | 'danger' 
  | 'info' 
  | 'ghost' 
  | 'ghost-success' 
  | 'ghost-danger';

export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

/**
 * 通用按钮组件
 * 
 * @example
 * // 主要按钮
 * <Button variant="primary">提交</Button>
 * 
 * // 危险按钮
 * <Button variant="danger" leftIcon={<Trash2 className="w-4 h-4" />}>删除</Button>
 * 
 * // 加载状态
 * <Button isLoading>处理中...</Button>
 * 
 * // 幽灵按钮
 * <Button variant="ghost">取消</Button>
 */
export function Button({
  children,
  variant = 'secondary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  rounded = 'xl',
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const baseClasses = [
    'inline-flex items-center justify-center gap-2',
    'font-medium whitespace-nowrap',
    'transition-all duration-200 ease-out',
    'active:scale-95',
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
    'touch-manipulation',
  ];

  // 尺寸样式
  const sizeClasses: Record<ButtonSize, string> = {
    xs: 'px-2.5 py-1.5 text-xs gap-1',
    sm: 'px-3 py-2 text-xs gap-1.5',
    md: 'px-4 py-2.5 text-sm gap-2',
    lg: 'px-5 py-3 text-sm gap-2',
    xl: 'px-6 py-3.5 text-base gap-2.5',
  };

  // 圆角样式
  const roundedClasses = {
    sm: 'rounded-lg',
    md: 'rounded-xl',
    lg: 'rounded-2xl',
    xl: 'rounded-3xl',
    full: 'rounded-full',
  };

  // 变体样式
  const variantClasses: Record<ButtonVariant, string> = {
    primary: [
      'bg-gradient-to-r from-primary-500 to-primary-600',
      'text-white shadow-lg shadow-primary-500/25',
      'hover:shadow-primary-500/40 hover:from-primary-600 hover:to-primary-700',
      'active:from-primary-700 active:to-primary-800',
    ].join(' '),
    
    secondary: [
      'bg-surface-100 dark:bg-surface-700',
      'text-surface-700 dark:text-surface-200',
      'hover:bg-surface-200 dark:hover:bg-surface-600',
      'active:bg-surface-300 dark:active:bg-surface-500',
    ].join(' '),
    
    success: [
      'bg-gradient-to-r from-emerald-500 to-emerald-600',
      'text-white shadow-lg shadow-emerald-500/25',
      'hover:shadow-emerald-500/40 hover:from-emerald-600 hover:to-emerald-700',
      'active:from-emerald-700 active:to-emerald-800',
    ].join(' '),
    
    warning: [
      'bg-gradient-to-r from-amber-500 to-amber-600',
      'text-white shadow-lg shadow-amber-500/25',
      'hover:shadow-amber-500/40 hover:from-amber-600 hover:to-amber-700',
      'active:from-amber-700 active:to-amber-800',
    ].join(' '),
    
    danger: [
      'bg-gradient-to-r from-red-500 to-red-600',
      'text-white shadow-lg shadow-red-500/25',
      'hover:shadow-red-500/40 hover:from-red-600 hover:to-red-700',
      'active:from-red-700 active:to-red-800',
    ].join(' '),
    
    info: [
      'bg-gradient-to-r from-cyan-500 to-cyan-600',
      'text-white shadow-lg shadow-cyan-500/25',
      'hover:shadow-cyan-500/40 hover:from-cyan-600 hover:to-cyan-700',
      'active:from-cyan-700 active:to-cyan-800',
    ].join(' '),
    
    ghost: [
      'bg-transparent',
      'text-surface-600 dark:text-surface-400',
      'hover:bg-surface-100 dark:hover:bg-surface-800',
      'hover:text-surface-900 dark:hover:text-surface-100',
    ].join(' '),
    
    'ghost-success': [
      'bg-transparent',
      'text-emerald-600 dark:text-emerald-400',
      'hover:bg-emerald-50 dark:hover:bg-emerald-900/20',
      'hover:text-emerald-700 dark:hover:text-emerald-300',
    ].join(' '),
    
    'ghost-danger': [
      'bg-transparent',
      'text-red-500 dark:text-red-400',
      'hover:bg-red-50 dark:hover:bg-red-900/20',
      'hover:text-red-600 dark:hover:text-red-300',
    ].join(' '),
  };

  // 移动端触摸优化
  const touchClasses = 'min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0';

  const classes = [
    ...baseClasses,
    sizeClasses[size],
    roundedClasses[rounded],
    variantClasses[variant],
    fullWidth ? 'w-full' : '',
    touchClasses,
    className,
  ].join(' ');

  return (
    <button
      className={classes}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          {children}
        </>
      ) : (
        <>
          {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
        </>
      )}
    </button>
  );
}

// 图标按钮组件
interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  icon: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  label: string;
}

export function IconButton({
  icon,
  variant = 'ghost',
  size = 'md',
  isLoading = false,
  label,
  className = '',
  ...props
}: IconButtonProps) {
  const sizeClasses: Record<ButtonSize, string> = {
    xs: 'p-1.5',
    sm: 'p-2',
    md: 'p-2.5',
    lg: 'p-3',
    xl: 'p-3.5',
  };

  const iconSizes: Record<ButtonSize, string> = {
    xs: 'w-3.5 h-3.5',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-5 h-5',
    xl: 'w-6 h-6',
  };

  return (
    <Button
      variant={variant}
      size="md"
      isLoading={isLoading}
      className={`${sizeClasses[size]} rounded-xl ${className}`}
      aria-label={label}
      title={label}
      {...props}
    >
      <span className={iconSizes[size]}>
        {isLoading ? <Loader2 className="w-full h-full animate-spin" /> : icon}
      </span>
    </Button>
  );
}

// 分段按钮/按钮组
interface ButtonGroupProps {
  children: ReactNode;
  className?: string;
}

export function ButtonGroup({ children, className = '' }: ButtonGroupProps) {
  return (
    <div className={`inline-flex bg-surface-100 dark:bg-surface-800 p-1 rounded-xl ${className}`}>
      {children}
    </div>
  );
}

// 分段按钮项
interface ButtonGroupItemProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isActive?: boolean;
  children: ReactNode;
}

export function ButtonGroupItem({
  isActive = false,
  children,
  className = '',
  ...props
}: ButtonGroupItemProps) {
  return (
    <button
      className={`
        px-3 py-1.5 sm:px-4 sm:py-2
        text-xs sm:text-sm font-medium
        rounded-lg sm:rounded-xl
        transition-all duration-200
        touch-manipulation active:scale-95
        ${isActive 
          ? 'bg-white dark:bg-surface-700 text-primary-600 dark:text-primary-400 shadow-sm' 
          : 'text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-200'
        }
        min-h-[36px] sm:min-h-0 min-w-[44px] sm:min-w-0
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
}

// 复制按钮组件
interface CopyButtonProps {
  text: string;
  copied?: boolean;
  onCopy?: () => void;
  variant?: 'button' | 'ghost' | 'icon';
  size?: ButtonSize;
}

import { Copy, Check } from 'lucide-react';

export function CopyButton({
  text,
  copied = false,
  onCopy,
  variant = 'ghost',
  size = 'sm',
}: CopyButtonProps) {
  const handleClick = () => {
    navigator.clipboard.writeText(text);
    onCopy?.();
  };

  if (variant === 'icon') {
    return (
      <IconButton
        icon={copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        variant={copied ? 'ghost-success' : 'ghost'}
        size={size}
        onClick={handleClick}
        label={copied ? '已复制' : '复制'}
      />
    );
  }

  return (
    <Button
      variant={copied ? 'ghost-success' : variant === 'button' ? 'secondary' : 'ghost'}
      size={size}
      leftIcon={copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      onClick={handleClick}
    >
      {copied ? '已复制' : '复制'}
    </Button>
  );
}

export default Button;
