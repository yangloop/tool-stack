import { useState, useCallback, useEffect } from 'react';
import { 
  Sparkles, Database, AlertTriangle, CheckCircle, 
  Info, Lightbulb, Trash2, Play, Copy, Check,
  Zap, Search, Table2, AlertCircle, Settings,
  X, BarChart3, Code2, Eye, EyeOff, ArrowRight,
  AlignLeft, Maximize2, Minimize2
} from 'lucide-react';
import { useClipboard } from '../../../hooks/useLocalStorage';
import { useSqlAdvisor } from '../hooks/useSqlAdvisor';
import { AdInArticle, AdFooter } from '../../../components/ads';
import { MonacoCodeEditor } from '../../../components/MonacoCodeEditor';
import { ToolInfoAuto } from './ToolInfoSection';
import { ToolHeader } from '../../../components/common';

// 支持的数据库类型
type DatabaseType = 'mysql' | 'postgresql' | 'sqlite' | 'sqlserver';

// 分析结果类型
type AnalysisType = 'critical' | 'warning' | 'info' | 'optimization' | 'success';

// 数据库配置
const DATABASE_CONFIGS: Record<DatabaseType, { name: string; description: string; features: string[] }> = {
  mysql: {
    name: 'MySQL / MariaDB',
    description: 'MySQL 5.7+ / 8.0+ 及 MariaDB 10.3+',
    features: ['完整的DDL支持', 'JSON类型', '窗口函数', 'CTE', 'MariaDB兼容']
  },
  postgresql: {
    name: 'PostgreSQL',
    description: 'PostgreSQL 12+',
    features: ['高级数据类型', '数组类型', 'JSONB', '全文索引']
  },
  sqlite: {
    name: 'SQLite',
    description: 'SQLite 3.x',
    features: ['轻量级', '文件数据库', '有限ALTER支持']
  },
  sqlserver: {
    name: 'SQL Server',
    description: 'Microsoft SQL Server 2016+',
    features: ['T-SQL支持', '聚集索引', '分区表', '窗口函数']
  }
};

