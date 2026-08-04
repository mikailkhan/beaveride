import { create } from 'zustand';
import type { FileLockInfo, QueueInfo } from '../types';

export const MAX_STALE_RETRIES = 3;

export interface StaleWriteStateInfo {
  fileId: number;
  status: 'retrying' | 'failed_terminal' | 'none';
  retryCount: number;
  retriesRemaining: number;
  lastReason?: string;
  lastCurrentHash?: string;
  totalAttempts?: number;
  timestamp: number;
}

interface LockState {
  /** Map of fileId → FileLockInfo[] for all locks in the current room */
  fileLocks: Map<number, FileLockInfo[]>;

  /** Files the current user is queued for: fileId → queue position & info */
  queuePositions: Map<number, QueueInfo>;

  /** Set the full lock state (on initial connect) */
  setLockState: (locks: FileLockInfo[]) => void;

  /** A lock was acquired (broadcast from server) */
  addLock: (lock: FileLockInfo) => void;

  /** A lock was released (broadcast from server) */
  removeLock: (fileId: number, lockId: string) => void;

  /** Update queue position for a file */
  setQueuePosition: (fileId: number, info: number | QueueInfo) => void;

  /** Remove from queue (lock was granted or cancelled) */
  removeFromQueue: (fileId: number) => void;

  /** Check if a file is globally locked by another user (file scope) */
  isFileLockedByOther: (fileId: number, currentUserId: number) => boolean;

  /** Get all locks for a specific file */
  getLocks: (fileId: number) => FileLockInfo[];

  /** Map of groupId → array of lock IDs belonging to that usage-inclusive group */
  usageGroups: Map<string, string[]>;

  /** Track a usage group */
  addUsageGroup: (groupId: string, lockIds: string[]) => void;

  /** Remove a usage group */
  removeUsageGroup: (groupId: string) => void;

  /** Get group ID for a lock */
  getGroupForLock: (lockId: string) => string | undefined;

  /** Re-anchor lock line spans using parsed code units */
  reanchorLockSpans: (fileId: number, codeUnits: Array<{ unitName: string; startLine: number; endLine: number }>, editStartLine: number, lineDelta: number) => void;

  /** Adjust lock line spans when lines are added/removed during editing */
  adjustLockSpans: (fileId: number, editStartLine: number, lineDelta: number) => void;

  /** Map of lockId → SHA-256 baseline content hash */
  contentHashes: Map<string, string>;

  /** Set content hash for a lock */
  setContentHash: (lockId: string, hash: string) => void;

  /** Get baseline content hash for user's lock on a file */
  getContentHashForFile: (fileId: number, userId: number | string) => string | undefined;

  /** Map of fileId → stale write rejection info */
  staleRejections: Map<number, { fileId: number; reason: string; currentHash: string; timestamp: number }>;

  /** Add stale rejection notification for a file */
  addStaleRejection: (fileId: number, data: { reason: string; currentHash: string }) => void;

  /** Clear stale rejection notification for a file */
  clearStaleRejection: (fileId: number) => void;

  /** Map of fileId → detailed stale write state (retrying, terminal, or none) */
  staleWriteState: Map<number, StaleWriteStateInfo>;

  /** Set state to retrying on recoverable stale write */
  setStaleWriteRetrying: (fileId: number, data: { retryCount: number; retriesRemaining: number; currentHash: string }) => void;

  /** Set state to failed_terminal when max retries are exhausted */
  setStaleWriteTerminal: (fileId: number, data: { totalAttempts: number; reason: string }) => void;

  /** Clear stale write state for a file */
  clearStaleWriteState: (fileId: number) => void;

  /** Clear all lock state (on room leave) */
  clearLockStore: () => void;
}

