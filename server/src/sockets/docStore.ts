import * as Y from 'yjs';
import { SnapshotRepository } from '../repositories/snapshotRepository.js';
import { clearActivities } from './activityStore.js';

const snapshotRepository = new SnapshotRepository();

interface CachedDoc {
  doc: Y.Doc;
  dirty: boolean;
  connectionCount: number;
  lastModifiedBy: number | null;
  loadPromise?: Promise<Y.Doc>;
}

const cache = new Map<number, CachedDoc>();

export async function getOrCreateDoc(roomId: number): Promise<Y.Doc> {
  let cached = cache.get(roomId);
  
  if (!cached) {
    cached = {
      doc: new Y.Doc(),
      dirty: false,
      connectionCount: 0,
      lastModifiedBy: null,
    };
    cache.set(roomId, cached);

    cached.loadPromise = (async () => {
      try {
        const snapshotBuffer = await snapshotRepository.getLatestSnapshot(roomId);
        if (snapshotBuffer) {
          Y.applyUpdate(cached!.doc, new Uint8Array(snapshotBuffer));
        }
      } catch (err) {
        console.error(`Error loading snapshot for room ${roomId}:`, err);
      }
      return cached!.doc;
    })();
  }

  cached.connectionCount++;
  
  if (cached.loadPromise) {
    await cached.loadPromise;
  }
  
  return cached.doc;
}

export function getDoc(roomId: number): Y.Doc | null {
  const cached = cache.get(roomId);
  return cached ? cached.doc : null;
}

export function updateDoc(roomId: number, update: Uint8Array, userId: number): void {
  const cached = cache.get(roomId);
  if (!cached) return;

  Y.applyUpdate(cached.doc, update);
  cached.dirty = true;
  cached.lastModifiedBy = userId;
}

export async function persistDoc(roomId: number): Promise<void> {
  const cached = cache.get(roomId);
  if (!cached || !cached.dirty || cached.lastModifiedBy === null) return;

  try {
    const stateUpdate = Y.encodeStateAsUpdate(cached.doc);
    const buffer = Buffer.from(stateUpdate.buffer, stateUpdate.byteOffset, stateUpdate.byteLength);
    await snapshotRepository.saveSnapshot(roomId, buffer, cached.lastModifiedBy);
    cached.dirty = false;
    console.log(`Persisted snapshot for room ${roomId}`);
  } catch (err) {
    console.error(`Failed to persist room ${roomId} to DB:`, err);
  }
}

export async function decrementConnections(roomId: number): Promise<void> {
  const cached = cache.get(roomId);
  if (!cached) return;

  cached.connectionCount--;
  console.log(`Room ${roomId} connection count decremented to ${cached.connectionCount}`);

  if (cached.connectionCount <= 0) {
    if (cached.dirty) {
      await persistDoc(roomId);
    }
    cache.delete(roomId);
    clearActivities(roomId);
    console.log(`Room ${roomId} connection count is 0. Saved and removed doc from cache. Activities cleared.`);
  }
}

export async function persistAllDirtyDocs(): Promise<void> {
  const rooms = Array.from(cache.keys());
  for (const roomId of rooms) {
    await persistDoc(roomId);
  }
}

// 30-second persistence interval
const intervalId = setInterval(async () => {
  await persistAllDirtyDocs();
}, 30000);

export function cleanupDocStore(): void {
  clearInterval(intervalId);
}
