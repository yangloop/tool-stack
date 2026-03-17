// SQL Advisor 常量配置

import type { DatabaseType } from './types';

export const DATABASE_CONFIGS: Record<DatabaseType, { name: string; description: string; features: string[] }> = {
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

// 数据类型分类
export const DATA_TYPE_CATEGORIES: Record<string, string[]> = {
  integer: ['INT', 'INTEGER', 'BIGINT', 'SMALLINT', 'TINYINT', 'MEDIUMINT', 'SERIAL', 'BIGSERIAL', 'INT2', 'INT4', 'INT8'],
  float: ['FLOAT', 'DOUBLE', 'DECIMAL', 'NUMERIC', 'REAL', 'DOUBLE PRECISION', 'FLOAT4', 'FLOAT8', 'MONEY'],
  string: ['VARCHAR', 'CHAR', 'TEXT', 'TINYTEXT', 'MEDIUMTEXT', 'LONGTEXT', 'STRING', 'CHARACTER', 'NVARCHAR', 'NCHAR', 'CLOB'],
  datetime: ['DATE', 'DATETIME', 'TIMESTAMP', 'TIME', 'YEAR', 'TIMESTAMPTZ', 'TIMETZ'],
  binary: ['BINARY', 'VARBINARY', 'BLOB', 'TINYBLOB', 'MEDIUMBLOB', 'LONGBLOB', 'BYTEA'],
  json: ['JSON', 'JSONB'],
  boolean: ['BOOLEAN', 'BOOL', 'BIT'],
  enum: ['ENUM', 'SET']
};
