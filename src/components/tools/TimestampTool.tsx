import { useState, useEffect } from 'react';
import { Copy, Check, Clock, RefreshCw } from 'lucide-react';
import { useClipboard } from '../../hooks/useLocalStorage';
import { AdFooter } from '../ads';
import { ToolInfoAuto } from './ToolInfoSection';

export function TimestampTool() {
  const [timestamp, setTimestamp] = useState(Math.floor(Date.now() / 1000).toString());
  const [dateInput, setDateInput] = useState('');
  const [timeInput, setTimeInput] = useState('');
  const [unit, setUnit] = useState<'s' | 'ms'>('s');
  const [currentTime, setCurrentTime] = useState(Date.now());
  const { copied, copy } = useClipboard();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!timestamp) return;
    const ts = parseInt(timestamp);
    if (isNaN(ts)) return;
    
    const date = new Date(unit === 's' ? ts * 1000 : ts);
    setDateInput(date.toISOString().split('T')[0]);
    setTimeInput(date.toTimeString().slice(0, 5));
  }, [timestamp, unit]);

  const handleDateChange = (date: string, time: string) => {
    if (!date) return;
    const d = new Date(`${date}T${time || '00:00'}`);
    const ts = unit === 's' ? Math.floor(d.getTime() / 1000) : d.getTime();
    setTimestamp(ts.toString());
  };

  const formatDate = (ts: number) => {
    const date = new Date(unit === 's' ? ts * 1000 : ts);
    return {
      local: date.toLocaleString('zh-CN'),
      utc: date.toUTCString(),
      iso: date.toISOString(),
    };
  };

  const ts = parseInt(timestamp);
  const dateInfo = !isNaN(ts) ? formatDate(ts) : null;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />
          时间戳转换
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Unix 时间戳与日期时间互转
        </p>
      </div>

      {/* 当前时间 */}
      <div className="card p-4 sm:p-6 mb-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-900">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">当前时间戳</div>
            <div className="text-xl sm:text-2xl font-mono font-bold text-blue-600 dark:text-blue-400">
              {Math.floor(currentTime / 1000)}
              <span className="text-xs sm:text-sm font-normal text-gray-400 ml-1">秒</span>
            </div>
            <div className="text-base sm:text-lg font-mono text-gray-600 dark:text-gray-300">
              {currentTime}
              <span className="text-xs sm:text-sm font-normal text-gray-400 ml-1">毫秒</span>
            </div>
          </div>
          <button
            onClick={() => {
              setTimestamp(Math.floor(Date.now() / 1000).toString());
              setUnit('s');
            }}
            className="btn-icon text-primary-500 hover:text-primary-600"
          >
            <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {/* 转换区域 */}
      <div className="grid md:grid-cols-2 gap-3 sm:gap-4">
        <div className="card p-4 sm:p-6 space-y-3 sm:space-y-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              时间戳
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={timestamp}
                onChange={(e) => setTimestamp(e.target.value)}
                placeholder="输入时间戳..."
                className="flex-1 px-3 sm:px-4 py-2 font-mono text-xs sm:text-sm bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:text-white"
              />
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value as 's' | 'ms')}
                className="px-2 sm:px-3 py-2 bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-xs sm:text-sm dark:text-white"
              >
                <option value="s">秒</option>
                <option value="ms">毫秒</option>
              </select>
            </div>
          </div>

          <div className="space-y-2 sm:space-y-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">日期</label>
              <input
                type="date"
                value={dateInput}
                onChange={(e) => {
                  setDateInput(e.target.value);
                  handleDateChange(e.target.value, timeInput);
                }}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-xs sm:text-sm dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">时间</label>
              <input
                type="time"
                value={timeInput}
                onChange={(e) => {
                  setTimeInput(e.target.value);
                  handleDateChange(dateInput, e.target.value);
                }}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-xs sm:text-sm dark:text-white"
              />
            </div>
          </div>
        </div>

        <div className="card p-4 sm:p-6 space-y-3 sm:space-y-4">
          {dateInfo ? (
            <>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs sm:text-sm text-gray-500">本地时间</span>
                  <button onClick={() => copy(dateInfo.local)} className={`btn-icon ${copied ? 'text-emerald-500' : 'text-primary-500'}`}>
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <div className="p-2 sm:p-3 bg-gray-50 dark:bg-slate-900 rounded-lg font-mono text-xs sm:text-sm dark:text-white">
                  {dateInfo.local}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs sm:text-sm text-gray-500">UTC 时间</span>
                  <button onClick={() => copy(dateInfo.utc)} className={`btn-icon ${copied ? 'text-emerald-500' : 'text-primary-500'}`}>
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <div className="p-2 sm:p-3 bg-gray-50 dark:bg-slate-900 rounded-lg font-mono text-xs sm:text-sm dark:text-white">
                  {dateInfo.utc}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs sm:text-sm text-gray-500">ISO 8601</span>
                  <button onClick={() => copy(dateInfo.iso)} className={`btn-icon ${copied ? 'text-emerald-500' : 'text-primary-500'}`}>
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <div className="p-2 sm:p-3 bg-gray-50 dark:bg-slate-900 rounded-lg font-mono text-xs sm:text-sm dark:text-white">
                  {dateInfo.iso}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center text-gray-400 py-8">输入有效的时间戳</div>
          )}
        </div>
      </div>

      {/* 功能说明 */}
      <ToolInfoAuto toolId="timestamp" />

      {/* 底部广告 */}
      <AdFooter />
    </div>
  );
}
