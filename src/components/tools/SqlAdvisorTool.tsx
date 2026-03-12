import { useState, useCallback, useMemo } from 'react';
import { 
  Sparkles, Database, AlertTriangle, CheckCircle, 
  Info, Lightbulb, Trash2, Play, Copy, Check,
  Zap, Search, Table2, AlertCircle, Settings,
  X, BarChart3, Code2, Eye, EyeOff, ArrowRight
} from 'lucide-react';
import { Parser } from 'node-sql-parser';
import { useClipboard } from '../../hooks/useLocalStorage';
import { AdInArticle, AdFooter } from '../ads';

// ==================== 类型定义 ====================

// 支持的数据库类型
type DatabaseType = 'mysql' | 'postgresql' | 'sqlite' | 'mariadb' | 'bigquery';

// 分析结果类型
type AnalysisType = 'critical' | 'warning' | 'info' | 'optimization' | 'success';

// 分析结果项
interface AnalysisResult {
  id: string;
  type: AnalysisType;
  category: string;
  title: string;
  description: string;
  sql?: string;
  line?: number;
  column?: number;
  suggestion?: string;
  details?: string[];
}

// 索引定义
interface IndexDef {
  name: string;
  columns: string[];
  isPrimary?: boolean;
  isUnique?: boolean;
  type?: 'BTREE' | 'HASH' | 'FULLTEXT' | 'SPATIAL';
}

// 列定义
interface ColumnDef {
  name: string;
  type: string;
  isPrimary?: boolean;
  isNullable?: boolean;
  defaultValue?: string;
  length?: number;
  precision?: number;
  scale?: number;
  unsigned?: boolean;
}

// 表结构定义
interface TableSchema {
  name: string;
  columns: ColumnDef[];
  indexes?: IndexDef[];
  engine?: string;
  charset?: string;
}

// 解析错误
interface ParseError {
  message: string;
  line?: number;
  column?: number;
  sql?: string;
}

// ==================== 数据库配置 ====================

