import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type * as Monaco from 'monaco-editor';
import {
  ArrowLeftRight,
  Check,
  ChevronsDownUp,
  ChevronsUpDown,
  Copy,
  FileJson,
  GitCompare,
  Maximize2,
  Minimize2,
  RefreshCcw,
  Sparkles,
  Trash2,
  WrapText,
} from 'lucide-react';
import { ToolHeader } from '../../../components/common';
import { MonacoDiffEditor } from '../../../components/MonacoDiffEditor';
import { AdFooter } from '../../../components/ads';
import { useClipboard } from '../../../hooks/useLocalStorage';
import { ToolInfoAuto } from './ToolInfoSection';
import {
  canFormatLanguage,
  canReorderJson,
  formatContent,
  reorderJsonContent,
  type DiffLanguage,
} from '../../../utils/codeFormatters';

interface DiffStats {
  addedLines: number;
  removedLines: number;
  modifiedLines: number;
  changedBlocks: number;
  inlineChanges: number;
}

const languageOptions: Array<{ label: string; value: DiffLanguage }> = [
  { label: '纯文本', value: 'text' },
  { label: 'JSON', value: 'json' },
  { label: 'TypeScript', value: 'typescript' },
  { label: 'JavaScript', value: 'javascript' },
  { label: 'SQL', value: 'sql' },
  { label: 'HTML', value: 'html' },
  { label: 'XML', value: 'xml' },
  { label: 'CSS', value: 'css' },
  { label: 'YAML', value: 'yaml' },
  { label: 'Markdown', value: 'markdown' },
];

const examples: Record<DiffLanguage, { original: string; modified: string }> = {
  text: {
    original: `部署清单
- 配置环境变量
- 初始化数据库
- 启动 API 服务
- 通知测试团队`,
    modified: `部署清单
- 配置环境变量
- 初始化数据库
- 启动 API 服务
- 预热缓存
- 通知 QA 团队`,
  },
  json: {
    original: `{"name":"ToolStack","version":"1.0.0","features":["json","sql"],"flags":{"darkMode":false,"diff":false}}`,
    modified: `{"version":"1.1.0","name":"ToolStack","features":["json","sql","diff"],"flags":{"diff":true,"darkMode":true},"seo":{"enabled":true}}`,
  },
  typescript: {
    original: `export function sum(a:number,b:number){return a+b}

export function formatUser(name:string){
return name.trim()
}`,
    modified: `export function sum(a: number, b: number) {
  return a + b;
}

export function formatUser(name: string) {
  return name.trim().toUpperCase();
}`,
  },
  javascript: {
    original: `const users=[{id:1,name:"alice"},{id:2,name:"bob"}]
export const names=users.map(user=>user.name)`,
    modified: `const users = [{ id: 1, name: 'alice' }, { id: 2, name: 'bob' }];

export const names = users.map((user) => user.name.toUpperCase());`,
  },
  sql: {
    original: `select u.id,u.name,o.total from users u left join orders o on u.id=o.user_id where o.status='paid' order by o.created_at desc;`,
    modified: `SELECT
  u.id,
  u.name,
  o.total,
  o.currency
FROM users u
LEFT JOIN orders o
  ON u.id = o.user_id
WHERE o.status = 'paid'
ORDER BY o.created_at DESC;`,
  },
  html: {
    original: `<section><h1>ToolStack</h1><p>Diff preview</p></section>`,
    modified: `<section class="hero">
  <h1>ToolStack</h1>
  <p>Monaco diff preview</p>
</section>`,
  },
  xml: {
    original: `<config><feature name="diff" enabled="false"/><theme>light</theme></config>`,
    modified: `<config>
  <feature name="diff" enabled="true" />
  <theme>dark</theme>
</config>`,
  },
  css: {
    original: `.panel{display:flex;gap:8px;color:#334155}`,
    modified: `.panel {
  display: grid;
  gap: 12px;
  color: #0f172a;
}`,
  },
  yaml: {
    original: `services:
  web:
    image: nginx
    ports: ["80:80"]`,
    modified: `services:
  web:
    image: nginx:stable
    ports:
      - "80:80"
    restart: unless-stopped`,
  },
  markdown: {
    original: `# 更新说明

- 新增基础对比
- 支持复制结果`,
    modified: `# 更新说明

- 新增 Monaco Diff
- 支持格式化与差异导航`,
  },
};

function createEmptyStats(): DiffStats {
  return {
    addedLines: 0,
    removedLines: 0,
    modifiedLines: 0,
    changedBlocks: 0,
    inlineChanges: 0,
  };
}

