import { ToolHeader } from '../../../components/common';
import { ToolInfoAuto } from './ToolInfoSection';

interface SsrSafeToolPlaceholderProps {
  title: string;
  description: string;
  toolId: string;
}

export function SsrSafeToolPlaceholder({
  title,
  description,
  toolId,
}: SsrSafeToolPlaceholderProps) {
  return (
    <div className="space-y-6">
      <div className="card p-6">
        <ToolHeader
          title={title}
          description={description}
          compact
        />
      </div>

      <div className="card p-6">
        <div className="rounded-2xl border border-surface-200 bg-surface-50 p-5 text-sm text-surface-600 dark:border-surface-700 dark:bg-surface-900/50 dark:text-surface-300">
          当前页面在服务端渲染时使用安全占位内容，完整交互会在浏览器中自动加载。
        </div>
      </div>

      <ToolInfoAuto toolId={toolId} />
    </div>
  );
}
