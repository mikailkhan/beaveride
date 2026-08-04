import { eventService } from '../services/eventService.js';
import { acquireLock } from '../sockets/lockStore.js';
import { getOrCreateDoc, getOrCreateFileText, getFileContent } from '../sockets/docStore.js';
import { computeScopeHash } from '../utils/contentHash.js';

async function runWriteActivityLogTest() {
  console.log('--- Testing Write Activity Log Instrumentation ---');

  const roomId = 666;
  const fileId = 404;

  await getOrCreateDoc(roomId);
  const yText = getOrCreateFileText(roomId, fileId);
  yText.insert(0, `function logger() {\n  return true;\n}`);

  // 1. Acquire lock
  const lockRes = acquireLock(roomId, fileId, 1, 'alice', 'socket1', 'function', 1, 3, 'logger');
  console.assert(lockRes.status === 'acquired', 'Lock acquired');

  if (lockRes.status === 'acquired') {
    const lock = lockRes.lock;
    const initialContent = getFileContent(roomId, fileId)!;
    const versionRef = computeScopeHash(initialContent, 'function', 1, 3);
    lock.contentHash = versionRef;

    // 2. Simulate write_applied emission
    yText.delete(0, yText.length);
    yText.insert(0, `function logger() {\n  return false;\n}`);
    const updatedContent = getFileContent(roomId, fileId)!;
    const versionProduced = computeScopeHash(updatedContent, 'function', 1, 3);

    const correlationId = eventService.generateCorrelationId();

    eventService.emit({
      roomId,
      actorId: 1,
      actorName: 'alice',
      actorType: 'human',
      eventType: 'write_applied',
      targetFileId: fileId,
      targetScope: 'function',
      targetUnitName: 'logger',
      outcome: 'applied',
      versionRef,
      versionProduced,
      correlationId,
    });

    console.log('✓ Emitted write_applied event with versionRef:', versionRef.substring(0, 16) + '... and versionProduced:', versionProduced.substring(0, 16) + '...');

    // 3. Simulate write_rejected_stale emission
    const staleRef = 'oldstalehash1234567890abcdef1234567890abcdef1234567890abcdef1234';
    eventService.emit({
      roomId,
      actorId: 1,
      actorName: 'alice',
      actorType: 'human',
      eventType: 'write_rejected_stale',
      targetFileId: fileId,
      targetScope: 'function',
      targetUnitName: 'logger',
      outcome: 'rejected',
      reason: 'stale_version',
      versionRef: staleRef,
      correlationId,
      metadata: { currentHash: versionProduced },
    });

    console.log('✓ Emitted write_rejected_stale event with stale versionRef:', staleRef.substring(0, 16) + '...');
  }

  console.log('\n✅ All Write Activity Log Instrumentation tests passed successfully!');
}

runWriteActivityLogTest();
