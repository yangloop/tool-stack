import { useState, useEffect } from 'react';
import { 
  Monitor, Smartphone, Globe, Cpu, Layers, 
  Copy, Check, RefreshCw, AlertCircle, Info,
  ChevronDown, ChevronUp, Terminal
} from 'lucide-react';
import { useClipboard } from '../../hooks/useLocalStorage';
import { AdFooter } from '../ads';

// UA 解析结果类型
interface UAParseResult {
  browser: {
    name: string;
    version: string;
    engine: string;
  };
  os: {
    name: string;
    version: string;
    platform: string;
  };
  device: {
    type: string;
    model: string;
    vendor: string;
  };
  screen: {
    width: number;
    height: number;
    colorDepth: number;
    pixelRatio: number;
  };
  features: {
    cookies: boolean;
    localStorage: boolean;
    sessionStorage: boolean;
    touch: boolean;
    webp: boolean;
  };
}

// 解析 User Agent
function parseUA(ua: string): UAParseResult {
  const result: UAParseResult = {
    browser: { name: 'Unknown', version: '', engine: '' },
    os: { name: 'Unknown', version: '', platform: '' },
    device: { type: 'Desktop', model: '', vendor: '' },
    screen: {
      width: window.screen.width,
      height: window.screen.height,
      colorDepth: window.screen.colorDepth,
      pixelRatio: window.devicePixelRatio || 1,
    },
    features: {
      cookies: navigator.cookieEnabled,
      localStorage: !!window.localStorage,
      sessionStorage: !!window.sessionStorage,
      touch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
      webp: false, // 需要异步检测
    },
  };

  // 检测 WebP 支持
  const canvas = document.createElement('canvas');
  if (canvas.getContext && canvas.getContext('2d')) {
    result.features.webp = canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  }

  // 浏览器检测
  const browserRules = [
    { name: 'Edge', regex: /Edg\/([\d.]+)/ },
    { name: 'Chrome', regex: /Chrome\/([\d.]+)/ },
    { name: 'Safari', regex: /Version\/([\d.]+).*Safari\// },
    { name: 'Firefox', regex: /Firefox\/([\d.]+)/ },
    { name: 'Opera', regex: /OPR\/([\d.]+)/ },
    { name: 'IE', regex: /MSIE ([\d.]+)|Trident.*rv:([\d.]+)/ },
  ];

  for (const rule of browserRules) {
    const match = ua.match(rule.regex);
    if (match) {
      result.browser.name = rule.name;
      result.browser.version = match[1] || match[2] || '';
      break;
    }
  }

  // 渲染引擎
  if (ua.includes('WebKit')) result.browser.engine = 'WebKit';
  else if (ua.includes('Gecko')) result.browser.engine = 'Gecko';
  else if (ua.includes('Trident')) result.browser.engine = 'Trident';
  else if (ua.includes('Blink')) result.browser.engine = 'Blink';

  // 操作系统检测
  const osRules = [
    { name: 'Windows', regex: /Windows NT ([\d.]+)/ },
    { name: 'macOS', regex: /Mac OS X ([\d_]+)/ },
    { name: 'iOS', regex: /iPhone OS ([\d_]+)|iOS ([\d.]+)/ },
    { name: 'Android', regex: /Android ([\d.]+)/ },
    { name: 'Linux', regex: /Linux/ },
    { name: 'Chrome OS', regex: /CrOS/ },
  ];

  for (const rule of osRules) {
    const match = ua.match(rule.regex);
    if (match) {
      result.os.name = rule.name;
      result.os.version = (match[1] || match[2] || '').replace(/_/g, '.');
      break;
    }
  }

  // 平台架构
  if (ua.includes('Win64') || ua.includes('x64')) result.os.platform = 'x64';
  else if (ua.includes('Win32') || ua.includes('x86')) result.os.platform = 'x86';
  else if (ua.includes('arm64') || ua.includes('ARM64')) result.os.platform = 'ARM64';
  else if (ua.includes('arm')) result.os.platform = 'ARM';

  // 设备类型检测
  if (/Mobile|Android.*Mobile|iPhone|iPod/.test(ua)) {
    result.device.type = 'Mobile';
  } else if (/iPad|Tablet|Android(?!.*Mobile)/.test(ua)) {
    result.device.type = 'Tablet';
  } else if (/TV|SmartTV|AppleTV/.test(ua)) {
    result.device.type = 'TV';
  } else if (/VR|Oculus/.test(ua)) {
    result.device.type = 'VR';
  }

  // 设备厂商
  const vendorRules = [
    { name: 'Apple', regex: /iPhone|iPad|iPod|Macintosh/ },
    { name: 'Samsung', regex: /Samsung/ },
    { name: 'Huawei', regex: /Huawei|HONOR/ },
    { name: 'Xiaomi', regex: /MI|Mi|Redmi/ },
    { name: 'OPPO', regex: /OPPO/ },
    { name: 'vivo', regex: /vivo/ },
    { name: 'Google', regex: /Pixel/ },
    { name: 'OnePlus', regex: /OnePlus/ },
  ];

  for (const rule of vendorRules) {
    if (rule.regex.test(ua)) {
      result.device.vendor = rule.name;
      break;
    }
  }

  return result;
}

// 信息卡片组件
function InfoCard({ 
  icon: Icon, 
  title, 
  items,
  color = 'blue'
}: { 
  icon: React.ComponentType<{ className?: string }>; 
  title: string; 
  items: { label: string; value: string }[];
  color?: 'blue' | 'green' | 'purple' | 'orange';
}) {
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
    green: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    purple: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800',
    orange: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800',
  };

  const iconColors = {
    blue: 'text-blue-500',
    green: 'text-green-500',
    purple: 'text-purple-500',
    orange: 'text-orange-500',
  };

  return (
    <div className={`p-4 rounded-xl border ${colorClasses[color]}`}>
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`w-5 h-5 ${iconColors[color]}`} />
        <span className="font-semibold text-gray-900 dark:text-white">{title}</span>
      </div>
      <div className="space-y-2">
        {items.map((item, idx) => (
          <div key={idx} className="flex justify-between text-sm">
            <span className="text-gray-500">{item.label}</span>
            <span className="font-medium text-gray-900 dark:text-gray-200">
              {item.value || '-'}
            </span>
          </div>
        ))}
      </div>

      {/* 底部广告 */}
      <AdFooter />
    </div>
  );
}

