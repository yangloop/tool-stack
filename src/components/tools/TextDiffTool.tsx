import { useState, useMemo } from 'react';
import { GitCompare, Trash2, ArrowLeftRight, Copy, Check, FileText, Sparkles } from 'lucide-react';
import { useClipboard } from '../../hooks/useLocalStorage';
import { AdFooter } from '../ads';

interface DiffLine {
  type: 'equal' | 'insert' | 'delete' | 'modify';
  leftLineNum: number | null;
  rightLineNum: number | null;
  leftContent: string;
  rightContent: string;
}

// 字符级别的差异片段
interface CharDiff {
  type: 'equal' | 'insert' | 'delete';
  text: string;
}

// 计算两个字符串的字符级别差异（简化版 LCS）
function computeCharDiff(oldStr: string, newStr: string): CharDiff[] {
  const m = oldStr.length;
  const n = newStr.length;
  
  // 动态规划表
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
  
  // 填充 DP 表
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (oldStr[i - 1] === newStr[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }
  
  // 回溯找出差异
  const result: CharDiff[] = [];
  let i = m, j = n;
  
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldStr[i - 1] === newStr[j - 1]) {
      // 相同字符
      result.unshift({ type: 'equal', text: oldStr[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      // 新增字符
      result.unshift({ type: 'insert', text: newStr[j - 1] });
      j--;
    } else if (i > 0) {
      // 删除字符
      result.unshift({ type: 'delete', text: oldStr[i - 1] });
      i--;
    }
  }
  
  // 合并连续的相同类型片段
  const merged: CharDiff[] = [];
  for (const diff of result) {
    if (merged.length > 0 && merged[merged.length - 1].type === diff.type) {
      merged[merged.length - 1].text += diff.text;
    } else {
      merged.push({ ...diff });
    }
  }
  
  return merged;
}

// 行内差异高亮组件
function InlineDiff({ oldStr, newStr, side }: { oldStr: string; newStr: string; side: 'left' | 'right' }) {
  const diffs = useMemo(() => computeCharDiff(oldStr, newStr), [oldStr, newStr]);
  
  if (diffs.length === 0) {
    return <span>{side === 'left' ? oldStr : newStr}</span>;
  }
  
  return (
    <span className="font-mono">
      {diffs.map((diff, index) => {
        const key = `${diff.type}-${index}`;
        
        // 左侧只显示删除和相同
        if (side === 'left') {
          if (diff.type === 'insert') return null;
          if (diff.type === 'delete') {
            return (
              <mark 
                key={key} 
                className="bg-red-200 dark:bg-red-800/60 text-red-900 dark:text-red-100 px-0.5 rounded"
              >
                {diff.text}
              </mark>
            );
          }
          return <span key={key}>{diff.text}</span>;
        }
        
        // 右侧只显示新增和相同
        if (side === 'right') {
          if (diff.type === 'delete') return null;
          if (diff.type === 'insert') {
            return (
              <mark 
                key={key} 
                className="bg-emerald-200 dark:bg-emerald-800/60 text-emerald-900 dark:text-emerald-100 px-0.5 rounded"
              >
                {diff.text}
              </mark>
            );
          }
          return <span key={key}>{diff.text}</span>;
        }
        
        return null;
      })}
    </span>
  );
}

export function TextDiffTool() {
  const [leftText, setLeftText] = useState('');
  const [rightText, setRightText] = useState('');
  const { copied, copy } = useClipboard();
  const [showEqualLines, setShowEqualLines] = useState(true);
  const [showInlineDiff, setShowInlineDiff] = useState(true);

  // 简单的行级 diff 算法
  const diffResult = useMemo((): DiffLine[] => {
    const leftLines = leftText.split('\n');
    const rightLines = rightText.split('\n');
    const result: DiffLine[] = [];
    
    let leftIndex = 0;
    let rightIndex = 0;
    let leftLineNum = 1;
    let rightLineNum = 1;

    // 使用简化的 LCS (最长公共子序列) 算法
    while (leftIndex < leftLines.length || rightIndex < rightLines.length) {
      const leftLine = leftLines[leftIndex];
      const rightLine = rightLines[rightIndex];

      if (leftIndex >= leftLines.length) {
        // 左侧已结束，右侧剩余为新增
        result.push({
          type: 'insert',
          leftLineNum: null,
          rightLineNum: rightLineNum++,
          leftContent: '',
          rightContent: rightLine,
        });
        rightIndex++;
      } else if (rightIndex >= rightLines.length) {
        // 右侧已结束，左侧剩余为删除
        result.push({
          type: 'delete',
          leftLineNum: leftLineNum++,
          rightLineNum: null,
          leftContent: leftLine,
          rightContent: '',
        });
        leftIndex++;
      } else if (leftLine === rightLine) {
        // 相同行
        result.push({
          type: 'equal',
          leftLineNum: leftLineNum++,
          rightLineNum: rightLineNum++,
          leftContent: leftLine,
          rightContent: rightLine,
        });
        leftIndex++;
        rightIndex++;
      } else {
        // 行不同，检查是否是插入或删除
        // 简化处理：如果下一行匹配，则当前行是插入/删除
        const nextLeftMatch = rightLines.slice(rightIndex).includes(leftLine);
        const nextRightMatch = leftLines.slice(leftIndex).includes(rightLine);

        if (!nextLeftMatch && nextRightMatch) {
          // 左侧当前行被删除
          result.push({
            type: 'delete',
            leftLineNum: leftLineNum++,
            rightLineNum: null,
            leftContent: leftLine,
            rightContent: '',
          });
          leftIndex++;
        } else if (nextLeftMatch && !nextRightMatch) {
          // 右侧当前行是新增
          result.push({
            type: 'insert',
            leftLineNum: null,
            rightLineNum: rightLineNum++,
            leftContent: '',
            rightContent: rightLine,
          });
          rightIndex++;
        } else {
          // 都不匹配，视为修改（删除旧行+新增新行）
          result.push({
            type: 'modify',
            leftLineNum: leftLineNum++,
            rightLineNum: rightLineNum++,
            leftContent: leftLine,
            rightContent: rightLine,
          });
          leftIndex++;
          rightIndex++;
        }
      }
    }

    return result;
  }, [leftText, rightText]);

  // 统计信息
  const stats = useMemo(() => {
    const insertCount = diffResult.filter(l => l.type === 'insert').length;
    const deleteCount = diffResult.filter(l => l.type === 'delete').length;
    const modifyCount = diffResult.filter(l => l.type === 'modify').length;
    const equalCount = diffResult.filter(l => l.type === 'equal').length;
    return { insertCount, deleteCount, modifyCount, equalCount };
  }, [diffResult]);

  // 过滤后的结果
  const filteredResult = useMemo(() => {
    if (showEqualLines) return diffResult;
    return diffResult.filter(line => line.type !== 'equal');
  }, [diffResult, showEqualLines]);

  const handleClear = () => {
    setLeftText('');
    setRightText('');
  };

  const handleSwap = () => {
    setLeftText(rightText);
    setRightText(leftText);
  };

  const handleCopyDiff = () => {
    const diffText = diffResult
      .filter(line => line.type !== 'equal')
      .map(line => {
        const prefix = line.type === 'insert' ? '+' : line.type === 'delete' ? '-' : '~';
        const content = line.type === 'insert' ? line.rightContent : line.leftContent;
        return `${prefix} ${content}`;
      })
      .join('\n');
    copy(diffText);
  };

  // 示例数据
  const loadExample = () => {
    setLeftText(`function greet(name) {
  console.log("Hello, " + name + "!");
  return true;
}

const user = "World";`);
    setRightText(`function greet(name) {
  console.log(\`Hello, \${name}!\`);
  return { success: true };
}

const user = "ToolStack";
const version = "2.0";`);
  };

  return (
    <div className="max-w-7xl mx-auto animate-fade-in">
      {/* 工具标题 */}
      <div className="tool-header">
        <div className="tool-icon">
          <GitCompare className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-semibold text-surface-900 dark:text-surface-100">
            文本对比
          </h1>
          <p className="text-sm text-surface-500 mt-0.5">
            比较两段文本的差异，支持行内字符级高亮
          </p>
        </div>
        <button
          onClick={loadExample}
          className="btn-secondary text-sm"
        >
          <Sparkles className="w-4 h-4" />
          加载示例
        </button>
      </div>

      {/* 输入区域 */}
      <div className="grid lg:grid-cols-2 gap-4 mb-5">
        {/* 左侧输入 */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-surface-700 dark:text-surface-300">原文本</span>
            <span className="text-xs text-surface-400">{leftText.length} 字符</span>
          </div>
          <textarea
            value={leftText}
            onChange={(e) => setLeftText(e.target.value)}
            placeholder="在此粘贴原始文本..."
            className="w-full h-48 p-4 font-mono text-sm bg-surface-50 dark:bg-surface-900/50 border border-surface-200 dark:border-surface-700 rounded-xl resize-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
            spellCheck={false}
          />
        </div>

        {/* 右侧输入 */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-surface-700 dark:text-surface-300">对比文本</span>
            <span className="text-xs text-surface-400">{rightText.length} 字符</span>
          </div>
          <textarea
            value={rightText}
            onChange={(e) => setRightText(e.target.value)}
            placeholder="在此粘贴对比文本..."
            className="w-full h-48 p-4 font-mono text-sm bg-surface-50 dark:bg-surface-900/50 border border-surface-200 dark:border-surface-700 rounded-xl resize-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
            spellCheck={false}
          />
        </div>
      </div>

      {/* 工具栏 */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2">
          <button
            onClick={handleSwap}
            className="btn-secondary text-sm"
            disabled={!leftText && !rightText}
          >
            <ArrowLeftRight className="w-4 h-4" />
            交换
          </button>
          <button
            onClick={handleClear}
            className="btn-ghost text-sm text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
            disabled={!leftText && !rightText}
          >
            <Trash2 className="w-4 h-4" />
            清空
          </button>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-surface-600 dark:text-surface-400 cursor-pointer">
            <input
              type="checkbox"
              checked={showInlineDiff}
              onChange={(e) => setShowInlineDiff(e.target.checked)}
              className="w-4 h-4 rounded border-surface-300 text-primary-500 focus:ring-primary-500"
            />
            行内差异高亮
          </label>
          <label className="flex items-center gap-2 text-sm text-surface-600 dark:text-surface-400 cursor-pointer">
            <input
              type="checkbox"
              checked={showEqualLines}
              onChange={(e) => setShowEqualLines(e.target.checked)}
              className="w-4 h-4 rounded border-surface-300 text-primary-500 focus:ring-primary-500"
            />
            显示相同行
          </label>
          <div className="h-4 w-px bg-surface-300 dark:bg-surface-600" />
          <button
            onClick={handleCopyDiff}
            className="btn-secondary text-sm"
            disabled={stats.insertCount === 0 && stats.deleteCount === 0 && stats.modifyCount === 0}
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? '已复制' : '复制差异'}
          </button>
        </div>
      </div>

      {/* 统计信息 */}
      {(leftText || rightText) && (
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-lg text-sm">
            <span className="w-2 h-2 bg-emerald-500 rounded-full" />
            相同: {stats.equalCount} 行
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg text-sm">
            <span className="w-2 h-2 bg-red-500 rounded-full" />
            删除: {stats.deleteCount} 行
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 rounded-lg text-sm">
            <span className="w-2 h-2 bg-primary-500 rounded-full" />
            新增: {stats.insertCount} 行
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-lg text-sm">
            <span className="w-2 h-2 bg-amber-500 rounded-full" />
            修改: {stats.modifyCount} 行
          </div>
        </div>
      )}

      {/* 对比结果 */}
      {leftText && rightText && (
        <div className="card overflow-hidden p-0">
          {/* 结果头部 */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-surface-200 dark:border-surface-700 bg-surface-50/50 dark:bg-surface-800/50">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-surface-500" />
              <span className="text-sm font-medium text-surface-700 dark:text-surface-300">
                对比结果
              </span>
              {showInlineDiff && (
                <span className="badge-primary text-[10px]">行内高亮已开启</span>
              )}
            </div>
            <span className="text-xs text-surface-400">
              共 {filteredResult.length} 行
            </span>
          </div>

          {/* 图例说明 */}
          {showInlineDiff && (
            <div className="flex items-center gap-4 px-5 py-2 border-b border-surface-200 dark:border-surface-700 bg-surface-50/30 dark:bg-surface-800/30 text-xs">
              <span className="text-surface-500">图例:</span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 bg-red-200 dark:bg-red-800/60 rounded" />
                <span className="text-surface-600 dark:text-surface-400">删除</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 bg-emerald-200 dark:bg-emerald-800/60 rounded" />
                <span className="text-surface-600 dark:text-surface-400">新增</span>
              </span>
            </div>
          )}

          {/* 对比表格 */}
          <div className="overflow-auto max-h-[600px]">
            <table className="w-full text-sm">
              <tbody>
                {filteredResult.map((line, index) => (
                  <tr
                    key={index}
                    className={`
                      ${line.type === 'delete' ? 'bg-red-50/50 dark:bg-red-900/10' : ''}
                      ${line.type === 'insert' ? 'bg-primary-50/50 dark:bg-primary-900/10' : ''}
                      ${line.type === 'modify' ? 'bg-amber-50/30 dark:bg-amber-900/5' : ''}
                      ${line.type === 'equal' ? 'hover:bg-surface-50 dark:hover:bg-surface-800/50' : ''}
                      transition-colors
                    `}
                  >
                    {/* 左侧行号 */}
                    <td className="w-12 px-3 py-1.5 text-right text-xs text-surface-400 font-mono border-r border-surface-200 dark:border-surface-700 select-none">
                      {line.leftLineNum ?? ''}
                    </td>
                    {/* 左侧内容 */}
                    <td className="w-1/2 px-4 py-1.5 font-mono text-xs border-r border-surface-200 dark:border-surface-700">
                      {line.leftContent && (
                        <span className={`
                          ${line.type === 'delete' ? 'text-red-700 dark:text-red-400' : 'text-surface-700 dark:text-surface-300'}
                        `}>
                          {line.type === 'delete' && <span className="text-red-500 mr-2">-</span>}
                          {line.type === 'modify' && <span className="text-amber-500 mr-2">~</span>}
                          {line.type === 'modify' && showInlineDiff ? (
                            <InlineDiff oldStr={line.leftContent} newStr={line.rightContent} side="left" />
                          ) : (
                            line.leftContent || ' '
                          )}
                        </span>
                      )}
                    </td>
                    {/* 右侧行号 */}
                    <td className="w-12 px-3 py-1.5 text-right text-xs text-surface-400 font-mono border-r border-surface-200 dark:border-surface-700 select-none">
                      {line.rightLineNum ?? ''}
                    </td>
                    {/* 右侧内容 */}
                    <td className="w-1/2 px-4 py-1.5 font-mono text-xs">
                      {line.rightContent && (
                        <span className={`
                          ${line.type === 'insert' ? 'text-primary-700 dark:text-primary-400' : 'text-surface-700 dark:text-surface-300'}
                        `}>
                          {line.type === 'insert' && <span className="text-primary-500 mr-2">+</span>}
                          {line.type === 'modify' && <span className="text-amber-500 mr-2">~</span>}
                          {line.type === 'modify' && showInlineDiff ? (
                            <InlineDiff oldStr={line.leftContent} newStr={line.rightContent} side="right" />
                          ) : (
                            line.rightContent || ' '
                          )}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredResult.length === 0 && (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-surface-100 dark:bg-surface-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <GitCompare className="w-8 h-8 text-surface-400" />
              </div>
              <p className="text-surface-500">暂无差异</p>
              <p className="text-sm text-surface-400 mt-1">两段文本完全相同</p>
            </div>
          )}
        </div>
      )}

      {/* 底部广告 */}
      <AdFooter />
    </div>
  );
}
