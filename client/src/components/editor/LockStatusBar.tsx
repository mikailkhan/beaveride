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
      className="h-8 px-4 bg-[#f5f3f3] border-b border-[#eae8e7] flex items-center gap-2 overflow-x-auto select-none shrink-0"
    >
      <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-500 mr-1 shrink-0">
        <span className="material-symbols-outlined text-sm">lock</span>
        <span>Active Locks:</span>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto py-0.5">
        {fileLocks.map((lock) => {
          const isMine = currentUser && String(lock.userId) === String(currentUser.id);
          const colorInfo = getUserColor(lock.userId, currentUser ? Number(currentUser.id) : undefined);
          const isUsageSpan = lock.unitName?.endsWith('(usage)');
          const cleanUnitName = isUsageSpan
            ? lock.unitName?.replace(' (usage)', '')
            : lock.unitName;

          const isFileLock = lock.lockScope === 'file';
          const lineRangeText = lock.startLine && lock.endLine ? `L${lock.startLine}-L${lock.endLine}` : 'Full File';
          const usageCount = lock.usageSpans?.length || 0;

          return (
            <div
              key={lock.id}
              onClick={() => handleScrollToLock(lock.startLine)}
              title={isFileLock ? `Locked by ${lock.username}` : `Click to jump to line ${lock.startLine}`}
              className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-medium bg-white border border-[#eae8e7] hover:border-primary/40 transition-all cursor-pointer shadow-xs shrink-0 group relative"
              style={{
                borderLeftWidth: '3px',
                borderLeftColor: colorInfo.icon,
              }}
            >
              <span 
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: colorInfo.icon }}
              />
              <span className="font-mono text-[#1b1c1c] font-bold">
                {isFileLock ? 'Entire File' : cleanUnitName || 'Code Block'}
              </span>
              <span className="text-neutral-400 font-mono text-[11px]">
                {lineRangeText}
              </span>
              <span className="text-neutral-500 text-[11px] font-semibold pl-1 border-l border-neutral-200">
                {isMine ? 'you' : lock.username}
              </span>
              {lock.includeUsages && usageCount > 0 && (
                <span className="px-1.5 py-0.2 rounded bg-primary/10 text-primary text-[10px] font-bold">
                  +{usageCount} usage{usageCount > 1 ? 's' : ''}
                </span>
              )}
              {isMine && onReleaseLock && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onReleaseLock(lock);
                  }}
                  title="Release this lock"
                  className="ml-1 w-4 h-4 rounded-full flex items-center justify-center text-neutral-400 hover:text-red-600 hover:bg-red-100 transition-colors"
                >
                  <span className="material-symbols-outlined text-[12px]">close</span>
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
