import { create } from 'zustand';
import type { FileLockInfo } from '../types';

interface LockState {
  /** Map of fileId → FileLockInfo for all locked files in the current room */
  fileLocks: Map<number, FileLockInfo>;

  /** Files the current user is queued for: fileId → queue position */
  queuePositions: Map<number, number>;

  /** Set the full lock state (on initial connect) */
  setLockState: (locks: FileLockInfo[]) => void;

  /** A file was locked (broadcast from server) */
  addLock: (lock: FileLockInfo) => void;

  /** A file was unlocked (broadcast from server) */
  removeLock: (fileId: number) => void;

  /** Update queue position for a file */
  setQueuePosition: (fileId: number, position: number) => void;

  /** Remove from queue (lock was granted or cancelled) */
  removeFromQueue: (fileId: number) => void;

  /** Check if a file is locked by another user */
  isLockedByOther: (fileId: number, currentUserId: number) => boolean;

  /** Get lock info for a specific file */
  getLock: (fileId: number) => FileLockInfo | undefined;

  /** Clear all lock state (on room leave) */
  clearLockStore: () => void;
}

export const useLockStore = create<LockState>((set, get) => ({
  fileLocks: new Map(),
  queuePositions: new Map(),

  setLockState: (locks) => {
    const map = new Map<number, FileLockInfo>();
    for (const lock of locks) {
      map.set(lock.fileId, lock);
    }
    set({ fileLocks: map });
  },

  addLock: (lock) => {
    set((state) => {
      const updated = new Map(state.fileLocks);
      updated.set(lock.fileId, lock);
      return { fileLocks: updated };
    });
  },

  removeLock: (fileId) => {
    set((state) => {
      const updated = new Map(state.fileLocks);
      updated.delete(fileId);
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

  isLockedByOther: (fileId, currentUserId) => {
    const lock = get().fileLocks.get(fileId);
    return lock !== undefined && lock.userId !== currentUserId;
  },

  getLock: (fileId) => {
    return get().fileLocks.get(fileId);
  },

  clearLockStore: () => {
    set({
      fileLocks: new Map(),
      queuePositions: new Map(),
    });
  },
}));
