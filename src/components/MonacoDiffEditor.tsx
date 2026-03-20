import { DiffEditor } from '@monaco-editor/react';
import type * as Monaco from 'monaco-editor';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { useIsDarkMode } from '../hooks/useIsDarkMode';

interface MonacoDiffEditorProps {
  original: string;
  modified: string;
  contentVersion?: number;
  language: string;
  height?: string | number;
  sideBySide?: boolean;
  ignoreTrimWhitespace?: boolean;
  wordWrap?: 'off' | 'on';
  onMount?: (editor: Monaco.editor.IStandaloneDiffEditor, monaco: typeof Monaco) => void;
}

const lightThemeName = 'toolstack-vs';
const darkThemeName = 'toolstack-vs-dark';

function defineDiffThemes(monaco: typeof Monaco) {
  monaco.editor.defineTheme(lightThemeName, {
    base: 'vs',
    inherit: true,
    rules: [],
    colors: {
      'editor.background': '#f8fafc',
      'diffEditor.insertedTextBackground': '#dcfce780',
      'diffEditor.removedTextBackground': '#fee2e280',
      'diffEditor.insertedLineBackground': '#ecfdf533',
      'diffEditor.removedLineBackground': '#fff1f233',
      'diffEditor.diagonalFill': '#e2e8f0',
      'editor.lineHighlightBackground': '#e2e8f033',
    },
  });

  monaco.editor.defineTheme(darkThemeName, {
    base: 'vs-dark',
    inherit: true,
    rules: [],
    colors: {
      'editor.background': '#0f172a',
      'diffEditor.insertedTextBackground': '#14532d80',
      'diffEditor.removedTextBackground': '#7f1d1d80',
      'diffEditor.insertedLineBackground': '#052e1633',
      'diffEditor.removedLineBackground': '#450a0a33',
      'diffEditor.diagonalFill': '#334155',
      'editor.lineHighlightBackground': '#1e293b66',
    },
  });
}

function MonacoDiffEditorInner({
  original,
  modified,
  contentVersion = 0,
  language,
  height = 560,
  sideBySide = true,
  ignoreTrimWhitespace = false,
  wordWrap = 'off',
  onMount,
}: MonacoDiffEditorProps) {
  const { isDark, isReady } = useIsDarkMode();
  const editorRef = useRef<Monaco.editor.IStandaloneDiffEditor | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleMount = useCallback(
    (editor: Monaco.editor.IStandaloneDiffEditor, monaco: typeof Monaco) => {
      editorRef.current = editor;
      defineDiffThemes(monaco);
      monaco.editor.setTheme(isDark ? darkThemeName : lightThemeName);

      onMount?.(editor, monaco);
    },
    [isDark, onMount]
  );

  const handleBeforeMount = useCallback((monaco: typeof Monaco) => {
    defineDiffThemes(monaco);
  }, []);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }

    const originalModel = editor.getOriginalEditor().getModel();
    const modifiedModel = editor.getModifiedEditor().getModel();

    if (originalModel && originalModel.getValue() !== original) {
      originalModel.pushEditOperations(
        [],
        [
          {
            range: originalModel.getFullModelRange(),
            text: original,
          },
        ],
        () => null
      );
    }

    if (modifiedModel && modifiedModel.getValue() !== modified) {
      modifiedModel.pushEditOperations(
        [],
        [
          {
            range: modifiedModel.getFullModelRange(),
            text: modified,
          },
        ],
        () => null
      );
    }
  }, [contentVersion, modified, original]);

  if (!isReady || !isMounted) {
    return (
      <div
        className="flex h-full min-h-[420px] items-center justify-center rounded-2xl border border-surface-200 bg-surface-50 text-surface-400 shadow-soft dark:border-surface-700 dark:bg-surface-900/60"
        style={{ height: typeof height === 'number' ? `${height}px` : height }}
      >
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
          <span className="text-sm">加载 Monaco Diff...</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="h-full min-h-0 overflow-hidden rounded-2xl border border-surface-200 shadow-soft dark:border-surface-700"
      style={{ height: typeof height === 'number' ? `${height}px` : height }}
    >
      <DiffEditor
        height={height}
        language={language}
        original={original}
        modified={modified}
        theme={isDark ? darkThemeName : lightThemeName}
        beforeMount={handleBeforeMount}
        onMount={handleMount}
        options={{
          automaticLayout: true,
          readOnly: false,
          renderSideBySide: sideBySide,
          originalEditable: true,
          ignoreTrimWhitespace,
          fontSize: 13,
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          lineNumbersMinChars: 3,
          renderIndicators: true,
          glyphMargin: true,
          diffCodeLens: true,
          stickyScroll: { enabled: true },
          wordWrap,
          renderOverviewRuler: true,
          overviewRulerBorder: false,
          padding: { top: 16, bottom: 16 },
        }}
        keepCurrentOriginalModel
        keepCurrentModifiedModel
        loading=""
       />
    </div>
  );
}

function arePropsEqual(previousProps: MonacoDiffEditorProps, nextProps: MonacoDiffEditorProps) {
  const contentChanged = previousProps.contentVersion !== nextProps.contentVersion;

  return (
    !contentChanged &&
    previousProps.language === nextProps.language &&
    previousProps.height === nextProps.height &&
    previousProps.sideBySide === nextProps.sideBySide &&
    previousProps.ignoreTrimWhitespace === nextProps.ignoreTrimWhitespace &&
    previousProps.wordWrap === nextProps.wordWrap &&
    previousProps.onMount === nextProps.onMount
  );
}

export const MonacoDiffEditor = memo(MonacoDiffEditorInner, arePropsEqual);
