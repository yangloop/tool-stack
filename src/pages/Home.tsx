import { useMemo, useState, useEffect } from 'react';
import { 
  FileJson, Code, Hash, Clock,
  Fingerprint, QrCode, Lock, Search, Palette, Key,
  Sparkles, History, Star, Zap,
  Terminal, Wrench, AlignLeft, Database, TrendingUp,
  Shield, Globe, Braces, Link, FileCode, GitCompare,
  FileText, Wifi, Container, FileLock, Rocket, Binary
} from 'lucide-react';
import type { Tool } from '../types';
import { tools, categories } from '@tools-data';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  FileJson, Code, Hash, Clock, 
  Fingerprint, QrCode, Lock, Search, Palette, Key,
  Terminal, Wrench, AlignLeft, Database, Shield, Globe,
  Braces, Link, FileCode, GitCompare, FileText, Wifi, Container, FileLock,
  Sparkles, Rocket, Binary
};

interface HomeProps {
  onToolSelect: (toolId: string) => void;
}

export function Home({ onToolSelect }: HomeProps) {
  // SSR 友好的状态管理 - 初始用空数组，客户端再读取
  const [recentTools, setRecentTools] = useState<string[]>([]);
  const [favoriteTools, setFavoriteTools] = useState<string[]>([]);
  const [isClient, setIsClient] = useState(false);

  // 客户端挂载后读取 localStorage
  useEffect(() => {
    setIsClient(true);
    try {
      const savedRecent = localStorage.getItem('recent-tools');
      const savedFavorites = localStorage.getItem('favorite-tools');
      if (savedRecent) setRecentTools(JSON.parse(savedRecent));
      if (savedFavorites) setFavoriteTools(JSON.parse(savedFavorites));
    } catch {
      // 忽略 localStorage 错误
    }
  }, []);

  // 保存到 localStorage
  useEffect(() => {
    if (!isClient) return;
    try {
      localStorage.setItem('recent-tools', JSON.stringify(recentTools));
    } catch {}
  }, [recentTools, isClient]);

  useEffect(() => {
    if (!isClient) return;
    try {
      localStorage.setItem('favorite-tools', JSON.stringify(favoriteTools));
    } catch {}
  }, [favoriteTools, isClient]);

  const toolsById = useMemo(() => new Map(tools.map((tool) => [tool.id, tool])), []);

  const toolsByCategory = useMemo(
    () =>
      categories.map((category) => ({
        ...category,
        tools: tools.filter((tool) => tool.category === category.id),
      })),
    []
  );

  const recentToolsList = useMemo(
    () =>
      recentTools
        .map((id) => toolsById.get(id))
        .filter((tool): tool is Tool => tool !== undefined)
        .slice(0, 6),
    [recentTools, toolsById]
  );

  const favoriteToolsList = useMemo(
    () =>
      favoriteTools
        .map((id) => toolsById.get(id))
        .filter((tool): tool is Tool => tool !== undefined),
    [favoriteTools, toolsById]
  );

  const hotTools = useMemo(() => tools.filter(t => t.hot).slice(0, 6), []);
  const newTools = useMemo(() => tools.filter(t => t.new).slice(0, 4), []);
  const showRecent = isClient && recentToolsList.length > 0;
  const showFavorites = isClient && favoriteToolsList.length > 0;
  const featuredColumnClass = !showRecent && !showFavorites
    ? 'lg:col-span-3'
    : showRecent !== showFavorites
      ? 'lg:col-span-2'
      : '';

  // 添加工具到最近使用
  const handleToolClick = (toolId: string) => {
    setRecentTools(prev => {
      const filtered = prev.filter(id => id !== toolId);
      return [toolId, ...filtered].slice(0, 10);
    });
    onToolSelect(toolId);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Hero 区域 - 紧凑现代化 */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-white rounded-full blur-3xl"></div>
        </div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')]"></div>
        
        <div className="relative px-6 py-8 sm:py-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <span className="px-3 py-1 bg-white/20 backdrop-blur rounded-full text-xs font-medium">
                  {tools.length}+ 实用工具
                </span>
                <span className="px-3 py-1 bg-white/10 backdrop-blur rounded-full text-xs font-medium text-primary-100">
                  完全免费
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-3 tracking-tight">
                开发者工具箱
              </h1>
              <p className="text-primary-100 text-sm sm:text-base max-w-xl leading-relaxed">
                简洁高效的在线工具集合，支持 JSON 格式化、SQL 智能分析、Base64 编解码、二维码生成等多种实用工具，助力开发效率提升。
              </p>
            </div>
            
            {/* 快捷入口 */}
            <div className="flex flex-wrap gap-2 lg:flex-col lg:gap-2">
              <QuickAccessButton 
                icon={FileJson} 
                label="JSON 工具" 
                onClick={() => handleToolClick('json')} 
              />
              <QuickAccessButton 
                icon={Sparkles} 
                label="SQL 分析优化" 
                onClick={() => handleToolClick('sql-advisor')} 
              />
              <QuickAccessButton 
                icon={Code} 
                label="Base64 编解码" 
                onClick={() => handleToolClick('base64')} 
              />
            </div>
          </div>
        </div>
      </div>

      {/* 快捷功能区：最近使用 + 我的收藏 + 热门推荐 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 最近使用 - 只在客户端显示 */}
        {showRecent && (
          <section className="card">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-primary-50 dark:bg-primary-900/20 rounded-lg flex items-center justify-center">
                <History className="w-4 h-4 text-primary-500" />
              </div>
              <h2 className="font-semibold text-surface-900 dark:text-surface-100 text-sm">最近使用</h2>
            </div>
            <div className="space-y-1">
              {recentToolsList.slice(0, 5).map(tool => (
                <ToolRowSmall key={tool.id} tool={tool} onClick={() => handleToolClick(tool.id)} />
              ))}
            </div>
          </section>
        )}

        {/* 我的收藏 - 只在客户端显示 */}
        {showFavorites && (
          <section className="card">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-amber-50 dark:bg-amber-900/20 rounded-lg flex items-center justify-center">
                <Star className="w-4 h-4 text-amber-500" />
              </div>
              <h2 className="font-semibold text-surface-900 dark:text-surface-100 text-sm">我的收藏</h2>
            </div>
            <div className="space-y-1">
              {favoriteToolsList.slice(0, 5).map(tool => (
                <ToolRowSmall key={tool.id} tool={tool} onClick={() => handleToolClick(tool.id)} />
              ))}
            </div>
          </section>
        )}

        {/* 热门推荐 */}
        <section className={`card ${featuredColumnClass}`}>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-primary-50 dark:bg-primary-900/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-primary-500" />
            </div>
            <h2 className="font-semibold text-surface-900 dark:text-surface-100 text-sm">热门推荐</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {hotTools.map(tool => (
              <ToolItem 
                key={tool.id} 
                tool={tool} 
                onClick={() => handleToolClick(tool.id)}
              />
            ))}
          </div>
        </section>
      </div>

      {/* 全部工具 - 按分类展示 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-100">全部工具</h2>
          <span className="text-xs text-surface-500">共 {tools.length} 个工具</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {toolsByCategory.map(cat => {
            const Icon = iconMap[cat.icon] || Wrench;
            
            return (
              <section
                key={cat.id}
                className="card p-4 border border-surface-200/80 dark:border-surface-700/80 bg-gradient-to-b from-surface-0 to-surface-50/60 dark:from-surface-800 dark:to-surface-800/70"
              >
                <div className="flex items-center gap-2 mb-3 pb-3 border-b border-surface-100 dark:border-surface-700">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center text-white shadow-sm">
                    <Icon className="w-4 h-4" />
                  </div>
                  <h3 className="font-semibold text-surface-900 dark:text-surface-100">{cat.name}</h3>
                  <span className="ml-auto text-xs text-surface-400 bg-surface-100 dark:bg-surface-700 px-2 py-0.5 rounded-full">
                    {cat.tools.length}
                  </span>
                </div>
                <div className="space-y-1">
                  {cat.tools.map(tool => (
                    <ToolRowSmall 
                      key={tool.id} 
                      tool={tool} 
                      onClick={() => handleToolClick(tool.id)}
                      showTags
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </div>

      {/* 功能特性 */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <FeatureCard 
          icon={Zap} 
          iconBg="bg-primary-50 dark:bg-primary-900/20"
          iconColor="text-primary-500"
          title="极速响应"
          description="本地运行，无需服务器"
        />
        <FeatureCard 
          icon={Shield} 
          iconBg="bg-emerald-50 dark:bg-emerald-900/20"
          iconColor="text-emerald-500"
          title="隐私安全"
          description="数据不上传服务器"
        />
        <FeatureCard 
          icon={Rocket} 
          iconBg="bg-rose-50 dark:bg-rose-900/20"
          iconColor="text-rose-500"
          title="持续更新"
          description="不断优化功能体验"
        />
        <FeatureCard 
          icon={Sparkles} 
          iconBg="bg-amber-50 dark:bg-amber-900/20"
          iconColor="text-amber-500"
          title="简洁易用"
          description="直观友好的界面设计"
        />
      </section>

      {/* 新增工具 */}
      {newTools.length > 0 && (
        <section className="card">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-green-500" />
            </div>
            <h2 className="font-semibold text-surface-900 dark:text-surface-100">最近新增</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {newTools.map(tool => (
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
      )}
    </div>
  );
}

// 快捷入口按钮
function QuickAccessButton({ icon: Icon, label, onClick }: { icon: React.ComponentType<{ className?: string }>, label: string, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur rounded-xl text-sm font-medium transition-all duration-200 text-left group"
    >
      <Icon className="w-4 h-4 text-primary-100 group-hover:text-white transition-colors" />
      <span>{label}</span>
    </button>
  );
}

// 小型工具行（用于分类列表）
interface ToolRowSmallProps {
  tool: Tool;
  onClick: () => void;
  showTags?: boolean;
}

function ToolRowSmall({ tool, onClick, showTags }: ToolRowSmallProps) {
  const Icon = iconMap[tool.icon] || Code;
  
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-700/50 transition-colors text-left group"
    >
      <div className="w-8 h-8 bg-surface-100 dark:bg-surface-700 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-primary-50 dark:group-hover:bg-primary-900/20 transition-colors">
        <Icon className="w-4 h-4 text-surface-500 group-hover:text-primary-500 transition-colors" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="font-medium text-surface-900 dark:text-surface-100 text-sm truncate">{tool.name}</span>
          {showTags && (
            <>
              {tool.hot && (
                <span className="flex-shrink-0 text-[9px] font-bold bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-1 py-0.5 rounded">HOT</span>
              )}
              {tool.new && (
                <span className="flex-shrink-0 text-[9px] font-bold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-1 py-0.5 rounded">NEW</span>
              )}
            </>
          )}
        </div>
        <p className="text-xs text-surface-500 truncate">{tool.description}</p>
      </div>
    </button>
  );
}

// 工具项（用于热门推荐）
function ToolItem({ tool, onClick }: { tool: Tool; onClick: () => void }) {
  const Icon = iconMap[tool.icon] || Code;
  
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 p-2.5 rounded-xl bg-surface-50 dark:bg-surface-700/30 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors text-left group"
    >
      <div className="w-8 h-8 bg-white dark:bg-surface-700 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
        <Icon className="w-4 h-4 text-primary-500" />
      </div>
      <div className="flex-1 min-w-0">
        <span className="font-medium text-surface-900 dark:text-surface-100 text-sm block truncate">{tool.name}</span>
      </div>
    </button>
  );
}

// 功能特性卡片
function FeatureCard({ icon: Icon, iconBg, iconColor, title, description }: { 
  icon: React.ComponentType<{ className?: string }>, 
  iconBg: string,
  iconColor: string,
  title: string, 
  description: string 
}) {
  return (
    <div className="card p-4 text-center">
      <div className={`w-10 h-10 mx-auto mb-2 ${iconBg} rounded-xl flex items-center justify-center`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
      <h3 className="font-medium text-surface-900 dark:text-surface-100 text-sm mb-1">{title}</h3>
      <p className="text-xs text-surface-500">{description}</p>
    </div>
  );
}

// 工具卡片（用于新增工具）
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
      className="group cursor-pointer text-left p-4 bg-surface-0 dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 hover:border-primary-300 dark:hover:border-primary-500 hover:shadow-lg hover:shadow-primary-500/10 transition-all duration-300"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 rounded-xl flex items-center justify-center group-hover:from-primary-500 group-hover:to-primary-600 transition-all duration-300">
          <Icon className="w-5 h-5 text-primary-500 group-hover:text-white transition-colors" />
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
            <span className="text-[9px] font-bold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded">NEW</span>
          )}
        </div>
      </div>
      <h3 className="font-semibold text-surface-900 dark:text-surface-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors text-sm">
        {tool.name}
      </h3>
      <p className="text-xs text-surface-500 dark:text-surface-400 mt-1 line-clamp-2">
        {tool.description}
      </p>
    </div>
  );
}