export function SqlAdvisorTool() {
  // 状态
  const [ddlInput, setDdlInput] = useState('');
  const [sqlInput, setSqlInput] = useState('');
  const [dbType, setDbType] = useState<DatabaseType>('mysql');
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | AnalysisType>('all');
  const [showDDLOnly, setShowDDLOnly] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { copied, copy } = useClipboard();

  // 使用 SQL Advisor Hook
  const { results, schemas, isAnalyzing, analyze, reset, error, hasAnalyzed } = useSqlAdvisor();

  // 按类别分组的结果
  const filteredResults = (() => {
    if (activeTab === 'all') return results;
    return results.filter(r => r.type === activeTab);
  })();

  // 统计信息
  const stats = (() => ({
    critical: results.filter(r => r.type === 'critical').length,
    warning: results.filter(r => r.type === 'warning').length,
    info: results.filter(r => r.type === 'info').length,
    optimization: results.filter(r => r.type === 'optimization').length,
    success: results.filter(r => r.type === 'success').length,
    total: results.length
  }))();

  // 格式化 SQL
  const formatSQL = async (sql: string): Promise<string> => {
    if (!sql.trim()) return sql;
    try {
      const { format } = await import('sql-formatter');
      // 映射数据库类型到 sql-formatter 支持的类型
      const formatterDialect: Record<DatabaseType, string> = {
        mysql: 'mysql',
        postgresql: 'postgresql',
        sqlite: 'sqlite',
        sqlserver: 'transactsql',
      };
      
      return format(sql, {
        language: formatterDialect[dbType] as any,
        tabWidth: 2,
        keywordCase: 'upper',
        linesBetweenQueries: 2,
      });
    } catch (e) {
      // 格式化失败时返回原内容
      return sql;
    }
  };

  const handleFormatDDL = () => {
    void (async () => {
      setDdlInput(await formatSQL(ddlInput));
    })();
  };

  const handleFormatSQL = () => {
    void (async () => {
      setSqlInput(await formatSQL(sqlInput));
    })();
  };

  // 事件处理
  const handleAnalyze = useCallback(() => {
    // 仅分析DDL模式时，不传SQL输入
    analyze(showDDLOnly ? '' : sqlInput, ddlInput, dbType);
  }, [analyze, sqlInput, ddlInput, dbType, showDDLOnly]);

  const handleClear = useCallback(() => {
    setDdlInput('');
    setSqlInput('');
    reset(); // 清除分析结果
  }, [reset]);

  const handleCopyResults = async () => {
    const text = results.map((r, i) => 
      `${i + 1}. [${getTypeLabel(r.type)}] ${r.title}\n   ${r.description}${r.suggestion ? '\n   建议: ' + r.suggestion : ''}`
    ).join('\n\n');
    await copy(text);
  };

  // 加载示例 - 根据数据库类型加载对应的 DDL 和 SQL
  const loadExample = useCallback(() => {
    const examples: Record<DatabaseType, { ddl: string; sql: string }> = {
      mysql: {
        ddl: `-- 用户表
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL,
    age INT,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_status_created (status, created_at)
);

-- 订单表
CREATE TABLE orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_status_created (status, created_at),
    INDEX idx_user_status (user_id, status)
);`,
        sql: `-- 查询示例：有一些优化空间
SELECT * FROM users u
JOIN orders o ON u.id = o.user_id
WHERE u.status = 'active' 
  AND u.age > 18
ORDER BY o.created_at DESC
LIMIT 10;`
      },
      postgresql: {
        ddl: `-- 用户表
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL,
    age INTEGER,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_username ON users (username);
CREATE INDEX idx_email ON users (email);
CREATE INDEX idx_status_created ON users (status, created_at);

-- 订单表
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_id ON orders (user_id);
CREATE INDEX idx_status_created ON orders (status, created_at);
CREATE INDEX idx_user_status ON orders (user_id, status);`,
        sql: `-- 查询示例：有一些优化空间
SELECT * FROM users u
JOIN orders o ON u.id = o.user_id
WHERE u.status = 'active' 
  AND u.age > 18
ORDER BY o.created_at DESC
LIMIT 10;`
      },
      sqlite: {
        ddl: `-- 用户表
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    email TEXT NOT NULL,
    age INTEGER,
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_username ON users (username);
CREATE INDEX idx_email ON users (email);
CREATE INDEX idx_status_created ON users (status, created_at);

-- 订单表
CREATE TABLE orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_id ON orders (user_id);
CREATE INDEX idx_status_created ON orders (status, created_at);
CREATE INDEX idx_user_status ON orders (user_id, status);`,
        sql: `-- 查询示例：有一些优化空间
SELECT * FROM users u
JOIN orders o ON u.id = o.user_id
WHERE u.status = 'active' 
  AND u.age > 18
ORDER BY o.created_at DESC
LIMIT 10;`
      },
      sqlserver: {
        ddl: `-- 用户表
CREATE TABLE users (
    id INT PRIMARY KEY IDENTITY(1,1),
    username NVARCHAR(50) NOT NULL,
    email NVARCHAR(100) NOT NULL,
    age INT,
    status NVARCHAR(20) DEFAULT 'active',
    created_at DATETIME2 DEFAULT GETDATE()
);

CREATE INDEX idx_username ON users (username);
CREATE INDEX idx_email ON users (email);
CREATE INDEX idx_status_created ON users (status, created_at);

-- 订单表
CREATE TABLE orders (
    id INT PRIMARY KEY IDENTITY(1,1),
    user_id INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    status NVARCHAR(20) DEFAULT 'pending',
    created_at DATETIME2 DEFAULT GETDATE()
);

CREATE INDEX idx_user_id ON orders (user_id);
CREATE INDEX idx_status_created ON orders (status, created_at);
CREATE INDEX idx_user_status ON orders (user_id, status);`,
        sql: `-- 查询示例：有一些优化空间
SELECT * FROM users u
INNER JOIN orders o ON u.id = o.user_id
WHERE u.status = 'active' 
  AND u.age > 18
ORDER BY o.created_at DESC
OFFSET 0 ROWS FETCH NEXT 10 ROWS ONLY;`
      }
    };

    const example = examples[dbType];
    if (example) {
      setDdlInput(example.ddl);
      setSqlInput(example.sql);
    }
  }, [dbType]);

  // 渲染辅助函数
  const getTypeIcon = (type: AnalysisType) => {
    switch (type) {
      case 'critical': return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case 'info': return <Info className="w-5 h-5 text-blue-500" />;
      case 'optimization': return <Lightbulb className="w-5 h-5 text-green-500" />;
      case 'success': return <CheckCircle className="w-5 h-5 text-emerald-500" />;
    }
  };

  const getTypeStyle = (type: AnalysisType) => {
    switch (type) {
      case 'critical': return 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10';
      case 'warning': return 'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/10';
      case 'info': return 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/10';
      case 'optimization': return 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/10';
      case 'success': return 'border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/10';
    }
  };

  const getTypeLabel = (type: AnalysisType) => {
    switch (type) {
      case 'critical': return '严重';
      case 'warning': return '警告';
      case 'info': return '提示';
      case 'optimization': return '优化';
      case 'success': return '通过';
    }
  };

  const getTypeBadgeStyle = (type: AnalysisType) => {
    switch (type) {
      case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'warning': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
      case 'info': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'optimization': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'success': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300';
    }
  };

  const parsedDDL = schemas.length > 0;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isFullscreen]);

  const inputPanels = (
    <div className={`grid ${showDDLOnly ? 'grid-cols-1' : 'lg:grid-cols-2'} gap-3 sm:gap-4 mb-4`}>
      <div className="card flex flex-col p-4 sm:p-5">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Table2 className="w-4 h-4 text-surface-500" />
            <span className="text-sm font-medium text-surface-700 dark:text-surface-300">表结构 (DDL)</span>
            <span className="text-xs text-surface-400">{dbType.toUpperCase()}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleFormatDDL}
              disabled={!ddlInput.trim()}
              className="btn-ghost btn-tool-sm disabled:opacity-30"
              title="格式化 DDL"
            >
              <AlignLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">格式化</span>
            </button>
            {parsedDDL && schemas.length > 0 && (
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                已解析 {schemas.length} 个表
              </span>
            )}
          </div>
        </div>
        <div style={{ height: showDDLOnly ? '500px' : '280px' }} className="min-h-0">
          <MonacoCodeEditor
            value={ddlInput}
            onChange={setDdlInput}
            language="sql"
            height="100%"
            wordWrap="on"
          />
        </div>
        {schemas.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {schemas.map((table) => (
              <span
                key={table.name}
                className="rounded bg-surface-100 px-2 py-1 text-xs dark:bg-surface-800"
                title={`${table.columns.length}列, ${(table.indexes || []).length}索引`}
              >
                {table.name}
              </span>
            ))}
          </div>
        )}
      </div>

      {!showDDLOnly && (
        <div className="card flex flex-col p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-surface-500" />
              <span className="text-sm font-medium text-surface-700 dark:text-surface-300">SQL 语句</span>
              <span className="text-xs text-primary-500">{dbType.toUpperCase()}</span>
            </div>
            <button
              onClick={handleFormatSQL}
              disabled={!sqlInput.trim()}
              className="btn-ghost btn-tool-sm disabled:opacity-30"
              title="格式化 SQL"
            >
              <AlignLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">格式化</span>
            </button>
          </div>
          <div style={{ height: '280px' }} className="min-h-0">
            <MonacoCodeEditor
              value={sqlInput}
              onChange={setSqlInput}
              language="sql"
              height="100%"
              wordWrap="on"
            />
          </div>
        </div>
      )}
    </div>
  );

  const renderStatsSection = () => {
    if (results.length === 0) {
      return null;
    }

    return (
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { type: 'all', label: '全部', count: stats.total, icon: BarChart3 },
          { type: 'critical', label: '严重', count: stats.critical, icon: AlertCircle },
          { type: 'warning', label: '警告', count: stats.warning, icon: AlertTriangle },
          { type: 'info', label: '提示', count: stats.info, icon: Info },
          { type: 'optimization', label: '优化', count: stats.optimization, icon: Lightbulb },
          { type: 'success', label: '通过', count: stats.success, icon: CheckCircle },
        ].map(({ type, label, count, icon: Icon }) => (
          <button
            key={type}
            onClick={() => setActiveTab(type as 'all' | AnalysisType)}
            className={`rounded-lg border p-3 text-left transition-all ${
              activeTab === type
                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-purple-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <Icon className="w-4 h-4 text-gray-500" />
              <span className={`text-lg font-bold ${
                count > 0 && type !== 'success' && type !== 'all' && type !== 'info'
                  ? type === 'critical' ? 'text-red-500' : 'text-amber-500'
                  : 'text-gray-700 dark:text-gray-300'
              }`}>
                {count}
              </span>
            </div>
            <div className="mt-1 text-xs text-surface-500 dark:text-surface-400">{label}</div>
          </button>
        ))}
      </div>
    );
  };

  const renderResultsList = () => {
    if (filteredResults.length === 0) {
      return null;
    }

    return (
      <div className="space-y-3">
        {filteredResults.map((result) => (
          <div
            key={result.id}
            className={`rounded-lg border p-4 transition-all hover:shadow-md ${getTypeStyle(result.type)}`}
          >
            <div className="flex items-start gap-3">
              {getTypeIcon(result.type)}
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <span className={`rounded px-2 py-0.5 text-xs font-medium ${getTypeBadgeStyle(result.type)}`}>
                    {getTypeLabel(result.type)}
                  </span>
                  <span className="text-xs text-surface-500 dark:text-surface-400">
                    {result.category}
                  </span>
                  {result.line && (
                    <span className="text-xs text-surface-400">
                      第{result.line}行
                    </span>
                  )}
                </div>
                <h4 className="mb-1 font-medium text-gray-900 dark:text-white">
                  {result.title}
                </h4>
                <p className="mb-2 text-sm text-gray-600 dark:text-gray-300">
                  {result.description}
                </p>
                {result.suggestion && (
                  <div className="flex items-start gap-2 text-sm">
                    <ArrowRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary-500" />
                    <span className="text-primary-700 dark:text-primary-300">
                      {result.suggestion}
                    </span>
                  </div>
                )}
                {result.sql && (
                  <div className="mt-2 overflow-x-auto rounded bg-surface-100 p-2 text-xs font-mono text-surface-600 dark:bg-surface-800 dark:text-surface-400">
                    {result.sql}
                  </div>
                )}
                {result.details && result.details.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {result.details.map((detail, idx) => (
                      <li key={idx} className="flex items-start gap-1 text-xs text-surface-500 dark:text-surface-400">
                        <span className="text-primary-500">•</span>
                        {detail}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderEmptyState = () => {
    if (!(filteredResults.length === 0 && sqlInput && !isAnalyzing && hasAnalyzed)) {
      return null;
    }

    return (
      <div className="card p-8 text-center">
        <CheckCircle className="mx-auto mb-3 h-12 w-12 text-green-500" />
        <h3 className="mb-1 text-lg font-medium text-surface-900 dark:text-surface-100">
          未发现问题
        </h3>
        <p className="text-sm text-surface-500 dark:text-surface-400">
          {activeTab === 'all'
            ? '已分析SQL语句，未发现明显问题'
            : `当前筛选条件下没有${getTypeLabel(activeTab)}类型的结果`}
        </p>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto">
      <ToolHeader
        icon={Sparkles}
        title="SQL 优化建议"
        description="智能分析SQL语法、检查DDL一致性、优化索引使用"
        iconColorClass="text-purple-500"
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFullscreen(true)}
              className="btn-tool-sm sm:btn-tool btn-ghost"
              title="全屏使用"
            >
              <Maximize2 className="w-4 h-4" />
              <span className="hidden sm:inline">全屏使用</span>
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="btn-ghost btn-tool"
              title="设置"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        }
      />

      {/* 设置面板 */}
      {showSettings && (
        <div className="card p-4 mb-4 border-purple-200 dark:border-purple-800">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-surface-900 dark:text-surface-100 flex items-center gap-2">
              <Database className="w-4 h-4" />
              数据库类型
            </h3>
            <button onClick={() => setShowSettings(false)}>
              <X className="w-4 h-4 text-surface-400" />
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {(Object.keys(DATABASE_CONFIGS) as DatabaseType[]).map((type) => (
              <button
                key={type}
                onClick={() => setDbType(type)}
                className={`p-3 rounded-lg border text-left transition-all ${
                  dbType === type
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-surface-200 dark:border-surface-700 hover:border-primary-300'
                }`}
              >
                <div className="font-medium text-sm text-surface-900 dark:text-surface-100">
                  {DATABASE_CONFIGS[type].name}
                </div>
                <div className="text-xs text-surface-500 dark:text-surface-400 mt-1">
                  {DATABASE_CONFIGS[type].description}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 工具栏 */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <button 
          onClick={handleAnalyze} 
          disabled={isAnalyzing || (!showDDLOnly && !sqlInput.trim())} 
          className="btn-primary btn-tool disabled:opacity-50"
        >
          {isAnalyzing ? (
            <Zap className="w-3.5 h-3.5 flex-shrink-0 animate-pulse" />
          ) : (
            <Play className="w-3.5 h-3.5 flex-shrink-0" />
          )}
          {isAnalyzing ? '分析中...' : showDDLOnly ? '分析DDL' : '分析SQL'}
        </button>
        <button onClick={handleClear} className="btn-ghost-danger btn-tool">
          <Trash2 className="w-3.5 h-3.5 flex-shrink-0" />
          清空
        </button>
        <button onClick={loadExample} className="btn-secondary btn-tool">
          <Code2 className="w-3.5 h-3.5 flex-shrink-0" />
          加载示例
        </button>
        {results.length > 0 && (
          <button onClick={handleCopyResults} className="btn-secondary btn-tool">
            {copied ? <Check className="w-3.5 h-3.5 flex-shrink-0" /> : <Copy className="w-3.5 h-3.5 flex-shrink-0" />}
            {copied ? '已复制' : '复制结果'}
          </button>
        )}
        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={() => setShowDDLOnly(!showDDLOnly)}
            className={`btn-tool ${showDDLOnly ? 'btn-primary' : 'btn-ghost'}`}
          >
            {showDDLOnly ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {showDDLOnly ? '显示全部' : '仅分析DDL'}
          </button>
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="mb-4 p-4 rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-800">
          <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {inputPanels}

      {results.length > 0 && <div className="mb-4">{renderStatsSection()}</div>}

      {filteredResults.length > 0 && (
        <div className="card p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Search className="w-5 h-5 text-purple-500" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">分析结果</h3>
              <span className="text-sm text-gray-500">
                共 {filteredResults.length} 条
                {activeTab !== 'all' && ` (${getTypeLabel(activeTab)})`}
              </span>
            </div>
          </div>
          {renderResultsList()}
        </div>
      )}

      {renderEmptyState()}

      <AdInArticle />

      <ToolInfoAuto toolId="sql-advisor" />

      <AdFooter />

      {isFullscreen && (
        <div className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-surface-0 dark:bg-surface-900">
          <div className="flex h-14 flex-shrink-0 items-center justify-between border-b border-surface-200 bg-surface-0 px-4 dark:border-surface-700 dark:bg-surface-800">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-purple-500" />
              <span className="font-medium text-surface-900 dark:text-surface-100">SQL 优化建议</span>
              <span className="hidden text-xs text-surface-400 sm:inline">按 ESC 退出全屏</span>
            </div>
            <button
              onClick={() => setIsFullscreen(false)}
              className="btn-tool-sm sm:btn-tool btn-ghost flex-shrink-0"
              title="退出全屏"
            >
              <Minimize2 className="w-4 h-4" />
              <span className="hidden sm:inline">退出全屏</span>
            </button>
          </div>

          <div className="border-b border-surface-200 bg-surface-50/90 px-3 py-2 dark:border-surface-700 dark:bg-surface-900/60">
            <div className="flex flex-nowrap items-center gap-2 overflow-x-auto pb-1">
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing || (!showDDLOnly && !sqlInput.trim())}
                className="btn-primary btn-tool flex-shrink-0 disabled:opacity-50"
              >
                {isAnalyzing ? <Zap className="w-3.5 h-3.5 flex-shrink-0 animate-pulse" /> : <Play className="w-3.5 h-3.5 flex-shrink-0" />}
                {isAnalyzing ? '分析中...' : showDDLOnly ? '分析DDL' : '分析SQL'}
              </button>
              <button onClick={handleClear} className="btn-ghost-danger btn-tool flex-shrink-0">
                <Trash2 className="w-3.5 h-3.5 flex-shrink-0" />
                清空
              </button>
              <button onClick={loadExample} className="btn-secondary btn-tool flex-shrink-0">
                <Code2 className="w-3.5 h-3.5 flex-shrink-0" />
                加载示例
              </button>
              <button
                onClick={() => setShowDDLOnly(!showDDLOnly)}
                className={`btn-tool flex-shrink-0 ${showDDLOnly ? 'btn-primary' : 'btn-ghost'}`}
              >
                {showDDLOnly ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                {showDDLOnly ? '显示全部' : '仅分析DDL'}
              </button>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="btn-secondary btn-tool flex-shrink-0"
              >
                <Settings className="w-3.5 h-3.5 flex-shrink-0" />
                设置
              </button>
            </div>
          </div>

          {showSettings && (
            <div className="border-b border-surface-200 bg-surface-0 px-4 py-3 dark:border-surface-700 dark:bg-surface-800">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                {(Object.keys(DATABASE_CONFIGS) as DatabaseType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => setDbType(type)}
                    className={`rounded-lg border p-3 text-left transition-all ${
                      dbType === type
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-surface-200 dark:border-surface-700 hover:border-primary-300'
                    }`}
                  >
                    <div className="text-sm font-medium text-surface-900 dark:text-surface-100">
                      {DATABASE_CONFIGS[type].name}
                    </div>
                    <div className="mt-1 text-xs text-surface-500 dark:text-surface-400">
                      {DATABASE_CONFIGS[type].description}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="border-b border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            </div>
          )}

          <div className="min-h-0 flex-1 overflow-hidden p-4">
            <div className="grid h-full min-h-0 gap-4 lg:grid-rows-[minmax(300px,1fr)_minmax(260px,1fr)]">
              <div className={`grid min-h-0 ${showDDLOnly ? 'grid-cols-1' : 'lg:grid-cols-2'} gap-4`}>
                <div className="min-h-0 overflow-hidden rounded-2xl border border-surface-200 bg-surface-0 p-4 pb-5 shadow-soft dark:border-surface-700 dark:bg-surface-800 flex flex-col">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Table2 className="w-4 h-4 text-surface-500" />
                      <span className="text-sm font-medium text-surface-700 dark:text-surface-300">表结构 (DDL)</span>
                      <span className="text-xs text-surface-400">{dbType.toUpperCase()}</span>
                    </div>
                    <button
                      onClick={handleFormatDDL}
                      disabled={!ddlInput.trim()}
                      className="btn-ghost btn-tool-sm disabled:opacity-30"
                    >
                      <AlignLeft className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">格式化</span>
                    </button>
                  </div>
                  <div className="min-h-0 flex-1">
                    <MonacoCodeEditor
                      value={ddlInput}
                      onChange={setDdlInput}
                      language="sql"
                      height="100%"
                      wordWrap="on"
                    />
                  </div>
                </div>

                {!showDDLOnly && (
                  <div className="min-h-0 overflow-hidden rounded-2xl border border-surface-200 bg-surface-0 p-4 pb-5 shadow-soft dark:border-surface-700 dark:bg-surface-800 flex flex-col">
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Database className="w-4 h-4 text-surface-500" />
                        <span className="text-sm font-medium text-surface-700 dark:text-surface-300">SQL 语句</span>
                        <span className="text-xs text-primary-500">{dbType.toUpperCase()}</span>
                      </div>
                      <button
                        onClick={handleFormatSQL}
                        disabled={!sqlInput.trim()}
                        className="btn-ghost btn-tool-sm disabled:opacity-30"
                      >
                        <AlignLeft className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">格式化</span>
                      </button>
                    </div>
                    <div className="min-h-0 flex-1">
                      <MonacoCodeEditor
                        value={sqlInput}
                        onChange={setSqlInput}
                        language="sql"
                        height="100%"
                        wordWrap="on"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="min-h-0 overflow-hidden rounded-2xl border border-surface-200 bg-surface-0 shadow-soft dark:border-surface-700 dark:bg-surface-800">
                <div className="border-b border-surface-200 px-4 py-3 dark:border-surface-700">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Search className="w-5 h-5 text-purple-500" />
                      <h3 className="text-base font-semibold text-gray-900 dark:text-white">分析结果</h3>
                      <span className="text-sm text-gray-500">
                        共 {filteredResults.length} 条
                        {activeTab !== 'all' && ` (${getTypeLabel(activeTab)})`}
                      </span>
                    </div>
                    {results.length > 0 && (
                      <button onClick={handleCopyResults} className="btn-secondary btn-tool-sm">
                        {copied ? <Check className="w-3.5 h-3.5 flex-shrink-0" /> : <Copy className="w-3.5 h-3.5 flex-shrink-0" />}
                        {copied ? '已复制' : '复制结果'}
                      </button>
                    )}
                  </div>
                  {renderStatsSection()}
                </div>

                <div className="h-full overflow-y-auto p-4">
                  {filteredResults.length > 0 ? (
                    renderResultsList()
                  ) : renderEmptyState() ? (
                    renderEmptyState()
                  ) : (
                    <div className="flex h-full min-h-[220px] items-center justify-center text-sm text-surface-500 dark:text-surface-400">
                      运行分析后，这里会展示 SQL 优化结果
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