const DATABASE_CONFIGS: Record<DatabaseType, { name: string; description: string; features: string[] }> = {
  mysql: {
    name: 'MySQL',
    description: 'MySQL 5.7+ / 8.0+',
    features: ['完整的DDL支持', 'JSON类型', '窗口函数', 'CTE']
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
  mariadb: {
    name: 'MariaDB',
    description: 'MariaDB 10.3+',
    features: ['MySQL兼容', '序列', '动态列']
  },
  bigquery: {
    name: 'BigQuery',
    description: 'Google BigQuery',
    features: ['嵌套重复字段', '分区表', '集群']
  }
};

// ==================== 数据类型映射 ====================

// 数据类型分类
const DATA_TYPE_CATEGORIES: Record<string, string[]> = {
  integer: ['INT', 'INTEGER', 'BIGINT', 'SMALLINT', 'TINYINT', 'MEDIUMINT', 'SERIAL', 'BIGSERIAL', 'INT2', 'INT4', 'INT8'],
  float: ['FLOAT', 'DOUBLE', 'DECIMAL', 'NUMERIC', 'REAL', 'DOUBLE PRECISION', 'FLOAT4', 'FLOAT8', 'MONEY'],
  string: ['VARCHAR', 'CHAR', 'TEXT', 'TINYTEXT', 'MEDIUMTEXT', 'LONGTEXT', 'STRING', 'CHARACTER', 'NVARCHAR', 'NCHAR', 'CLOB'],
  datetime: ['DATE', 'DATETIME', 'TIMESTAMP', 'TIME', 'YEAR', 'TIMESTAMPTZ', 'TIMETZ'],
  binary: ['BINARY', 'VARBINARY', 'BLOB', 'TINYBLOB', 'MEDIUMBLOB', 'LONGBLOB', 'BYTEA'],
  json: ['JSON', 'JSONB'],
  boolean: ['BOOLEAN', 'BOOL', 'BIT'],
  enum: ['ENUM', 'SET']
};

// ==================== 工具函数 ====================

// 获取数据类型分类
function getTypeCategory(type: string): string {
  const upperType = type.toUpperCase().replace(/\(.*\)/, '');
  for (const [cat, types] of Object.entries(DATA_TYPE_CATEGORIES)) {
    if (types.some(t => upperType.startsWith(t))) {
      return cat;
    }
  }
  return 'unknown';
}



// 检查类型是否兼容
function checkTypeCompatibility(
  columnType: string, 
  valueType: string, 
  value?: unknown
): { compatible: boolean; issue?: string; severity: 'error' | 'warning' | 'info' } {
  const colCategory = getTypeCategory(columnType);
  
  // 数值类型检查
  if (colCategory === 'integer') {
    if (valueType === 'float') {
      return { 
        compatible: false, 
        issue: `列类型为 ${columnType}（整数），但传入的是浮点数，可能导致精度丢失`,
        severity: 'warning'
      };
    }
    if (valueType === 'string') {
      return { 
        compatible: false, 
        issue: `列类型为 ${columnType}（整数），但传入的是字符串，将导致隐式类型转换，索引可能失效`,
        severity: 'error'
      };
    }
  }
  
  // 浮点数检查
  if (colCategory === 'float') {
    if (valueType === 'string') {
      return { 
        compatible: false, 
        issue: `列类型为 ${columnType}（数值），但传入的是字符串，将导致隐式类型转换`,
        severity: 'warning'
      };
    }
  }
  
  // 字符串检查
  if (colCategory === 'string') {
    if (valueType === 'integer' || valueType === 'float') {
      return { 
        compatible: true, 
        issue: `列类型为 ${columnType}（字符串），但传入的是数值，将发生隐式转换`,
        severity: 'info'
      };
    }
  }
  
  // 日期时间检查
  if (colCategory === 'datetime') {
    if (valueType === 'integer' || valueType === 'float') {
      return { 
        compatible: false, 
        issue: `列类型为 ${columnType}（日期时间），但传入的是数值，请使用正确的日期格式`,
        severity: 'error'
      };
    }
  }
  
  // JSON检查
  if (colCategory === 'json') {
    if (valueType === 'string') {
      try {
        if (typeof value === 'string') {
          JSON.parse(value);
        }
        return { compatible: true, severity: 'info' };
      } catch {
        return { 
          compatible: false, 
          issue: `列类型为 ${columnType}，但传入的字符串不是有效的JSON格式`,
          severity: 'error'
        };
      }
    }
  }
  
  return { compatible: true, severity: 'info' };
}

// 从AST节点提取值
function extractValueFromNode(node: any): { value: unknown; isStringLiteral: boolean; type: string } {
  if (!node) return { value: undefined, isStringLiteral: false, type: 'null' };
  if (node.type === 'number') return { value: node.value, isStringLiteral: false, type: 'number' };
  if (node.type === 'single_quote_string' || node.type === 'double_quote_string' || node.type === 'string') {
    return { value: node.value, isStringLiteral: true, type: 'string' };
  }
  if (node.type === 'bool') return { value: node.value, isStringLiteral: false, type: 'boolean' };
  if (node.type === 'null') return { value: null, isStringLiteral: false, type: 'null' };
  if (node.value !== undefined) {
    const extracted = extractValueFromNode(node.value);
    return extracted;
  }
  return { value: node, isStringLiteral: false, type: 'unknown' };
}

// 检测值的数据类型
function detectValueType(value: unknown, isStringLiteral: boolean = false): string {
  if (value === null || value === undefined) return 'null';
  if (isStringLiteral) return 'string';
  if (typeof value === 'object' && value !== null) {
    const node = value as any;
    if (node.type === 'number') {
      const numValue = node.value;
      return Number.isInteger(Number(numValue)) ? 'integer' : 'float';
    }
    if (node.type === 'single_quote_string' || node.type === 'double_quote_string' || node.type === 'string') {
      return 'string';
    }
    if (node.type === 'bool') return 'boolean';
    if (node.type === 'null') return 'null';
    if (node.value !== undefined) return detectValueType(node.value);
    return 'unknown';
  }
  if (typeof value === 'number') return Number.isInteger(value) ? 'integer' : 'float';
  if (typeof value === 'string') return 'string';
  if (typeof value === 'boolean') return 'boolean';
  return 'unknown';
}

// 生成唯一ID
function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

// ==================== SQL解析器扩展 ====================

// 递归提取WHERE子句中的条件
function extractWhereConditions(where: any): Array<{ 
  column: string; 
  table?: string;
  value: unknown; 
  isStringLiteral: boolean; 
  operator: string;
  valueType: string;
}> {
  const conditions: Array<{ 
    column: string; 
    table?: string;
    value: unknown; 
    isStringLiteral: boolean; 
    operator: string;
    valueType: string;
  }> = [];
  
  if (!where) return conditions;
  
  if (where.type === 'expr') {
    conditions.push(...extractWhereConditions(where.expr));
    return conditions;
  }
  
  if (where.type === 'binary_expr' && (where.operator === 'AND' || where.operator === 'OR')) {
    conditions.push(...extractWhereConditions(where.left));
    conditions.push(...extractWhereConditions(where.right));
    return conditions;
  }
  
  if (where.type === 'binary_expr') {
    let columnName = '';
    let tableName: string | undefined;
    
    if (where.left?.type === 'column_ref') {
      columnName = where.left.column;
      tableName = where.left.table;
    } else if (where.left?.type === 'column') {
      columnName = where.left.column;
    }
    
    const { value, isStringLiteral, type } = extractValueFromNode(where.right);
    
    if (columnName) {
      conditions.push({ 
        column: columnName, 
        table: tableName,
        value, 
        isStringLiteral, 
        operator: where.operator,
        valueType: type
      });
    }
    return conditions;
  }
  
  // 处理 IN 表达式
  if (where.type === 'in') {
    let columnName = '';
    let tableName: string | undefined;
    
    if (where.left?.type === 'column_ref') {
      columnName = where.left.column;
      tableName = where.left.table;
    }
    
    if (columnName && where.right) {
      const values = Array.isArray(where.right) ? where.right : [where.right];
      values.forEach((v: any) => {
        const { value, isStringLiteral, type } = extractValueFromNode(v);
        conditions.push({
          column: columnName,
          table: tableName,
          value,
          isStringLiteral,
          operator: 'IN',
          valueType: type
        });
      });
    }
  }
  
  // 处理 BETWEEN 表达式
  if (where.type === 'between') {
    let columnName = '';
    let tableName: string | undefined;
    
    if (where.left?.type === 'column_ref') {
      columnName = where.left.column;
      tableName = where.left.table;
    }
    
    if (columnName) {
      ['left', 'right'].forEach(side => {
        const node = where[side];
        const { value, isStringLiteral, type } = extractValueFromNode(node);
        conditions.push({
          column: columnName,
          table: tableName,
          value,
          isStringLiteral,
          operator: 'BETWEEN',
          valueType: type
        });
      });
    }
  }
  
  return conditions;
}

// 提取SELECT语句中的所有列和表
function extractSelectInfo(selectStmt: any): {
  selectCols: Array<{ name: string; alias?: string; table?: string }>;
  whereCols: Array<{ name: string; table?: string }>;
  orderByCols: Array<{ name: string; table?: string; direction: string }>;
  groupByCols: Array<{ name: string; table?: string }>;
  joinCols: Array<{ name: string; table?: string; type: string }>;
  whereConditions: Array<{ column: string; table?: string; value: unknown; isStringLiteral: boolean; operator: string; valueType: string }>;
  tables: Array<{ name: string; alias?: string }>;
} {
  const selectCols: Array<{ name: string; alias?: string; table?: string }> = [];
  const whereCols: Array<{ name: string; table?: string }> = [];
  const orderByCols: Array<{ name: string; table?: string; direction: string }> = [];
  const groupByCols: Array<{ name: string; table?: string }> = [];
  const joinCols: Array<{ name: string; table?: string; type: string }> = [];
  let whereConditions: Array<{ column: string; table?: string; value: unknown; isStringLiteral: boolean; operator: string; valueType: string }> = [];
  const tables: Array<{ name: string; alias?: string }> = [];

  // 提取表信息
  if (selectStmt.from) {
    const fromList = Array.isArray(selectStmt.from) ? selectStmt.from : [selectStmt.from];
    fromList.forEach((from: any) => {
      if (from.table) {
        tables.push({ 
          name: from.table, 
          alias: from.as || from.alias 
        });
      }
      
      // 处理JOIN
      if (from.join) {
        const joinType = from.join;
        if (from.on) {
          const extractJoinColumns = (expr: any) => {
            if (expr.type === 'binary_expr' && (expr.operator === 'AND' || expr.operator === 'OR')) {
              extractJoinColumns(expr.left);
              extractJoinColumns(expr.right);
            } else if (expr.type === 'binary_expr' && expr.operator === '=') {
              if (expr.left?.type === 'column_ref') {
                joinCols.push({ 
                  name: expr.left.column, 
                  table: expr.left.table,
                  type: joinType 
                });
              }
              if (expr.right?.type === 'column_ref') {
                joinCols.push({ 
                  name: expr.right.column, 
                  table: expr.right.table,
                  type: joinType 
                });
              }
            }
          };
          extractJoinColumns(from.on);
        }
      }
    });
  }

  // 提取SELECT列
  if (selectStmt.columns && Array.isArray(selectStmt.columns)) {
    selectStmt.columns.forEach((col: any) => {
      if (col.expr?.type === 'column_ref') {
        selectCols.push({ 
          name: col.expr.column, 
          alias: col.as,
          table: col.expr.table
        });
      } else if (col.expr?.column) {
        selectCols.push({ 
          name: col.expr.column,
          alias: col.as,
          table: col.expr.table
        });
      } else if (col.expr?.type === 'aggr_func') {
        // 聚合函数
        const funcName = col.expr.name;
        const arg = col.expr.args?.expr;
        if (arg?.type === 'column_ref') {
          selectCols.push({ 
            name: `${funcName}(${arg.column})`,
            alias: col.as,
            table: arg.table
          });
        } else if (arg?.column) {
          selectCols.push({ 
            name: `${funcName}(${arg.column})`,
            alias: col.as,
            table: arg.table
          });
        }
      }
    });
  }

  // 提取WHERE条件
  if (selectStmt.where) {
    whereConditions = extractWhereConditions(selectStmt.where);
    whereConditions.forEach(cond => {
      if (cond.column) {
        whereCols.push({ name: cond.column, table: cond.table });
      }
    });
  }

  // 提取ORDER BY
  if (selectStmt.orderby && Array.isArray(selectStmt.orderby)) {
    selectStmt.orderby.forEach((o: any) => {
      const direction = o.type || 'ASC';
      if (o.expr?.type === 'column_ref') {
        orderByCols.push({ 
          name: o.expr.column, 
          table: o.expr.table,
          direction: direction.toUpperCase()
        });
      } else if (typeof o.expr === 'string') {
        orderByCols.push({ name: o.expr, direction: direction.toUpperCase() });
      } else if (o.expr?.column) {
        orderByCols.push({ 
          name: o.expr.column, 
          table: o.expr.table,
          direction: direction.toUpperCase()
        });
      }
    });
  }

  // 提取GROUP BY
  if (selectStmt.groupby && Array.isArray(selectStmt.groupby)) {
    selectStmt.groupby.forEach((g: any) => {
      if (g.expr?.type === 'column_ref') {
        groupByCols.push({ name: g.expr.column, table: g.expr.table });
      } else if (typeof g.expr === 'string') {
        groupByCols.push({ name: g.expr });
      } else if (g.expr?.column) {
        groupByCols.push({ name: g.expr.column, table: g.expr.table });
      }
    });
  }

  return { selectCols, whereCols, orderByCols, groupByCols, joinCols, whereConditions, tables };
}

// ==================== 主组件 ====================

export function SqlAdvisorTool() {
  // 状态
  const [ddlInput, setDdlInput] = useState('');
  const [sqlInput, setSqlInput] = useState('');
  const [results, setResults] = useState<AnalysisResult[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [dbType, setDbType] = useState<DatabaseType>('mysql');
  const [showSettings, setShowSettings] = useState(false);

  const [activeTab, setActiveTab] = useState<'all' | AnalysisType>('all');
  const [tableSchemas, setTableSchemas] = useState<TableSchema[]>([]);
  const [parsedDDL, setParsedDDL] = useState<boolean>(false);
  const [showDDLOnly, setShowDDLOnly] = useState(false);
  const { copied, copy } = useClipboard();

  // 初始化解析器
  const parser = useMemo(() => new Parser(), []);

  // 按类别分组的结果


  // 过滤后的结果
  const filteredResults = useMemo(() => {
    if (activeTab === 'all') return results;
    return results.filter(r => r.type === activeTab);
  }, [results, activeTab]);

  // 统计信息
  const stats = useMemo(() => ({
    critical: results.filter(r => r.type === 'critical').length,
    warning: results.filter(r => r.type === 'warning').length,
    info: results.filter(r => r.type === 'info').length,
    optimization: results.filter(r => r.type === 'optimization').length,
    success: results.filter(r => r.type === 'success').length,
    total: results.length
  }), [results]);

  // ==================== DDL解析 ====================

  const parseDDL = useCallback((ddl: string, databaseType: DatabaseType): { schemas: TableSchema[]; errors: ParseError[] } => {
    const schemas: TableSchema[] = [];
    const errors: ParseError[] = [];
    
    if (!ddl.trim()) return { schemas, errors };
    
    // 分割DDL语句
    const ddlStatements = ddl.split(/;\s*/).filter(s => s.trim());

    for (let i = 0; i < ddlStatements.length; i++) {
      const ddl = ddlStatements[i].trim();
      if (!ddl) continue;

      try {
        const ast = parser.astify(ddl, { database: databaseType });
        if (Array.isArray(ast)) continue;
        
        if (ast.type === 'create' && ast.keyword === 'table') {
          const createTable = ast as any;
          const tableName = createTable.table?.[0]?.table || '';
          const columns: ColumnDef[] = [];
          const indexes: IndexDef[] = [];
          let primaryKeyColumns: string[] = [];

          if (createTable.create_definitions) {
            for (const def of createTable.create_definitions) {
              // 解析列定义
              if (def.column && def.definition) {
                let colName: string;
                if (typeof def.column === 'string') colName = def.column;
                else if (def.column.column) colName = def.column.column;
                else if (def.column.name) colName = def.column.name;
                else colName = String(def.column);

                let colType = '';
                let length: number | undefined;
                let precision: number | undefined;
                let scale: number | undefined;
                
                if (typeof def.definition === 'object') {
                  colType = def.definition.dataType || '';
                  if (def.definition.length) {
                    length = def.definition.length;
                  }
                  if (def.definition.precision !== undefined) {
                    precision = def.definition.precision;
                  }
                  if (def.definition.scale !== undefined) {
                    scale = def.definition.scale;
                  }
                } else {
                  colType = String(def.definition);
                }

                // 解析数据类型中的长度信息
                const typeMatch = colType.match(/^(\w+)\s*\((\d+)(?:,\s*(\d+))?\)/i);
                if (typeMatch) {
                  colType = typeMatch[1];
                  if (typeMatch[3]) {
                    precision = parseInt(typeMatch[2]);
                    scale = parseInt(typeMatch[3]);
                  } else {
                    length = parseInt(typeMatch[2]);
                  }
                }

                const isPrimary = def.primary_key === 'primary key' || def.unique === 'primary key';
                
                columns.push({
                  name: colName,
                  type: colType.toUpperCase(),
                  isPrimary,
                  isNullable: def.nullable?.type !== 'not null',
                  length,
                  precision,
                  scale,
                  unsigned: def.unsigned === 'unsigned'
                });

                if (isPrimary) {
                  primaryKeyColumns.push(colName);
                }

                if (def.primary_key === 'primary key') {
                  indexes.push({ name: 'PRIMARY', columns: [colName], isPrimary: true });
                }
              }

              // 解析 PRIMARY KEY 约束（多列）
              if (def.constraint === 'primary key' && def.definition) {
                let pkColumns: string[] = [];
                if (Array.isArray(def.definition)) {
                  pkColumns = def.definition.map((d: any) => {
                    if (typeof d === 'string') return d;
                    if (d.column) return d.column;
                    return String(d);
                  }).filter(Boolean);
                }
                if (pkColumns.length > 0) {
                  primaryKeyColumns = pkColumns;
                  indexes.push({ name: 'PRIMARY', columns: pkColumns, isPrimary: true });
                }
              }

              // 解析索引
              if ((def.resource === 'index' || def.resource === 'key') && def.index) {
                const idxName = typeof def.index === 'string' ? def.index : (def.index.name || def.index.column || 'index');
                let idxColumns: string[] = [];
                if (def.definition && Array.isArray(def.definition)) {
                  idxColumns = def.definition.map((d: any) => {
                    if (typeof d === 'string') return d;
                    if (d.column) return d.column;
                    if (d.expr && d.expr.column) return d.expr.column;
                    return String(d);
                  }).filter(Boolean);
                } else if (def.definition) {
                  const col = typeof def.definition === 'string' ? def.definition : (def.definition.column || String(def.definition));
                  if (col) idxColumns.push(col);
                }
                if (idxColumns.length > 0) {
                  indexes.push({ 
                    name: idxName, 
                    columns: idxColumns, 
                    isPrimary: false, 
                    isUnique: def.unique === 'unique',
                    type: def.index_type?.toUpperCase()
                  });
                }
              }

              // 解析 UNIQUE 索引
              if (def.resource === 'unique' && def.index) {
                const idxName = typeof def.index === 'string' ? def.index : (def.index.name || 'unique_index');
                let idxColumns: string[] = [];
                if (def.definition && Array.isArray(def.definition)) {
                  idxColumns = def.definition.map((d: any) => {
                    if (typeof d === 'string') return d;
                    if (d.column) return d.column;
                    return String(d);
                  }).filter(Boolean);
                } else if (def.definition) {
                  const col = typeof def.definition === 'string' ? def.definition : (def.definition.column || String(def.definition));
                  if (col) idxColumns.push(col);
                }
                if (idxColumns.length > 0) {
                  indexes.push({ 
                    name: idxName, 
                    columns: idxColumns, 
                    isPrimary: false, 
                    isUnique: true 
                  });
                }
              }
            }
          }

          schemas.push({ 
            name: tableName, 
            columns, 
            indexes,
            engine: createTable.table_options?.engine,
            charset: createTable.table_options?.charset
          });
        }
      } catch (e: any) {
        errors.push({
          message: e.message || 'DDL解析错误',
          line: i + 1,
          sql: ddl.substring(0, 100) + (ddl.length > 100 ? '...' : '')
        });
      }
    }

    return { schemas, errors };
  }, [parser]);

  // ==================== SQL分析 ====================

  const analyzeSQL = useCallback(() => {
    const newResults: AnalysisResult[] = [];
    
    if (!sqlInput.trim()) {
      setResults([]);
      return;
    }

    // 解析DDL
    const { schemas, errors: ddlErrors } = parseDDL(ddlInput, dbType);
    setTableSchemas(schemas);
    setParsedDDL(schemas.length > 0);

    // 添加DDL解析错误
    ddlErrors.forEach(err => {
      newResults.push({
        id: generateId(),
        type: 'critical',
        category: 'DDL语法检查',
        title: 'DDL语法错误',
        description: err.message,
        line: err.line,
        sql: err.sql
      });
    });

    // 解析SQL
    let ast: any;
    try {
      ast = parser.astify(sqlInput, { database: dbType });
    } catch (e: any) {
      newResults.push({
        id: generateId(),
        type: 'critical',
        category: 'SQL语法检查',
        title: 'SQL语法错误',
        description: e.message || '无法解析SQL语句',
        suggestion: '请检查SQL语法是否符合所选数据库规范'
      });
      setResults(newResults);
      return;
    }

    const statements = Array.isArray(ast) ? ast : [ast];

    statements.forEach((stmt, idx) => {
      const line = idx + 1;

      // SELECT语句分析
      if (stmt.type === 'select') {
        const selectStmt = stmt as any;
        const { 
          selectCols, 
          whereCols, 
          orderByCols, 
          groupByCols, 
          joinCols, 
          whereConditions, 
          tables 
        } = extractSelectInfo(selectStmt);

        // 1. 表名匹配检查
        if (schemas.length > 0 && tables.length > 0) {
          const schemaTableNames = new Set(schemas.map(s => s.name.toLowerCase()));
          
          tables.forEach(table => {
            const tableLower = table.name.toLowerCase();
            if (!schemaTableNames.has(tableLower)) {
              // 尝试找到相似的表名
              let suggested: string | undefined;
              for (const schema of schemas) {
                const schemaName = schema.name.toLowerCase();
                if (schemaName.includes(tableLower) || tableLower.includes(schemaName)) {
                  suggested = schema.name;
                  break;
                }
              }
              
              newResults.push({
                id: generateId(),
                type: 'critical',
                category: '表名检查',
                title: `表不存在: ${table.name}`,
                description: suggested 
                  ? `SQL中引用的表 "${table.name}" 在DDL中不存在。您是否指的是 "${suggested}"？`
                  : `SQL中引用的表 "${table.name}" 在提供的DDL中不存在。`,
                suggestion: '请检查表名拼写，或提供完整的DDL',
                line
              });
            }
          });
        }

        // 2. 字段存在性检查
        if (schemas.length > 0) {
          const allColumns = new Map<string, { table: string; column: ColumnDef }>();
          schemas.forEach(schema => {
            schema.columns.forEach(col => {
              allColumns.set(`${schema.name.toLowerCase()}.${col.name.toLowerCase()}`, { table: schema.name, column: col });
              allColumns.set(col.name.toLowerCase(), { table: schema.name, column: col });
            });
          });

          // 检查SELECT字段
          selectCols.forEach(col => {
            if (col.name === '*') return;
            const colLower = col.name.toLowerCase();
            const fullName = col.table ? `${col.table.toLowerCase()}.${colLower}` : colLower;
            
            if (!allColumns.has(colLower) && !allColumns.has(fullName)) {
              // 聚合函数不检查
              if (col.name.includes('(')) return;
              
              let suggested: string | undefined;
              for (const [key, value] of allColumns) {
                if (key.includes(colLower) || colLower.includes(key)) {
                  suggested = value.column.name;
                  break;
                }
              }
              
              newResults.push({
                id: generateId(),
                type: 'critical',
                category: '字段存在性检查',
                title: `SELECT字段不存在: ${col.name}`,
                description: suggested 
                  ? `字段 "${col.name}" 在表结构中不存在。您是否指的是 "${suggested}"？`
                  : `字段 "${col.name}" 在表结构中不存在。`,
                suggestion: '请检查字段名拼写',
                line
              });
            }
          });

          // 检查WHERE字段
          whereCols.forEach(col => {
            const colLower = col.name.toLowerCase();
            const fullName = col.table ? `${col.table.toLowerCase()}.${colLower}` : colLower;
            
            if (!allColumns.has(colLower) && !allColumns.has(fullName)) {
              newResults.push({
                id: generateId(),
                type: 'critical',
                category: '字段存在性检查',
                title: `WHERE条件字段不存在: ${col.name}`,
                description: `WHERE条件中的字段 "${col.name}" 在表结构中不存在。`,
                suggestion: '请检查字段名拼写',
                line
              });
            }
          });

          // 检查ORDER BY字段
          orderByCols.forEach(col => {
            const colLower = col.name.toLowerCase();
            const fullName = col.table ? `${col.table.toLowerCase()}.${colLower}` : colLower;
            
            if (!allColumns.has(colLower) && !allColumns.has(fullName)) {
              newResults.push({
                id: generateId(),
                type: 'critical',
                category: '字段存在性检查',
                title: `ORDER BY字段不存在: ${col.name}`,
                description: `ORDER BY中的字段 "${col.name}" 在表结构中不存在。`,
                suggestion: '请检查字段名拼写',
                line
              });
            }
          });

          // 检查GROUP BY字段
          groupByCols.forEach(col => {
            const colLower = col.name.toLowerCase();
            const fullName = col.table ? `${col.table.toLowerCase()}.${colLower}` : colLower;
            
            if (!allColumns.has(colLower) && !allColumns.has(fullName)) {
              newResults.push({
                id: generateId(),
                type: 'critical',
                category: '字段存在性检查',
                title: `GROUP BY字段不存在: ${col.name}`,
                description: `GROUP BY中的字段 "${col.name}" 在表结构中不存在。`,
                suggestion: '请检查字段名拼写',
                line
              });
            }
          });

          // 3. 数据类型匹配检查
          const checkedColumns = new Set<string>();
          for (const cond of whereConditions) {
            if (!cond.column || checkedColumns.has(cond.column)) continue;
            
            const colLower = cond.column.toLowerCase();
            const colInfo = allColumns.get(colLower);
            
            if (colInfo) {
              const valueType = detectValueType(cond.value, cond.isStringLiteral);
              const typeCheck = checkTypeCompatibility(colInfo.column.type, valueType, cond.value);
              
              if (!typeCheck.compatible || typeCheck.severity === 'error') {
                newResults.push({
                  id: generateId(),
                  type: typeCheck.severity === 'error' ? 'critical' : 'warning',
                  category: '数据类型检查',
                  title: `数据类型不匹配: ${cond.column}`,
                  description: `${typeCheck.issue}。列类型: ${colInfo.column.type}，传入值类型: ${valueType}`,
                  suggestion: `建议将值转换为 ${colInfo.column.type} 类型，或使用CAST/CONVERT函数`,
                  line
                });
                checkedColumns.add(cond.column);
              } else if (typeCheck.issue) {
                newResults.push({
                  id: generateId(),
                  type: 'info',
                  category: '数据类型检查',
                  title: `数据类型注意事项: ${cond.column}`,
                  description: typeCheck.issue,
                  line
                });
              }
            }
          }

          // 4. 索引使用检查
          analyzeIndexUsage(
            schemas, 
            tables, 
            whereCols, 
            orderByCols, 
            groupByCols, 
            joinCols, 
            newResults, 
            line
          );
        }

        // 5. SQL优化规范检查
        analyzeOptimizationRules(selectStmt, schemas, newResults, line);
      }

      // UPDATE/DELETE语句检查
      if (stmt.type === 'update' || stmt.type === 'delete') {
        const modifyStmt = stmt as any;
        
        if (!modifyStmt.where) {
          newResults.push({
            id: generateId(),
            type: 'critical',
            category: '安全规范',
            title: `危险操作: ${stmt.type.toUpperCase()} 没有WHERE条件`,
            description: `这条 ${stmt.type.toUpperCase()} 语句没有WHERE条件，将影响表中所有行！`,
            suggestion: '请添加WHERE条件以限制影响范围',
            line
          });
        }

        // 检查UPDATE是否使用了索引
        if (stmt.type === 'update' && schemas.length > 0 && modifyStmt.where) {
          const whereColumns: string[] = [];
          const conditions = extractWhereConditions(modifyStmt.where);
          conditions.forEach(c => {
            if (c.column) whereColumns.push(c.column);
          });

          analyzeWhereIndexUsage(schemas, whereColumns, newResults, line);
        }
      }

      // INSERT语句检查
      if (stmt.type === 'insert') {
        const insertStmt = stmt as any;
        
        // 检查是否指定了列名
        if (!insertStmt.columns || insertStmt.columns.length === 0) {
          newResults.push({
            id: generateId(),
            type: 'warning',
            category: '最佳实践',
            title: 'INSERT未指定列名',
            description: 'INSERT语句没有明确指定列名，依赖表的列顺序可能导致问题',
            suggestion: '建议明确指定要插入的列名',
            line
          });
        }

        // 检查表是否存在
        if (schemas.length > 0 && insertStmt.table) {
          const tableName = insertStmt.table[0]?.table;
          if (tableName) {
            const schemaTable = schemas.find(s => s.name.toLowerCase() === tableName.toLowerCase());
            if (!schemaTable) {
              newResults.push({
                id: generateId(),
                type: 'critical',
                category: '表名检查',
                title: `表不存在: ${tableName}`,
                description: `INSERT语句引用的表 "${tableName}" 在DDL中不存在`,
                line
              });
            }
          }
        }
      }
    });

    // 通用检查
    analyzeCommonPatterns(sqlInput, newResults);

    // 如果没有问题，添加成功提示
    if (newResults.length === 0) {
      newResults.push({
        id: generateId(),
        type: 'success',
        category: '综合分析',
        title: 'SQL语句检查通过',
        description: '未发现明显问题，SQL语句符合规范'
      });
    }

    setResults(newResults);
  }, [sqlInput, ddlInput, dbType, parseDDL, parser]);

  // 分析索引使用情况
  function analyzeIndexUsage(
    schemas: TableSchema[],
    tables: Array<{ name: string; alias?: string }>,
    whereCols: Array<{ name: string; table?: string }>,
    orderByCols: Array<{ name: string; table?: string; direction: string }>,
    groupByCols: Array<{ name: string; table?: string }>,
    joinCols: Array<{ name: string; table?: string; type: string }>,
    results: AnalysisResult[],
    line: number
  ) {
    // 为每个表收集查询中使用的字段
    const tableQueryInfo: Map<string, {
      whereCols: string[];
      orderByCols: Array<{ name: string; direction: string }>;
      groupByCols: string[];
      joinCols: string[];
    }> = new Map();

    // 初始化表查询信息
    schemas.forEach(schema => {
      tableQueryInfo.set(schema.name.toLowerCase(), {
        whereCols: [],
        orderByCols: [],
        groupByCols: [],
        joinCols: []
      });
    });

    // 辅助函数：获取字段所属的实际表
    const getColumnTable = (col: { name: string; table?: string }): string | null => {
      if (col.table) {
        const table = tables.find(t => 
          t.name.toLowerCase() === col.table?.toLowerCase() || 
          t.alias?.toLowerCase() === col.table?.toLowerCase()
        );
        if (table) return table.name.toLowerCase();
      }
      // 如果只有一个表，字段就属于那个表
      if (tables.length === 1) {
        return tables[0].name.toLowerCase();
      }
      // 尝试在所有表中查找该字段
      for (const schema of schemas) {
        if (schema.columns.some(c => c.name.toLowerCase() === col.name.toLowerCase())) {
          return schema.name.toLowerCase();
        }
      }
      return null;
    };

    // 分配WHERE字段到表
    whereCols.forEach(col => {
      const tableName = getColumnTable(col);
      if (tableName) {
        const info = tableQueryInfo.get(tableName);
        if (info && !info.whereCols.includes(col.name)) {
          info.whereCols.push(col.name);
        }
      }
    });

    // 分配ORDER BY字段到表
    orderByCols.forEach(col => {
      const tableName = getColumnTable(col);
      if (tableName) {
        const info = tableQueryInfo.get(tableName);
        if (info && !info.orderByCols.some(c => c.name === col.name)) {
          info.orderByCols.push({ name: col.name, direction: col.direction });
        }
      }
    });

    // 分配GROUP BY字段到表
    groupByCols.forEach(col => {
      const tableName = getColumnTable(col);
      if (tableName) {
        const info = tableQueryInfo.get(tableName);
        if (info && !info.groupByCols.includes(col.name)) {
          info.groupByCols.push(col.name);
        }
      }
    });

    // 分配JOIN字段到表
    joinCols.forEach(col => {
      const tableName = getColumnTable(col);
      if (tableName) {
        const info = tableQueryInfo.get(tableName);
        if (info && !info.joinCols.includes(col.name)) {
          info.joinCols.push(col.name);
        }
      }
    });

    // 分析每个表的索引使用情况
    schemas.forEach(schema => {
      const queryInfo = tableQueryInfo.get(schema.name.toLowerCase());
      if (!queryInfo) return;

      const indexes = schema.indexes || [];
      
      // 检查WHERE条件的索引使用
      if (queryInfo.whereCols.length > 0) {
        checkWhereIndex(schema, queryInfo.whereCols, indexes, results, line);
      }

      // 检查WHERE + ORDER BY的组合索引
      if (queryInfo.whereCols.length > 0 && queryInfo.orderByCols.length > 0) {
        checkWhereOrderByIndex(schema, queryInfo.whereCols, queryInfo.orderByCols, indexes, results, line);
      }

      // 检查WHERE + GROUP BY的组合索引
      if (queryInfo.whereCols.length > 0 && queryInfo.groupByCols.length > 0) {
        checkWhereGroupByIndex(schema, queryInfo.whereCols, queryInfo.groupByCols, indexes, results, line);
      }

      // 检查ORDER BY的索引使用
      if (queryInfo.orderByCols.length > 0) {
        checkOrderByIndex(schema, queryInfo.orderByCols, indexes, results, line);
      }

      // 检查GROUP BY的索引使用
      if (queryInfo.groupByCols.length > 0) {
        checkGroupByIndex(schema, queryInfo.groupByCols, indexes, results, line);
      }

      // 检查JOIN的索引使用
      if (queryInfo.joinCols.length > 0) {
        checkJoinIndex(schema, queryInfo.joinCols, indexes, results, line);
      }
    });
  }

  // 检查WHERE条件的索引使用
  function checkWhereIndex(
    schema: TableSchema,
    whereCols: string[],
    indexes: IndexDef[],
    results: AnalysisResult[],
    line: number
  ) {
    const whereColsLower = whereCols.map(c => c.toLowerCase());
    
    // 检查每个WHERE字段是否有索引
    const colsWithoutIndex: string[] = [];
    const partialIndexMatches: Array<{ col: string; index: IndexDef; position: number }> = [];

    for (const col of whereCols) {
      const colLower = col.toLowerCase();
      let hasIndex = false;
      
      for (const idx of indexes) {
        if (idx.columns.length === 0) continue;
        
        const idxColsLower = idx.columns.map(c => c.toLowerCase());
        
        // 检查是否是最左前缀
        if (idxColsLower[0] === colLower) {
          hasIndex = true;
          break;
        }
        
        // 记录部分匹配（字段在索引中但不是最左列）
        const position = idxColsLower.indexOf(colLower);
        if (position > 0) {
          partialIndexMatches.push({ col, index: idx, position });
        }
      }
      
      if (!hasIndex) {
        colsWithoutIndex.push(col);
      }
    }

    // 检查组合索引的最左前缀匹配
    let hasMatchingCompositeIndex = false;
    let bestMatchIndex: IndexDef | null = null;
    let bestMatchCount = 0;

    for (const idx of indexes) {
      if (idx.columns.length < 2) continue;
      
      const idxColsLower = idx.columns.map(c => c.toLowerCase());
      let matchCount = 0;
      
      for (let i = 0; i < idxColsLower.length && i < whereColsLower.length; i++) {
        if (idxColsLower[i] === whereColsLower[i]) {
          matchCount++;
        } else {
          break;
        }
      }
      
      if (matchCount > bestMatchCount) {
        bestMatchCount = matchCount;
        bestMatchIndex = idx;
      }
      
      if (matchCount === whereColsLower.length) {
        hasMatchingCompositeIndex = true;
        break;
      }
    }

    // 报告结果
    if (colsWithoutIndex.length > 0 && !hasMatchingCompositeIndex) {
      let description = `WHERE条件字段 (${colsWithoutIndex.join(', ')}) `;
      
      if (whereCols.length === 1) {
        description += '没有对应的索引，将导致全表扫描';
      } else {
        description += '没有合适的组合索引覆盖';
      }

      if (partialIndexMatches.length > 0) {
        description += `。注意: ${partialIndexMatches.map(m => 
          `"${m.col}" 在索引 ${m.index.name}(${m.index.columns.join(', ')}) 中但位于第${m.position + 1}列，不是最左前缀`
        ).join('；')}。`;
      }

      if (bestMatchIndex && bestMatchCount > 0) {
        description += ` 当前索引 ${bestMatchIndex.name}(${bestMatchIndex.columns.join(', ')}) `;
        description += `只匹配了前${bestMatchCount}个字段。`;
      }

      const suggestion = bestMatchIndex && bestMatchCount > 0
        ? `建议调整WHERE条件字段顺序为: ${bestMatchIndex.columns.slice(0, bestMatchCount).concat(colsWithoutIndex).join(', ')}，或创建新索引覆盖所有字段`
        : `建议为字段 (${colsWithoutIndex.join(', ')}) 创建索引`;

      results.push({
        id: generateId(),
        type: 'optimization',
        category: '索引优化',
        title: `缺少WHERE索引: ${schema.name}`,
        description,
        suggestion,
        line
      });
    }
  }

  // 检查WHERE + ORDER BY的组合索引
  function checkWhereOrderByIndex(
    schema: TableSchema,
    whereCols: string[],
    orderByCols: Array<{ name: string; direction: string }>,
    indexes: IndexDef[],
    results: AnalysisResult[],
    line: number
  ) {
    const combinedCols = [...whereCols, ...orderByCols.map(c => c.name)];
    const combinedColsLower = combinedCols.map(c => c.toLowerCase());
    
    let hasCombinedIndex = false;
    let bestMatch: IndexDef | null = null;

    for (const idx of indexes) {
      if (idx.columns.length < combinedCols.length) continue;
      
      const idxColsLower = idx.columns.map(c => c.toLowerCase());
      let match = true;
      
      for (let i = 0; i < combinedColsLower.length; i++) {
        if (idxColsLower[i] !== combinedColsLower[i]) {
          match = false;
          break;
        }
      }
      
      if (match) {
        hasCombinedIndex = true;
        break;
      }
      
      // 检查WHERE部分是否匹配
      const whereColsLower = whereCols.map(c => c.toLowerCase());
      let whereMatch = true;
      for (let i = 0; i < whereColsLower.length; i++) {
        if (idxColsLower[i] !== whereColsLower[i]) {
          whereMatch = false;
          break;
        }
      }
      
      if (whereMatch && !bestMatch) {
        bestMatch = idx;
      }
    }

    if (!hasCombinedIndex) {
      const whereStr = whereCols.join(', ');
      const orderStr = orderByCols.map(c => `${c.name} ${c.direction}`).join(', ');
      
      let description = `WHERE字段 (${whereStr}) 和 ORDER BY字段 (${orderStr}) `;
      description += `没有合适的组合索引。`;
      
      if (bestMatch) {
        description += ` 现有索引 ${bestMatch.name}(${bestMatch.columns.join(', ')}) 可以支持WHERE条件，但ORDER BY需要额外排序。`;
      }

      results.push({
        id: generateId(),
        type: 'optimization',
        category: '索引优化',
        title: `建议添加WHERE+ORDER BY组合索引: ${schema.name}`,
        description,
        suggestion: `建议创建组合索引 (${combinedCols.join(', ')})，字段顺序很重要：先放WHERE字段，再放ORDER BY字段`,
        line
      });
    }
  }

  // 检查WHERE + GROUP BY的组合索引
  function checkWhereGroupByIndex(
    schema: TableSchema,
    whereCols: string[],
    groupByCols: string[],
    indexes: IndexDef[],
    results: AnalysisResult[],
    line: number
  ) {
    const combinedCols = [...whereCols, ...groupByCols];
    const combinedColsLower = combinedCols.map(c => c.toLowerCase());
    
    let hasCombinedIndex = false;
    
    for (const idx of indexes) {
      if (idx.columns.length < combinedCols.length) continue;
      
      const idxColsLower = idx.columns.map(c => c.toLowerCase());
      let match = true;
      
      for (let i = 0; i < combinedColsLower.length; i++) {
        if (idxColsLower[i] !== combinedColsLower[i]) {
          match = false;
          break;
        }
      }
      
      if (match) {
        hasCombinedIndex = true;
        break;
      }
    }

    if (!hasCombinedIndex) {
      results.push({
        id: generateId(),
        type: 'optimization',
        category: '索引优化',
        title: `建议添加WHERE+GROUP BY组合索引: ${schema.name}`,
        description: `WHERE字段 (${whereCols.join(', ')}) 和 GROUP BY字段 (${groupByCols.join(', ')}) 没有合适的组合索引。`,
        suggestion: `建议创建组合索引 (${combinedCols.join(', ')})，可以消除临时表和文件排序`,
        line
      });
    }
  }

  // 检查ORDER BY的索引使用
  function checkOrderByIndex(
    schema: TableSchema,
    orderByCols: Array<{ name: string; direction: string }>,
    indexes: IndexDef[],
    results: AnalysisResult[],
    line: number
  ) {
    const orderColsOnly = orderByCols.map(c => c.name);
    const orderColsLower = orderColsOnly.map(c => c.toLowerCase());
    
    let hasIndex = false;
    
    for (const idx of indexes) {
      const idxColsLower = idx.columns.map(c => c.toLowerCase());
      
      if (orderColsLower.length > idxColsLower.length) continue;
      
      let match = true;
      for (let i = 0; i < orderColsLower.length; i++) {
        if (idxColsLower[i] !== orderColsLower[i]) {
          match = false;
          break;
        }
      }
      
      if (match) {
        hasIndex = true;
        break;
      }
    }

    if (!hasIndex) {
      const orderStr = orderByCols.map(c => `${c.name} ${c.direction}`).join(', ');
      
      results.push({
        id: generateId(),
        type: 'optimization',
        category: '索引优化',
        title: `ORDER BY缺少索引: ${schema.name}`,
        description: `ORDER BY (${orderStr}) 没有对应的索引，可能导致全表排序和临时表创建`,
        suggestion: `建议为ORDER BY字段创建索引 (${orderColsOnly.join(', ')})`,
        line
      });
    }
  }

  // 检查GROUP BY的索引使用
  function checkGroupByIndex(
    schema: TableSchema,
    groupByCols: string[],
    indexes: IndexDef[],
    results: AnalysisResult[],
    line: number
  ) {
    const groupColsLower = groupByCols.map(c => c.toLowerCase());
    
    let hasIndex = false;
    
    for (const idx of indexes) {
      const idxColsLower = idx.columns.map(c => c.toLowerCase());
      
      if (groupColsLower.length > idxColsLower.length) continue;
      
      let match = true;
      for (let i = 0; i < groupColsLower.length; i++) {
        if (idxColsLower[i] !== groupColsLower[i]) {
          match = false;
          break;
        }
      }
      
      if (match) {
        hasIndex = true;
        break;
      }
    }

    if (!hasIndex) {
      results.push({
        id: generateId(),
        type: 'optimization',
        category: '索引优化',
        title: `GROUP BY缺少索引: ${schema.name}`,
        description: `GROUP BY (${groupByCols.join(', ')}) 没有对应的索引，可能导致全表扫描和临时表创建`,
        suggestion: `建议为GROUP BY字段创建索引 (${groupByCols.join(', ')}) 或使用松散索引扫描`,
        line
      });
    }
  }

  // 检查JOIN的索引使用
  function checkJoinIndex(
    schema: TableSchema,
    joinCols: string[],
    indexes: IndexDef[],
    results: AnalysisResult[],
    line: number
  ) {
    for (const col of joinCols) {
      const colLower = col.toLowerCase();
      let hasIndex = false;
      
      for (const idx of indexes) {
        if (idx.columns.length > 0 && idx.columns[0].toLowerCase() === colLower) {
          hasIndex = true;
          break;
        }
      }
      
      if (!hasIndex) {
        results.push({
          id: generateId(),
          type: 'optimization',
          category: '索引优化',
          title: `JOIN字段缺少索引: ${schema.name}.${col}`,
          description: `JOIN条件中的字段 "${col}" 没有索引，这将导致嵌套循环连接和全表扫描`,
          suggestion: `建议为JOIN字段 "${col}" 创建索引以提高连接性能`,
          line
        });
      }
    }
  }

  // 分析UPDATE/DELETE的WHERE索引
  function analyzeWhereIndexUsage(
    schemas: TableSchema[],
    whereCols: string[],
    results: AnalysisResult[],
    line: number
  ) {
    schemas.forEach(schema => {
      const indexes = schema.indexes || [];
      const missingIndexCols: string[] = [];
      
      for (const col of whereCols) {
        const colLower = col.toLowerCase();
        const hasIndex = indexes.some(idx => 
          idx.columns.length > 0 && idx.columns[0].toLowerCase() === colLower
        );
        
        if (!hasIndex) {
          missingIndexCols.push(col);
        }
      }
      
      if (missingIndexCols.length > 0) {
        results.push({
          id: generateId(),
          type: 'warning',
          category: '索引优化',
          title: `UPDATE/DELETE缺少WHERE索引: ${schema.name}`,
          description: `WHERE条件字段 (${missingIndexCols.join(', ')}) 缺少索引，可能导致全表锁和性能问题`,
          suggestion: `建议为这些字段添加索引，或使用LIMIT限制影响行数`,
          line
        });
      }
    });
  }

  // 分析优化规范
  function analyzeOptimizationRules(
    selectStmt: any,
    _schemas: TableSchema[],
    results: AnalysisResult[],
    line: number
  ) {
    const upperSQL = sqlInput.toUpperCase();

    // 1. 避免SELECT *
    const isSelectAll = selectStmt.columns === '*' ||
      (Array.isArray(selectStmt.columns) && 
       selectStmt.columns.length === 1 &&
       (selectStmt.columns[0]?.expr?.column === '*' || 
        selectStmt.columns[0]?.expr?.type === 'star'));

    if (isSelectAll) {
      results.push({
        id: generateId(),
        type: 'warning',
        category: '查询优化',
        title: '避免使用SELECT *',
        description: '使用SELECT * 会查询所有列，可能导致不必要的I/O开销、网络传输和内存使用',
        suggestion: '明确指定需要的列名，特别是宽表（有很多列的表）',
        line
      });
    }

    // 2. 检查LIMIT
    if (!selectStmt.limit) {
      results.push({
        id: generateId(),
        type: 'info',
        category: '查询优化',
        title: '建议添加LIMIT限制',
        description: '查询没有LIMIT限制，如果返回数据量过大可能影响性能',
        suggestion: '建议添加LIMIT限制返回行数，特别是在开发调试阶段',
        line
      });
    }

    // 3. 检查LIKE前导通配符
    if (upperSQL.includes("LIKE '%") || upperSQL.includes('LIKE "%')) {
      results.push({
        id: generateId(),
        type: 'warning',
        category: '查询优化',
        title: '前导通配符导致索引失效',
        description: 'LIKE以%或_开头会导致索引失效，无法进行范围扫描',
        suggestion: '考虑使用全文索引(FULLTEXT)，或调整查询条件避免前导通配符',
        line
      });
    }

    // 4. 检查NOT IN
    if (upperSQL.includes('NOT IN')) {
      results.push({
        id: generateId(),
        type: 'info',
        category: '查询优化',
        title: '考虑使用NOT EXISTS替代NOT IN',
        description: 'NOT IN在子查询返回NULL时可能产生意外结果，且性能通常不如NOT EXISTS',
        suggestion: '建议使用NOT EXISTS或LEFT JOIN ... IS NULL替代NOT IN',
        line
      });
    }

    // 5. 检查子查询
    const selectCount = (sqlInput.match(/\bSELECT\b/gi) || []).length;
    if (selectCount > 1) {
      results.push({
        id: generateId(),
        type: 'optimization',
        category: '查询优化',
        title: '考虑优化子查询',
        description: '检测到嵌套子查询，可能影响性能和可读性',
        suggestion: '考虑使用JOIN替代相关子查询，或使用EXISTS替代IN',
        line
      });
    }

    // 6. 检查隐式类型转换（在函数中使用列）
    if (upperSQL.includes('UPPER(') || upperSQL.includes('LOWER(') || 
        upperSQL.includes('DATE(') || upperSQL.match(/\bYEAR\s*\(/)) {
      results.push({
        id: generateId(),
        type: 'warning',
        category: '查询优化',
        title: '函数操作可能导致索引失效',
        description: '在WHERE条件中对列使用函数会导致索引失效',
        suggestion: '考虑使用函数索引（如果数据库支持），或调整查询条件',
        line
      });
    }

    // 7. 检查OR条件
    if (upperSQL.includes(' OR ')) {
      results.push({
        id: generateId(),
        type: 'info',
        category: '查询优化',
        title: 'OR条件可能影响索引使用',
        description: 'OR条件可能导致索引失效或需要多个索引合并',
        suggestion: '考虑使用IN替代多个OR条件，或将查询拆分为UNION',
        line
      });
    }

    // 8. 检查COUNT(*)
    if (upperSQL.includes('COUNT(*)')) {
      results.push({
        id: generateId(),
        type: 'info',
        category: '查询优化',
        title: 'COUNT(*)在大表上可能较慢',
        description: '在大表上执行COUNT(*)需要全表扫描或索引全扫描',
        suggestion: '考虑使用近似值（SHOW TABLE STATUS），或维护计数表',
        line
      });
    }

    // 9. 检查ORDER BY RAND()
    if (upperSQL.includes('ORDER BY RAND()') || upperSQL.includes('ORDER BY RANDOM()')) {
      results.push({
        id: generateId(),
        type: 'warning',
        category: '查询优化',
        title: '避免使用ORDER BY RAND()',
        description: 'ORDER BY RAND()需要为每行生成随机数并排序，性能极差',
        suggestion: '考虑在应用层随机选择，或使用其他随机化策略',
        line
      });
    }

    // 10. 检查SELECT DISTINCT
    if (upperSQL.includes('SELECT DISTINCT')) {
      results.push({
        id: generateId(),
        type: 'info',
        category: '查询优化',
        title: 'DISTINCT可能需要排序和去重',
        description: 'DISTINCT操作需要额外的排序和去重操作',
        suggestion: '确保DISTINCT是必要的，或考虑使用GROUP BY替代',
        line
      });
    }
  }

  // 通用模式分析
  function analyzeCommonPatterns(sql: string, results: AnalysisResult[]) {
    // 检查DELETE/UPDATE不带WHERE（已经在语句分析中处理，这里作为兜底）
    const deleteWithoutWhere = /DELETE\s+FROM\s+\w+\s*(?!WHERE)/i.test(sql);
    const updateWithoutWhere = /UPDATE\s+\w+\s+SET\s+[^;]+(?!WHERE)/i.test(sql);
    
    if (deleteWithoutWhere || updateWithoutWhere) {
      const type = deleteWithoutWhere ? 'DELETE' : 'UPDATE';
      results.push({
        id: generateId(),
        type: 'critical',
        category: '安全规范',
        title: `危险操作: ${type} 没有WHERE条件`,
        description: `检测到 ${type} 语句可能缺少WHERE条件，将影响表中所有行！`,
        suggestion: '请确保添加WHERE条件限制影响范围'
      });
    }

    // 检查SQL注入风险（简单的字符串拼接检测）
    if (sql.includes('$') || sql.match(/\+\s*['"]/)) {
      results.push({
        id: generateId(),
        type: 'warning',
        category: '安全规范',
        title: '可能存在SQL注入风险',
        description: '检测到SQL语句中可能包含字符串拼接模式',
        suggestion: '使用参数化查询或预处理语句，避免SQL注入风险'
      });
    }

    // 检查注释掉的代码
    if (sql.includes('--') || sql.includes('/*')) {
      results.push({
        id: generateId(),
        type: 'info',
        category: '代码质量',
        title: 'SQL中包含注释',
        description: '检测到SQL语句中包含注释',
        suggestion: '生产环境中建议移除不必要的注释'
      });
    }

    // 检查过长的IN列表
    const inMatches = sql.match(/IN\s*\([^)]+\)/gi);
    if (inMatches) {
      inMatches.forEach(match => {
        const valueCount = (match.match(/,/g) || []).length + 1;
        if (valueCount > 100) {
          results.push({
            id: generateId(),
            type: 'warning',
            category: '查询优化',
            title: 'IN列表值过多',
            description: `IN子句包含${valueCount}个值，可能导致性能问题`,
            suggestion: '考虑使用临时表或JOIN替代大量IN值，或分批处理'
          });
        }
      });
    }
  }

  // ==================== 事件处理 ====================

  const handleAnalyze = () => {
    setIsAnalyzing(true);
    // 使用setTimeout让UI有时间更新
    setTimeout(() => {
      analyzeSQL();
      setIsAnalyzing(false);
    }, 100);
  };

  const handleClear = () => {
    setDdlInput('');
    setSqlInput('');
    setResults([]);
    setTableSchemas([]);
    setParsedDDL(false);
  };



  const handleCopyResults = async () => {
    const text = results.map((r, i) => 
      `${i + 1}. [${getTypeLabel(r.type)}] ${r.title}\n   ${r.description}${r.suggestion ? '\n   建议: ' + r.suggestion : ''}`
    ).join('\n\n');
    await copy(text);
  };

  // ==================== 渲染辅助函数 ====================

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

  // ==================== 示例数据 ====================

  const loadExample = () => {
    const exampleDDL = `-- 用户表
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL,
    age INT,
    status ENUM('active', 'inactive') DEFAULT 'active',
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
);`;

    const exampleSQL = `-- 查询示例：有一些优化空间
SELECT * FROM users u
JOIN orders o ON u.id = o.user_id
WHERE u.status = 'active' 
  AND u.age > 18
ORDER BY o.created_at DESC
LIMIT 10;`;

    setDdlInput(exampleDDL);
    setSqlInput(exampleSQL);
  };

  // ==================== 渲染 ====================

  return (
    <div className="max-w-7xl mx-auto">
      {/* 头部 */}
      <div className="mb-4 sm:mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 text-purple-500" />
              SQL 优化建议
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1 text-xs sm:text-sm">
              智能分析SQL语法、检查DDL一致性、优化索引使用
            </p>
          </div>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="btn-ghost btn-tool"
            title="设置"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 设置面板 */}
      {showSettings && (
        <div className="card p-4 mb-4 border-purple-200 dark:border-purple-800">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
              <Database className="w-4 h-4" />
              数据库类型
            </h3>
            <button onClick={() => setShowSettings(false)}>
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {(Object.keys(DATABASE_CONFIGS) as DatabaseType[]).map((type) => (
              <button
                key={type}
                onClick={() => setDbType(type)}
                className={`p-3 rounded-lg border text-left transition-all ${
                  dbType === type
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-purple-300'
                }`}
              >
                <div className="font-medium text-sm text-gray-900 dark:text-white">
                  {DATABASE_CONFIGS[type].name}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
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
          disabled={isAnalyzing || !sqlInput.trim()} 
          className="btn-primary btn-tool disabled:opacity-50"
        >
          {isAnalyzing ? (
            <Zap className="w-3.5 h-3.5 flex-shrink-0 animate-pulse" />
          ) : (
            <Play className="w-3.5 h-3.5 flex-shrink-0" />
          )}
          {isAnalyzing ? '分析中...' : '分析SQL'}
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

      {/* 输入区域 */}
      <div className={`grid ${showDDLOnly ? 'grid-cols-1' : 'lg:grid-cols-2'} gap-3 sm:gap-4 mb-4`}>
        <div className="card p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Table2 className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">表结构 (DDL)</span>
              <span className="text-xs text-gray-400">{dbType.toUpperCase()}</span>
            </div>
            {parsedDDL && tableSchemas.length > 0 && (
              <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                已解析 {tableSchemas.length} 个表
              </span>
            )}
          </div>
          <textarea
            value={ddlInput}
            onChange={(e) => setDdlInput(e.target.value)}
            placeholder={`-- 在此粘贴 CREATE TABLE 语句...\n-- 支持 ${DATABASE_CONFIGS[dbType].name} 语法`}
            className="w-full h-[250px] p-3 font-mono text-xs bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg resize-none focus:ring-2 focus:ring-purple-500 dark:text-white"
            spellCheck={false}
          />
          {tableSchemas.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {tableSchemas.map(table => (
                <span 
                  key={table.name} 
                  className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded"
                  title={`${table.columns.length}列, ${(table.indexes || []).length}索引`}
                >
                  {table.name}
                </span>
              ))}
            </div>
          )}
        </div>

        {!showDDLOnly && (
          <div className="card p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-3">
              <Database className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">SQL 语句</span>
              <span className="text-xs text-purple-500">{dbType.toUpperCase()}</span>
            </div>
            <textarea
              value={sqlInput}
              onChange={(e) => setSqlInput(e.target.value)}
              placeholder={`-- 在此粘贴要分析的 SQL 语句...\n-- 支持 SELECT/INSERT/UPDATE/DELETE`}
              className="w-full h-[250px] p-3 font-mono text-xs bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg resize-none focus:ring-2 focus:ring-purple-500 dark:text-white"
              spellCheck={false}
            />
          </div>
        )}
      </div>

      {/* 统计卡片 */}
      {results.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mb-4">
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
              onClick={() => setActiveTab(type as any)}
              className={`p-3 rounded-lg border text-left transition-all ${
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
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{label}</div>
            </button>
          ))}
        </div>
      )}

      {/* 分析结果 */}
      {filteredResults.length > 0 && (
        <div className="card p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Search className="w-5 h-5 text-purple-500" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">分析结果</h3>
              <span className="text-sm text-gray-500">
                共 {filteredResults.length} 条
                {activeTab !== 'all' && ` (${getTypeLabel(activeTab)})`}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {filteredResults.map((result) => (
              <div 
                key={result.id} 
                className={`p-4 rounded-lg border ${getTypeStyle(result.type)} transition-all hover:shadow-md`}
              >
                <div className="flex items-start gap-3">
                  {getTypeIcon(result.type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded ${getTypeBadgeStyle(result.type)}`}>
                        {getTypeLabel(result.type)}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {result.category}
                      </span>
                      {result.line && (
                        <span className="text-xs text-gray-400">
                          第{result.line}行
                        </span>
                      )}
                    </div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                      {result.title}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                      {result.description}
                    </p>
                    {result.suggestion && (
                      <div className="flex items-start gap-2 text-sm">
                        <ArrowRight className="w-4 h-4 text-purple-500 flex-shrink-0 mt-0.5" />
                        <span className="text-purple-700 dark:text-purple-300">
                          {result.suggestion}
                        </span>
                      </div>
                    )}
                    {result.sql && (
                      <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono text-gray-600 dark:text-gray-400 overflow-x-auto">
                        {result.sql}
                      </div>
                    )}
                    {result.details && result.details.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {result.details.map((detail, idx) => (
                          <li key={idx} className="text-xs text-gray-500 dark:text-gray-400 flex items-start gap-1">
                            <span className="text-purple-500">•</span>
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
        </div>
      )}

      {/* 空状态 */}
      {filteredResults.length === 0 && sqlInput && !isAnalyzing && (
        <div className="card p-8 text-center">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
            未发现问题
          </h3>
          <p className="text-sm text-gray-500">
            {activeTab === 'all' 
              ? '已分析SQL语句，未发现明显问题' 
              : `当前筛选条件下没有${getTypeLabel(activeTab)}类型的结果`}
          </p>
        </div>
      )}

      <AdInArticle />
      <AdFooter />
    </div>
  );
}
