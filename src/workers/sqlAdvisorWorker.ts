// SQL Advisor Worker - 在独立线程中处理 SQL 解析和分析
// 模块化版本：将功能拆分到多个子模块

import type { 
  DatabaseType, 
  AnalysisResult, 
  TableSchema,
  WhereCondition
} from './sqlAdvisor/types';
import { generateId, checkTypeCompatibility, detectValueType } from './sqlAdvisor/utils';
import { parseDDL, extractSelectInfo, extractWhereConditions } from './sqlAdvisor/parser';
import { analyzeIndexUsage, analyzeWhereIndexUsage } from './sqlAdvisor/indexAnalyzer';
import { analyzeOptimizationRules, analyzeCommonPatterns } from './sqlAdvisor/optimizationRules';
import type { Parser } from 'node-sql-parser/build/mysql';

// 根据数据库类型动态导入对应的 Parser
async function loadParser(dbType: DatabaseType): Promise<typeof Parser> {
  switch (dbType) {
    case 'mysql':
      const mysqlModule = await import('node-sql-parser/build/mysql');
      return mysqlModule.Parser;
    case 'postgresql':
      const pgModule = await import('node-sql-parser/build/postgresql');
      return pgModule.Parser;
    case 'sqlite':
      const sqliteModule = await import('node-sql-parser/build/sqlite');
      return sqliteModule.Parser;


    case 'sqlserver':
      const sqlserverModule = await import('node-sql-parser/build/transactsql');
      return sqlserverModule.Parser;
    default:
      // 默认使用 MySQL 解析器
      const defaultModule = await import('node-sql-parser/build/mysql');
      return defaultModule.Parser;
  }
}

// 仅分析 DDL
async function analyzeDDLOnly(
  ddlInput: string,
  dbType: DatabaseType
): Promise<{ results: AnalysisResult[]; schemas: TableSchema[] }> {
  const newResults: AnalysisResult[] = [];
  
  if (!ddlInput.trim()) {
    return { results: [], schemas: [] };
  }

  const ParserClass = await loadParser(dbType);
  const parser = new ParserClass();

  // 解析DDL
  const { schemas, errors: ddlErrors } = parseDDL(ddlInput, dbType, parser);

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

  // DDL规范检查
  analyzeDDLStandards(schemas, newResults);

  // 如果没有问题，添加成功提示
  if (newResults.length === 0) {
    newResults.push({
      id: generateId(),
      type: 'success',
      category: 'DDL检查',
      title: 'DDL语法检查通过',
      description: `成功解析 ${schemas.length} 个表，未发现语法错误`
    });
  }

  return { results: newResults, schemas };
}

// DDL 规范检查
function analyzeDDLStandards(
  schemas: TableSchema[],
  results: AnalysisResult[]
): void {
  schemas.forEach(schema => {
    // 检查主键
    const hasPrimaryKey = schema.columns.some(col => col.isPrimary);
    if (!hasPrimaryKey) {
      results.push({
        id: generateId(),
        type: 'warning',
        category: 'DDL规范',
        title: `表 ${schema.name} 缺少主键`,
        description: '表中没有定义主键，建议每个表都有主键以保证数据唯一性和查询性能',
        suggestion: '为表添加 PRIMARY KEY 约束'
      });
    }

    // 检查索引
    if ((!schema.indexes || schema.indexes.length === 0) && schema.columns.length > 3) {
      results.push({
        id: generateId(),
        type: 'info',
        category: 'DDL规范',
        title: `表 ${schema.name} 缺少索引`,
        description: '表中没有定义索引，可能影响查询性能',
        suggestion: '为经常查询的字段添加索引'
      });
    }

    // 检查字段命名规范
    schema.columns.forEach(col => {
      // 检查是否使用保留字
      const reservedWords = ['select', 'insert', 'update', 'delete', 'from', 'where', 'order', 'group', 'index', 'key'];
      if (reservedWords.includes(col.name?.toLowerCase())) {
        results.push({
          id: generateId(),
          type: 'warning',
          category: 'DDL规范',
          title: `字段名使用保留字: ${col.name}`,
          description: `字段 "${col.name}" 是 SQL 保留字，可能导致语法冲突`,
          suggestion: '建议修改字段名或使用反引号/方括号包裹'
        });
      }

      // 检查大写命名
      if (col.name && col.name !== col.name.toLowerCase() && col.name !== col.name.toUpperCase()) {
        results.push({
          id: generateId(),
          type: 'info',
          category: 'DDL规范',
          title: `字段名大小写混合: ${col.name}`,
          description: '字段名使用大小写混合可能在不同数据库中表现不一致',
          suggestion: '建议使用全小写加下划线的命名方式 (snake_case)'
        });
      }
    });

    // 检查重复索引
    if (schema.indexes && schema.indexes.length > 1) {
      const indexSignatures = new Map<string, string>();
      schema.indexes.forEach(idx => {
        const signature = idx.columns?.map((c: string) => c.toLowerCase()).join(',');
        if (signature) {
          if (indexSignatures.has(signature)) {
            results.push({
              id: generateId(),
              type: 'warning',
              category: 'DDL规范',
              title: `表 ${schema.name} 存在重复索引`,
              description: `索引 "${idx.name}" 与 "${indexSignatures.get(signature)}" 包含相同的列`,
              suggestion: '考虑删除重复索引以减少维护开销'
            });
          } else {
            indexSignatures.set(signature, idx.name);
          }
        }
      });
    }

    // 检查索引字段是否存在于表中
    if (schema.indexes && schema.indexes.length > 0) {
      const columnNames = new Set(schema.columns.map(col => col.name?.toLowerCase()).filter(Boolean));
      
      for (const index of schema.indexes) {
        for (const colName of index.columns) {
          const colNameLower = colName?.toLowerCase();
          if (colNameLower && !columnNames.has(colNameLower)) {
            // 查找相似字段名用于建议
            let suggested: string | undefined;
            for (const col of schema.columns) {
              const existingCol = col.name?.toLowerCase();
              if (existingCol && (existingCol.includes(colNameLower) || colNameLower.includes(existingCol))) {
                suggested = col.name;
                break;
              }
            }
            
            results.push({
              id: generateId(),
              type: 'critical',
              category: 'DDL语法检查',
              title: `索引字段不存在: ${schema.name}.${colName}`,
              description: `索引 "${index.name}" 引用了不存在的字段 "${colName}"${suggested ? `。您是否指的是 "${suggested}"？` : ''}`,
              suggestion: '请检查索引定义中的字段名拼写，或确保字段已在表中定义'
            });
          }
        }
      }
    }
  });
}

