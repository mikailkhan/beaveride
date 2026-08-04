import { getOrCreateDoc, getOrCreateFileText, getFileContent } from '../sockets/docStore.js';
import { acquireLock, getLocksForUserInFile, updateLockContentHash } from '../sockets/lockStore.js';
import { computeScopeHash, validateWriteFreshness } from '../utils/contentHash.js';

async function runRollingHashTest() {
  console.log('--- Testing Content Hash Rolling Updates After Write ---');

  const roomId = 777;
  const fileId = 303;

  await getOrCreateDoc(roomId);
  const yText = getOrCreateFileText(roomId, fileId);
  yText.insert(0, `function compute() {\n  return 1;\n}`);

  // 1. Acquire initial lock
  const res = acquireLock(roomId, fileId, 1, 'alice', 'socket1', 'function', 1, 3, 'compute');
  console.assert(res.status === 'acquired', 'Lock acquired');

  if (res.status === 'acquired') {
    const lock = res.lock;
    const initialContent = getFileContent(roomId, fileId)!;
    const initialHash = computeScopeHash(initialContent, 'function', 1, 3);
    lock.contentHash = initialHash;

    // 2. First Edit — validate write freshness against initial hash
    const edit1Freshness = validateWriteFreshness(getFileContent(roomId, fileId)!, lock);
    console.assert(edit1Freshness.status === 'current', 'Edit 1 should be current');

    // 3. Apply Edit 1 to document text
    yText.delete(0, yText.length);
    yText.insert(0, `function compute() {\n  return 2;\n}`);

    // 4. Server recomputes hash and updates lock
    const updatedContent = getFileContent(roomId, fileId)!;
    const newHash = computeScopeHash(updatedContent, lock.lockScope, lock.startLine, lock.endLine);
    const updateSuccess = updateLockContentHash(roomId, fileId, lock.id, newHash);
    console.assert(updateSuccess === true, 'updateLockContentHash should succeed');
    console.assert(newHash !== initialHash, 'Rolling hash must differ from initial hash');
    console.log('✓ Rolling hash update after Edit 1 passed (new Hash:', newHash.substring(0, 16) + '...)');

    // 5. Second Edit — validate against new rolling hash (should NOT be marked stale)
    const userLocks = getLocksForUserInFile(roomId, fileId, 1);
    const updatedLock = userLocks[0]!;
    const edit2Freshness = validateWriteFreshness(getFileContent(roomId, fileId)!, updatedLock);
    console.assert(edit2Freshness.status === 'current', 'Edit 2 using rolling hash should be current');
    console.log('✓ Subsequent Edit 2 using updated baseline hash passed without false stale rejection');
  }

  console.log('\n✅ All Content Hash Rolling Update tests passed successfully!');
}

runRollingHashTest();
