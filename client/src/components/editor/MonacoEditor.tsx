import { Editor } from '@monaco-editor/react';
import type { OnMount } from '@monaco-editor/react';

interface MonacoEditorProps {
  language: string;
  value?: string;
  options?: Record<string, any>;
  onChange?: (value: string | undefined) => void;
  onMount?: OnMount;
  readOnly?: boolean;
}

export const MonacoEditor = ({ language, value, options, onChange, onMount, readOnly }: MonacoEditorProps) => {
  return (
    <div className="flex-1 w-full h-full relative flex flex-col">
      {readOnly && (
        <div className="flex items-center gap-xs px-sm py-1 bg-error/10 text-error text-xs font-label-md border-b border-error/20 shrink-0">
          <span className="material-symbols-outlined text-[14px]">lock</span>
          This file is locked by another user. View only.
        </div>
      )}
      <div className="flex-1 w-full relative">
        <Editor
          height="100%"
          language={language}
          value={value}
          onChange={onChange}
          onMount={onMount}
          theme="light"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            fontFamily: '"JetBrains Mono", monospace',
            wordWrap: 'on',
            lineNumbersMinChars: 3,
            padding: { top: 16 },
            scrollBeyondLastLine: false,
            smoothScrolling: true,
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            formatOnPaste: true,
            readOnly: readOnly ?? false,
            ...options,
          }}
          loading={<div className="p-4 text-on-surface-variant">Loading editor...</div>}
        />
      </div>
    </div>
  );
};
