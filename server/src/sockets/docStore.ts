import * as Y from 'yjs';
import { SnapshotRepository } from '../repositories/snapshotRepository.js';
import { FileRepository } from '../repositories/fileRepository.js';
import { clearActivities } from './activityStore.js';

const snapshotRepository = new SnapshotRepository();
const fileRepository = new FileRepository();

interface CachedDoc {
  doc: Y.Doc;
  dirty: boolean;
  connectionCount: number;
  lastModifiedBy: number | null;
  loadPromise?: Promise<Y.Doc>;
}

const cache = new Map<number, CachedDoc>();

async function seedDocFromDb(roomId: number, doc: Y.Doc): Promise<void> {
  try {
    const files = await fileRepository.getFileTree(roomId);
    const filesMap = doc.getMap('files');
    for (const file of files) {
      if (file.type === 'file') {
        const key = `file:${file.id}`;
        if (!filesMap.has(key)) {
          const yText = new Y.Text();
          yText.insert(0, file.content || '');
          filesMap.set(key, yText);
        }
      }
    }
  } catch (err) {
    console.error(`Error seeding doc from DB for room ${roomId}:`, err);
  }
}

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
        await seedDocFromDb(roomId, cached!.doc);
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

export function getOrCreateFileText(roomId: number, fileId: number): Y.Text {
  const cached = cache.get(roomId);
  if (!cached) {
    throw new Error(`Room ${roomId} doc not found in cache`);
  }
  const filesMap = cached.doc.getMap('files');
  const key = `file:${fileId}`;
  let yText = filesMap.get(key) as Y.Text | undefined;
  if (!yText) {
    yText = new Y.Text();
    filesMap.set(key, yText);
    cached.dirty = true;
  }
  return yText;
}

export function deleteFileText(roomId: number, fileId: number): void {
  const cached = cache.get(roomId);
  if (!cached) return;
  const filesMap = cached.doc.getMap('files');
  const key = `file:${fileId}`;
  if (filesMap.has(key)) {
    filesMap.delete(key);
    cached.dirty = true;
  }
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

    // Save individual file contents back to project_files table
    const filesMap = cached.doc.getMap('files');
    for (const key of filesMap.keys()) {
      if (key.startsWith('file:')) {
        const fileIdStr = key.substring(5);
        const fileId = parseInt(fileIdStr, 10);
        if (!isNaN(fileId)) {
          const yText = filesMap.get(key) as Y.Text;
          await fileRepository.updateFileContent(fileId, yText.toString());
        }
      }
    }

    cached.dirty = false;
    console.info(`Persisted snapshot and file contents for room ${roomId}`);
  } catch (err) {
    console.error(`Failed to persist room ${roomId} to DB:`, err);
  }
}

export async function decrementConnections(roomId: number): Promise<void> {
  const cached = cache.get(roomId);
  if (!cached) return;

  cached.connectionCount--;
  console.info(`Room ${roomId} connection count decremented to ${cached.connectionCount}`);

  if (cached.connectionCount <= 0) {
    if (cached.dirty) {
      await persistDoc(roomId);
    }
    cache.delete(roomId);
    clearActivities(roomId);
    console.info(`Room ${roomId} connection count is 0. Saved and removed doc from cache. Activities cleared.`);
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
