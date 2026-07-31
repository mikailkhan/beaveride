export interface LockSpan {
  fileId: number;
  startLine: number;
  endLine: number;
}

export interface FileLock {
  id: string;
  fileId: number;
  userId: number;
  username: string;
  socketId: string;
  lockScope: 'file' | 'function';
  unitName?: string | undefined;
  startLine?: number | undefined;
  endLine?: number | undefined;
  includeUsages?: boolean | undefined;
  usageSpans?: LockSpan[] | undefined;
  groupId?: string | undefined;
  acquiredAt: number;
  lastHeartbeat: number;
}

export interface QueueEntry {
  userId: number;
  username: string;
  socketId: string;
  requestedAt: number;
  lockScope: 'file' | 'function';
  unitName?: string | undefined;
  startLine?: number | undefined;
  endLine?: number | undefined;
  includeUsages?: boolean | undefined;
  usageSpans?: LockSpan[] | undefined;
  groupId?: string | undefined;
}

const HEARTBEAT_TIMEOUT_MS = 30_000; // 30 seconds

// key: `${roomId}:${fileId}`
const locks = new Map<string, FileLock[]>();
const queues = new Map<string, QueueEntry[]>();

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

export type AcquireLockResult =
  | { status: 'acquired'; lock: FileLock }
  | { status: 'queued'; position: number; heldBy: { userId: number; username: string } }
  | { status: 'already_held' };

function checkOverlap(a: FileLock | QueueEntry, b: FileLock | QueueEntry): boolean {
  if (a.lockScope === 'file' || b.lockScope === 'file') return true;
  if (a.startLine === undefined || a.endLine === undefined || b.startLine === undefined || b.endLine === undefined) return true;
  return a.startLine <= b.endLine && a.endLine >= b.startLine;
}

export function acquireLock(
  roomId: number,
  fileId: number,
  userId: number,
  username: string,
  socketId: string,
  lockScope: 'file' | 'function',
  startLine?: number,
  endLine?: number,
  unitName?: string,
  includeUsages: boolean = false,
  usageSpans: LockSpan[] = [],
  groupId?: string
): AcquireLockResult {
  const key = `${roomId}:${fileId}`;
  let fileLocks = locks.get(key) ?? [];

  // Check if same user already holds the exact lock scope (if file) or exact range (if function)
  const existingLock = fileLocks.find(l => 
    l.userId === userId && 
    (l.lockScope === 'file' || (lockScope === 'function' && l.startLine === startLine && l.endLine === endLine))
  );

  if (existingLock) {
    return { status: 'already_held' };
  }

  const requestedLock = { lockScope, startLine, endLine, unitName };

  // Check for overlaps with other users
  const overlappingLock = fileLocks.find(l => l.userId !== userId && checkOverlap(l, requestedLock as any));

  if (!overlappingLock) {
    const lock: FileLock = {
      id: generateId(),
      fileId,
      userId,
      username,
      socketId,
      lockScope,
      unitName,
      startLine,
      endLine,
      includeUsages,
      usageSpans,
      groupId,
      acquiredAt: Date.now(),
      lastHeartbeat: Date.now(),
    };
    locks.set(key, [...fileLocks, lock]);
    return { status: 'acquired', lock };
  }

  // Overlap exists — add to queue
  let queue = queues.get(key) ?? [];
  
  const alreadyQueued = queue.some((q) => 
    q.userId === userId && q.lockScope === lockScope && q.startLine === startLine && q.endLine === endLine
  );
  
  if (!alreadyQueued) {
    queue.push({
      userId,
      username,
      socketId,
      requestedAt: Date.now(),
      lockScope,
      unitName,
      startLine,
      endLine,
      includeUsages,
      usageSpans,
      groupId,
    });
    queues.set(key, queue);
  }

  const position = queue.findIndex((q) => q.userId === userId) + 1;
  return {
    status: 'queued',
    position,
    heldBy: { userId: overlappingLock.userId, username: overlappingLock.username },
  };
}

