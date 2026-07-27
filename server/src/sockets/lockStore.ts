export interface FileLock {
  fileId: number;
  userId: number;
  username: string;
  socketId: string;
  lockScope: 'file' | 'function';
  acquiredAt: number;
  lastHeartbeat: number;
}

export interface QueueEntry {
  userId: number;
  username: string;
  socketId: string;
  requestedAt: number;
}

const HEARTBEAT_TIMEOUT_MS = 30_000; // 30 seconds — if no heartbeat in this window, auto-release

const locks = new Map<string, FileLock>(); // key: `${roomId}:${fileId}`
const queues = new Map<string, QueueEntry[]>(); // key: `${roomId}:${fileId}`

export type AcquireLockResult =
  | { status: 'acquired'; lock: FileLock }
  | { status: 'queued'; position: number; heldBy: { userId: number; username: string } }
  | { status: 'already_held' }; // caller already holds this lock

export function acquireLock(
  roomId: number,
  fileId: number,
  userId: number,
  username: string,
  socketId: string,
  lockScope: 'file' | 'function'
): AcquireLockResult {
  const key = `${roomId}:${fileId}`;
  const existing = locks.get(key);

  // If the same user already holds the lock, return early
  if (existing && existing.userId === userId) {
    return { status: 'already_held' };
  }

  // If no lock exists, grant it immediately
  if (!existing) {
    const lock: FileLock = {
      fileId,
      userId,
      username,
      socketId,
      lockScope,
      acquiredAt: Date.now(),
      lastHeartbeat: Date.now(),
    };
    locks.set(key, lock);
    return { status: 'acquired', lock };
  }

  // Lock exists and is held by someone else — add to queue
  let queue = queues.get(key);
  if (!queue) {
    queue = [];
    queues.set(key, queue);
  }

  // Don't add duplicate queue entries for the same user
  const alreadyQueued = queue.some((q) => q.userId === userId);
  if (!alreadyQueued) {
    queue.push({ userId, username, socketId, requestedAt: Date.now() });
  }

  const position = queue.findIndex((q) => q.userId === userId) + 1;
  return {
    status: 'queued',
    position,
    heldBy: { userId: existing.userId, username: existing.username },
  };
}

export type ReleaseLockResult =
  | { status: 'released'; nextInQueue: QueueEntry | null }
  | { status: 'not_held' };

export function releaseLock(
  roomId: number,
  fileId: number,
  userId: number
): ReleaseLockResult {
  const key = `${roomId}:${fileId}`;
  const existing = locks.get(key);

  if (!existing || existing.userId !== userId) {
    return { status: 'not_held' };
  }

  locks.delete(key);

  // Check queue — promote next user
  const queue = queues.get(key);
  const next = queue?.shift() ?? null;

  // Clean up empty queue
  if (queue && queue.length === 0) {
    queues.delete(key);
  }

  return { status: 'released', nextInQueue: next };
}

export function refreshHeartbeat(roomId: number, fileId: number, userId: number): boolean {
  const key = `${roomId}:${fileId}`;
  const existing = locks.get(key);
  if (!existing || existing.userId !== userId) return false;
  existing.lastHeartbeat = Date.now();
  return true;
}

export interface ReleasedLock {
  roomId: number;
  fileId: number;
  lock: FileLock;
  nextInQueue: QueueEntry | null;
}

export function releaseAllLocksForSocket(socketId: string): ReleasedLock[] {
  const released: ReleasedLock[] = [];

  for (const [key, lock] of locks.entries()) {
    if (lock.socketId === socketId) {
      const parts = key.split(':');
      if (!parts[0] || !parts[1]) continue;
      const roomId = parseInt(parts[0], 10);
      const fileId = parseInt(parts[1], 10);

      locks.delete(key);

      const queue = queues.get(key);
      const next = queue?.shift() ?? null;
      if (queue && queue.length === 0) {
        queues.delete(key);
      }

      released.push({ roomId, fileId, lock, nextInQueue: next });
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

export function getExpiredLocks(): Array<{ key: string; lock: FileLock }> {
  const now = Date.now();
  const expired: Array<{ key: string; lock: FileLock }> = [];

  for (const [key, lock] of locks.entries()) {
    if (now - lock.lastHeartbeat > HEARTBEAT_TIMEOUT_MS) {
      expired.push({ key, lock });
    }
  }

  return expired;
}

export function getLocksForRoom(roomId: number): FileLock[] {
  const result: FileLock[] = [];
  const prefix = `${roomId}:`;
  for (const [key, lock] of locks.entries()) {
    if (key.startsWith(prefix)) {
      result.push(lock);
    }
  }
  return result;
}

export function getQueueForFile(roomId: number, fileId: number): QueueEntry[] {
  const key = `${roomId}:${fileId}`;
  return queues.get(key) ?? [];
}
