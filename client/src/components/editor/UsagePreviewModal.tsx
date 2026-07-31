import type { UsageScanResult } from '../../types';

interface UsagePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  scanResult: UsageScanResult | null;
  unitName: string;
  isLoading: boolean;
}

export const UsagePreviewModal = ({
  isOpen,
  onClose,
  onConfirm,
  scanResult,
  unitName,
  isLoading,
}: UsagePreviewModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-surface border border-outline-variant rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[80vh] flex flex-col z-10">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-xl">
              lock
            </span>
            <h2 className="text-lg font-title-lg text-on-surface">
              Lock with Usages
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              <span className="ml-3 text-on-surface-variant">
                Scanning workspace for usages of "{unitName}"...
              </span>
            </div>
          ) : scanResult ? (
            <>
              {/* Warnings */}
              {scanResult.warnings.length > 0 && (
                <div className="mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <div className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-amber-600 text-sm mt-0.5">
                      warning
                    </span>
                    <div className="text-xs text-amber-700">
                      {scanResult.warnings.map((w, i) => (
                        <p key={i}>{w}</p>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Definition info */}
              <div className="mb-4">
                <h3 className="text-sm font-label-lg text-on-surface mb-1">
                  Definition
                </h3>
                <p className="text-xs text-on-surface-variant">
                  Function "<span className="font-mono text-primary">{unitName}</span>" 
                  in file #{scanResult.definitionFileId}
                </p>
              </div>

              {/* Usages list */}
              <div>
                <h3 className="text-sm font-label-lg text-on-surface mb-2">
                  Usages Found ({scanResult.usages.length})
                </h3>

                {scanResult.usages.length === 0 ? (
                  <p className="text-xs text-on-surface-variant italic">
                    No usages found in other files. Only the definition will be locked.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {scanResult.usages.map((usage, i) => (
                      <div
                        key={`${usage.fileId}-${usage.startLine}-${i}`}
                        className="flex items-start gap-3 p-2 rounded-lg bg-surface-variant/50 border border-outline-variant/50"
                      >
                        <span className="material-symbols-outlined text-on-surface-variant text-sm mt-0.5">
                          description
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-label-md text-on-surface">
                              {usage.fileName}
                            </span>
                            <span className="text-xs text-on-surface-variant">
                              L{usage.startLine}
                            </span>
                            {usage.confidence === 'medium' && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600">
                                uncertain
                              </span>
                            )}
                          </div>
                          <code className="text-xs text-on-surface-variant font-mono block mt-1 truncate">
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
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-outline-variant">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-label-lg text-on-surface-variant hover:text-on-surface transition-colors rounded-lg hover:bg-surface-variant"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading || !scanResult}
            className="px-4 py-2 text-sm font-label-lg text-on-primary bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-lg"
          >
            {scanResult && scanResult.usages.length > 0
              ? `Lock Definition + ${scanResult.usages.length} Usage${scanResult.usages.length > 1 ? 's' : ''}`
              : 'Lock Definition Only'}
          </button>
        </div>
      </div>
    </div>
  );
};
