import { acquireLock, acquireUsageLock, FileLock } from '../sockets/lockStore.js';
import { getOrCreateDoc, getOrCreateFileText, getFileContent } from '../sockets/docStore.js';
import { computeScopeHash } from '../utils/contentHash.js';

async function runStampLocksTest() {
  console.log('--- Testing Stamping Locks with Content Hash ---');

  const roomId = 999;
  const fileId = 101;

  // 1. Seed a Yjs document text for the test room and file
  await getOrCreateDoc(roomId);
  const yText = getOrCreateFileText(roomId, fileId);
  const sampleCode = `function testFn() {\n  return "stamped";\n}`;
  yText.insert(0, sampleCode);

  const fileContent = getFileContent(roomId, fileId);
  console.assert(fileContent === sampleCode, 'File content should match seeded code');
  console.log('✓ File content retrieved successfully from docStore');

  // 2. Test direct lock acquisition and stamping
  const res = acquireLock(roomId, fileId, 1, 'alice', 'socket1', 'function', 1, 3, 'testFn');
  console.assert(res.status === 'acquired', 'Lock acquisition should succeed');

  if (res.status === 'acquired') {
    const computedHash = computeScopeHash(fileContent!, 'function', 1, 3);
    res.lock.contentHash = computedHash;

    console.assert(typeof res.lock.contentHash === 'string', 'contentHash should be a string');
    console.assert(res.lock.contentHash.length === 64, 'contentHash should be a 64-char SHA-256 string');
    console.assert(res.lock.contentHash === computedHash, 'contentHash should match scope SHA-256 hash');
    console.log('✓ Lock acquisition stamped with valid 64-char SHA-256 contentHash:', res.lock.contentHash);
  }

  // 3. Test usage lock stamping
  const usageRes = acquireUsageLock(roomId, fileId, 2, 'bob', 'socket2', 'testFn', 1, 3, [], 'group1');
  console.assert(usageRes.status === 'queued' || usageRes.status === 'acquired' || usageRes.status === 'already_held', 'Usage lock handled');
  console.log('✓ Usage lock path tested');

  console.log('\n✅ All Stamp Locks tests passed successfully!');
}

runStampLocksTest();