export type AcquireUsageLockResult =
  | { status: 'acquired'; locks: FileLock[] }
  | { status: 'queued'; position: number; blockedBy: { fileId: number; userId: number; username: string }[] }
  | { status: 'already_held' };

/**
 * Atomically acquires a function lock + all usage span locks.
 * ALL-OR-NOTHING per PRD §7.2
 */
export function acquireUsageLock(
  roomId: number,
  definitionFileId: number,
  userId: number,
  username: string,
  socketId: string,
  unitName: string,
  defStartLine: number,
  defEndLine: number,
  usageSpans: LockSpan[],
  groupId: string
): AcquireUsageLockResult {
  const defKey = `${roomId}:${definitionFileId}`;
  const defLocks = locks.get(defKey) ?? [];

  const existingDef = defLocks.find(l =>
    l.userId === userId &&
    l.lockScope === 'function' &&
    l.startLine === defStartLine &&
    l.endLine === defEndLine
  );
  if (existingDef) {
    return { status: 'already_held' };
  }

  const blockedBy: { fileId: number; userId: number; username: string }[] = [];

  const defRequest = { lockScope: 'function' as const, startLine: defStartLine, endLine: defEndLine };
  const defOverlap = defLocks.find(l => l.userId !== userId && checkOverlap(l, defRequest as any));
  if (defOverlap) {
    blockedBy.push({ fileId: definitionFileId, userId: defOverlap.userId, username: defOverlap.username });
  }

  for (const span of usageSpans) {
    const spanKey = `${roomId}:${span.fileId}`;
    const spanLocks = locks.get(spanKey) ?? [];
    const spanRequest = { lockScope: 'function' as const, startLine: span.startLine, endLine: span.endLine };
    const spanOverlap = spanLocks.find(l => l.userId !== userId && checkOverlap(l, spanRequest as any));
    if (spanOverlap) {
      blockedBy.push({ fileId: span.fileId, userId: spanOverlap.userId, username: spanOverlap.username });
    }
  }

  if (blockedBy.length > 0) {
    let queue = queues.get(defKey) ?? [];
    const alreadyQueued = queue.some(q => q.userId === userId && q.groupId === groupId);

    if (!alreadyQueued) {
      queue.push({
        userId,
        username,
        socketId,
        requestedAt: Date.now(),
        lockScope: 'function',
        unitName,
        startLine: defStartLine,
        endLine: defEndLine,
        includeUsages: true,
        usageSpans,
        groupId,
      });
      queues.set(defKey, queue);
    }

    const position = queue.findIndex(q => q.userId === userId && q.groupId === groupId) + 1;
    return { status: 'queued', position, blockedBy };
  }

  const acquiredLocks: FileLock[] = [];

  const defLock: FileLock = {
    id: generateId(),
    fileId: definitionFileId,
    userId,
    username,
    socketId,
    lockScope: 'function',
    unitName,
    startLine: defStartLine,
    endLine: defEndLine,
    includeUsages: true,
    usageSpans,
    groupId,
    acquiredAt: Date.now(),
    lastHeartbeat: Date.now(),
  };
  locks.set(defKey, [...(locks.get(defKey) ?? []), defLock]);
  acquiredLocks.push(defLock);

  for (const span of usageSpans) {
    const spanKey = `${roomId}:${span.fileId}`;
    const spanLock: FileLock = {
      id: generateId(),
      fileId: span.fileId,
      userId,
      username,
      socketId,
      lockScope: 'function',
      unitName: `${unitName} (usage)`,
      startLine: span.startLine,
      endLine: span.endLine,
      includeUsages: false,
      usageSpans: [],
      groupId,
      acquiredAt: Date.now(),
      lastHeartbeat: Date.now(),
    };
    locks.set(spanKey, [...(locks.get(spanKey) ?? []), spanLock]);
    acquiredLocks.push(spanLock);
  }

  return { status: 'acquired', locks: acquiredLocks };
}

export interface ReleaseGroupResult {
  status: 'released';
  releasedLocks: { roomId: number; fileId: number; lock: FileLock; nextInQueue: QueueEntry[] }[];
}

