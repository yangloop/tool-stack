// Home.tsx - 现代化首页仪表盘组件
import { 
  FileJson, Code, Hash, Clock, ArrowRight,
  Fingerprint, QrCode, Lock, Search, Palette, Key,
  Sparkles, History, Star, Zap, ChevronRight,
  Terminal, Wrench, AlignLeft, Database, TrendingUp,
  Box, Shield, Globe, Cpu, ShieldCheck
} from 'lucide-react';
import type { Tool } from '../types';
import { tools, categories } from '../data/tools';
import { useLocalStorage } from '../hooks/useLocalStorage';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  FileJson, Code, Hash, Clock, 
  Fingerprint, QrCode, Lock, Search, Palette, Key,
  Terminal, Wrench, AlignLeft, Database, Box, Shield, Globe, Cpu, ShieldCheck
};

interface HomeProps {
  onToolSelect: (toolId: string) => void;
}

export function Home({ onToolSelect }: HomeProps) {
  const [recentTools, setRecentTools] = useLocalStorage<string[]>('recent-tools', []);
  const [favoriteTools, setFavoriteTools] = useLocalStorage<string[]>('favorite-tools', []);

  // 获取最近使用的工具详情
  const recentToolsList = recentTools
    .map(id => tools.find(t => t.id === id))
    .filter((t): t is Tool => t !== undefined)
    .slice(0, 6);

  // 获取收藏的工具详情
  const favoriteToolsList = favoriteTools
    .map(id => tools.find(t => t.id === id))
    .filter((t): t is Tool => t !== undefined);

  // 热门工具（取前4个）
  const hotTools = tools.filter(t => t.hot).slice(0, 4);

  // 添加工具到最近使用
  const handleToolClick = (toolId: string) => {
    setRecentTools(prev => {
      const filtered = prev.filter(id => id !== toolId);
      return [toolId, ...filtered].slice(0, 10);
    });
    onToolSelect(toolId);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
      {/* Hero 区域 - 现代化渐变背景 */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 text-white">
        {/* 装饰性背景图案 */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-white rounded-full blur-3xl"></div>
        </div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')]"></div>
        
        <div className="relative px-8 py-12 md:py-16">
          <div className="flex items-center gap-2 mb-4">
            <span className="px-3 py-1 bg-white/20 backdrop-blur rounded-full text-xs font-medium">
              v2.0 全新发布
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
            ToolStack <span className="text-primary-200">开发者工具箱</span>
          </h1>
          <p className="text-primary-100 text-lg max-w-2xl mb-8 leading-relaxed">
            简洁高效的在线工具集合，助力开发效率提升。支持 JSON 格式化、Base64 编解码、二维码生成等 20+ 实用工具。
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => handleToolClick('json')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-primary-600 rounded-xl font-medium hover:bg-primary-50 transition-colors shadow-lg shadow-black/10"
            >
              <FileJson className="w-5 h-5" />
              JSON 格式化
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleToolClick('base64')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary-400/30 text-white rounded-xl font-medium hover:bg-primary-400/40 transition-colors backdrop-blur"
            >
              <Code className="w-5 h-5" />
              Base64 编解码
            </button>
          </div>
        </div>
      </div>

      {/* 最近使用 + 收藏 */}
      {(recentToolsList.length > 0 || favoriteToolsList.length > 0) && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* 最近使用 */}
          {recentToolsList.length > 0 && (
            <section className="card">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-primary-50 dark:bg-primary-900/20 rounded-xl flex items-center justify-center">
                    <History className="w-5 h-5 text-primary-500" />
                  </div>
                  <h2 className="font-semibold text-surface-900 dark:text-surface-100">最近使用</h2>
                </div>
              </div>
              <div className="space-y-1">
                {recentToolsList.map(tool => (
                  <ToolRow key={tool.id} tool={tool} onClick={() => handleToolClick(tool.id)} />
                ))}
              </div>
            </section>
          )}

          {/* 我的收藏 */}
          {favoriteToolsList.length > 0 && (
            <section className="card">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-amber-50 dark:bg-amber-900/20 rounded-xl flex items-center justify-center">
                    <Star className="w-5 h-5 text-amber-500" />
                  </div>
                  <h2 className="font-semibold text-surface-900 dark:text-surface-100">我的收藏</h2>
                </div>
              </div>
              <div className="space-y-1">
                {favoriteToolsList.map(tool => (
                  <ToolRow key={tool.id} tool={tool} onClick={() => handleToolClick(tool.id)} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* 分类快捷入口 - 玻璃拟态风格 */}
      <section>
        <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-5">工具分类</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {categories.map(cat => {
            const Icon = iconMap[cat.icon] || Wrench;
            const catToolsList = tools.filter(t => t.category === cat.id);
            return (
              <button
                key={cat.id}
                onClick={() => onToolSelect(catToolsList[0]?.id || '')}
                className="group p-5 bg-surface-0 dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 hover:border-primary-300 dark:hover:border-primary-500 hover:shadow-lg hover:shadow-primary-500/10 transition-all text-left"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-surface-100 to-surface-200 dark:from-surface-700 dark:to-surface-600 rounded-xl flex items-center justify-center mb-4 group-hover:from-primary-500 group-hover:to-primary-600 transition-all duration-300">
                  <Icon className="w-6 h-6 text-surface-600 dark:text-surface-400 group-hover:text-white transition-colors" />
                </div>
                <h3 className="font-medium text-surface-900 dark:text-surface-100 mb-1">{cat.name}</h3>
                <p className="text-xs text-surface-500">{catToolsList.length} 个工具</p>
              </button>
            );
          })}
        </div>
      </section>

      {/* 热门推荐 - 卡片悬停效果 */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-orange-50 dark:bg-orange-900/20 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-orange-500" />
            </div>
            <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-100">热门推荐</h2>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {hotTools.map(tool => (
            <ToolCard 
              key={tool.id} 
              tool={tool} 
              onClick={() => handleToolClick(tool.id)}
              isFavorite={favoriteTools.includes(tool.id)}
              onToggleFavorite={(e) => {
                e.stopPropagation();
                setFavoriteTools(prev => 
                  prev.includes(tool.id) 
                    ? prev.filter(id => id !== tool.id)
                    : [...prev, tool.id]
                );
              }}
            />
          ))}
        </div>
      </section>

      {/* 功能特性展示 */}
      <section className="grid md:grid-cols-3 gap-6">
        <div className="card text-center p-6">
          <div className="w-14 h-14 mx-auto mb-4 bg-primary-50 dark:bg-primary-900/20 rounded-2xl flex items-center justify-center">
            <Zap className="w-7 h-7 text-primary-500" />
          </div>
          <h3 className="font-semibold text-surface-900 dark:text-surface-100 mb-2">极速响应</h3>
          <p className="text-sm text-surface-500">所有工具均在本地运行，无需服务器，即刻响应</p>
        </div>
        <div className="card text-center p-6">
          <div className="w-14 h-14 mx-auto mb-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center">
            <Shield className="w-7 h-7 text-emerald-500" />
          </div>
          <h3 className="font-semibold text-surface-900 dark:text-surface-100 mb-2">隐私安全</h3>
          <p className="text-sm text-surface-500">数据不上传服务器，完全在浏览器本地处理</p>
        </div>
        <div className="card text-center p-6">
          <div className="w-14 h-14 mx-auto mb-4 bg-purple-50 dark:bg-purple-900/20 rounded-2xl flex items-center justify-center">
            <Sparkles className="w-7 h-7 text-purple-500" />
          </div>
          <h3 className="font-semibold text-surface-900 dark:text-surface-100 mb-2">持续更新</h3>
          <p className="text-sm text-surface-500">不断添加新工具，优化现有功能体验</p>
        </div>
      </section>

      {/* 更新日志 - 时间线风格 */}
      <section className="card">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-10 h-10 bg-green-50 dark:bg-green-900/20 rounded-xl flex items-center justify-center">
            <Clock className="w-5 h-5 text-green-500" />
          </div>
          <h2 className="font-semibold text-surface-900 dark:text-surface-100">最近更新</h2>
        </div>
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="flex flex-col items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <div className="w-px h-full bg-surface-200 dark:bg-surface-700 mt-2"></div>
            </div>
            <div className="pb-4">
              <span className="badge-success mb-1">NEW</span>
              <p className="text-sm text-surface-700 dark:text-surface-300 mt-1">新增 JWT 解码工具，支持解析和验证 JSON Web Token</p>
              <p className="text-xs text-surface-400 mt-1">2024-03-10</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="flex flex-col items-center">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <div className="w-px h-full bg-surface-200 dark:bg-surface-700 mt-2"></div>
            </div>
            <div className="pb-4">
              <span className="badge-primary mb-1">UPDATE</span>
              <p className="text-sm text-surface-700 dark:text-surface-300 mt-1">优化 JSON 工具性能，支持大文件处理和实时格式化</p>
              <p className="text-xs text-surface-400 mt-1">2024-03-08</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="flex flex-col items-center">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
            </div>
            <div>
              <span className="badge bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 mb-1">FEATURE</span>
              <p className="text-sm text-surface-700 dark:text-surface-300 mt-1">新增全屏模式，工具使用更专注；UI 全面现代化升级</p>
              <p className="text-xs text-surface-400 mt-1">2024-03-05</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

// 工具行（用于最近使用和收藏）
interface ToolRowProps {
  tool: Tool;
  onClick: () => void;
}

function ToolRow({ tool, onClick }: ToolRowProps) {
  const Icon = iconMap[tool.icon] || Code;
  
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors text-left group"
    >
      <div className="w-10 h-10 bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:from-primary-500 group-hover:to-primary-600 transition-all">
        <Icon className="w-5 h-5 text-primary-500 group-hover:text-white transition-colors" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-surface-900 dark:text-surface-100 text-sm">{tool.name}</span>
          {tool.hot && (
            <span className="badge-warning">HOT</span>
          )}
        </div>
        <p className="text-xs text-surface-500 truncate">{tool.description}</p>
      </div>
      <ChevronRight className="w-4 h-4 text-surface-400 flex-shrink-0" />
    </button>
  );
}

// 工具卡片（用于热门推荐）
interface ToolCardProps {
  tool: Tool;
  onClick: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: (e: React.MouseEvent) => void;
}

function ToolCard({ tool, onClick, isFavorite, onToggleFavorite }: ToolCardProps) {
  const Icon = iconMap[tool.icon] || Code;

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite?.(e);
  };

  return (
    <div
      onClick={onClick}
      className="group cursor-pointer text-left p-5 bg-surface-0 dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 hover:border-primary-300 dark:hover:border-primary-500 hover:shadow-lg hover:shadow-primary-500/10 transition-all duration-300"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 rounded-xl flex items-center justify-center group-hover:from-primary-500 group-hover:to-primary-600 transition-all duration-300">
          <Icon className="w-6 h-6 text-primary-500 group-hover:text-white transition-colors" />
        </div>
        <div className="flex items-center gap-1">
          {onToggleFavorite && (
            <button
              onClick={handleFavoriteClick}
              className={`p-1.5 rounded-lg transition-colors ${
                isFavorite 
                  ? 'text-amber-500 hover:text-amber-600' 
                  : 'text-surface-300 hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20'
              }`}
            >
              <Star className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
          )}
          {tool.new && (
            <span className="badge-success">NEW</span>
          )}
        </div>
      </div>
      <h3 className="font-semibold text-surface-900 dark:text-surface-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
        {tool.name}
      </h3>
      <p className="text-sm text-surface-500 dark:text-surface-400 mt-1.5 line-clamp-2">
        {tool.description}
      </p>
    </div>
  );
}
