// SQL Advisor 索引分析模块
// 分析 SQL 语句的索引使用情况

import type { 
  TableSchema, 
  IndexDef, 
  AnalysisResult, 
  TableInfo,
  TableQueryInfo
} from './types';
import { generateId } from './utils';

// 分析索引使用情况
export function analyzeIndexUsage(
  schemas: TableSchema[],
  tables: TableInfo[],
  whereCols: Array<{ name: string; table?: string }>,
  orderByCols: Array<{ name: string; table?: string; direction: string }>,
  groupByCols: Array<{ name: string; table?: string }>,
  joinCols: Array<{ name: string; table?: string; type: string }>,
  results: AnalysisResult[],
  line: number
): void {
  // 为每个表收集查询中使用的字段
  const tableQueryInfo: Map<string, TableQueryInfo> = new Map();

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

  // 分配字段到表
  whereCols.forEach(col => {
    const tableName = getColumnTable(col);
    if (tableName) {
      const info = tableQueryInfo.get(tableName);
      if (info && !info.whereCols.includes(col.name)) {
        info.whereCols.push(col.name);
      }
    }
  });

  orderByCols.forEach(col => {
    const tableName = getColumnTable(col);
    if (tableName) {
      const info = tableQueryInfo.get(tableName);
      if (info && !info.orderByCols.some(c => c.name === col.name)) {
        info.orderByCols.push({ name: col.name, direction: col.direction });
      }
    }
  });

  groupByCols.forEach(col => {
    const tableName = getColumnTable(col);
    if (tableName) {
      const info = tableQueryInfo.get(tableName);
      if (info && !info.groupByCols.includes(col.name)) {
        info.groupByCols.push(col.name);
      }
    }
  });

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
export function checkWhereIndex(
  schema: TableSchema,
  whereCols: string[],
  indexes: IndexDef[],
  results: AnalysisResult[],
  line: number
): void {
  const whereColsLower = whereCols.map(c => c.toLowerCase());
  const colsWithoutIndex: string[] = [];
  const partialIndexMatches: Array<{ col: string; index: IndexDef; position: number }> = [];

  for (const col of whereCols) {
    const colLower = col.toLowerCase();
    let hasIndex = false;
    
    for (const idx of indexes) {
      if (idx.columns.length === 0) continue;
      const idxColsLower = idx.columns.map(c => c.toLowerCase());
      
      if (idxColsLower[0] === colLower) {
        hasIndex = true;
        break;
      }
      
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
export function checkWhereOrderByIndex(
  schema: TableSchema,
  whereCols: string[],
  orderByCols: Array<{ name: string; direction: string }>,
  indexes: IndexDef[],
  results: AnalysisResult[],
  line: number
): void {
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
export function checkWhereGroupByIndex(
  schema: TableSchema,
  whereCols: string[],
  groupByCols: string[],
  indexes: IndexDef[],
  results: AnalysisResult[],
  line: number
): void {
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
export function checkOrderByIndex(
  schema: TableSchema,
  orderByCols: Array<{ name: string; direction: string }>,
  indexes: IndexDef[],
  results: AnalysisResult[],
  line: number
): void {
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
export function checkGroupByIndex(
  schema: TableSchema,
  groupByCols: string[],
  indexes: IndexDef[],
  results: AnalysisResult[],
  line: number
): void {
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
export function checkJoinIndex(
  schema: TableSchema,
  joinCols: string[],
  indexes: IndexDef[],
  results: AnalysisResult[],
  line: number
): void {
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
export function analyzeWhereIndexUsage(
  schemas: TableSchema[],
  whereCols: string[],
  results: AnalysisResult[],
  line: number
): void {
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
