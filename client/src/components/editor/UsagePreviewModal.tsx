import React from 'react';
import type { UsageScanResult } from '../../types';

interface UsagePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  scanResult: UsageScanResult | null;
  unitName: string;
  isLoading: boolean;
}

export const UsagePreviewModal: React.FC<UsagePreviewModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  scanResult,
  unitName,
  isLoading,
}) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md animate-fade-in p-4"
      onClick={onClose}
    >
      {/* Modal Dialog Card */}
      <div
        className="w-[580px] max-w-[90vw] max-h-[85vh] bg-white rounded-2xl border border-[#e2bfb2]/70 shadow-2xl flex flex-col overflow-hidden select-none z-10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#eae8e7] bg-[#f5f3f3]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-xl">lock</span>
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1b1c1c]">
                Lock with Usages
              </h2>
              <p className="text-xs text-[#5a4138]">
                Atomically lock function definition and all call sites
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200/50 transition-colors"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-white">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
              <div className="animate-spin rounded-full h-9 w-9 border-3 border-primary border-t-transparent" />
              <span className="text-sm font-medium text-[#1b1c1c]">
                Scanning workspace for usages of <code className="px-1.5 py-0.5 rounded bg-primary/10 text-primary font-mono text-xs">{unitName}</code>...
              </span>
              <p className="text-xs text-neutral-500 max-w-xs">
                Searching project files for all function calls and references.
              </p>
            </div>
          ) : scanResult ? (
            <>
              {/* Warnings */}
              {scanResult.warnings.length > 0 && (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 text-xs space-y-1">
                  <div className="flex items-center gap-2 font-semibold text-amber-800">
                    <span className="material-symbols-outlined text-base">warning</span>
                    <span>Scan Disclaimer</span>
                  </div>
                  {scanResult.warnings.map((w, i) => (
                    <p key={i} className="pl-6 text-amber-800/90 leading-relaxed">{w}</p>
                  ))}
                </div>
              )}

              {/* Definition Info Box */}
              <div className="p-4 rounded-xl bg-[#f5f3f3] border border-[#eae8e7] flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 block mb-0.5">
                    Target Definition
                  </span>
                  <span className="text-sm font-bold text-[#1b1c1c] font-mono">
                    {unitName}
                  </span>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-xs font-semibold">
                  Definition Span
                </span>
              </div>

              {/* Usages Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                    Usages Found ({scanResult.usages.length})
                  </h3>
                  <span className="text-xs text-neutral-400">
                    {scanResult.usages.length === 0 ? 'No external usages' : 'Across workspace'}
                  </span>
                </div>

                {scanResult.usages.length === 0 ? (
                  <div className="p-6 rounded-xl bg-[#fbf9f8] border border-dashed border-[#e2bfb2] text-center">
                    <p className="text-xs text-neutral-500 italic">
                      No usages found in other workspace files. Locking will apply to the definition only.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
                    {scanResult.usages.map((usage, i) => (
                      <div
                        key={`${usage.fileId}-${usage.startLine}-${i}`}
                        className="p-3 rounded-xl bg-[#fbf9f8] border border-[#e2bfb2]/60 hover:border-primary/50 transition-colors flex flex-col gap-1.5"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary text-sm">description</span>
                            <span className="font-semibold text-[#1b1c1c]">
                              {usage.fileName}
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-neutral-200 text-neutral-700 text-[11px] font-mono">
                              Line {usage.startLine}
                            </span>
                          </div>
                          {usage.confidence === 'medium' && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 font-medium">
                              Uncertain
                            </span>
                          )}
                        </div>
                        <div className="p-2 rounded-lg bg-white border border-[#eae8e7] overflow-x-auto">
                          <code className="text-xs font-mono text-[#1b1c1c] block whitespace-pre">
                            {usage.lineContent}
                          </code>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#eae8e7] bg-[#f5f3f3]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:text-neutral-900 rounded-xl hover:bg-neutral-200/50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading || !scanResult}
            className="px-5 py-2.5 text-xs font-bold text-white bg-[#a53c00] hover:bg-[#f66317] disabled:opacity-50 disabled:cursor-not-allowed transition-all rounded-xl shadow-md flex items-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">lock</span>
            <span>
              {scanResult && scanResult.usages.length > 0
                ? `Lock Definition + ${scanResult.usages.length} Usage${scanResult.usages.length > 1 ? 's' : ''}`
                : 'Lock Definition Only'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