export function releaseGroupLocks(
  roomId: number,
  groupId: string,
  userId: number
): ReleaseGroupResult {
  const releasedLocks: { roomId: number; fileId: number; lock: FileLock; nextInQueue: QueueEntry[] }[] = [];
  const prefix = `${roomId}:`;

  for (const [key, fileLocks] of locks.entries()) {
    if (!key.startsWith(prefix)) continue;

    const parts = key.split(':');
    const fileId = parseInt(parts[1]!, 10);

    const groupLocksInFile = fileLocks.filter(l => l.groupId === groupId && l.userId === userId);

    for (const lock of groupLocksInFile) {
      const result = releaseLock(roomId, fileId, userId, lock.id);
      if (result.status === 'released') {
        releasedLocks.push({ roomId, fileId, lock: result.lock, nextInQueue: result.nextInQueue });
      }
    }
  }

  return { status: 'released', releasedLocks };
}

export type ReleaseLockResult =
  | { status: 'released'; lock: FileLock; nextInQueue: QueueEntry[] }
  | { status: 'not_held' };

export function releaseLock(
  roomId: number,
  fileId: number,
  userId: number,
  lockId: string
): ReleaseLockResult {
  const key = `${roomId}:${fileId}`;
  let fileLocks = locks.get(key) ?? [];

  const lockIndex = fileLocks.findIndex(l => l.id === lockId && l.userId === userId);
  
  if (lockIndex === -1) {
    return { status: 'not_held' };
  }

  const releasedLock = fileLocks[lockIndex]!;
  fileLocks.splice(lockIndex, 1);
  
  if (fileLocks.length === 0) {
    locks.delete(key);
  } else {
    locks.set(key, fileLocks);
  }

  // Check queue — we might be able to promote multiple users if they don't overlap with each other
  // or with existing locks.
  const queue = queues.get(key) ?? [];
  const promotedEntries: QueueEntry[] = [];
  
  if (queue.length > 0) {
    // Find first entry in queue that no longer overlaps with current locks
    const nextValidIndex = queue.findIndex(q => !fileLocks.some(l => checkOverlap(l, q as any)));
    
    if (nextValidIndex !== -1 && queue[nextValidIndex]) {
      promotedEntries.push(queue[nextValidIndex]!);
      queue.splice(nextValidIndex, 1);
    }

    if (queue.length === 0) {
      queues.delete(key);
    } else {
      queues.set(key, queue);
    }
  }

  return { status: 'released', lock: releasedLock, nextInQueue: promotedEntries };
}

export function refreshHeartbeat(roomId: number, fileId: number, userId: number): boolean {
  const key = `${roomId}:${fileId}`;
  const fileLocks = locks.get(key);
  if (!fileLocks) return false;
  
  let found = false;
  for (const lock of fileLocks) {
    if (lock.userId === userId) {
      lock.lastHeartbeat = Date.now();
      found = true;
    }
  }
  return found;
}

export interface ReleasedLock {
  roomId: number;
  fileId: number;
  lock: FileLock;
  nextInQueue: QueueEntry[];
}

export function releaseAllLocksForSocket(socketId: string): ReleasedLock[] {
  const released: ReleasedLock[] = [];

  for (const [key, fileLocks] of locks.entries()) {
    const parts = key.split(':');
    if (!parts[0] || !parts[1]) continue;
    const roomId = parseInt(parts[0], 10);
    const fileId = parseInt(parts[1], 10);

    const locksToRemove = fileLocks.filter(l => l.socketId === socketId);
    
    for (const lock of locksToRemove) {
      const res = releaseLock(roomId, fileId, lock.userId, lock.id);
      if (res.status === 'released') {
        released.push({ roomId, fileId, lock: res.lock, nextInQueue: res.nextInQueue });
      }
    }
  }

  // Also remove from any queues
  for (const [key, queue] of queues.entries()) {
    const filtered = queue.filter((q) => q.socketId !== socketId);
    if (filtered.length === 0) {
      queues.delete(key);
    } else {
      queues.set(key, filtered);
    }
  }

  return released;
}

