// SQL Advisor 优化规则分析模块
// 检查 SQL 语句是否符合最佳实践

import type { AnalysisResult, TableSchema } from './types';
import { generateId } from './utils';

// 分析优化规范
export function analyzeOptimizationRules(
  selectStmt: any,
  sqlInput: string,
  _schemas: TableSchema[],
  results: AnalysisResult[],
  line: number
): void {
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
export function analyzeCommonPatterns(sql: string, results: AnalysisResult[]): void {
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
