import React from 'react';
import { useLockStore } from '../../store/lockStore';
import { useAuthStore } from '../../store/authStore';
import { getUserColor } from '../../utils/userColorMap';
import type { FileLockInfo } from '../../types';

interface LockStatusBarProps {
  fileId: number | null;
  editor: any;
  onReleaseLock?: (lock: FileLockInfo) => void;
}

export const LockStatusBar: React.FC<LockStatusBarProps> = ({ fileId, editor, onReleaseLock }) => {
  const currentUser = useAuthStore((state) => state.user);
  const fileLocks = useLockStore((state) => (fileId ? state.fileLocks.get(fileId) : undefined)) || [];

  if (!fileId || fileLocks.length === 0) {
    return null;
  }

  const handleScrollToLock = (startLine?: number) => {
    if (editor && startLine && !isNaN(startLine)) {
      try {
        editor.revealLineInCenter(startLine);
        editor.setPosition({ lineNumber: startLine, column: 1 });
        editor.focus();
      } catch (err) {
        console.error('Failed to scroll editor to line:', err);
      }
    }
  };

  return (
    <div 
      role="status"
      aria-label="Active file locks"
      className="h-7.5 px-3 bg-[#f8f7f6] border-b border-[#e5e3e1] flex items-center gap-2 overflow-x-auto scrollbar-none select-none shrink-0"
    >
      <div className="flex items-center gap-1 text-[11px] font-semibold text-neutral-500 shrink-0">
        <span className="material-symbols-outlined text-[13px] leading-none text-neutral-400">lock</span>
        <span className="tracking-tight">Active Locks:</span>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {fileLocks.map((lock) => {
          const isMine = currentUser && String(lock.userId) === String(currentUser.id);
          const isAgentLock = lock.isAgent || lock.username === 'BeaverBot' || Number(lock.userId) === 901;
          const colorInfo = getUserColor(lock.userId, currentUser ? Number(currentUser.id) : undefined, isAgentLock);
          const isUsageSpan = lock.unitName?.endsWith('(usage)');
          const cleanUnitName = isUsageSpan
            ? lock.unitName?.replace(' (usage)', '')
            : lock.unitName;

          const isFileLock = lock.lockScope === 'file';
          const lineRangeText = lock.startLine && lock.endLine ? `L${lock.startLine}–L${lock.endLine}` : 'Full File';
          const usageCount = lock.usageSpans?.length || 0;

          return (
            <div
              key={lock.id}
              tabIndex={0}
              role="button"
              aria-label={`Lock on ${isFileLock ? 'entire file' : cleanUnitName || 'code block'} by ${isMine ? 'you' : lock.username}${isAgentLock ? ' (BOT)' : ''}`}
              onClick={() => handleScrollToLock(lock.startLine)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleScrollToLock(lock.startLine);
                } else if ((e.key === 'Delete' || e.key === 'Backspace') && isMine && onReleaseLock) {
                  e.preventDefault();
                  onReleaseLock(lock);
                }
              }}
              title={isFileLock ? `Locked by ${lock.username}${isAgentLock ? ' (BOT)' : ''}` : `Click to jump to line ${lock.startLine}`}
              className="h-5.5 inline-flex items-center gap-1.5 px-2.5 rounded-full text-[11px] font-medium bg-white/90 border border-black/5 hover:border-black/15 shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-all cursor-pointer shrink-0 group relative focus:outline-hidden focus:ring-1 focus:ring-primary/50"
            >
              {/* Color Indicator Dot */}
              <span 
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ backgroundColor: colorInfo.icon }}
              />

              {/* Unit Name */}
              <span className="font-mono text-[#1f2020] font-semibold tracking-tight text-[11px] leading-none">
                {isFileLock ? 'Entire File' : cleanUnitName || 'Code Block'}
              </span>

              {/* Line Range */}
              <span className="text-neutral-400 font-mono text-[10px] leading-none">
                {lineRangeText}
              </span>

              {/* Username pill */}
              <span className="text-neutral-500 text-[10px] font-medium leading-none pl-1 border-l border-neutral-200/80 inline-flex items-center gap-1">
                {isAgentLock && <span className="text-[11px]">🤖</span>}
                {isMine ? 'you' : lock.username}
                {isAgentLock && (
                  <span className="ml-0.5 px-1 rounded bg-indigo-100 text-indigo-700 text-[8px] font-bold tracking-wider uppercase">
                    BOT
                  </span>
                )}
              </span>

              {/* Usage Count Pill */}
              {lock.includeUsages && usageCount > 0 && (
                <span className="px-1 py-[1px] rounded-full bg-primary/10 text-primary text-[9px] font-bold leading-none">
                  +{usageCount} usage{usageCount > 1 ? 's' : ''}
                </span>
              )}

              {/* Release Button */}
              {isMine && onReleaseLock && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onReleaseLock(lock);
                  }}
                  title="Release lock"
                  className="w-3.5 h-3.5 rounded-full inline-flex items-center justify-center text-neutral-400 hover:text-neutral-900 hover:bg-neutral-200/80 transition-colors ml-0.5 shrink-0 border-none bg-transparent p-0 leading-none cursor-pointer"
                >
                  <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 16 16">
                    <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
                  </svg>
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
