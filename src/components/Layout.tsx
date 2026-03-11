import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Menu, X, Github, Sun, Moon, Search, 
  AlignLeft, Code, Hash, Terminal, Wrench, Database, Clock, Globe, Send,
  Maximize2, Minimize2, Home, ChevronDown, Shield
} from 'lucide-react';
import { tools, categories } from '../data/tools';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  AlignLeft, Code, Hash, Terminal, Wrench, Home, Database, Clock, Globe, Send, Shield,
};

interface LayoutProps {
  children: React.ReactNode;
  activeToolId?: string;
}

export function Layout({ children, activeToolId }: LayoutProps) {
  const [isDark, setIsDark] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  
  const navigate = useNavigate();

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const filteredTools = searchQuery
    ? tools.filter(t => 
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  // 自动展开当前工具所属分类
  useEffect(() => {
    if (activeToolId) {
      const tool = tools.find(t => t.id === activeToolId);
      if (tool) {
        setExpandedCategory(tool.category);
      }
    }
  }, [activeToolId]);

  // 全屏模式下按 ESC 退出
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  const activeTool = tools.find(t => t.id === activeToolId);

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
    <div className={`min-h-screen bg-surface-50 dark:bg-surface-900 transition-colors duration-300 ${isDark ? 'dark' : ''}`}>
      {/* 顶部导航 - 全屏时隐藏 */}
      {!isFullscreen && (
        <header className="sticky top-0 z-50 glass-card border-b-0 mx-4 mt-4">
          <div className="flex items-center justify-between h-14 px-4">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-xl transition-colors"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
              <Link 
                to="/"
                className="flex items-center gap-3 cursor-pointer group"
              >
                <img 
                  src="/logo.svg" 
                  alt="ToolStack" 
                  className="w-9 h-9 rounded-xl shadow-lg shadow-primary-500/25 group-hover:shadow-primary-500/40 transition-shadow"
                />
                <span className="text-xl font-bold text-gradient">
                  ToolStack
                </span>
              </Link>
            </div>

            {/* 搜索框 */}
            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <div className="relative w-full group">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400 group-focus-within:text-primary-500 transition-colors" />
                <input
                  type="text"
                  placeholder="搜索工具..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-search bg-surface-100 dark:bg-surface-800 border-0 focus:ring-2 focus:ring-primary-500/50"
                />
                <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex px-2 py-0.5 text-[10px] font-medium text-surface-400 bg-surface-200 dark:bg-surface-700 rounded">
                  ⌘K
                </kbd>
              </div>
            </div>

            {/* 右侧操作 */}
            <div className="flex items-center gap-1">
              <button
                onClick={toggleTheme}
                className="p-2.5 text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-xl transition-colors"
                title="切换主题"
              >
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <a
                href="https://gitee.com/yangloop/tool-stack"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:flex p-2.5 text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-xl transition-colors"
                title="Gitee"
              >
                <Github className="w-5 h-5" />
              </a>
            </div>
          </div>
        </header>
      )}

      <div className={`flex ${isFullscreen ? 'h-screen' : 'max-w-[1600px] mx-auto px-4 py-4'}`}>
        {/* 侧边导航 - 全屏时隐藏 */}
        {!isFullscreen && (
          <aside 
            className={`
              fixed lg:sticky lg:top-[5.5rem] left-0 z-40 w-64 h-[calc(100vh-7rem)] 
              bg-surface-0 dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700
              shadow-soft
              transform transition-transform lg:transform-none overflow-y-auto scrollbar-hide
              ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}
          >
            <nav className="p-3 space-y-1">
              {/* 返回首页 */}
              <Link
                to="/"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`
                  nav-item w-full flex items-center gap-3
                  ${!activeToolId ? 'active' : ''}
                `}
              >
                <Home className="w-4 h-4" />
                首页
              </Link>

              <div className="h-px bg-surface-200 dark:bg-surface-700 my-2"></div>

              {/* 移动端搜索 */}
              <div className="md:hidden mb-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                  <input
                    type="text"
                    placeholder="搜索工具..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="input-search w-full"
                  />
                </div>
              </div>

              {/* 搜索结果 */}
              {searchQuery ? (
                <div className="space-y-1">
                  <div className="px-3 py-2 text-xs font-semibold text-surface-500">
                    搜索结果 ({filteredTools.length})
                  </div>
                  {filteredTools.map(tool => (
                    <button
                      key={tool.id}
                      onClick={() => handleToolSelect(tool.id)}
                      className="w-full px-3 py-2 rounded-xl text-sm text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 text-left transition-colors"
                    >
                      <div className="font-medium">{tool.name}</div>
                    </button>
                  ))}
                  {filteredTools.length === 0 && (
                    <div className="px-3 py-4 text-sm text-surface-400 text-center">
                      未找到相关工具
                    </div>
                  )}
                </div>
              ) : (
                /* 分类折叠菜单 */
                categories.map(cat => {
                  const Icon = iconMap[cat.icon] || Wrench;
                  const catTools = tools.filter(t => t.category === cat.id);
                  const isExpanded = expandedCategory === cat.id;
                  const hasActiveTool = catTools.some(t => t.id === activeToolId);
                  
                  return (
                    <div key={cat.id}>
                      <button
                        onClick={() => setExpandedCategory(isExpanded ? null : cat.id)}
                        className={`
                          w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                          ${hasActiveTool 
                            ? 'bg-primary-50/50 text-primary-600 dark:bg-primary-900/10 dark:text-primary-400' 
                            : 'text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700'
                          }
                        `}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="w-4 h-4" />
                          <span>{cat.name}</span>
                        </div>
                        <ChevronDown 
                          className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} 
                        />
                      </button>
                      
                      {/* 分类下的工具 */}
                      <div className={`
                        ml-4 mt-1 space-y-0.5 overflow-hidden transition-all duration-200
                        ${isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}
                      `}>
                        {catTools.map(tool => (
                          <Link
                            key={tool.id}
                            to={`/tool/${tool.id}`}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={`
                              w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-colors
                              ${activeToolId === tool.id 
                                ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400' 
                                : 'text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700'
                              }
                            `}
                          >
                            <span className="truncate">{tool.name}</span>
                            <div className="flex gap-1">
                              {tool.hot && (
                                <span className="px-1.5 py-0 text-[10px] bg-orange-100 text-orange-600 rounded-full">H</span>
                              )}
                              {tool.new && (
                                <span className="px-1.5 py-0 text-[10px] bg-emerald-100 text-emerald-600 rounded-full">N</span>
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

        {/* 遮罩 */}
        {isMobileMenuOpen && !isFullscreen && (
          <div 
            className="fixed inset-0 bg-surface-900/50 backdrop-blur-sm z-30 lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* 主内容区 */}
        <main className={`flex-1 min-w-0 ${isFullscreen ? 'p-0 h-full overflow-auto' : 'lg:ml-4'}`}>
          {/* 全屏模式顶部栏 */}
          {isFullscreen && (
            <div className="sticky top-0 z-50 flex items-center justify-between px-6 py-3 glass-card border-b-0 mx-4 mt-4">
              <div className="flex items-center gap-3">
                <img 
                  src="/logo.svg" 
                  alt="ToolStack" 
                  className="w-8 h-8 rounded-lg"
                />
                <span className="font-semibold text-surface-900 dark:text-surface-100">
                  {activeTool?.name || 'ToolStack'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleTheme}
                  className="p-2 text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-xl transition-colors"
                >
                  {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>
                <button
                  onClick={toggleFullscreen}
                  className="btn-primary text-sm"
                >
                  <Minimize2 className="w-4 h-4" />
                  退出全屏
                </button>
              </div>
            </div>
          )}
          
          <div className={`${isFullscreen ? 'p-6' : 'bg-surface-0 dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 shadow-soft min-h-[calc(100vh-8rem)]'}`}>
            {/* 卡片内工具栏 - 包含全屏按钮 */}
            {activeToolId && !isFullscreen && (
              <div className="flex justify-end mb-4 pt-2">
                <button
                  onClick={toggleFullscreen}
                  className="btn-ghost text-xs"
                  title="全屏模式 (ESC 退出)"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  全屏使用
                </button>
              </div>
            )}
            
            <div className={`${isFullscreen ? 'p-6' : 'p-6 pt-2'}`}>
              {children}
            </div>
          </div>

          {/* 页脚 - ICP备案 */}
          {!isFullscreen && (
            <footer className="mt-6 py-4 text-center text-xs text-surface-400 border-t border-surface-200 dark:border-surface-700">
              <a 
                href="https://beian.miit.gov.cn/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-primary-500 transition-colors"
              >
                陕ICP备2024042581号
              </a>
            </footer>
          )}
        </main>
      </div>
    </div>
  );
}
