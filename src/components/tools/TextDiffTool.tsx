import { useState, useMemo } from 'react';
import { CodeEditor } from '../CodeEditor';
import { GitCompare, Trash2, ArrowLeftRight, Copy, Check, FileText, Sparkles } from 'lucide-react';
import * as Diff from 'diff';
import { useClipboard } from '../../hooks/useLocalStorage';
import { AdFooter } from '../ads';
import { ToolInfoAuto } from './ToolInfoSection';

interface DiffLine {
  type: 'equal' | 'insert' | 'delete' | 'modify';
  leftLineNum: number | null;
  rightLineNum: number | null;
  leftContent: string;
  rightContent: string;
}

// 使用 diff 库计算字符级别差异
function computeCharDiff(oldStr: string, newStr: string): Diff.Change[] {
  return Diff.diffChars(oldStr, newStr);
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
        const key = `${diff.added}-${diff.removed}-${index}`;
        
        // 左侧只显示删除和相同
        if (side === 'left') {
          if (diff.added) return null;
          if (diff.removed) {
            return (
              <mark 
                key={key} 
                className="bg-red-200 dark:bg-red-800/60 text-red-900 dark:text-red-100 px-0.5 rounded"
              >
                {diff.value}
              </mark>
            );
          }
          return <span key={key}>{diff.value}</span>;
        }
        
        // 右侧只显示新增和相同
        if (side === 'right') {
          if (diff.removed) return null;
          if (diff.added) {
            return (
              <mark 
                key={key} 
                className="bg-emerald-200 dark:bg-emerald-800/60 text-emerald-900 dark:text-emerald-100 px-0.5 rounded"
              >
                {diff.value}
              </mark>
            );
          }
          return <span key={key}>{diff.value}</span>;
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

  // 使用 diff 库的 diffLines 算法进行行级对比
  const diffResult = useMemo((): DiffLine[] => {
    const changes = Diff.diffLines(leftText, rightText);
    const result: DiffLine[] = [];
    
    let leftLineNum = 1;
    let rightLineNum = 1;

    for (const change of changes) {
      const lines = change.value.replace(/\n$/, '').split('\n');
      // 如果原始文本以换行符结尾，最后一个空行会被 split 忽略，需要加回来
      if (change.value.endsWith('\n') && change.value.length > 0) {
        lines.push('');
      }
      
      for (const line of lines) {
        if (!change.added && !change.removed) {
          // 相同行
          result.push({
            type: 'equal',
            leftLineNum: leftLineNum++,
            rightLineNum: rightLineNum++,
            leftContent: line,
            rightContent: line,
          });
        } else if (change.added) {
          // 新增行
          result.push({
            type: 'insert',
            leftLineNum: null,
            rightLineNum: rightLineNum++,
            leftContent: '',
            rightContent: line,
          });
        } else if (change.removed) {
          // 删除行
          result.push({
            type: 'delete',
            leftLineNum: leftLineNum++,
            rightLineNum: null,
            leftContent: line,
            rightContent: '',
          });
        }
      }
    }

    // 处理修改行的配对（简化处理：连续的删除和插入视为修改）
    const optimizedResult: DiffLine[] = [];
    let i = 0;
    while (i < result.length) {
      const current = result[i];
      const next = result[i + 1];
      
      // 如果当前是删除，下一个是插入，则合并为修改
      if (current.type === 'delete' && next && next.type === 'insert') {
        optimizedResult.push({
          type: 'modify',
          leftLineNum: current.leftLineNum,
          rightLineNum: next.rightLineNum,
          leftContent: current.leftContent,
          rightContent: next.rightContent,
        });
        i += 2;
      } else {
        optimizedResult.push(current);
        i++;
      }
    }

    return optimizedResult;
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
        <div className="tool-icon w-9 h-9 sm:w-10 sm:h-10">
          <GitCompare className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg sm:text-xl font-semibold text-surface-900 dark:text-surface-100">
            文本对比
          </h1>
          <p className="text-xs sm:text-sm text-surface-500 mt-0.5">
            使用 diff 库比较两段文本的差异，支持行内字符级高亮
          </p>
        </div>
        <button
          onClick={loadExample}
          className="btn-secondary btn-tool"
        >
          <Sparkles className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="hidden sm:inline">加载示例</span>
          <span className="sm:hidden">示例</span>
        </button>
      </div>

      {/* 输入区域 */}
      <div className="grid lg:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-5">
        {/* 左侧输入 */}
        <div className="card p-4 sm:p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs sm:text-sm font-medium text-surface-700 dark:text-surface-300">原文本</span>
            <span className="text-xs text-surface-400">{leftText.length} 字符</span>
          </div>
          <CodeEditor
            value={leftText}
            onChange={setLeftText}
            language="text"
            height={240}
            placeholder="在此粘贴原始文本..."
            variant="embedded"
          />
        </div>

        {/* 右侧输入 */}
        <div className="card p-4 sm:p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs sm:text-sm font-medium text-surface-700 dark:text-surface-300">对比文本</span>
            <span className="text-xs text-surface-400">{rightText.length} 字符</span>
          </div>
          <CodeEditor
            value={rightText}
            onChange={setRightText}
            language="text"
            height={240}
            placeholder="在此粘贴对比文本..."
            variant="embedded"
          />
        </div>
      </div>

      {/* 工具栏 */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 sm:mb-5">
        <div className="flex items-center gap-2">
          <button
            onClick={handleSwap}
            className="btn-secondary btn-tool"
            disabled={!leftText && !rightText}
          >
            <ArrowLeftRight className="w-3.5 h-3.5 flex-shrink-0" />
            交换
          </button>
          <button
            onClick={handleClear}
            className="btn-ghost-danger btn-tool"
            disabled={!leftText && !rightText}
          >
            <Trash2 className="w-3.5 h-3.5 flex-shrink-0" />
            清空
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <label className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-surface-600 dark:text-surface-400 cursor-pointer">
            <input
              type="checkbox"
              checked={showInlineDiff}
              onChange={(e) => setShowInlineDiff(e.target.checked)}
              className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded border-surface-300 text-primary-500 focus:ring-primary-500"
            />
            <span className="hidden sm:inline">行内差异高亮</span>
            <span className="sm:hidden">行内高亮</span>
          </label>
          <label className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-surface-600 dark:text-surface-400 cursor-pointer">
            <input
              type="checkbox"
              checked={showEqualLines}
              onChange={(e) => setShowEqualLines(e.target.checked)}
              className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded border-surface-300 text-primary-500 focus:ring-primary-500"
            />
            显示相同行
          </label>
          <div className="h-4 w-px bg-surface-300 dark:bg-surface-600 hidden sm:block" />
          <button
            onClick={handleCopyDiff}
            className={`btn-tool ${copied ? 'btn-ghost-success' : 'btn-secondary'}`}
            disabled={stats.insertCount === 0 && stats.deleteCount === 0 && stats.modifyCount === 0}
          >
            {copied ? <Check className="w-3.5 h-3.5 flex-shrink-0" /> : <Copy className="w-3.5 h-3.5 flex-shrink-0" />}
            {copied ? '已复制' : '复制差异'}
          </button>
        </div>
      </div>

      {/* 统计信息 */}
      {(leftText || rightText) && (
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4 sm:mb-5">
          <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-lg text-xs sm:text-sm">
            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-emerald-500 rounded-full" />
            相同: {stats.equalCount} 行
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg text-xs sm:text-sm">
            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-red-500 rounded-full" />
            删除: {stats.deleteCount} 行
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 rounded-lg text-xs sm:text-sm">
            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-primary-500 rounded-full" />
            新增: {stats.insertCount} 行
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-lg text-xs sm:text-sm">
            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-amber-500 rounded-full" />
            修改: {stats.modifyCount} 行
          </div>
        </div>
      )}

      {/* 对比结果 */}
      {leftText && rightText && (
        <div className="card overflow-hidden p-0">
          {/* 结果头部 */}
          <div className="flex items-center justify-between px-3 sm:px-5 py-2.5 sm:py-3 border-b border-surface-200 dark:border-surface-700 bg-surface-50/50 dark:bg-surface-800/50">
            <div className="flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-surface-500" />
              <span className="text-xs sm:text-sm font-medium text-surface-700 dark:text-surface-300">
                对比结果
              </span>
              {showInlineDiff && (
                <span className="badge-primary text-[9px] sm:text-[10px]">行内高亮</span>
              )}
            </div>
            <span className="text-xs text-surface-400">
              共 {filteredResult.length} 行
            </span>
          </div>



          {/* 对比表格 */}
          <div className="overflow-auto max-h-[400px] sm:max-h-[600px]">
            <table className="w-full text-xs sm:text-sm">
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
                    <td className="w-10 sm:w-12 px-2 sm:px-3 py-1.5 text-right text-[10px] sm:text-xs text-surface-400 font-mono border-r border-surface-200 dark:border-surface-700 select-none">
                      {line.leftLineNum ?? ''}
                    </td>
                    {/* 左侧内容 */}
                    <td className="w-1/2 px-2 sm:px-4 py-1.5 font-mono text-[10px] sm:text-xs border-r border-surface-200 dark:border-surface-700">
                      {line.leftContent !== '' && (
                        <span className={`
                          ${line.type === 'delete' ? 'text-red-700 dark:text-red-400' : 'text-surface-700 dark:text-surface-300'}
                        `}>
                          {line.type === 'delete' && <span className="text-red-500 mr-1 sm:mr-2">-</span>}
                          {line.type === 'modify' && <span className="text-amber-500 mr-1 sm:mr-2">~</span>}
                          {line.type === 'modify' && showInlineDiff ? (
                            <InlineDiff oldStr={line.leftContent} newStr={line.rightContent} side="left" />
                          ) : (
                            line.leftContent || ' '
                          )}
                        </span>
                      )}
                    </td>
                    {/* 右侧行号 */}
                    <td className="w-10 sm:w-12 px-2 sm:px-3 py-1.5 text-right text-[10px] sm:text-xs text-surface-400 font-mono border-r border-surface-200 dark:border-surface-700 select-none">
                      {line.rightLineNum ?? ''}
                    </td>
                    {/* 右侧内容 */}
                    <td className="w-1/2 px-2 sm:px-4 py-1.5 font-mono text-[10px] sm:text-xs">
                      {line.rightContent !== '' && (
                        <span className={`
                          ${line.type === 'insert' ? 'text-primary-700 dark:text-primary-400' : 'text-surface-700 dark:text-surface-300'}
                        `}>
                          {line.type === 'insert' && <span className="text-primary-500 mr-1 sm:mr-2">+</span>}
                          {line.type === 'modify' && <span className="text-amber-500 mr-1 sm:mr-2">~</span>}
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
            <div className="p-8 sm:p-12 text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-surface-100 dark:bg-surface-800 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <GitCompare className="w-6 h-6 sm:w-8 sm:h-8 text-surface-400" />
              </div>
              <p className="text-surface-500 text-sm">暂无差异</p>
              <p className="text-xs sm:text-sm text-surface-400 mt-1">两段文本完全相同</p>
            </div>
          )}
        </div>
      )}

      <ToolInfoAuto toolId="text-diff" />

      {/* 底部广告 */}
      <AdFooter />
    </div>
  );
}
