import { useState, useCallback } from 'react';
import { Copy, Check, RefreshCw, Lock, Settings2 } from 'lucide-react';
import { useClipboard } from '../../hooks/useLocalStorage';
import { randomString } from '../../utils/helpers';
import { AdFooter } from '../ads';
import { ToolInfoAuto } from './ToolInfoSection';

export function PasswordTool() {
  const [password, setPassword] = useState('');
  const [length, setLength] = useState(16);
  const [options, setOptions] = useState({
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
  });
  const [excludeSimilar, setExcludeSimilar] = useState(false);
  const { copied, copy } = useClipboard();

  const generate = useCallback(() => {
    let chars = '';
    if (options.uppercase) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (options.lowercase) chars += 'abcdefghijklmnopqrstuvwxyz';
    if (options.numbers) chars += '0123456789';
    if (options.symbols) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';

    if (excludeSimilar) {
      chars = chars.replace(/[0O1lI]/g, '');
    }

    if (!chars) {
      setPassword('');
      return;
    }

    setPassword(randomString(length, chars));
  }, [length, options, excludeSimilar]);

  const getStrength = (pwd: string): { score: number; maxScore: number; label: string; color: string; percent: number } => {
    if (!pwd) return { score: 0, maxScore: 6, label: '未生成', color: 'gray', percent: 0 };
    
    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    // 极强时显示100%，其他按实际比例
    let percent = (score / 6) * 100;
    
    if (score <= 2) return { score, maxScore: 6, label: '弱', color: 'red', percent };
    if (score <= 4) return { score, maxScore: 6, label: '中等', color: 'yellow', percent };
    if (score <= 5) return { score, maxScore: 6, label: '强', color: 'blue', percent };
    // 极强时强制100%
    return { score, maxScore: 6, label: '极强', color: 'green', percent: 100 };
  };

  const strength = getStrength(password);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Lock className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />
          密码生成
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          生成安全随机密码
        </p>
      </div>

      {/* 密码显示 */}
      <div className="card p-4 sm:p-6 mb-4">
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="flex-1 relative">
            <input
              type="text"
              value={password}
              readOnly
              placeholder="点击生成按钮..."
              className="w-full px-3 sm:px-4 py-3 sm:py-4 text-lg sm:text-xl font-mono bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-center dark:text-white"
            />
          </div>
          <button
            onClick={() => password && copy(password)}
            disabled={!password}
            className={`btn-icon ${copied ? 'text-emerald-500' : ''}`}
          >
            {copied ? <Check className="w-5 h-5 sm:w-6 sm:h-6" /> : <Copy className="w-5 h-5 sm:w-6 sm:h-6" />}
          </button>
        </div>

        {/* 强度指示 */}
        {password && (
          <div className="mt-3 sm:mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs sm:text-sm text-gray-500">密码强度</span>
              <span className={`text-xs sm:text-sm font-medium ${
                strength.color === 'red' ? 'text-red-500' :
                strength.color === 'yellow' ? 'text-yellow-500' :
                strength.color === 'blue' ? 'text-blue-500' :
                'text-green-500'
              }`}>
                {strength.label}
              </span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  strength.color === 'red' ? 'bg-red-500' :
                  strength.color === 'yellow' ? 'bg-yellow-500' :
                  strength.color === 'blue' ? 'bg-blue-500' :
                  'bg-green-500'
                }`}
                style={{ width: `${strength.percent}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* 设置 */}
      <div className="card p-4 sm:p-6 space-y-3 sm:space-y-4">
        <div className="flex items-center gap-2 sm:gap-4">
          <Settings2 className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
          <span className="text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300">长度</span>
          <input
            type="range"
            min={4}
            max={64}
            value={length}
            onChange={(e) => setLength(Number(e.target.value))}
            className="flex-1"
          />
          <span className="w-10 sm:w-12 text-center font-mono text-sm sm:text-base dark:text-white">{length}</span>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {Object.entries({
            uppercase: '大写字母 (A-Z)',
            lowercase: '小写字母 (a-z)',
            numbers: '数字 (0-9)',
            symbols: '特殊字符 (!@#$...)',
          }).map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 sm:gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={options[key as keyof typeof options]}
                onChange={(e) => setOptions({ ...options, [key]: e.target.checked })}
                className="w-4 h-4 text-blue-500 rounded"
              />
              <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">{label}</span>
            </label>
          ))}
        </div>

        <label className="flex items-center gap-2 sm:gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={excludeSimilar}
            onChange={(e) => setExcludeSimilar(e.target.checked)}
            className="w-4 h-4 text-blue-500 rounded"
          />
          <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
            排除相似字符 (0, O, 1, l, I)
          </span>
        </label>

        <button
          onClick={generate}
          className="w-full btn-primary btn-action"
        >
          <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
          生成密码
        </button>
      </div>

      {/* 功能说明 */}
      <ToolInfoAuto toolId="password" />

      {/* 底部广告 */}
      <AdFooter />
    </div>
  );
}
