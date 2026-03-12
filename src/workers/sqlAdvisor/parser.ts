// SQL Advisor 解析器模块
// 处理 SQL 和 DDL 的解析，提取 AST 信息

import { Parser } from 'node-sql-parser';
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
import { extractValueFromNode } from './utils';

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

// 解析DDL
export function parseDDL(
  ddl: string, 
  dbType: DatabaseType, 
  parser: Parser
): { schemas: TableSchema[]; errors: ParseError[] } {
  const schemas: TableSchema[] = [];
  const errors: ParseError[] = [];
  
  if (!ddl.trim()) return { schemas, errors };
  
  const ddlStatements = ddl.split(/;\s*/).filter(s => s.trim());

  for (let i = 0; i < ddlStatements.length; i++) {
    const ddl = ddlStatements[i].trim();
    if (!ddl) continue;

    try {
      const ast = parser.astify(ddl, { database: dbType });
      if (Array.isArray(ast)) continue;
      
      if (ast.type === 'create' && ast.keyword === 'table') {
        const createTable = ast as any;
        const tableName = createTable.table?.[0]?.table || '';
        const columns: ColumnDef[] = [];
        const indexes: IndexDef[] = [];

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
}
