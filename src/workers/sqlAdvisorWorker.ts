// SQL Advisor Worker - 在独立线程中处理 SQL 解析和分析
// 模块化版本：将功能拆分到多个子模块

import { Parser } from 'node-sql-parser';
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

// 分析 SQL 主函数
function analyzeSQL(
  sqlInput: string,
  ddlInput: string,
  dbType: DatabaseType
): { results: AnalysisResult[]; schemas: TableSchema[] } {
  const newResults: AnalysisResult[] = [];
  
  if (!sqlInput.trim()) {
    return { results: [], schemas: [] };
  }

  const parser = new Parser();

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
  const schemaTableNames = new Set(schemas.map(s => s.name.toLowerCase()));
  
  tables.forEach(table => {
    const tableLower = table.name.toLowerCase();
    if (!schemaTableNames.has(tableLower)) {
      let suggested: string | undefined;
      for (const schema of schemas) {
        const schemaName = schema.name.toLowerCase();
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
      allColumns.set(`${schema.name.toLowerCase()}.${col.name.toLowerCase()}`, { table: schema.name, column: col });
      allColumns.set(col.name.toLowerCase(), { table: schema.name, column: col });
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
  const colLower = col.name.toLowerCase();
  const fullName = col.table ? `${col.table.toLowerCase()}.${colLower}` : colLower;
  
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
      const schemaTable = schemas.find(s => s.name.toLowerCase() === tableName.toLowerCase());
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
self.onmessage = (event: MessageEvent) => {
  const { sqlInput, ddlInput, dbType, id } = event.data;
  
  try {
    const { results, schemas } = analyzeSQL(sqlInput, ddlInput, dbType);
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