// 特性标签组件
function FeatureTag({ 
  enabled, 
  label 
}: { 
  enabled: boolean; 
  label: string;
}) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
      enabled 
        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
        : 'bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-gray-400'
    }`}>
      {enabled ? <Check className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
      {label}
    </span>
  );
}

export function UaParserTool() {
  const [ua, setUa] = useState('');
  const [parsed, setParsed] = useState<UAParseResult | null>(null);
  const [showRaw, setShowRaw] = useState(false);
  const { copied, copy } = useClipboard();

  // 获取当前浏览器 UA
  useEffect(() => {
    setUa(navigator.userAgent);
  }, []);

  // 解析 UA
  useEffect(() => {
    if (ua) {
      setParsed(parseUA(ua));
    }
  }, [ua]);

  const handleCopy = async () => {
    if (ua) {
      await copy(ua);
    }
  };

  const handleReset = () => {
    setUa(navigator.userAgent);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* 标题 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Terminal className="w-7 h-7 text-blue-500" />
          User Agent 分析器
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          解析浏览器 User Agent 字符串，获取设备、浏览器、操作系统信息
        </p>
      </div>

      {/* UA 输入 */}
      <div className="card space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            User Agent 字符串
          </label>
          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              disabled={!ua}
              className="flex items-center gap-1 px-3 py-1.5 text-xs bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 disabled:opacity-50"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? '已复制' : '复制'}
            </button>
            <button
              onClick={handleReset}
              className="flex items-center gap-1 px-3 py-1.5 text-xs bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              重置
            </button>
          </div>
        </div>
        <textarea
          value={ua}
          onChange={(e) => setUa(e.target.value)}
          placeholder="输入 User Agent 字符串..."
          className="w-full h-24 p-3 font-mono text-xs bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg resize-none dark:text-white"
        />
      </div>

      {parsed && (
        <>
          {/* 信息卡片网格 */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 浏览器信息 */}
            <InfoCard
              icon={Globe}
              title="浏览器"
              color="blue"
              items={[
                { label: '名称', value: parsed.browser.name },
                { label: '版本', value: parsed.browser.version },
                { label: '引擎', value: parsed.browser.engine },
              ]}
            />

            {/* 操作系统 */}
            <InfoCard
              icon={Layers}
              title="操作系统"
              color="green"
              items={[
                { label: '名称', value: parsed.os.name },
                { label: '版本', value: parsed.os.version },
                { label: '架构', value: parsed.os.platform },
              ]}
            />

            {/* 设备信息 */}
            <InfoCard
              icon={parsed.device.type === 'Mobile' || parsed.device.type === 'Tablet' ? Smartphone : Monitor}
              title="设备"
              color="purple"
              items={[
                { label: '类型', value: parsed.device.type },
                { label: '厂商', value: parsed.device.vendor },
                { label: '型号', value: parsed.device.model || 'Unknown' },
              ]}
            />

            {/* 屏幕信息 */}
            <InfoCard
              icon={Cpu}
              title="屏幕"
              color="orange"
              items={[
                { label: '分辨率', value: `${parsed.screen.width} × ${parsed.screen.height}` },
                { label: '色深', value: `${parsed.screen.colorDepth} bit` },
                { label: '像素比', value: `${parsed.screen.pixelRatio}x` },
              ]}
            />
          </div>

          {/* 浏览器特性 */}
          <div className="card">
            <h3 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Info className="w-5 h-5 text-blue-500" />
              浏览器特性支持
            </h3>
            <div className="flex flex-wrap gap-2">
              <FeatureTag enabled={parsed.features.cookies} label="Cookies" />
              <FeatureTag enabled={parsed.features.localStorage} label="LocalStorage" />
              <FeatureTag enabled={parsed.features.sessionStorage} label="SessionStorage" />
              <FeatureTag enabled={parsed.features.touch} label="触摸屏" />
              <FeatureTag enabled={parsed.features.webp} label="WebP 图片" />
            </div>
          </div>

          {/* 原始 UA 字符串（可折叠） */}
          <div className="card">
            <button
              onClick={() => setShowRaw(!showRaw)}
              className="flex items-center justify-between w-full text-left"
            >
              <span className="font-medium text-gray-900 dark:text-white">原始 User Agent</span>
              {showRaw ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>
            {showRaw && (
              <div className="mt-3 p-3 bg-gray-50 dark:bg-slate-900 rounded-lg">
                <code className="text-xs font-mono text-gray-700 dark:text-gray-300 break-all">
                  {ua}
                </code>
              </div>
            )}
          </div>
        </>
      )}

      {/* 提示信息 */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm text-blue-700 dark:text-blue-400">
        <p className="flex items-start gap-2">
          <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>
            User Agent 字符串可以被浏览器或用户修改，解析结果仅供参考。
            现代浏览器推荐使用 Client Hints API 获取更准确的设备信息。
          </span>
        </p>
      </div>
    </div>
  );
}
