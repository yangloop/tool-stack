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
  if (node.type === 'number') {
    const numValue = typeof node.value === 'number' ? node.value : Number(node.value);
    return { value: numValue, isStringLiteral: false, type: 'number' };
  }
  if (node.type === 'single_quote_string' || node.type === 'double_quote_string' || node.type === 'string') {
    // 确保值是字符串
    const strValue = typeof node.value === 'string' ? node.value : String(node.value ?? '');
    return { value: strValue, isStringLiteral: true, type: 'string' };
  }
  if (node.type === 'bool') {
    const boolValue = typeof node.value === 'boolean' ? node.value : (node.value === 'true' || node.value === true);
    return { value: boolValue, isStringLiteral: false, type: 'boolean' };
  }
  if (node.type === 'null') return { value: null, isStringLiteral: false, type: 'null' };
  
  // 处理嵌套 value 属性
  if (node.value !== undefined && node.value !== null) {
    // 如果 value 是原始类型，直接使用
    if (typeof node.value === 'string' || typeof node.value === 'number' || typeof node.value === 'boolean') {
      const type = typeof node.value === 'number' ? 'number' : (typeof node.value === 'string' ? 'string' : 'boolean');
      return { value: node.value, isStringLiteral: type === 'string', type };
    }
    // 如果 value 是对象，递归解析
    if (typeof node.value === 'object') {
      return extractValueFromNode(node.value);
    }
  }
  
  // 处理 expr 属性（某些解析器使用）
  if (node.expr !== undefined && node.expr !== null) {
    return extractValueFromNode(node.expr);
  }
  
  // 如果节点本身就是原始值
  if (typeof node === 'string' || typeof node === 'number' || typeof node === 'boolean') {
    const type = typeof node === 'number' ? 'number' : (typeof node === 'string' ? 'string' : 'boolean');
    return { value: node, isStringLiteral: type === 'string', type };
  }
  
  // 最后尝试转换为字符串
  const strValue = String(node);
  // 避免 [object Object]
  if (strValue === '[object Object]') {
    return { value: undefined, isStringLiteral: false, type: 'unknown' };
  }
  return { value: strValue, isStringLiteral: false, type: 'unknown' };
}

// 检测值的数据类型
export function detectValueType(value: unknown, isStringLiteral: boolean = false): string {
  if (value === null || value === undefined) return 'null';
  if (isStringLiteral) return 'string';
  if (typeof value === 'object' && value !== null) {
    const node = value as any;
    // 处理 AST 节点类型
    if (node.type === 'number') {
      const numValue = node.value !== undefined ? node.value : node;
      const num = Number(numValue);
      return Number.isInteger(num) ? 'integer' : 'float';
    }
    if (node.type === 'single_quote_string' || node.type === 'double_quote_string' || node.type === 'string') {
      return 'string';
    }
    if (node.type === 'bool') return 'boolean';
    if (node.type === 'null') return 'null';
    // 递归处理嵌套 value
    if (node.value !== undefined) {
      // 如果 value 是原始类型，直接判断
      if (typeof node.value === 'number') {
        return Number.isInteger(node.value) ? 'integer' : 'float';
      }
      if (typeof node.value === 'string') return 'string';
      if (typeof node.value === 'boolean') return 'boolean';
      // 如果是对象，递归
      if (typeof node.value === 'object') {
        return detectValueType(node.value);
      }
    }
    // 处理 expr 属性
    if (node.expr !== undefined) {
      return detectValueType(node.expr);
    }
    return 'unknown';
  }
  if (typeof value === 'number') return Number.isInteger(value) ? 'integer' : 'float';
  if (typeof value === 'string') return 'string';
  if (typeof value === 'boolean') return 'boolean';
  return 'unknown';
}
