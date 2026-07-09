import { Editor } from '@monaco-editor/react';

interface MonacoEditorProps {
  language: string;
  value: string;
  onChange: (value: string | undefined) => void;
}

export const MonacoEditor = ({ language, value, onChange }: MonacoEditorProps) => {
  return (
    <div className="flex-1 w-full h-full relative">
      <Editor
        height="100%"
        language={language}
        value={value}
        onChange={onChange}
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
        }}
        loading={<div className="p-4 text-on-surface-variant">Loading editor...</div>}
      />
    </div>
  );
};
