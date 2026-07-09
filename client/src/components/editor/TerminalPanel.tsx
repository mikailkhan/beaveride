import { useEffect, useRef } from 'react';

interface TerminalPanelProps {
  output: string;
  status: 'idle' | 'running' | 'success' | 'error';
}

export const TerminalPanel = ({ output, status }: TerminalPanelProps) => {
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [output]);

  return (
    <div className="h-64 w-full bg-[#0D0D0D] border-t border-outline-variant flex flex-col font-mono text-sm">
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#2e303a] bg-[#16171d]">
        <span className="text-white/80 font-medium">Terminal</span>
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
          status === 'running' ? 'bg-tertiary-container text-on-tertiary-container' : 
          status === 'error' ? 'bg-error-container text-on-error-container' : 
          status === 'success' ? 'bg-primary-container text-on-primary-container' : 
          'bg-surface-variant text-on-surface-variant'
        }`}>
          {status.toUpperCase()}
        </span>
      </div>
      <div 
        ref={terminalRef}
        className="flex-1 overflow-auto p-4 text-[#9ca3af] whitespace-pre-wrap"
      >
        {output || <span className="opacity-50">Output will appear here...</span>}
      </div>
    </div>
  );
};
