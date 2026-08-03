import React, { useEffect } from 'react';

interface LockScopePopoverProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectScope: (scope: 'file' | 'function' | 'usage') => void;
  currentBlock?: {
    unitName?: string;
    startLine: number;
    endLine: number;
  } | null;
  fileName: string;
}

export const LockScopePopover: React.FC<LockScopePopoverProps> = ({
  isOpen,
  onClose,
  onSelectScope,
  currentBlock,
  fileName,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const hasFunctionBlock = !!(currentBlock && currentBlock.unitName);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md animate-fade-in p-4"
      onClick={onClose}
    >
      <div 
        className="w-[480px] max-w-[90vw] bg-white rounded-2xl border border-[#e2bfb2]/70 shadow-2xl flex flex-col overflow-hidden select-none z-10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#eae8e7] bg-[#f5f3f3]">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-primary text-xl">security</span>
            <div>
              <h2 className="text-base font-bold text-[#1b1c1c]">Select Lock Scope</h2>
              <p className="text-xs text-neutral-500 font-mono">{fileName}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200/50 transition-colors"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Options Body */}
        <div className="p-6 space-y-3 bg-white">
          {/* Option 1: File Lock */}
          <button
            onClick={() => onSelectScope('file')}
            className="w-full p-4 rounded-xl border border-[#eae8e7] hover:border-primary bg-[#fbf9f8] hover:bg-primary/5 transition-all flex items-start gap-3 text-left group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-lg">description</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-[#1b1c1c] group-hover:text-primary transition-colors">
                  Lock Entire File
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-neutral-200 text-neutral-700 font-semibold">
                  File Scope
                </span>
              </div>
              <p className="text-xs text-neutral-500 mt-0.5">
                Acquire exclusive editing rights to the entire file. Others cannot edit any line.
              </p>
            </div>
          </button>

          {/* Option 2: Function Scope */}
          <button
            disabled={!hasFunctionBlock}
            onClick={() => hasFunctionBlock && onSelectScope('function')}
            className={`w-full p-4 rounded-xl border transition-all flex items-start gap-3 text-left group ${
              hasFunctionBlock 
                ? 'border-[#eae8e7] hover:border-primary bg-[#fbf9f8] hover:bg-primary/5 cursor-pointer' 
                : 'border-neutral-200 bg-neutral-100/60 opacity-60 cursor-not-allowed'
            }`}
          >
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${hasFunctionBlock ? 'bg-primary/10 text-primary group-hover:scale-105 transition-transform' : 'bg-neutral-200 text-neutral-400'}`}>
              <span className="material-symbols-outlined text-lg">code_blocks</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className={`text-sm font-bold ${hasFunctionBlock ? 'text-[#1b1c1c] group-hover:text-primary transition-colors' : 'text-neutral-400'}`}>
                  Lock Function Scope
                </span>
                {hasFunctionBlock && (
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-primary/10 text-primary font-bold">
                    {currentBlock?.unitName} [L{currentBlock?.startLine}-L{currentBlock?.endLine}]
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-500 mt-0.5">
                {hasFunctionBlock 
                  ? `Lock "${currentBlock?.unitName}" function scope. Collaborators can edit outside these lines.` 
                  : 'Place cursor inside a function to use this option.'}
              </p>
            </div>
          </button>

          {/* Option 3: Lock with Usages */}
          <button
            disabled={!hasFunctionBlock}
            onClick={() => hasFunctionBlock && onSelectScope('usage')}
            className={`w-full p-4 rounded-xl border transition-all flex items-start gap-3 text-left group ${
              hasFunctionBlock 
                ? 'border-[#eae8e7] hover:border-primary bg-[#fbf9f8] hover:bg-primary/5 cursor-pointer' 
                : 'border-neutral-200 bg-neutral-100/60 opacity-60 cursor-not-allowed'
            }`}
          >
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${hasFunctionBlock ? 'bg-primary/10 text-primary group-hover:scale-105 transition-transform' : 'bg-neutral-200 text-neutral-400'}`}>
              <span className="material-symbols-outlined text-lg">hub</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className={`text-sm font-bold ${hasFunctionBlock ? 'text-[#1b1c1c] group-hover:text-primary transition-colors' : 'text-neutral-400'}`}>
                  Lock with Usages
                </span>
                {hasFunctionBlock && (
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-700 font-bold">
                    Cross-File Lock
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-500 mt-0.5">
                {hasFunctionBlock 
                  ? `Lock "${currentBlock?.unitName}" AND atomically lock all call sites across the workspace.` 
                  : 'Place cursor inside a named function to use this option.'}
              </p>
            </div>
          </button>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-3 border-t border-[#eae8e7] bg-[#f5f3f3]">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-neutral-600 hover:text-neutral-900 rounded-lg hover:bg-neutral-200/50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