// 分析 SQL 主函数
async function analyzeSQL(
  sqlInput: string,
  ddlInput: string,
  dbType: DatabaseType
): Promise<{ results: AnalysisResult[]; schemas: TableSchema[] }> {
  const newResults: AnalysisResult[] = [];
  
  // 如果SQL输入为空但DDL不为空，执行纯DDL分析
  if (!sqlInput.trim()) {
    if (ddlInput.trim()) {
      return analyzeDDLOnly(ddlInput, dbType);
    }
    return { results: [], schemas: [] };
  }

  const ParserClass = await loadParser(dbType);
  const parser = new ParserClass();

  // 解析DDL
  const { schemas, errors: ddlErrors } = parseDDL(ddlInput, dbType, parser);

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
    const parserDbMap: Record<string, string> = { sqlserver: 'transactsql' };
    const parserDbType = parserDbMap[dbType] || dbType;
    ast = parser.astify(sqlInput, { database: parserDbType });
  } catch (e: any) {
    newResults.push({
      id: generateId(),
      type: 'critical',
      category: 'SQL语法检查',
      title: 'SQL语法错误',
      description: e.message || '无法解析SQL语句',
      suggestion: '请检查SQL语法是否符合所选数据库规范'
    });
    return { results: newResults, schemas };
  }

  const statements = Array.isArray(ast) ? ast : [ast];

  statements.forEach((stmt, idx) => {
    const line = idx + 1;

    // SELECT语句分析
    if (stmt.type === 'select') {
      analyzeSelectStatement(stmt, sqlInput, schemas, newResults, line);
    }

    // UPDATE/DELETE语句检查
    if (stmt.type === 'update' || stmt.type === 'delete') {
      analyzeModifyStatement(stmt, schemas, newResults, line);
    }

    // INSERT语句检查
    if (stmt.type === 'insert') {
      analyzeInsertStatement(stmt, schemas, newResults, line);
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

  return { results: newResults, schemas };
}

// 分析 SELECT 语句
function analyzeSelectStatement(
  selectStmt: any,
  sqlInput: string,
  schemas: TableSchema[],
  results: AnalysisResult[],
  line: number
): void {
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
    checkTableNames(schemas, tables, results, line);
  }

  // 2. 字段存在性检查 + 3. 数据类型匹配检查
  if (schemas.length > 0) {
    checkColumnsAndTypes(
      schemas, 
      selectCols, 
      whereCols, 
      orderByCols, 
      groupByCols, 
      whereConditions, 
      results, 
      line
    );

    // 4. 索引使用检查
    analyzeIndexUsage(
      schemas, 
      tables, 
      whereCols, 
      orderByCols, 
      groupByCols, 
      joinCols, 
      results, 
      line
    );
  }

  // 5. SQL优化规范检查
  analyzeOptimizationRules(selectStmt, sqlInput, schemas, results, line);
}

// 检查表名
function checkTableNames(
  schemas: TableSchema[],
  tables: Array<{ name: string; alias?: string }>,
  results: AnalysisResult[],
  line: number
): void {
  const schemaTableNames = new Set(schemas.map(s => s.name?.toLowerCase()).filter(Boolean));
  
  tables.forEach(table => {
    const tableLower = table.name?.toLowerCase();
    if (!tableLower) return;
    if (!schemaTableNames.has(tableLower)) {
      let suggested: string | undefined;
      for (const schema of schemas) {
        const schemaName = schema.name?.toLowerCase();
        if (!schemaName) continue;
        if (schemaName.includes(tableLower) || tableLower.includes(schemaName)) {
          suggested = schema.name;
          break;
        }
      }
      
      results.push({
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

// 检查字段和数据类型
function checkColumnsAndTypes(
  schemas: TableSchema[],
  selectCols: Array<{ name: string; alias?: string; table?: string }>,
  whereCols: Array<{ name: string; table?: string }>,
  orderByCols: Array<{ name: string; table?: string; direction: string }>,
  groupByCols: Array<{ name: string; table?: string }>,
  whereConditions: WhereCondition[],
  results: AnalysisResult[],
  line: number
): void {
  const allColumns = new Map<string, { table: string; column: { name: string; type: string } }>();
  schemas.forEach(schema => {
    schema.columns.forEach(col => {
      allColumns.set(`${schema.name?.toLowerCase()}.${col.name?.toLowerCase()}`, { table: schema.name, column: col });
      allColumns.set(col.name?.toLowerCase(), { table: schema.name, column: col });
    });
  });

  // 检查SELECT字段
  selectCols.forEach(col => {
    if (col.name === '*') return;
    if (col.name.includes('(')) return; // 聚合函数不检查
    
    checkColumnExists(col, allColumns, 'SELECT字段不存在', results, line);
  });

  // 检查WHERE字段
  whereCols.forEach(col => {
    checkColumnExists(col, allColumns, 'WHERE条件字段不存在', results, line);
  });

  // 检查ORDER BY字段
  orderByCols.forEach(col => {
    checkColumnExists(col, allColumns, 'ORDER BY字段不存在', results, line);
  });

  // 检查GROUP BY字段
  groupByCols.forEach(col => {
    checkColumnExists(col, allColumns, 'GROUP BY字段不存在', results, line);
  });

  // 数据类型匹配检查
  const checkedColumns = new Set<string>();
  for (const cond of whereConditions) {
    if (!cond.column || checkedColumns.has(cond.column)) continue;
    
    const colLower = cond.column.toLowerCase();
    const colInfo = allColumns.get(colLower);
    
    if (colInfo) {
      const valueType = detectValueType(cond.value, cond.isStringLiteral);
      const typeCheck = checkTypeCompatibility(colInfo.column.type, valueType, cond.value);
      
      if (!typeCheck.compatible || typeCheck.severity === 'error') {
        results.push({
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
        results.push({
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
}

// 检查字段是否存在
function checkColumnExists(
  col: { name: string; table?: string },
  allColumns: Map<string, { table: string; column: { name: string; type: string } }>,
  errorTitle: string,
  results: AnalysisResult[],
  line: number
): void {
  const colLower = col.name?.toLowerCase();
  const fullName = col.table ? `${col.table?.toLowerCase()}.${colLower}` : colLower;
  
  if (!allColumns.has(colLower) && !allColumns.has(fullName)) {
    let suggested: string | undefined;
    for (const [key, value] of allColumns) {
      if (key.includes(colLower) || colLower.includes(key)) {
        suggested = value.column.name;
        break;
      }
    }
    
    results.push({
      id: generateId(),
      type: 'critical',
      category: '字段存在性检查',
      title: `${errorTitle}: ${col.name}`,
      description: suggested 
        ? `字段 "${col.name}" 在表结构中不存在。您是否指的是 "${suggested}"？`
        : `字段 "${col.name}" 在表结构中不存在。`,
      suggestion: '请检查字段名拼写',
      line
    });
  }
}

// 分析 UPDATE/DELETE 语句
function analyzeModifyStatement(
  stmt: any,
  schemas: TableSchema[],
  results: AnalysisResult[],
  line: number
): void {
  const modifyStmt = stmt as any;
  
  if (!modifyStmt.where) {
    results.push({
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

    analyzeWhereIndexUsage(schemas, whereColumns, results, line);
  }
}

// 分析 INSERT 语句
function analyzeInsertStatement(
  stmt: any,
  schemas: TableSchema[],
  results: AnalysisResult[],
  line: number
): void {
  const insertStmt = stmt as any;
  
  if (!insertStmt.columns || insertStmt.columns.length === 0) {
    results.push({
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
      const schemaTable = schemas.find(s => s.name?.toLowerCase() === tableName?.toLowerCase());
      if (!schemaTable) {
        results.push({
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

// Worker 消息处理
self.onmessage = async (event: MessageEvent) => {
  const { sqlInput, ddlInput, dbType, id } = event.data;
  
  try {
    const { results, schemas } = await analyzeSQL(sqlInput, ddlInput, dbType);
    self.postMessage({ type: 'success', results, schemas, id });
  } catch (error: any) {
    self.postMessage({ 
      type: 'error', 
      error: error.message || '分析过程中发生错误',
      id 
    });
  }
};

export {};
