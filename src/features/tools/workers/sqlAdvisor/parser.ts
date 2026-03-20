// SQL Advisor 解析器模块
// 处理 SQL 和 DDL 的解析，提取 AST 信息

import type { 
  DatabaseType, 
  TableSchema, 
  ColumnDef, 
  IndexDef, 
  ParseError,
  WhereCondition,
  SelectInfo,
  TableInfo,
  SelectColumn,
  OrderByColumn,
  JoinColumn
} from './types';
import type { Parser } from 'node-sql-parser/build/mysql';
import { extractValueFromNode } from './utils';

// 安全地提取字符串值（处理对象格式，如 PostgreSQL 解析器返回的）
function safeExtractString(value: any): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  if (value && typeof value === 'object') {
    // 尝试常见的字符串属性
    if (typeof value.column === 'string') return value.column;
    if (typeof value.name === 'string') return value.name;
    if (typeof value.table === 'string') return value.table;
    if (typeof value.value === 'string') return value.value;
    // 处理 expr 属性（PostgreSQL 解析器返回 { expr: { type: 'default', value: 'xxx' } } 这样的结构）
    if (value.expr !== undefined && value.expr !== null) {
      const exprResult = safeExtractString(value.expr);
      if (exprResult) return exprResult;
    }
    // 处理嵌套对象（某些解析器返回 { column: { name: 'xxx' } } 这样的结构）
    if (value.column && typeof value.column === 'object') {
      const colResult = safeExtractString(value.column);
      if (colResult) return colResult;
    }
    if (value.name && typeof value.name === 'object') {
      const nameResult = safeExtractString(value.name);
      if (nameResult) return nameResult;
    }
    // 处理 value 属性是对象的情况
    if (value.value && typeof value.value === 'object') {
      const valResult = safeExtractString(value.value);
      if (valResult) return valResult;
    }
    // 处理 type/value 结构（PostgreSQL 常用）
    if (value.value !== undefined) {
      const tvResult = safeExtractString(value.value);
      if (tvResult) return tvResult;
    }
    // 遍历对象的所有属性，寻找字符串值
    for (const key of Object.keys(value)) {
      const prop = value[key];
      if (typeof prop === 'string' && prop) {
        return prop;
      }
      if (typeof prop === 'object' && prop !== null) {
        const nestedResult = safeExtractString(prop);
        if (nestedResult) return nestedResult;
      }
    }
  }
  return '';
}

