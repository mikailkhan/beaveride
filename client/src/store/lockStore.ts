import { create } from 'zustand';
import type { FileLockInfo } from '../types';

interface LockState {
  /** Map of fileId → FileLockInfo[] for all locks in the current room */
  fileLocks: Map<number, FileLockInfo[]>;

  /** Files the current user is queued for: fileId → queue position */
  queuePositions: Map<number, number>;

  /** Set the full lock state (on initial connect) */
  setLockState: (locks: FileLockInfo[]) => void;

  /** A lock was acquired (broadcast from server) */
  addLock: (lock: FileLockInfo) => void;

  /** A lock was released (broadcast from server) */
  removeLock: (fileId: number, lockId: string) => void;

  /** Update queue position for a file */
  setQueuePosition: (fileId: number, position: number) => void;

  /** Remove from queue (lock was granted or cancelled) */
  removeFromQueue: (fileId: number) => void;

  /** Check if a file is globally locked by another user (file scope) */
  isFileLockedByOther: (fileId: number, currentUserId: number) => boolean;

  /** Get all locks for a specific file */
  getLocks: (fileId: number) => FileLockInfo[];

  /** Clear all lock state (on room leave) */
  clearLockStore: () => void;
}

export const useLockStore = create<LockState>((set, get) => ({
  fileLocks: new Map(),
  queuePositions: new Map(),

  setLockState: (locks) => {
    const map = new Map<number, FileLockInfo[]>();
    for (const lock of locks) {
      const existing = map.get(lock.fileId) || [];
      existing.push(lock);
      map.set(lock.fileId, existing);
    }
    set({ fileLocks: map });
  },

  addLock: (lock) => {
    set((state) => {
      const updated = new Map(state.fileLocks);
      const existing = updated.get(lock.fileId) || [];
      // Replace if same lock id already exists, else append
      const index = existing.findIndex(l => l.id === lock.id);
      if (index >= 0) {
        existing[index] = lock;
      } else {
        existing.push(lock);
      }
      updated.set(lock.fileId, [...existing]);
      return { fileLocks: updated };
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
      return { fileLocks: updated };
    });
  },

  setQueuePosition: (fileId, position) => {
    set((state) => {
      const updated = new Map(state.queuePositions);
      updated.set(fileId, position);
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
    // True if there is a 'file' scope lock owned by someone else
    return locks.some(l => l.lockScope === 'file' && l.userId !== currentUserId);
  },

  getLocks: (fileId) => {
    return get().fileLocks.get(fileId) || [];
  },

  clearLockStore: () => {
    set({
      fileLocks: new Map(),
      queuePositions: new Map(),
    });
  },
}));
