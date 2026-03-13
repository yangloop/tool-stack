import { useState, useEffect } from 'react';
import { 
  Clock, Copy, Check, Calendar, RefreshCw,
  Info, AlertCircle, Save
} from 'lucide-react';
import { useClipboard } from '../../hooks/useLocalStorage';
import { AdFooter } from '../ads';
import { ToolInfoAuto } from './ToolInfoSection';

// Cron 字段定义
interface CronField {
  name: string;
  min: number;
  max: number;
  options: { label: string; value: string }[];
}

const cronFields: CronField[] = [
  {
    name: '分钟',
    min: 0,
    max: 59,
    options: [
      { label: '每分钟', value: '*' },
      { label: '每5分钟', value: '*/5' },
      { label: '每10分钟', value: '*/10' },
      { label: '每15分钟', value: '*/15' },
      { label: '每30分钟', value: '*/30' },
      { label: '整点', value: '0' },
    ],
  },
  {
    name: '小时',
    min: 0,
    max: 23,
    options: [
      { label: '每小时', value: '*' },
      { label: '每2小时', value: '*/2' },
      { label: '每3小时', value: '*/3' },
      { label: '每6小时', value: '*/6' },
      { label: '每12小时', value: '*/12' },
      { label: '凌晨0点', value: '0' },
      { label: '上午8点', value: '8' },
      { label: '中午12点', value: '12' },
    ],
  },
  {
    name: '日',
    min: 1,
    max: 31,
    options: [
      { label: '每天', value: '*' },
      { label: '每月1日', value: '1' },
      { label: '每月15日', value: '15' },
      { label: '每月最后一天', value: 'L' },
    ],
  },
  {
    name: '月',
    min: 1,
    max: 12,
    options: [
      { label: '每月', value: '*' },
      { label: '一月', value: '1' },
      { label: '二月', value: '2' },
      { label: '三月', value: '3' },
      { label: '四月', value: '4' },
      { label: '五月', value: '5' },
      { label: '六月', value: '6' },
      { label: '七月', value: '7' },
      { label: '八月', value: '8' },
      { label: '九月', value: '9' },
      { label: '十月', value: '10' },
      { label: '十一月', value: '11' },
      { label: '十二月', value: '12' },
    ],
  },
  {
    name: '星期',
    min: 0,
    max: 7,
    options: [
      { label: '每天', value: '*' },
      { label: '周一', value: '1' },
      { label: '周二', value: '2' },
      { label: '周三', value: '3' },
      { label: '周四', value: '4' },
      { label: '周五', value: '5' },
      { label: '周六', value: '6' },
      { label: '周日', value: '0' },
      { label: '工作日', value: '1-5' },
      { label: '周末', value: '0,6' },
    ],
  },
];

// 常用预设
const presets = [
  { name: '每分钟', value: '* * * * *', desc: '每分钟执行一次' },
  { name: '每5分钟', value: '*/5 * * * *', desc: '每5分钟执行一次' },
  { name: '每15分钟', value: '*/15 * * * *', desc: '每15分钟执行一次' },
  { name: '每小时', value: '0 * * * *', desc: '每小时的第0分钟执行' },
  { name: '每天凌晨', value: '0 0 * * *', desc: '每天凌晨0点执行' },
  { name: '每天早上8点', value: '0 8 * * *', desc: '每天早上8点执行' },
  { name: '每周一', value: '0 0 * * 1', desc: '每周一凌晨0点执行' },
  { name: '每月1日', value: '0 0 1 * *', desc: '每月1日凌晨0点执行' },
  { name: '每年1月1日', value: '0 0 1 1 *', desc: '每年1月1日凌晨0点执行' },
  { name: '工作日早上9点', value: '0 9 * * 1-5', desc: '工作日早上9点执行' },
];