export const useLockStore = create<LockState>((set, get) => ({
  fileLocks: new Map(),
  queuePositions: new Map(),
  usageGroups: new Map(),

  reanchorLockSpans: (fileId, codeUnits, editStartLine, lineDelta) => {
    set((state) => {
      const updated = new Map(state.fileLocks);
      const existing = updated.get(fileId);
      if (!existing) return {};

      const modified = existing.map((lock) => {
        if (lock.lockScope === 'function' && lock.unitName) {
          // Clean unitName if it's a usage span
          const cleanName = lock.unitName.endsWith('(usage)')
            ? lock.unitName.replace(' (usage)', '')
            : lock.unitName;

          const matchedUnit = codeUnits.find(u => u.unitName === cleanName);
          if (matchedUnit) {
            return { ...lock, startLine: matchedUnit.startLine, endLine: matchedUnit.endLine };
          }
        }

        // Fallback line shift math if unit name not matched
        if (lock.lockScope === 'function' && lock.startLine !== undefined && lock.endLine !== undefined && lineDelta !== 0) {
          let newStart = lock.startLine;
          let newEnd = lock.endLine;

          if (editStartLine <= lock.startLine) {
            newStart += lineDelta;
            newEnd += lineDelta;
          } else if (editStartLine > lock.startLine && editStartLine <= lock.endLine) {
            newEnd += lineDelta;
            if (newEnd < newStart) newEnd = newStart;
          }

          return { ...lock, startLine: newStart, endLine: newEnd };
        }

        return lock;
      });

      updated.set(fileId, modified);
      return { fileLocks: updated };
    });
  },

  adjustLockSpans: (fileId, editStartLine, lineDelta) => {
    if (lineDelta === 0) return;
    set((state) => {
      const updated = new Map(state.fileLocks);
      const existing = updated.get(fileId);
      if (!existing) return {};

      const modified = existing.map((lock) => {
        if (lock.lockScope === 'function' && lock.startLine !== undefined && lock.endLine !== undefined) {
          let newStart = lock.startLine;
          let newEnd = lock.endLine;

          if (editStartLine < lock.startLine) {
            newStart += lineDelta;
            newEnd += lineDelta;
          } else if (editStartLine >= lock.startLine && editStartLine <= lock.endLine) {
            newEnd += lineDelta;
            if (newEnd < newStart) newEnd = newStart;
          }

          return { ...lock, startLine: newStart, endLine: newEnd };
        }
        return lock;
      });

      updated.set(fileId, modified);
      return { fileLocks: updated };
    });
  },

  setLockState: (locks) => {
    const map = new Map<number, FileLockInfo[]>();
    const groups = new Map<string, string[]>();
    for (const lock of locks) {
      const existing = map.get(lock.fileId) || [];
      existing.push(lock);
      map.set(lock.fileId, existing);

      if (lock.groupId) {
        const groupLocks = groups.get(lock.groupId) || [];
        groupLocks.push(lock.id);
        groups.set(lock.groupId, groupLocks);
      }
    }
    set({ fileLocks: map, usageGroups: groups });
  },

  addLock: (lock) => {
    set((state) => {
      const updated = new Map(state.fileLocks);
      const existing = updated.get(lock.fileId) || [];
      const index = existing.findIndex(l => l.id === lock.id);
      if (index >= 0) {
        existing[index] = lock;
      } else {
        existing.push(lock);
      }
      updated.set(lock.fileId, [...existing]);

      const groups = new Map(state.usageGroups);
      if (lock.groupId) {
        const groupLocks = groups.get(lock.groupId) || [];
        if (!groupLocks.includes(lock.id)) {
          groupLocks.push(lock.id);
          groups.set(lock.groupId, groupLocks);
        }
      }

      return { fileLocks: updated, usageGroups: groups };
    });
  },

  removeLock: (fileId, lockId) => {
    set((state) => {
      const updated = new Map(state.fileLocks);
      const existing = updated.get(fileId) || [];
      const filtered = existing.filter(l => l.id !== lockId);
      if (filtered.length === 0) {
        updated.delete(fileId);
      } else {
        updated.set(fileId, filtered);
      }

      const groups = new Map(state.usageGroups);
      for (const [groupId, lockIds] of groups.entries()) {
        if (lockIds.includes(lockId)) {
          const newIds = lockIds.filter(id => id !== lockId);
          if (newIds.length === 0) {
            groups.delete(groupId);
          } else {
            groups.set(groupId, newIds);
          }
        }
      }

      return { fileLocks: updated, usageGroups: groups };
    });
  },

  setQueuePosition: (fileId, info) => {
    set((state) => {
      const updated = new Map(state.queuePositions);
      const queueInfo: QueueInfo = typeof info === 'number' ? { position: info } : info;
      updated.set(fileId, queueInfo);
      return { queuePositions: updated };
    });
  },

  removeFromQueue: (fileId) => {
    set((state) => {
      const updated = new Map(state.queuePositions);
      updated.delete(fileId);
      return { queuePositions: updated };
    });
  },

  isFileLockedByOther: (fileId, currentUserId) => {
    const locks = get().fileLocks.get(fileId);
    if (!locks) return false;
    return locks.some(l => l.lockScope === 'file' && l.userId !== currentUserId);
  },

  getLocks: (fileId) => {
    return get().fileLocks.get(fileId) || [];
  },

  addUsageGroup: (groupId, lockIds) => {
    set((state) => {
      const updated = new Map(state.usageGroups);
      updated.set(groupId, lockIds);
      return { usageGroups: updated };
    });
  },

  removeUsageGroup: (groupId) => {
    set((state) => {
      const updated = new Map(state.usageGroups);
      updated.delete(groupId);
      return { usageGroups: updated };
    });
  },

  getGroupForLock: (lockId: string) => {
    const { usageGroups } = get();
    for (const [groupId, lockIds] of usageGroups.entries()) {
      if (lockIds.includes(lockId)) return groupId;
    }
    return undefined;
  },

  isUsageLock: (lockId: string) => {
    return !!get().getGroupForLock(lockId);
  },

  contentHashes: new Map(),

  setContentHash: (lockId, hash) => {
    set((state) => {
      const updated = new Map(state.contentHashes);
      updated.set(lockId, hash);
      return { contentHashes: updated };
    });
  },

  getContentHashForFile: (fileId, userId) => {
    const locks = get().fileLocks.get(fileId) || [];
    const myLock = locks.find((l) => String(l.userId) === String(userId) && (l.contentHash || get().contentHashes.get(l.id)));
    if (!myLock) return undefined;
    return myLock.contentHash || get().contentHashes.get(myLock.id);
  },

  staleRejections: new Map(),

  addStaleRejection: (fileId, data) => {
    set((state) => {
      const updated = new Map(state.staleRejections);
      updated.set(fileId, {
        fileId,
        reason: data.reason,
        currentHash: data.currentHash,
        timestamp: Date.now(),
      });
      return { staleRejections: updated };
    });
  },

  clearStaleRejection: (fileId) => {
    set((state) => {
      const updated = new Map(state.staleRejections);
      updated.delete(fileId);
      return { staleRejections: updated };
    });
  },

  staleWriteState: new Map(),

  setStaleWriteRetrying: (fileId, data) => {
    set((state) => {
      const updated = new Map(state.staleWriteState);
      updated.set(fileId, {
        fileId,
        status: 'retrying',
        retryCount: data.retryCount,
        retriesRemaining: data.retriesRemaining,
        lastCurrentHash: data.currentHash,
        timestamp: Date.now(),
      });

      const updatedRejections = new Map(state.staleRejections);
      updatedRejections.set(fileId, {
        fileId,
        reason: 'stale_version',
        currentHash: data.currentHash,
        timestamp: Date.now(),
      });

      return { staleWriteState: updated, staleRejections: updatedRejections };
    });
  },

  setStaleWriteTerminal: (fileId, data) => {
    set((state) => {
      const updated = new Map(state.staleWriteState);
      updated.set(fileId, {
        fileId,
        status: 'failed_terminal',
        retryCount: data.totalAttempts,
        retriesRemaining: 0,
        totalAttempts: data.totalAttempts,
        lastReason: data.reason,
        timestamp: Date.now(),
      });

      const updatedRejections = new Map(state.staleRejections);
      updatedRejections.set(fileId, {
        fileId,
        reason: data.reason,
        currentHash: '',
        timestamp: Date.now(),
      });

      return { staleWriteState: updated, staleRejections: updatedRejections };
    });
  },

  clearStaleWriteState: (fileId) => {
    set((state) => {
      const updatedState = new Map(state.staleWriteState);
      updatedState.delete(fileId);
      const updatedRejections = new Map(state.staleRejections);
      updatedRejections.delete(fileId);
      return { staleWriteState: updatedState, staleRejections: updatedRejections };
    });
  },

  clearLockStore: () => {
    set({
      fileLocks: new Map(),
      queuePositions: new Map(),
      usageGroups: new Map(),
      contentHashes: new Map(),
      staleRejections: new Map(),
      staleWriteState: new Map(),
    });
  },
}));