function getDiffStats(lineChanges: readonly Monaco.editor.ILineChange[] | null): DiffStats {
  if (!lineChanges?.length) {
    return createEmptyStats();
  }

  return lineChanges.reduce<DiffStats>((stats, change) => {
    const originalLines =
      change.originalEndLineNumber === 0
        ? 0
        : change.originalEndLineNumber - change.originalStartLineNumber + 1;
    const modifiedLines =
      change.modifiedEndLineNumber === 0
        ? 0
        : change.modifiedEndLineNumber - change.modifiedStartLineNumber + 1;

    stats.changedBlocks += 1;
    stats.addedLines += Math.max(0, modifiedLines - originalLines);
    stats.removedLines += Math.max(0, originalLines - modifiedLines);
    stats.modifiedLines += Math.min(originalLines, modifiedLines);
    stats.inlineChanges += change.charChanges?.length ?? 0;

    return stats;
  }, createEmptyStats());
}

function getEditorValue(editor: Monaco.editor.IStandaloneCodeEditor) {
  return editor.getModel()?.getValue() ?? '';
}

export function TextDiffTool() {
  const [original, setOriginal] = useState(examples.text.original);
  const [modified, setModified] = useState(examples.text.modified);
  const [language, setLanguage] = useState<DiffLanguage>('text');
  const [renderSideBySide, setRenderSideBySide] = useState(true);
  const [ignoreTrimWhitespace, setIgnoreTrimWhitespace] = useState(false);
  const [wordWrap, setWordWrap] = useState<'off' | 'on'>('off');
  const [stats, setStats] = useState<DiffStats>(createEmptyStats);
  const [diffCount, setDiffCount] = useState(0);
  const [activeDiffIndex, setActiveDiffIndex] = useState(0);
  const [error, setError] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [contentVersion, setContentVersion] = useState(0);
  const { copied, copy } = useClipboard();

  const diffEditorRef = useRef<Monaco.editor.IStandaloneDiffEditor | null>(null);
  const diffChangesRef = useRef<readonly Monaco.editor.ILineChange[]>([]);

  const updateDiffStats = useCallback(() => {
    const editor = diffEditorRef.current;
    const lineChanges = editor?.getLineChanges() ?? [];

    diffChangesRef.current = lineChanges;
    setStats(getDiffStats(lineChanges));
    setDiffCount(lineChanges.length);

    setActiveDiffIndex((currentIndex) => {
      if (lineChanges.length === 0) {
        return 0;
      }

      return Math.min(Math.max(currentIndex, 1), lineChanges.length);
    });
  }, []);

  const handleMount = useCallback(
    (editor: Monaco.editor.IStandaloneDiffEditor, _monaco: typeof Monaco) => {
      diffEditorRef.current = editor;

      const originalEditor = editor.getOriginalEditor();
      const modifiedEditor = editor.getModifiedEditor();

      originalEditor.onDidChangeModelContent(() => {
        setOriginal(getEditorValue(originalEditor));
      });

      modifiedEditor.onDidChangeModelContent(() => {
        setModified(getEditorValue(modifiedEditor));
      });

      editor.onDidUpdateDiff(() => {
        updateDiffStats();
      });

      updateDiffStats();
    },
    [updateDiffStats]
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isFullscreen]);

  const applyEditorValues = useCallback((nextOriginal: string, nextModified: string) => {
    setOriginal(nextOriginal);
    setModified(nextModified);
    setContentVersion((currentValue) => currentValue + 1);
    setError('');
  }, []);

  const handleSwap = useCallback(() => {
    applyEditorValues(modified, original);
  }, [applyEditorValues, modified, original]);

  const handleClear = useCallback(() => {
    applyEditorValues('', '');
    setActiveDiffIndex(0);
  }, [applyEditorValues]);

  const handleLoadExample = useCallback(() => {
    const example = examples[language];
    applyEditorValues(example.original, example.modified);
  }, [applyEditorValues, language]);

  const runFormatter = useCallback(
    async (target: 'original' | 'modified' | 'both') => {
      if (!canFormatLanguage(language)) {
        return;
      }

      setIsBusy(true);
      setError('');

      try {
        if (target === 'original') {
          setOriginal(await formatContent(original, language));
        } else if (target === 'modified') {
          setModified(await formatContent(modified, language));
        } else {
          const [nextOriginal, nextModified] = await Promise.all([
            formatContent(original, language),
            formatContent(modified, language),
          ]);
          applyEditorValues(nextOriginal, nextModified);
        }
      } catch (formatterError) {
        setError(formatterError instanceof Error ? formatterError.message : '格式化失败');
      } finally {
        setIsBusy(false);
      }
    },
    [applyEditorValues, language, modified, original]
  );

  const runJsonReorder = useCallback(
    (target: 'original' | 'modified' | 'both') => {
      if (!canReorderJson(language)) {
        return;
      }

      try {
        if (target === 'original') {
          setOriginal(reorderJsonContent(original));
        } else if (target === 'modified') {
          setModified(reorderJsonContent(modified));
        } else {
          applyEditorValues(reorderJsonContent(original), reorderJsonContent(modified));
        }
        setError('');
      } catch (reorderError) {
        setError(reorderError instanceof Error ? reorderError.message : 'JSON 重排失败');
      }
    },
    [applyEditorValues, language, modified, original]
  );

  const navigateDiff = useCallback((direction: 'next' | 'previous') => {
    const editor = diffEditorRef.current;
    const changes = diffChangesRef.current;

    if (!editor || changes.length === 0) {
      return;
    }

    const nextIndex =
      direction === 'next'
        ? activeDiffIndex >= changes.length
          ? 1
          : activeDiffIndex + 1
        : activeDiffIndex <= 1
          ? changes.length
          : activeDiffIndex - 1;

    const targetChange = changes[nextIndex - 1];
    const targetLine = targetChange.modifiedStartLineNumber || targetChange.originalStartLineNumber || 1;

    editor.revealLineInCenter(targetLine);
    editor.getModifiedEditor().setPosition({ lineNumber: Math.max(targetLine, 1), column: 1 });
    editor.focus();
    setActiveDiffIndex(nextIndex);
  }, [activeDiffIndex]);

  const handleCopyModified = useCallback(async () => {
    await copy(modified);
  }, [copy, modified]);

  const changedLineTotal = useMemo(
    () => stats.addedLines + stats.removedLines + stats.modifiedLines,
    [stats.addedLines, stats.modifiedLines, stats.removedLines]
  );

  const statsBadges = (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
        +{stats.addedLines}
      </span>
      <span className="rounded-full bg-red-50 px-2.5 py-1 text-red-700 dark:bg-red-950/40 dark:text-red-300">
        -{stats.removedLines}
      </span>
      <span className="rounded-full bg-amber-50 px-2.5 py-1 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
        ~{stats.modifiedLines}
      </span>
      <span className="rounded-full bg-primary-50 px-2.5 py-1 text-primary-700 dark:bg-primary-950/40 dark:text-primary-300">
        {stats.changedBlocks} 处差异
      </span>
    </div>
  );

  const toolbar = (
    <div className="mb-3 rounded-2xl border border-surface-200 bg-surface-0 px-3 py-2 shadow-soft dark:border-surface-700 dark:bg-surface-800">
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={language}
          onChange={(event) => setLanguage(event.target.value as DiffLanguage)}
          className="select min-w-[120px] flex-1 py-2 text-sm sm:max-w-[180px] sm:flex-none"
        >
          {languageOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <button onClick={handleLoadExample} className="btn-secondary btn-tool">
          <Sparkles className="h-3.5 w-3.5 flex-shrink-0" />
          示例
        </button>

        <button
          onClick={() => runFormatter('both')}
          className="btn-primary btn-tool"
          disabled={!canFormatLanguage(language) || (!original && !modified) || isBusy}
        >
          <RefreshCcw className={`h-3.5 w-3.5 flex-shrink-0 ${isBusy ? 'animate-spin' : ''}`} />
          一键格式化
        </button>

        <button
          onClick={() => runJsonReorder('both')}
          className="btn-secondary btn-tool"
          disabled={!canReorderJson(language) || (!original && !modified)}
        >
          <FileJson className="h-3.5 w-3.5 flex-shrink-0" />
          JSON 重排
        </button>

        <button onClick={handleSwap} className="btn-secondary btn-tool" disabled={!original && !modified}>
          <ArrowLeftRight className="h-3.5 w-3.5 flex-shrink-0" />
          交换
        </button>

        <button onClick={handleClear} className="btn-ghost-danger btn-tool" disabled={!original && !modified}>
          <Trash2 className="h-3.5 w-3.5 flex-shrink-0" />
          清空
        </button>

        <button
          onClick={handleCopyModified}
          className={`btn-tool ${copied ? 'btn-ghost-success' : 'btn-ghost'}`}
          disabled={!modified}
        >
          {copied ? <Check className="h-3.5 w-3.5 flex-shrink-0" /> : <Copy className="h-3.5 w-3.5 flex-shrink-0" />}
          {copied ? '已复制' : '复制右侧'}
        </button>

        <label className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-surface-500 hover:bg-surface-100 dark:text-surface-400 dark:hover:bg-surface-700/60">
          <input
            type="checkbox"
            checked={renderSideBySide}
            onChange={(event) => setRenderSideBySide(event.target.checked)}
            className="h-4 w-4 rounded border-surface-300 text-primary-500 focus:ring-primary-500"
          />
          <span className="inline-flex items-center gap-1">
            {renderSideBySide ? <ChevronsUpDown className="h-3.5 w-3.5" /> : <ChevronsDownUp className="h-3.5 w-3.5" />}
            双栏
          </span>
        </label>

        <label className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-surface-500 hover:bg-surface-100 dark:text-surface-400 dark:hover:bg-surface-700/60">
          <input
            type="checkbox"
            checked={ignoreTrimWhitespace}
            onChange={(event) => setIgnoreTrimWhitespace(event.target.checked)}
            className="h-4 w-4 rounded border-surface-300 text-primary-500 focus:ring-primary-500"
          />
          忽略空白
        </label>

        <button
          onClick={() => setWordWrap((currentValue) => (currentValue === 'on' ? 'off' : 'on'))}
          className={`btn-tool ${wordWrap === 'on' ? 'btn-secondary' : 'btn-ghost'}`}
        >
          <WrapText className="h-3.5 w-3.5 flex-shrink-0" />
          自动换行
        </button>
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-[1600px] animate-fade-in">
      <ToolHeader
        icon={GitCompare}
        title="文本对比"
        description="基于 Monaco Diff Editor 的代码与文本差异对比，支持 VS Code 风格 diff、格式化、JSON 重排和差异定位。"
        iconColorClass="text-primary-500"
        actions={
          <button onClick={() => setIsFullscreen(true)} className="btn-tool-sm sm:btn-tool btn-ghost flex-shrink-0" title="全屏使用">
            <Maximize2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">全屏使用</span>
          </button>
        }
      />

      {!isFullscreen && toolbar}

      {error && (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      )}

      {!isFullscreen && (
        <div className="overflow-hidden rounded-2xl border border-surface-200 bg-surface-0 shadow-soft dark:border-surface-700 dark:bg-surface-800">
          <div className="flex flex-col gap-2 border-b border-surface-200 bg-surface-50/80 px-4 py-3 dark:border-surface-700 dark:bg-surface-900/50 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-sm font-medium text-surface-800 dark:text-surface-100">Diff 视图</div>
            <div className="mt-1 text-xs text-surface-500 dark:text-surface-400">
              当前语言: {languageOptions.find((option) => option.value === language)?.label} · 已定位 {diffCount === 0 ? 0 : activeDiffIndex}/{diffCount} · 变更行 {changedLineTotal}
            </div>
            <div className="mt-2">{statsBadges}</div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => navigateDiff('previous')} className="btn-secondary btn-tool" disabled={diffCount === 0}>
              上一个差异
            </button>
            <button onClick={() => navigateDiff('next')} className="btn-primary btn-tool" disabled={diffCount === 0}>
              下一个差异
            </button>
          </div>
          </div>

          <MonacoDiffEditor
            original={original}
            modified={modified}
            contentVersion={contentVersion}
            language={language}
            height={620}
            sideBySide={renderSideBySide}
            ignoreTrimWhitespace={ignoreTrimWhitespace}
            wordWrap={wordWrap}
            onMount={handleMount}
          />
        </div>
      )}

      <div className="mt-4">
        <ToolInfoAuto toolId="text-diff" />
      </div>

      <AdFooter />

      {isFullscreen && (
        <div className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-surface-0 dark:bg-surface-900">
          <div
            className="flex h-14 flex-shrink-0 items-center justify-between border-b border-surface-200 bg-surface-0 px-4 dark:border-surface-700 dark:bg-surface-800"
          >
            <div className="flex items-center gap-3">
              <GitCompare className="h-5 w-5 text-primary-500" />
              <span className="font-medium text-surface-900 dark:text-surface-100">文本对比</span>
              <span className="hidden text-xs text-surface-400 sm:inline">按 ESC 退出全屏</span>
            </div>
            <button onClick={() => setIsFullscreen(false)} className="btn-tool-sm sm:btn-tool btn-ghost flex-shrink-0" title="退出全屏">
              <Minimize2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">退出全屏</span>
            </button>
          </div>

          <div className="border-b border-surface-200 bg-surface-50/90 px-3 py-2 dark:border-surface-700 dark:bg-surface-900/60">
            <div className="flex flex-nowrap items-center gap-2 overflow-x-auto pb-1">
              <select
                value={language}
                onChange={(event) => setLanguage(event.target.value as DiffLanguage)}
                className="select w-[132px] flex-shrink-0 py-2 text-sm"
              >
                {languageOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <button onClick={handleLoadExample} className="btn-secondary btn-tool flex-shrink-0">
                <Sparkles className="h-3.5 w-3.5 flex-shrink-0" />
                示例
              </button>

              <button
                onClick={() => runFormatter('both')}
                className="btn-primary btn-tool flex-shrink-0"
                disabled={!canFormatLanguage(language) || (!original && !modified) || isBusy}
              >
                <RefreshCcw className={`h-3.5 w-3.5 flex-shrink-0 ${isBusy ? 'animate-spin' : ''}`} />
                一键格式化
              </button>

              <button
                onClick={() => runJsonReorder('both')}
                className="btn-secondary btn-tool flex-shrink-0"
                disabled={!canReorderJson(language) || (!original && !modified)}
              >
                <FileJson className="h-3.5 w-3.5 flex-shrink-0" />
                JSON 重排
              </button>

              <button onClick={handleSwap} className="btn-secondary btn-tool flex-shrink-0" disabled={!original && !modified}>
                <ArrowLeftRight className="h-3.5 w-3.5 flex-shrink-0" />
                交换
              </button>

              <button onClick={handleClear} className="btn-ghost-danger btn-tool flex-shrink-0" disabled={!original && !modified}>
                <Trash2 className="h-3.5 w-3.5 flex-shrink-0" />
                清空
              </button>

              <button
                onClick={handleCopyModified}
                className={`btn-tool flex-shrink-0 ${copied ? 'btn-ghost-success' : 'btn-ghost'}`}
                disabled={!modified}
              >
                {copied ? <Check className="h-3.5 w-3.5 flex-shrink-0" /> : <Copy className="h-3.5 w-3.5 flex-shrink-0" />}
                {copied ? '已复制' : '复制右侧'}
              </button>

              <label className="flex flex-shrink-0 cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-surface-500 hover:bg-surface-100 dark:text-surface-400 dark:hover:bg-surface-700/60">
                <input
                  type="checkbox"
                  checked={renderSideBySide}
                  onChange={(event) => setRenderSideBySide(event.target.checked)}
                  className="h-4 w-4 rounded border-surface-300 text-primary-500 focus:ring-primary-500"
                />
                <span className="inline-flex items-center gap-1">
                  {renderSideBySide ? <ChevronsUpDown className="h-3.5 w-3.5" /> : <ChevronsDownUp className="h-3.5 w-3.5" />}
                  双栏
                </span>
              </label>

              <label className="flex flex-shrink-0 cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-surface-500 hover:bg-surface-100 dark:text-surface-400 dark:hover:bg-surface-700/60">
                <input
                  type="checkbox"
                  checked={ignoreTrimWhitespace}
                  onChange={(event) => setIgnoreTrimWhitespace(event.target.checked)}
                  className="h-4 w-4 rounded border-surface-300 text-primary-500 focus:ring-primary-500"
                />
                忽略空白
              </label>

              <button
                onClick={() => setWordWrap((currentValue) => (currentValue === 'on' ? 'off' : 'on'))}
                className={`btn-tool flex-shrink-0 ${wordWrap === 'on' ? 'btn-secondary' : 'btn-ghost'}`}
              >
                <WrapText className="h-3.5 w-3.5 flex-shrink-0" />
                自动换行
              </button>

              <button onClick={() => navigateDiff('previous')} className="btn-secondary btn-tool flex-shrink-0" disabled={diffCount === 0}>
                上一个差异
              </button>

              <button onClick={() => navigateDiff('next')} className="btn-primary btn-tool flex-shrink-0" disabled={diffCount === 0}>
                下一个差异
              </button>
            </div>
          </div>

          {error && (
            <div className="border-b border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
              {error}
            </div>
          )}

          <div className="min-h-0 flex-1 p-4">
            <MonacoDiffEditor
              original={original}
              modified={modified}
              contentVersion={contentVersion}
              language={language}
              height="100%"
              sideBySide={renderSideBySide}
              ignoreTrimWhitespace={ignoreTrimWhitespace}
              wordWrap={wordWrap}
              onMount={handleMount}
            />
          </div>
        </div>
      )}
    </div>
  );
}
