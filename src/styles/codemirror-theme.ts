/**
 * CodeMirror 主题配置
 * 适配项目整体 UI 风格 - 支持暗黑和浅色模式
 */

import { EditorView } from '@codemirror/view';
import type { Extension } from '@codemirror/state';

// 浅色模式主题配置
const lightThemeConfig = {
  // 背景色
  background: '#f8fafc', // surface-50
  foreground: '#1e293b', // surface-800
  caret: '#0ea5e9',      // primary-500
  selection: '#bae6fd',  // primary-200
  selectionMatch: '#7dd3fc40', // primary-300 with opacity
  lineHighlight: '#f1f5f9', // surface-100
  gutterBackground: '#f8fafc',
  gutterForeground: '#94a3b8', // surface-400
  gutterBorder: '#e2e8f0', // surface-200
  
  // 语法高亮颜色
  comment: '#64748b',    // surface-500
  keyword: '#2563eb',    // blue-600
  string: '#059669',     // emerald-600
  number: '#ea580c',     // orange-600
  bool: '#2563eb',       // blue-600
  function: '#7c3aed',   // violet-600
  variable: '#1e293b',   // surface-800
  type: '#2563eb',       // blue-600
  tag: '#2563eb',        // blue-600
  attribute: '#ea580c',  // orange-600
  property: '#2563eb',   // blue-600
  operator: '#475569',   // surface-600
  punctuation: '#64748b', // surface-500
};

// 深色模式主题配置
const darkThemeConfig = {
  // 背景色
  background: '#0f172a', // surface-900
  foreground: '#e2e8f0', // surface-200
  caret: '#38bdf8',      // primary-400
  selection: '#0369a180', // primary-700 with opacity
  selectionMatch: '#0ea5e940', // primary-500 with opacity
  lineHighlight: '#1e293b', // surface-800
  gutterBackground: '#0f172a',
  gutterForeground: '#64748b', // surface-500
  gutterBorder: '#334155', // surface-700
  
  // 语法高亮颜色
  comment: '#64748b',    // surface-500
  keyword: '#60a5fa',    // blue-400
  string: '#34d399',     // emerald-400
  number: '#fb923c',     // orange-400
  bool: '#60a5fa',       // blue-400
  function: '#a78bfa',   // violet-400
  variable: '#e2e8f0',   // surface-200
  type: '#60a5fa',       // blue-400
  tag: '#60a5fa',        // blue-400
  attribute: '#fb923c',  // orange-400
  property: '#60a5fa',   // blue-400
  operator: '#94a3b8',   // surface-400
  punctuation: '#64748b', // surface-500
};

