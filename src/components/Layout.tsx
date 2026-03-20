import { useState, useEffect, useCallback, useRef, useMemo, useDeferredValue } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Menu, X, Sun, Moon, Search, 
  AlignLeft, Code, Hash, Terminal, Wrench, Database, Clock, Globe, Send,
  Minimize2, Home, ChevronDown, Shield, Sparkles
} from 'lucide-react';
import { tools, categories } from '@tools-data';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  AlignLeft, Code, Hash, Terminal, Wrench, Home, Database, Clock, Globe, Send, Shield,
};

interface LayoutProps {
  children: React.ReactNode;
  activeToolId?: string;
}

function getInitialDarkMode() {
  if (typeof document !== 'undefined') {
    return document.documentElement.classList.contains('dark');
  }

  return false;
}

function getStoredExpandedCategories() {
  if (typeof window === 'undefined') {
    return ['format', 'codec', 'security', 'dev', 'util'];
  }

  try {
    const savedExpanded = localStorage.getItem('sidebar-expanded-cats');
    return savedExpanded ? JSON.parse(savedExpanded) : ['format', 'codec', 'security', 'dev', 'util'];
  } catch {
    return ['format', 'codec', 'security', 'dev', 'util'];
  }
}

export function Layout({ children, activeToolId }: LayoutProps) {
  // SSR 友好的状态管理
  const [isDark, setIsDark] = useState(getInitialDarkMode);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<string[]>(getStoredExpandedCategories);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isClient, setIsClient] = useState(() => typeof window !== 'undefined');
  
  const navigate = useNavigate();
  const location = useLocation();
  const sidebarRef = useRef<HTMLElement>(null);
  const touchStartX = useRef<number>(0);
  const desktopSearchRef = useRef<HTMLInputElement>(null);
  const mobileSearchRef = useRef<HTMLInputElement>(null);
  const deferredSearchQuery = useDeferredValue(searchQuery);

  // 客户端挂载后读取 localStorage
  useEffect(() => {
    setIsClient(true);
    try {
      const savedTheme = localStorage.getItem('theme-dark');
      const savedExpanded = localStorage.getItem('sidebar-expanded-cats');
      if (savedTheme) {
        setIsDark(JSON.parse(savedTheme));
      } else {
        setIsDark(getInitialDarkMode());
      }
      if (savedExpanded) setExpandedCategories(JSON.parse(savedExpanded));
    } catch {
      // 忽略 localStorage 错误
    }
  }, []);

  // 保存到 localStorage
  useEffect(() => {
    if (!isClient) return;
    try {
      localStorage.setItem('theme-dark', JSON.stringify(isDark));
    } catch {}
  }, [isDark, isClient]);

  useEffect(() => {
    if (!isClient) return;
    try {
      localStorage.setItem('sidebar-expanded-cats', JSON.stringify(expandedCategories));
    } catch {}
  }, [expandedCategories, isClient]);

  // 同步暗黑模式状态到 document.documentElement
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const normalizedSearchQuery = deferredSearchQuery.trim().toLowerCase();

  const filteredTools = useMemo(() => {
    if (!normalizedSearchQuery) {
      return [];
    }

    return tools.filter((tool) =>
      tool.name.toLowerCase().includes(normalizedSearchQuery) ||
      tool.description.toLowerCase().includes(normalizedSearchQuery)
    );
  }, [normalizedSearchQuery]);

  const categorizedTools = useMemo(
    () =>
      categories.map((category) => ({
        ...category,
        tools: tools.filter((tool) => tool.category === category.id),
      })),
    []
  );

  // 切换分类展开/折叠状态
  const toggleCategory = (catId: string) => {
    setExpandedCategories(prev => {
      if (prev.includes(catId)) {
        return prev.filter(id => id !== catId);
      } else {
        return [...prev, catId];
      }
    });
  };

  // 监听滚动 - 用于头部阴影效果
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 移动端触摸滑动关闭侧边栏
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!isMobileMenuOpen) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;
    // 向左滑动超过 80px 关闭菜单
    if (diff > 80) {
      setIsMobileMenuOpen(false);
    }
  }, [isMobileMenuOpen]);

  // 键盘快捷键 - 合并到一个 useEffect 中
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // CMD/Ctrl + K 打开搜索
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (window.innerWidth >= 768) {
          desktopSearchRef.current?.focus();
        } else {
          setIsMobileMenuOpen(true);
          requestAnimationFrame(() => mobileSearchRef.current?.focus());
        }
      }
      // ESC 关闭移动端菜单或退出全屏
      if (e.key === 'Escape') {
        if (isMobileMenuOpen) {
          setIsMobileMenuOpen(false);
        } else if (isFullscreen) {
          setIsFullscreen(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileMenuOpen, isFullscreen]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setSearchQuery('');
  }, [location.pathname]);

  const activeTool = useMemo(
    () => tools.find((tool) => tool.id === activeToolId),
    [activeToolId]
  );

  // 处理工具选择
  const handleToolSelect = (toolId: string) => {
    if (toolId) {
      navigate(`/tool/${toolId}`);
    } else {
      navigate('/');
    }
    setIsMobileMenuOpen(false);
    setSearchQuery('');
  };

  return (
    <div className="min-h-screen bg-surface-50 transition-colors duration-300 dark:bg-surface-900">
      {/* 顶部导航 - 全屏时隐藏 */}
      {!isFullscreen && (
        <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'safe-area-top' : ''}`}>
          {/* 玻璃拟态背景层 */}
          <div className={`absolute inset-0 bg-surface-0/80 dark:bg-surface-800/80 backdrop-blur-xl transition-opacity duration-300 ${isScrolled ? 'opacity-100' : 'opacity-0'}`} />
          <div className={`absolute inset-0 bg-surface-0 dark:bg-surface-800 transition-opacity duration-300 ${isScrolled ? 'opacity-0' : 'opacity-100'}`} />
          
          {/* 底部边框和阴影 */}
          <div className={`absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-surface-200 dark:via-surface-700 to-transparent transition-opacity duration-300 ${isScrolled ? 'opacity-100' : 'opacity-0'}`} />
          <div className={`absolute inset-0 shadow-sm shadow-black/5 transition-opacity duration-300 ${isScrolled ? 'opacity-100' : 'opacity-0'}`} />
          
          <div className="relative max-w-[1600px] mx-auto">
            <div className="flex items-center justify-between h-14 sm:h-16 px-4">
              {/* Logo区域 */}
              <div className="flex items-center gap-3">
                {/* 移动端菜单按钮 - 优化样式 */}
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="lg:hidden relative group"
                  aria-label={isMobileMenuOpen ? "关闭菜单" : "打开菜单"}
                >
                  <div className={`absolute inset-0 rounded-xl bg-primary-500/10 transition-all duration-300 ${isMobileMenuOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`} />
                  <div className="relative flex items-center justify-center w-10 h-10 rounded-xl text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 transition-all duration-200">
                    <div className="relative w-5 h-5">
                      <Menu className={`absolute inset-0 w-5 h-5 transition-all duration-300 ${isMobileMenuOpen ? 'rotate-90 opacity-0' : 'rotate-0 opacity-100'}`} style={{ width: '20px', height: '20px' }} />
                      <X className={`absolute inset-0 w-5 h-5 transition-all duration-300 ${isMobileMenuOpen ? 'rotate-0 opacity-100' : '-rotate-90 opacity-0'}`} style={{ width: '20px', height: '20px' }} />
                    </div>
                  </div>
                </button>
                
                {/* Logo */}
                <Link 
                  to="/"
                  className="flex items-center gap-2.5 sm:gap-3 cursor-pointer group"
                >
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl blur-md opacity-40 group-hover:opacity-60 transition-opacity" />
                    <img 
                      src="/logo.svg" 
                      alt="ToolStack" 
                      className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-xl shadow-lg shadow-primary-500/20"
                      style={{ width: '32px', height: '32px' }}
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-lg sm:text-xl font-bold text-gradient">
                      ToolStack
                    </span>
                    <Sparkles className="hidden sm:block w-3.5 h-3.5 text-primary-400 animate-pulse" style={{ width: '14px', height: '14px' }} />
                  </div>
                </Link>
              </div>

              {/* 搜索框 - 桌面端 */}
              <div className="hidden md:flex flex-1 max-w-md mx-4 lg:mx-8">
                <div className="relative w-full group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Search className="w-4 h-4 text-surface-400 group-focus-within:text-primary-500 transition-colors duration-200" style={{ width: '16px', height: '16px' }} />
                  </div>
                  <input
                    ref={desktopSearchRef}
                    type="text"
                    id="tool-search"
                    name="tool-search"
                    placeholder="搜索工具..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-10 pl-10 pr-20 bg-surface-100 dark:bg-surface-700/50 rounded-xl text-sm text-surface-900 dark:text-surface-100 placeholder:text-surface-400 border-0 ring-1 ring-surface-200 dark:ring-surface-700 focus:ring-2 focus:ring-primary-500/50 transition-all duration-200"
                  />
                  <div className="absolute inset-y-0 right-2 flex items-center gap-1.5">
                    <kbd className="hidden lg:inline-flex px-2 py-0.5 text-[10px] font-medium text-surface-500 bg-surface-200 dark:bg-surface-600 rounded-md border border-surface-300 dark:border-surface-600">
                      ⌘K
                    </kbd>
                  </div>
                </div>
              </div>

              {/* 右侧操作区 */}
              <div className="flex items-center gap-1 sm:gap-2">
                {/* 主题切换按钮 - 优化样式 */}
                <button
                  onClick={toggleTheme}
                  className="relative group flex items-center justify-center w-10 h-10 rounded-xl text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 transition-all duration-200"
                  title="切换主题"
                  aria-label="切换主题"
                >
                  <div className="relative w-5 h-5">
                    <Sun
                      className="absolute inset-0 w-5 h-5 rotate-90 scale-0 opacity-0 transition-all duration-500 dark:rotate-0 dark:scale-100 dark:opacity-100"
                      style={{ width: '20px', height: '20px' }}
                    />
                    <Moon
                      className="absolute inset-0 w-5 h-5 rotate-0 scale-100 opacity-100 transition-all duration-500 dark:-rotate-90 dark:scale-0 dark:opacity-0"
                      style={{ width: '20px', height: '20px' }}
                    />
                  </div>
                </button>
                
                {/* Gitee链接 */}
                <a
                  href="https://gitee.com/yangloop/tool-stack"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden sm:flex items-center justify-center w-10 h-10 rounded-xl text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 hover:text-primary-500 dark:hover:text-primary-400 transition-all duration-200"
                  title="Gitee"
                >
                  <svg className="w-5 h-5" viewBox="0 0 1024 1024" fill="currentColor" style={{ width: '20px', height: '20px' }}>
                    <path d="M512 1024q-104 0-199-40-92-39-163-110T40 711Q0 616 0 512t40-199Q79 221 150 150T313 40q95-40 199-40t199 40q92 39 163 110t110 163q40 95 40 199t-40 199q-39 92-110 163T711 984q-95 40-199 40z m259-569H480q-10 0-17.5 7.5T455 480v64q0 10 7.5 17.5T480 569h177q11 0 18.5 7.5T683 594v13q0 31-22.5 53.5T607 683H367q-11 0-18.5-7.5T341 657V417q0-31 22.5-53.5T417 341h354q11 0 18-7t7-18v-63q0-11-7-18t-18-7H417q-38 0-72.5 14T283 283q-27 27-41 61.5T228 417v354q0 11 7 18t18 7h373q46 0 85.5-22.5t62-62Q796 672 796 626V480q0-10-7-17.5t-18-7.5z"/>
                  </svg>
                </a>

                {/* GitHub链接 */}
                <a
                  href="https://github.com/yangloop/tool-stack"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden sm:flex items-center justify-center w-10 h-10 rounded-xl text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 hover:text-primary-500 dark:hover:text-primary-400 transition-all duration-200"
                  title="GitHub"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" style={{ width: '20px', height: '20px' }}>
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </header>
      )}

      {/* 主内容区域 - 添加顶部间距给固定的header */}
      <div className={`flex ${isFullscreen ? 'h-screen' : 'max-w-[1600px] mx-auto px-0 sm:px-4 pt-14 sm:pt-16'}`}>
        {/* 侧边导航 - 全屏时隐藏 */}
        {!isFullscreen && (
          <aside 
            ref={sidebarRef}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            className={`
              fixed lg:sticky lg:top-[5.5rem] left-0 z-40 
              w-[280px] sm:w-72 
              h-[calc(100dvh-3.5rem)] sm:h-[calc(100vh-6rem)]
              bg-surface-0 dark:bg-surface-800 
              rounded-r-2xl sm:rounded-2xl 
              border-r border-surface-200 dark:border-surface-700 sm:border
              shadow-2xl shadow-black/10 dark:shadow-black/30 lg:shadow-soft
              transform transition-all duration-300 ease-out lg:transform-none 
              overflow-y-auto scrollbar-hide
              overscroll-contain
              ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}
          >
            {/* 移动端拖动手柄 */}
            <div className="lg:hidden absolute right-2 top-1/2 -translate-y-1/2 w-1 h-12 bg-surface-300 dark:bg-surface-600 rounded-full opacity-50" />
            
            <nav className="p-3 space-y-1 pb-20">
              {/* 移动端侧边栏头部 */}
              <div className="lg:hidden flex items-center justify-between px-3 py-3 mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/25">
                    <img src="/logo.svg" alt="" className="w-5 h-5" style={{ width: '20px', height: '20px' }} />
                  </div>
                  <span className="font-semibold text-surface-900 dark:text-surface-100">ToolStack</span>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-center w-8 h-8 rounded-lg text-surface-500 hover:text-surface-700 dark:hover:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
                >
                  <X className="w-4 h-4" style={{ width: '16px', height: '16px' }} />
                </button>
              </div>
              
              {/* 返回首页 */}
              <Link
                to="/"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`
                  nav-item w-full flex items-center gap-3 group
                  ${!activeToolId ? 'active' : ''}
                `}
              >
                <div className={`flex items-center justify-center w-8 h-8 rounded-lg transition-colors ${!activeToolId ? 'bg-primary-500/10 text-primary-600 dark:text-primary-400' : 'bg-surface-100 dark:bg-surface-700 text-surface-500 group-hover:text-primary-500'}`}>
                  <Home className="w-4 h-4" style={{ width: '16px', height: '16px' }} />
                </div>
                <span className="font-medium">首页</span>
              </Link>

              <div className="h-px bg-surface-200 dark:bg-surface-700 my-2"></div>

              {/* 移动端搜索 - 优化样式 */}
              <div id="mobile-search" className="md:hidden mb-3">
                <div className="relative group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400 group-focus-within:text-primary-500 transition-colors" style={{ width: '16px', height: '16px' }} />
                  <input
                    ref={mobileSearchRef}
                    type="text"
                    id="mobile-tool-search"
                    name="mobile-tool-search"
                    placeholder="搜索工具..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-11 pl-10 pr-4 bg-surface-50 dark:bg-surface-900/50 border border-surface-200 dark:border-surface-700 rounded-xl text-base text-surface-900 dark:text-surface-100 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
                    enterKeyHint="search"
                  />
                </div>
              </div>

              {/* 搜索结果 - 优化样式 */}
              {searchQuery ? (
                <div className="space-y-1">
                  <div className="flex items-center justify-between px-3 py-2">
                    <span className="text-xs font-semibold text-surface-500">
                      搜索结果
                    </span>
                    <span className="text-xs text-surface-400 bg-surface-100 dark:bg-surface-700 px-2 py-0.5 rounded-full">
                      {filteredTools.length}
                    </span>
                  </div>
                  {filteredTools.map(tool => (
                    <button
                      key={tool.id}
                      onClick={() => handleToolSelect(tool.id)}
                      className="group w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 text-left transition-all duration-200 hover:translate-x-0.5"
                    >
                      <span className="font-medium">{tool.name}</span>
                      <Search className="w-3.5 h-3.5 text-surface-300 group-hover:text-primary-400 transition-colors" style={{ width: '14px', height: '14px' }} />
                    </button>
                  ))}
                  {filteredTools.length === 0 && (
                    <div className="flex flex-col items-center justify-center px-3 py-8 text-surface-400">
                      <Search className="w-8 h-8 mb-2 opacity-30" style={{ width: '32px', height: '32px' }} />
                      <span className="text-sm">未找到相关工具</span>
                    </div>
                  )}
                </div>
              ) : (
                /* 分类折叠菜单 */
                categorizedTools.map(cat => {
                  const Icon = iconMap[cat.icon] || Wrench;
                  const isExpanded = expandedCategories.includes(cat.id);
                  const hasActiveTool = cat.tools.some((tool) => tool.id === activeToolId);
                  
                  return (
                    <div key={cat.id}>
                      <button
                        onClick={() => toggleCategory(cat.id)}
                        className={`
                          w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                          ${hasActiveTool 
                            ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400 shadow-sm shadow-primary-500/10' 
                            : 'text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700'
                          }
                        `}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`flex items-center justify-center w-7 h-7 rounded-lg ${hasActiveTool ? 'bg-primary-500/10' : 'bg-surface-100 dark:bg-surface-700'}`}>
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <span>{cat.name}</span>
                        </div>
                        <ChevronDown 
                          className={`w-4 h-4 text-surface-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                        />
                      </button>
                      
                      {/* 分类下的工具 - 优化样式 */}
                      <div className={`
                        ml-4 mt-1 space-y-0.5 transition-all duration-300 ease-out
                        ${isExpanded ? 'max-h-none opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}
                      `}>
                        {cat.tools.map(tool => (
                          <Link
                            key={tool.id}
                            to={`/tool/${tool.id}`}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={`
                              group w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-all duration-200
                              ${activeToolId === tool.id 
                                ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400 shadow-sm shadow-primary-500/5' 
                                : 'text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700 hover:translate-x-0.5'
                              }
                            `}
                          >
                            <span className="truncate font-medium">{tool.name}</span>
                            <div className="flex gap-1 shrink-0">
                              {tool.hot && (
                                <span className="flex items-center justify-center w-4 h-4 text-[9px] font-bold bg-gradient-to-br from-orange-400 to-orange-500 text-white rounded-full shadow-sm">
                                  H
                                </span>
                              )}
                              {tool.new && (
                                <span className="flex items-center justify-center w-4 h-4 text-[9px] font-bold bg-gradient-to-br from-emerald-400 to-emerald-500 text-white rounded-full shadow-sm">
                                  N
                                </span>
                              )}
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </nav>

          </aside>
        )}

        {/* 遮罩 - 优化渐变效果 */}
        {isMobileMenuOpen && !isFullscreen && (
          <div 
            className="fixed inset-0 bg-gradient-to-r from-surface-900/60 to-surface-900/40 backdrop-blur-sm z-30 lg:hidden touch-manipulation transition-opacity duration-300"
            style={{ opacity: isMobileMenuOpen ? 1 : 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          />
        )}

        {/* 主内容区 */}
        <main className={`flex-1 min-w-0 ${isFullscreen ? 'p-0 h-full overflow-hidden' : 'lg:ml-4 pt-4'}`}>
          {/* 全屏模式顶部栏 - 优化样式 */}
          {isFullscreen && (
            <div className="sticky top-0 z-50 flex items-center justify-between px-4 sm:px-6 py-3 glass-card border-b-0 mx-0 sm:mx-4 mt-0 sm:mt-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/25">
                  <img src="/logo.svg" alt="" className="w-5 h-5" style={{ width: '20px', height: '20px' }} />
                </div>
                <span className="font-semibold text-surface-900 dark:text-surface-100">
                  {activeTool?.name || 'ToolStack'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleTheme}
                  className="flex items-center justify-center w-9 h-9 rounded-xl text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
                >
                  <div className="relative h-4 w-4">
                    <Sun
                      className="absolute inset-0 h-4 w-4 rotate-90 scale-0 opacity-0 transition-all duration-500 dark:rotate-0 dark:scale-100 dark:opacity-100"
                      style={{ width: '16px', height: '16px' }}
                    />
                    <Moon
                      className="absolute inset-0 h-4 w-4 rotate-0 scale-100 opacity-100 transition-all duration-500 dark:-rotate-90 dark:scale-0 dark:opacity-0"
                      style={{ width: '16px', height: '16px' }}
                    />
                  </div>
                </button>
                <button
                  onClick={toggleFullscreen}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white text-sm font-medium shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 transition-all"
                >
                  <Minimize2 className="w-4 h-4" style={{ width: '16px', height: '16px' }} />
                  <span className="hidden sm:inline">退出全屏</span>
                </button>
              </div>
            </div>
          )}
          
          <div className={`${isFullscreen ? 'p-0 h-full' : 'bg-surface-0 dark:bg-surface-800 rounded-t-2xl sm:rounded-2xl border-t sm:border border-surface-200 dark:border-surface-700 shadow-soft min-h-[calc(100dvh-7rem)] sm:min-h-[calc(100vh-8rem)]'}`}>

            
            <div className={`${isFullscreen ? 'p-0 h-full' : 'p-4 sm:p-6 pt-2'}`}>
              {children}
            </div>
          </div>

          {/* 页脚 - 版权信息和ICP备案 - 优化样式 */}
          {!isFullscreen && (
            <footer className="mt-6 sm:mt-8 py-4 sm:py-6 px-4">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-xs text-surface-400">
                <span>© 2026 ToolStack</span>
                <span className="hidden sm:inline">·</span>
                <a 
                  href="https://beian.miit.gov.cn/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-primary-500 transition-colors"
                >
                  陕ICP备2024042581号
                </a>
              </div>
            </footer>
          )}
        </main>
      </div>
    </div>
  );
}