export function getExpiredLocks(): Array<{ roomId: number, fileId: number, lock: FileLock }> {
  const now = Date.now();
  const expired: Array<{ roomId: number, fileId: number, lock: FileLock }> = [];

  for (const [key, fileLocks] of locks.entries()) {
    const parts = key.split(':');
    if (!parts[0] || !parts[1]) continue;
    const roomId = parseInt(parts[0], 10);
    const fileId = parseInt(parts[1], 10);

    for (const lock of fileLocks) {
      if (now - lock.lastHeartbeat > HEARTBEAT_TIMEOUT_MS) {
        expired.push({ roomId, fileId, lock });
      }
    }
  }

  return expired;
}

export function getLocksForRoom(roomId: number): FileLock[] {
  const result: FileLock[] = [];
  const prefix = `${roomId}:`;
  for (const [key, fileLocks] of locks.entries()) {
    if (key.startsWith(prefix)) {
      result.push(...fileLocks);
    }
  }
  return result;
}

export function getQueueForFile(roomId: number, fileId: number): QueueEntry[] {
  const key = `${roomId}:${fileId}`;
  return queues.get(key) ?? [];
}

export function adjustLockSpansOnEdit(
  roomId: number,
  fileId: number,
  editStartLine: number,
  lineDelta: number
): FileLock[] {
  const key = `${roomId}:${fileId}`;
  const fileLocks = locks.get(key) ?? [];

  for (const lock of fileLocks) {
    if (lock.lockScope === 'function' && lock.startLine !== undefined && lock.endLine !== undefined) {
      if (editStartLine <= lock.startLine) {
        // Edit above or at start of lock header -> shift entire range
        lock.startLine += lineDelta;
        lock.endLine += lineDelta;
      } else if (editStartLine > lock.startLine && editStartLine <= lock.endLine) {
        // Edit inside the body of the lock -> expand/contract endLine
        lock.endLine += lineDelta;
        if (lock.endLine < lock.startLine) {
          lock.endLine = lock.startLine;
        }
      }
    }
  }

  const queue = queues.get(key) ?? [];
  for (const q of queue) {
    if (q.lockScope === 'function' && q.startLine !== undefined && q.endLine !== undefined) {
      if (editStartLine <= q.startLine) {
        q.startLine += lineDelta;
        q.endLine += lineDelta;
      } else if (editStartLine > q.startLine && editStartLine <= q.endLine) {
        q.endLine += lineDelta;
        if (q.endLine < q.startLine) {
          q.endLine = q.startLine;
        }
      }
    }
  }

  return fileLocks;
}

export type TerminateLockResult =
  | { status: 'terminated'; lock: FileLock; clearedWaiters: QueueEntry[] }
  | { status: 'not_found' };

export function terminateLockOnUnitDeletion(
  roomId: number,
  fileId: number,
  userId: number,
  lockId: string
): TerminateLockResult {
  const key = `${roomId}:${fileId}`;
  let fileLocks = locks.get(key) ?? [];

  const lockIndex = fileLocks.findIndex(l => l.id === lockId && l.userId === userId);
  if (lockIndex === -1) {
    return { status: 'not_found' };
  }

  const terminatedLock = fileLocks[lockIndex]!;
  fileLocks.splice(lockIndex, 1);

  if (fileLocks.length === 0) {
    locks.delete(key);
  } else {
    locks.set(key, fileLocks);
  }

  // Remove queued waiters that were waiting for this specific deleted unit
  const queue = queues.get(key) ?? [];
  const clearedWaiters: QueueEntry[] = [];
  const remainingQueue: QueueEntry[] = [];

  for (const q of queue) {
    const isOverlapWithDeleted = checkOverlap(terminatedLock, q);
    if (isOverlapWithDeleted) {
      clearedWaiters.push(q);
    } else {
      remainingQueue.push(q);
    }
  }

  if (remainingQueue.length === 0) {
    queues.delete(key);
  } else {
    queues.set(key, remainingQueue);
  }

  return { status: 'terminated', lock: terminatedLock, clearedWaiters };
}