// 创建浅色主题
export const lightTheme: Extension = EditorView.theme({
  '&': {
    backgroundColor: lightThemeConfig.background,
    color: lightThemeConfig.foreground,
  },
  
  '.cm-content': {
    caretColor: lightThemeConfig.caret,
    fontFamily: "'JetBrains Mono', 'Fira Code', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
    fontSize: '13px',
    lineHeight: '1.6',
    padding: '8px',
  },
  
  '.cm-cursor, .cm-dropCursor': {
    borderLeftColor: lightThemeConfig.caret,
    borderLeftWidth: '2px',
  },
  
  '&.cm-focused .cm-cursor': {
    borderLeftColor: lightThemeConfig.caret,
  },
  
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection': {
    backgroundColor: lightThemeConfig.selection,
  },
  
  '.cm-selectionMatch': {
    backgroundColor: lightThemeConfig.selectionMatch,
    borderRadius: '2px',
  },
  
  '.cm-gutters': {
    backgroundColor: lightThemeConfig.gutterBackground,
    color: lightThemeConfig.gutterForeground,
    borderRight: `1px solid ${lightThemeConfig.gutterBorder}`,
  },
  
  // 滚动条样式
  '.cm-scroller::-webkit-scrollbar': {
    width: '8px',
    height: '8px',
  },
  
  '.cm-scroller::-webkit-scrollbar-track': {
    background: 'transparent',
  },
  
  '.cm-scroller::-webkit-scrollbar-thumb': {
    background: '#cbd5e1',
    borderRadius: '4px',
  },
  
  '.cm-scroller::-webkit-scrollbar-thumb:hover': {
    background: '#94a3b8',
  },
  
  // 搜索面板样式
  '.cm-search': {
    backgroundColor: '#ffffff',
    borderTop: `1px solid ${lightThemeConfig.gutterBorder}`,
    padding: '8px 12px',
  },
  
  '.cm-search input': {
    border: `1px solid ${lightThemeConfig.gutterBorder}`,
    borderRadius: '6px',
    padding: '4px 8px',
    fontSize: '13px',
    outline: 'none',
    background: '#ffffff',
    color: lightThemeConfig.foreground,
  },
  
  '.cm-search input:focus': {
    borderColor: lightThemeConfig.caret,
    boxShadow: '0 0 0 2px rgba(14, 165, 233, 0.2)',
  },
  
  '.cm-search button': {
    border: `1px solid ${lightThemeConfig.gutterBorder}`,
    borderRadius: '6px',
    padding: '4px 12px',
    fontSize: '12px',
    background: '#f8fafc',
    color: lightThemeConfig.foreground,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  
  '.cm-search button:hover': {
    background: '#f1f5f9',
    borderColor: '#cbd5e1',
  },
  
  // 工具提示
  '.cm-tooltip': {
    border: `1px solid ${lightThemeConfig.gutterBorder}`,
    borderRadius: '8px',
    backgroundColor: '#ffffff',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
  },
  
  '.cm-tooltip.cm-tooltip-autocomplete': {
    border: `1px solid ${lightThemeConfig.gutterBorder}`,
  },
  
  '.cm-tooltip-autocomplete ul li[aria-selected]': {
    backgroundColor: lightThemeConfig.lineHighlight,
    color: lightThemeConfig.foreground,
  },
  
  // 面板样式
  '.cm-panels': {
    borderColor: lightThemeConfig.gutterBorder,
  },
  
  '.cm-panels-bottom': {
    borderTop: `1px solid ${lightThemeConfig.gutterBorder}`,
  },
  
  // 占位符
  '.cm-placeholder': {
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  
  // 匹配括号
  '.cm-matchingBracket': {
    backgroundColor: 'rgba(14, 165, 233, 0.15)',
    borderRadius: '2px',
    fontWeight: 'bold',
  },
  
  '.cm-nonmatchingBracket': {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderRadius: '2px',
  },
  
  // 特殊字符
  '.cm-specialChar': {
    color: '#dc2626',
  },
}, { dark: false });

// 创建深色主题
export const darkTheme: Extension = EditorView.theme({
  '&': {
    backgroundColor: darkThemeConfig.background,
    color: darkThemeConfig.foreground,
  },
  
  '.cm-content': {
    caretColor: darkThemeConfig.caret,
    fontFamily: "'JetBrains Mono', 'Fira Code', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
    fontSize: '13px',
    lineHeight: '1.6',
    padding: '8px',
  },
  
  '.cm-cursor, .cm-dropCursor': {
    borderLeftColor: darkThemeConfig.caret,
    borderLeftWidth: '2px',
  },
  
  '&.cm-focused .cm-cursor': {
    borderLeftColor: darkThemeConfig.caret,
  },
  
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection': {
    backgroundColor: darkThemeConfig.selection,
  },
  
  '.cm-selectionMatch': {
    backgroundColor: darkThemeConfig.selectionMatch,
    borderRadius: '2px',
  },
  
  '.cm-gutters': {
    backgroundColor: darkThemeConfig.gutterBackground,
    color: darkThemeConfig.gutterForeground,
    borderRight: `1px solid ${darkThemeConfig.gutterBorder}`,
  },
  
  // 滚动条样式
  '.cm-scroller::-webkit-scrollbar': {
    width: '8px',
    height: '8px',
  },
  
  '.cm-scroller::-webkit-scrollbar-track': {
    background: 'transparent',
  },
  
  '.cm-scroller::-webkit-scrollbar-thumb': {
    background: '#334155',
    borderRadius: '4px',
  },
  
  '.cm-scroller::-webkit-scrollbar-thumb:hover': {
    background: '#475569',
  },
  
  // 搜索面板样式
  '.cm-search': {
    backgroundColor: '#1e293b',
    borderTop: `1px solid ${darkThemeConfig.gutterBorder}`,
    padding: '8px 12px',
  },
  
  '.cm-search input': {
    border: `1px solid ${darkThemeConfig.gutterBorder}`,
    borderRadius: '6px',
    padding: '4px 8px',
    fontSize: '13px',
    outline: 'none',
    background: '#0f172a',
    color: darkThemeConfig.foreground,
  },
  
  '.cm-search input:focus': {
    borderColor: darkThemeConfig.caret,
    boxShadow: '0 0 0 2px rgba(56, 189, 248, 0.2)',
  },
  
  '.cm-search button': {
    border: `1px solid ${darkThemeConfig.gutterBorder}`,
    borderRadius: '6px',
    padding: '4px 12px',
    fontSize: '12px',
    background: '#1e293b',
    color: darkThemeConfig.foreground,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  
  '.cm-search button:hover': {
    background: '#334155',
    borderColor: '#475569',
  },
  
  // 工具提示
  '.cm-tooltip': {
    border: `1px solid ${darkThemeConfig.gutterBorder}`,
    borderRadius: '8px',
    backgroundColor: '#1e293b',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
    overflow: 'hidden',
  },
  
  '.cm-tooltip.cm-tooltip-autocomplete': {
    border: `1px solid ${darkThemeConfig.gutterBorder}`,
  },
  
  '.cm-tooltip-autocomplete ul li[aria-selected]': {
    backgroundColor: darkThemeConfig.lineHighlight,
    color: darkThemeConfig.foreground,
  },
  
  // 面板样式
  '.cm-panels': {
    borderColor: darkThemeConfig.gutterBorder,
  },
  
  '.cm-panels-bottom': {
    borderTop: `1px solid ${darkThemeConfig.gutterBorder}`,
  },
  
  // 占位符
  '.cm-placeholder': {
    color: '#64748b',
    fontStyle: 'italic',
  },
  
  // 匹配括号
  '.cm-matchingBracket': {
    backgroundColor: 'rgba(56, 189, 248, 0.2)',
    borderRadius: '2px',
    fontWeight: 'bold',
  },
  
  '.cm-nonmatchingBracket': {
    backgroundColor: 'rgba(248, 113, 113, 0.2)',
    borderRadius: '2px',
  },
  
  // 特殊字符
  '.cm-specialChar': {
    color: '#f87171',
  },
}, { dark: true });

// 语法高亮配置
export const highlightStyle = EditorView.baseTheme({
  // 注释
  '.cmt-comment': { color: lightThemeConfig.comment, fontStyle: 'italic' },
  '.cmt-comment.cmt-comment': { color: darkThemeConfig.comment, fontStyle: 'italic' },
  
  // 关键字
  '.cmt-keyword': { color: lightThemeConfig.keyword, fontWeight: '600' },
  '.cmt-keyword.cmt-keyword': { color: darkThemeConfig.keyword, fontWeight: '600' },
  
  // 字符串
  '.cmt-string': { color: lightThemeConfig.string },
  '.cmt-string.cmt-string': { color: darkThemeConfig.string },
  
  // 数字
  '.cmt-number': { color: lightThemeConfig.number },
  '.cmt-number.cmt-number': { color: darkThemeConfig.number },
  
  // 布尔值
  '.cmt-bool': { color: lightThemeConfig.bool, fontWeight: '600' },
  '.cmt-bool.cmt-bool': { color: darkThemeConfig.bool, fontWeight: '600' },
  
  // 函数
  '.cmt-function': { color: lightThemeConfig.function },
  '.cmt-function.cmt-function': { color: darkThemeConfig.function },
  
  // 变量
  '.cmt-variableName': { color: lightThemeConfig.variable },
  '.cmt-variableName.cmt-variableName': { color: darkThemeConfig.variable },
  
  // 类型
  '.cmt-typeName': { color: lightThemeConfig.type, fontWeight: '600' },
  '.cmt-typeName.cmt-typeName': { color: darkThemeConfig.type, fontWeight: '600' },
  
  // 标签
  '.cmt-tagName': { color: lightThemeConfig.tag },
  '.cmt-tagName.cmt-tagName': { color: darkThemeConfig.tag },
  
  // 属性
  '.cmt-propertyName': { color: lightThemeConfig.property },
  '.cmt-propertyName.cmt-propertyName': { color: darkThemeConfig.property },
  
  // 操作符
  '.cmt-operator': { color: lightThemeConfig.operator },
  '.cmt-operator.cmt-operator': { color: darkThemeConfig.operator },
  
  // 标点符号
  '.cmt-punctuation': { color: lightThemeConfig.punctuation },
  '.cmt-punctuation.cmt-punctuation': { color: darkThemeConfig.punctuation },
});
