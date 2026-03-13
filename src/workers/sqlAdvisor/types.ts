// SQL Advisor 类型定义

export type DatabaseType = 'mysql' | 'postgresql' | 'sqlite' | 'sqlserver';

export type AnalysisType = 'critical' | 'warning' | 'info' | 'optimization' | 'success';

export interface AnalysisResult {
  id: string;
  type: AnalysisType;
  category: string;
  title: string;
  description: string;
  sql?: string;
  line?: number;
  suggestion?: string;
  details?: string[];
}

export interface IndexDef {
  name: string;
  columns: string[];
  isPrimary?: boolean;
  isUnique?: boolean;
  type?: 'BTREE' | 'HASH' | 'FULLTEXT' | 'SPATIAL';
}

export interface ColumnDef {
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

export interface TableSchema {
  name: string;
  columns: ColumnDef[];
  indexes?: IndexDef[];
  engine?: string;
  charset?: string;
}

export interface ParseError {
  message: string;
  line?: number;
  sql?: string;
}

// AST 相关类型
export interface WhereCondition {
  column: string;
  table?: string;
  value: unknown;
  isStringLiteral: boolean;
  operator: string;
  valueType: string;
}

export interface SelectColumn {
  name: string;
  alias?: string;
  table?: string;
}

export interface OrderByColumn {
  name: string;
  table?: string;
  direction: string;
}

export interface JoinColumn {
  name: string;
  table?: string;
  type: string;
}

export interface TableInfo {
  name: string;
  alias?: string;
}

export interface SelectInfo {
  selectCols: SelectColumn[];
  whereCols: Array<{ name: string; table?: string }>;
  orderByCols: OrderByColumn[];
  groupByCols: Array<{ name: string; table?: string }>;
  joinCols: JoinColumn[];
  whereConditions: WhereCondition[];
  tables: TableInfo[];
}

export interface TableQueryInfo {
  whereCols: string[];
  orderByCols: Array<{ name: string; direction: string }>;
  groupByCols: string[];
  joinCols: string[];
}

export interface TypeCompatibilityResult {
  compatible: boolean;
  issue?: string;
  severity: 'error' | 'warning' | 'info';
}

export interface ValueExtraction {
  value: unknown;
  isStringLiteral: boolean;
  type: string;
}