// 递归提取WHERE子句中的条件
export function extractWhereConditions(where: any): WhereCondition[] {
  const conditions: WhereCondition[] = [];
  
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
      columnName = safeExtractString(where.left.column);
      tableName = safeExtractString(where.left.table);
    } else if (where.left?.type === 'column') {
      columnName = safeExtractString(where.left.column);
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
      columnName = safeExtractString(where.left.column);
      tableName = safeExtractString(where.left.table);
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
      columnName = safeExtractString(where.left.column);
      tableName = safeExtractString(where.left.table);
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
export function extractSelectInfo(selectStmt: any): SelectInfo {
  const selectCols: SelectColumn[] = [];
  const whereCols: Array<{ name: string; table?: string }> = [];
  const orderByCols: OrderByColumn[] = [];
  const groupByCols: Array<{ name: string; table?: string }> = [];
  const joinCols: JoinColumn[] = [];
  let whereConditions: WhereCondition[] = [];
  const tables: TableInfo[] = [];

  // 提取表信息
  if (selectStmt.from) {
    const fromList = Array.isArray(selectStmt.from) ? selectStmt.from : [selectStmt.from];
    fromList.forEach((from: any) => {
      if (from.table) {
        // 处理表名可能是对象的情况（如 PostgreSQL 解析器）
        const tableName = safeExtractString(from.table);
        
        // 处理别名可能是对象的情况
        const aliasName = safeExtractString(from.as || from.alias) || undefined;
        
        tables.push({ 
          name: tableName, 
          alias: aliasName 
        });
      }
      
      // 处理JOIN
      if (from.join) {
        const joinType = from.join;
        
        // 提取JOIN的右表
        // PostgreSQL 解析器可能将右表存储在不同的属性中
        const joinTableSource = from.table || from.join_table || from.right;
        if (joinTableSource) {
          const joinTableName = safeExtractString(joinTableSource);
          const joinAliasName = safeExtractString(from.as || from.alias || from.join_as || from.right_alias) || undefined;
          
          // 检查是否已添加（避免重复）
          const alreadyAdded = tables.some(t => t.name === joinTableName);
          if (!alreadyAdded && joinTableName) {
            tables.push({ 
              name: joinTableName, 
              alias: joinAliasName 
            });
          }
        }
        
        if (from.on) {
          const extractJoinColumns = (expr: any) => {
            if (expr.type === 'binary_expr' && (expr.operator === 'AND' || expr.operator === 'OR')) {
              extractJoinColumns(expr.left);
              extractJoinColumns(expr.right);
            } else if (expr.type === 'binary_expr' && expr.operator === '=') {
              if (expr.left?.type === 'column_ref') {
                joinCols.push({ 
                  name: safeExtractString(expr.left.column), 
                  table: safeExtractString(expr.left.table),
                  type: joinType 
                });
              }
              if (expr.right?.type === 'column_ref') {
                joinCols.push({ 
                  name: safeExtractString(expr.right.column), 
                  table: safeExtractString(expr.right.table),
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
          name: safeExtractString(col.expr.column), 
          alias: safeExtractString(col.as),
          table: safeExtractString(col.expr.table)
        });
      } else if (col.expr?.column) {
        selectCols.push({ 
          name: safeExtractString(col.expr.column),
          alias: safeExtractString(col.as),
          table: safeExtractString(col.expr.table)
        });
      } else if (col.expr?.type === 'aggr_func') {
        const funcName = safeExtractString(col.expr.name);
        const arg = col.expr.args?.expr;
        if (arg?.type === 'column_ref') {
          selectCols.push({ 
            name: `${funcName}(${safeExtractString(arg.column)})`,
            alias: safeExtractString(col.as),
            table: safeExtractString(arg.table)
          });
        } else if (arg?.column) {
          selectCols.push({ 
            name: `${funcName}(${safeExtractString(arg.column)})`,
            alias: safeExtractString(col.as),
            table: safeExtractString(arg.table)
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
          name: safeExtractString(o.expr.column), 
          table: safeExtractString(o.expr.table),
          direction: direction.toUpperCase()
        });
      } else if (typeof o.expr === 'string') {
        orderByCols.push({ name: o.expr, direction: direction.toUpperCase() });
      } else if (o.expr?.column) {
        orderByCols.push({ 
          name: safeExtractString(o.expr.column), 
          table: safeExtractString(o.expr.table),
          direction: direction.toUpperCase()
        });
      }
    });
  }

  // 提取GROUP BY
  if (selectStmt.groupby && Array.isArray(selectStmt.groupby)) {
    selectStmt.groupby.forEach((g: any) => {
      if (g.expr?.type === 'column_ref') {
        groupByCols.push({ name: safeExtractString(g.expr.column), table: safeExtractString(g.expr.table) });
      } else if (typeof g.expr === 'string') {
        groupByCols.push({ name: g.expr });
      } else if (g.expr?.column) {
        groupByCols.push({ name: safeExtractString(g.expr.column), table: safeExtractString(g.expr.table) });
      }
    });
  }

  return { selectCols, whereCols, orderByCols, groupByCols, joinCols, whereConditions, tables };
}

// 解析DDL
export function parseDDL(
  ddl: string, 
  dbType: DatabaseType, 
  parser: Parser
): { schemas: TableSchema[]; errors: ParseError[] } {
  const schemas: TableSchema[] = [];
  const errors: ParseError[] = [];
  const indexStatements: Array<{ idxName: string; tableName: string; columns: string[]; isUnique: boolean }> = [];
  
  if (!ddl.trim()) return { schemas, errors };
  
  const ddlStatements = ddl.split(/;\s*/).filter(s => s.trim());

  // 第一遍：解析所有 CREATE TABLE 语句
  for (let i = 0; i < ddlStatements.length; i++) {
    const ddl = ddlStatements[i].trim();
    if (!ddl) continue;

    try {
      // SQL Server 使用 transactsql
      const parserDbMap: Record<string, string> = { sqlserver: 'transactsql' };
      const parserDbType = parserDbMap[dbType] || dbType;
      const ast = parser.astify(ddl, { database: parserDbType });
      if (Array.isArray(ast)) continue;
      
      if (ast.type === 'create' && ast.keyword === 'table') {
        const createTable = ast as any;
        // 处理表名可能是对象的情况（使用 safeExtractString 统一处理）
        let tableName = safeExtractString(createTable.table?.[0]?.table);
        const columns: ColumnDef[] = [];
        const indexes: IndexDef[] = [];

        if (createTable.create_definitions) {
          for (const def of createTable.create_definitions) {
            // 解析列定义
            if (def.column && def.definition) {
              // 使用 safeExtractString 处理各种可能的格式
              let colName = safeExtractString(def.column);
              
              // 如果提取失败，尝试其他方式
              if (!colName && typeof def.column === 'object') {
                // 尝试各种可能的属性
                if (def.column.expr) {
                  colName = safeExtractString(def.column.expr);
                } else if (def.column.value) {
                  colName = safeExtractString(def.column.value);
                }
              }
              
              // 如果还是失败，使用原始值的字符串表示
              if (!colName) {
                colName = String(def.column);
              }

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

              // 确保列名有效（检查各种无效情况）
              if (!colName || 
                  colName === 'undefined' || 
                  colName === 'null' || 
                  colName === '[object Object]' ||
                  colName.startsWith('{') ||
                  colName.length === 0) {
                continue; // 跳过无效的列定义
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
                  if (d.column) return safeExtractString(d.column);
                  return String(d);
                }).filter(Boolean);
              }
              if (pkColumns.length > 0) {
                indexes.push({ name: 'PRIMARY', columns: pkColumns, isPrimary: true });
              }
            }

            // 解析索引
            if ((def.resource === 'index' || def.resource === 'key') && def.index) {
              const idxName = typeof def.index === 'string' ? def.index : safeExtractString(def.index.name || def.index.column || 'index');
              let idxColumns: string[] = [];
              if (def.definition && Array.isArray(def.definition)) {
                idxColumns = def.definition.map((d: any) => {
                  if (typeof d === 'string') return d;
                  if (d.column) return safeExtractString(d.column);
                  if (d.expr && d.expr.column) return safeExtractString(d.expr.column);
                  return String(d);
                }).filter(Boolean);
              } else if (def.definition) {
                const col = typeof def.definition === 'string' ? def.definition : safeExtractString(def.definition.column || String(def.definition));
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
              const idxName = typeof def.index === 'string' ? def.index : safeExtractString(def.index.name || 'unique_index');
              let idxColumns: string[] = [];
              if (def.definition && Array.isArray(def.definition)) {
                idxColumns = def.definition.map((d: any) => {
                  if (typeof d === 'string') return d;
                  if (d.column) return safeExtractString(d.column);
                  return String(d);
                }).filter(Boolean);
              } else if (def.definition) {
                const col = typeof def.definition === 'string' ? def.definition : safeExtractString(def.definition.column || String(def.definition));
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
      
      // 收集独立的 CREATE INDEX 语句（稍后处理）
      if (ast.type === 'create' && ast.keyword === 'index') {
        const createIndex = ast as any;
        const idxName = safeExtractString(createIndex.index) || 'index';
        // PostgreSQL 表名在 createIndex.table.table
        const tableName = safeExtractString(createIndex.table?.table);
        // Debug: console.log('[DDL] 原始 AST:', JSON.stringify(createIndex, null, 2));
        
        if (tableName) {
          let idxColumns: string[] = [];
          // PostgreSQL: index_columns, MySQL: definition 或 columns
          const definitions = createIndex.index_columns || createIndex.definition || createIndex.columns || createIndex.on_columns;
          
          if (Array.isArray(definitions)) {
            idxColumns = definitions.map((d: any) => {
              if (typeof d === 'string') return d;
              // PostgreSQL 格式: { column: { expr: { value: 'colname' } } }
              if (d.column?.expr?.value) return d.column.expr.value;
              if (d.column) return safeExtractString(d.column);
              // SQLite 格式: { type: 'column_ref', column: 'colname' }
              if (d.type === 'column_ref' && d.column) return safeExtractString(d.column);
              // SQL Server 格式可能类似于 MySQL 但也有特殊格式
              if (d.expr && d.expr.column) return safeExtractString(d.expr.column);
              if (d.expr?.type === 'column_ref' && d.expr.column) return safeExtractString(d.expr.column);
              if (d.name) return safeExtractString(d.name);
              if (d.value) return safeExtractString(d.value);
              return safeExtractString(d);
            }).filter(Boolean);
          } else if (definitions && typeof definitions === 'object') {
            // 处理单列索引的情况（某些解析器可能返回对象而非数组）
            const d = definitions;
            if (d.column?.expr?.value) idxColumns.push(d.column.expr.value);
            else if (d.column) idxColumns.push(safeExtractString(d.column));
            else if (d.type === 'column_ref' && d.column) idxColumns.push(safeExtractString(d.column));
            else if (d.expr && d.expr.column) idxColumns.push(safeExtractString(d.expr.column));
            else if (d.name) idxColumns.push(safeExtractString(d.name));
            else if (d.value) idxColumns.push(safeExtractString(d.value));
          }
          // Debug: console.log('[DDL] 索引列:', idxColumns);
          if (idxColumns.length > 0) {
            indexStatements.push({
              idxName,
              tableName,
              columns: idxColumns,
              isUnique: createIndex.unique === 'unique' || createIndex.keyword === 'unique'
            });
          }
        }
      }
    } catch (e: any) {
      errors.push({
        message: e.message || 'DDL解析错误',
        line: i + 1,
        sql: ddl.substring(0, 100) + (ddl.length > 100 ? '...' : '')
      });
    }
  }
  
  // 第二遍：将所有收集到的索引添加到对应的表中，并检查表是否存在
  for (const idx of indexStatements) {
    const tableNameLower = idx.tableName?.toLowerCase();
    const schema = schemas.find(s => {
      const schemaName = safeExtractString(s.name);
      return schemaName?.toLowerCase() === tableNameLower;
    });
    if (schema) {
      schema.indexes = schema.indexes || [];
      schema.indexes.push({
        name: idx.idxName,
        columns: idx.columns,
        isPrimary: false,
        isUnique: idx.isUnique
      });
    } else {
      // 表不存在，记录错误
      errors.push({
        message: `CREATE INDEX "${idx.idxName}" 引用了不存在的表 "${idx.tableName}"`,
        line: undefined,
        sql: `CREATE INDEX ${idx.idxName} ON ${idx.tableName} (...)`
      });
    }
  }

  // 第三遍：检查所有索引字段是否存在于对应的表中
  for (const schema of schemas) {
    const columnNames = new Set(schema.columns.map(col => col.name?.toLowerCase()).filter(Boolean));
    
    if (schema.indexes && schema.indexes.length > 0) {
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
            
            errors.push({
              message: `索引 "${index.name}" 引用了不存在的字段 "${colName}"${suggested ? `，您是否指的是 "${suggested}"` : ''}`,
              line: undefined,
              sql: `表: ${schema.name}, 索引: ${index.name}, 字段: ${colName}`
            });
          }
        }
      }
    }
  }

  return { schemas, errors };
}