// 解析 Cron 表达式为人类可读文本
function parseCronToHuman(cron: string): string {
  const parts = cron.trim().split(/\s+/);
  if (parts.length !== 5) return '无效的 Cron 表达式';

  const [minute, hour, day, month, weekday] = parts;

  // 简单的解析逻辑
  const descriptions: string[] = [];

  // 分钟
  if (minute === '*') descriptions.push('每分钟');
  else if (minute.startsWith('*/')) descriptions.push(`每${minute.slice(2)}分钟`);
  else if (minute.includes(',')) descriptions.push(`第 ${minute} 分钟`);
  else if (minute.includes('-')) descriptions.push(`${minute} 分钟之间`);
  else descriptions.push(`第 ${minute} 分钟`);

  // 小时
  if (hour === '*') descriptions.push('每小时');
  else if (hour.startsWith('*/')) descriptions.push(`每${hour.slice(2)}小时`);
  else if (hour.includes(',')) descriptions.push(` ${hour} 点`);
  else if (hour.includes('-')) descriptions.push(`${hour} 点之间`);
  else descriptions.push(`${hour} 点`);

  // 日
  if (day === '*') descriptions.push('每天');
  else if (day === 'L') descriptions.push('每月最后一天');
  else if (day.includes(',')) descriptions.push(`每月 ${day} 日`);
  else descriptions.push(`每月 ${day} 日`);

  // 月
  if (month === '*') descriptions.push('每月');
  else {
    const monthNames = ['', '一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
    if (month.includes(',')) {
      const months = month.split(',').map(m => monthNames[parseInt(m)] || m).join('、');
      descriptions.push(months);
    } else {
      descriptions.push(monthNames[parseInt(month)] || month);
    }
  }

  // 星期
  if (weekday === '*') descriptions.push('每天');
  else if (weekday === '1-5') descriptions.push('（周一至周五）');
  else if (weekday === '0,6') descriptions.push('（周末）');
  else {
    const weekdayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六', '周日'];
    if (weekday.includes(',')) {
      const days = weekday.split(',').map(d => weekdayNames[parseInt(d)] || d).join('、');
      descriptions.push(`（${days}）`);
    } else {
      descriptions.push(`（${weekdayNames[parseInt(weekday)] || weekday}）`);
    }
  }

  return descriptions.join('，');
}

// 计算下次执行时间的函数可以在这里实现
// function getNextExecution(cron: string, count: number = 5): Date[] { ... }

export function CrontabTool() {
  const [values, setValues] = useState(['0', '8', '*', '*', '*']); // 默认每天早上8点
  const [expression, setExpression] = useState('0 8 * * *');
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [error, setError] = useState('');
  const { copied, copy } = useClipboard();

  // 从字段值生成表达式
  useEffect(() => {
    setExpression(values.join(' '));
  }, [values]);

  // 验证表达式
  useEffect(() => {
    const parts = expression.trim().split(/\s+/);
    if (parts.length !== 5) {
      setError('Cron 表达式必须由 5 个字段组成');
    } else {
      setError('');
    }
  }, [expression]);

  const handleValueChange = (index: number, value: string) => {
    const newValues = [...values];
    newValues[index] = value;
    setValues(newValues);
  };

  const handleExpressionEdit = () => {
    setEditValue(expression);
    setIsEditing(true);
  };

  const handleExpressionSave = () => {
    const parts = editValue.trim().split(/\s+/);
    if (parts.length === 5) {
      setValues(parts);
      setExpression(editValue);
      setIsEditing(false);
    }
  };

  const handlePresetClick = (preset: typeof presets[0]) => {
    setValues(preset.value.split(' '));
    setExpression(preset.value);
  };

  const handleCopy = async () => {
    await copy(expression);
  };

  // const nextExecutions = useMemo(() => getNextExecution(expression), [expression]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* 标题 */}
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Clock className="w-6 h-6 sm:w-7 sm:h-7 text-blue-500" />
          Crontab 生成
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          可视化生成和解析 Unix/Linux 定时任务表达式
        </p>
      </div>

      {/* 表达式显示 */}
      <div className="card p-4 sm:p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4">
          <div className="flex-1">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
              Cron 表达式
            </div>
            {isEditing ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  id="cron-expression"
                  name="cron-expression"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="flex-1 px-3 py-2 font-mono text-lg bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg dark:text-white"
                  placeholder="* * * * *"
                />
                <button
                  onClick={handleExpressionSave}
                  className="btn-primary btn-icon"
                >
                  <Save className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div 
                onClick={handleExpressionEdit}
                className="font-mono text-2xl text-blue-600 dark:text-blue-400 cursor-pointer hover:underline"
              >
                {expression}
              </div>
            )}
            {error && (
              <div className="mt-2 text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}
          </div>
          <button
            onClick={handleCopy}
            className={`btn-tool ${copied ? 'btn-ghost-success' : 'btn-secondary'}`}
          >
            {copied ? <Check className="w-4 h-4 flex-shrink-0" /> : <Copy className="w-4 h-4 flex-shrink-0" />}
            {copied ? '已复制' : '复制'}
          </button>
        </div>

        {/* 人类可读描述 */}
        <div className="mt-4 p-3 bg-white/50 dark:bg-slate-900/50 rounded-lg">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Info className="w-4 h-4" />
            <span>{parseCronToHuman(expression)}</span>
          </div>
        </div>
      </div>

      {/* 时间字段选择 */}
      <div className="card p-4 sm:p-6">
        <h3 className="font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
          时间设置
        </h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          {cronFields.map((field, index) => (
            <div key={field.name}>
              <label htmlFor={`cron-field-${index}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {field.name}
                <span className="text-xs text-gray-400 ml-1">
                  ({field.min}-{field.max})
                </span>
              </label>
              <select
                id={`cron-field-${index}`}
                name={`cron-field-${index}`}
                value={values[index]}
                onChange={(e) => handleValueChange(index, e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-sm dark:text-white"
              >
                <option value="*">*</option>
                {field.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <input
                type="text"
                id={`cron-value-${index}`}
                name={`cron-value-${index}`}
                value={values[index]}
                onChange={(e) => handleValueChange(index, e.target.value)}
                placeholder="自定义"
                className="w-full mt-2 px-3 py-1.5 text-sm bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg dark:text-white"
              />
            </div>
          ))}
        </div>
      </div>

      {/* 常用预设 */}
      <div className="card p-4 sm:p-6">
        <h3 className="font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
          常用预设
        </h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
          {presets.map((preset) => (
            <button
              key={preset.value}
              onClick={() => handlePresetClick(preset)}
              className={`p-3 text-left rounded-lg border transition-all ${
                expression === preset.value
                  ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800'
                  : 'bg-surface-50 dark:bg-surface-800 border-surface-200 dark:border-surface-700 hover:border-primary-300'
              }`}
            >
              <div className="font-medium text-gray-900 dark:text-white text-sm">
                {preset.name}
              </div>
              <div className="font-mono text-xs text-blue-600 dark:text-blue-400 mt-1">
                {preset.value}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {preset.desc}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 功能说明 */}
      <ToolInfoAuto toolId="crontab" />

      {/* 底部广告 */}
      <AdFooter />
    </div>
  );
}
