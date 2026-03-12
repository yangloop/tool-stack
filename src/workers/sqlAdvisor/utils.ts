// SQL Advisor 工具函数

import type { TypeCompatibilityResult, ValueExtraction } from './types';
import { DATA_TYPE_CATEGORIES } from './constants';

// 生成唯一ID
export function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

// 获取数据类型分类
export function getTypeCategory(type: string): string {
  const upperType = type.toUpperCase().replace(/\(.*\)/, '');
  for (const [cat, types] of Object.entries(DATA_TYPE_CATEGORIES)) {
    if (types.some(t => upperType.startsWith(t))) {
      return cat;
    }
  }
  return 'unknown';
}

// 检查类型是否兼容
export function checkTypeCompatibility(
  columnType: string, 
  valueType: string, 
  value?: unknown
): TypeCompatibilityResult {
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
export function extractValueFromNode(node: any): ValueExtraction {
  if (!node) return { value: undefined, isStringLiteral: false, type: 'null' };
  if (node.type === 'number') return { value: node.value, isStringLiteral: false, type: 'number' };
  if (node.type === 'single_quote_string' || node.type === 'double_quote_string' || node.type === 'string') {
    return { value: node.value, isStringLiteral: true, type: 'string' };
  }
  if (node.type === 'bool') return { value: node.value, isStringLiteral: false, type: 'boolean' };
  if (node.type === 'null') return { value: null, isStringLiteral: false, type: 'null' };
  if (node.value !== undefined) {
    return extractValueFromNode(node.value);
  }
  return { value: node, isStringLiteral: false, type: 'unknown' };
}

// 检测值的数据类型
export function detectValueType(value: unknown, isStringLiteral: boolean = false): string {
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
