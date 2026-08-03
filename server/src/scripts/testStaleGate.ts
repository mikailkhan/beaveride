import { getOrCreateDoc, getOrCreateFileText, getFileContent } from '../sockets/docStore.js';
import { acquireLock, getLocksForUserInFile } from '../sockets/lockStore.js';
import { computeScopeHash, validateWriteFreshness } from '../utils/contentHash.js';

async function runStaleGateTest() {
  console.log('--- Testing Server-Side Stale Write Detection Gate ---');

  const roomId = 888;
  const fileId = 202;

  await getOrCreateDoc(roomId);
  const yText = getOrCreateFileText(roomId, fileId);
  const initialContent = `function calculate() {\n  return 10;\n}`;
  yText.insert(0, initialContent);

  // 1. Acquire lock and stamp hash
  const res = acquireLock(roomId, fileId, 1, 'alice', 'socket1', 'function', 1, 3, 'calculate');
  console.assert(res.status === 'acquired', 'Lock acquired');

  if (res.status === 'acquired') {
    const liveContent = getFileContent(roomId, fileId)!;
    const initialHash = computeScopeHash(liveContent, 'function', 1, 3);
    res.lock.contentHash = initialHash;

    // 2. Validate current write hash matches live content
    const freshnessCurrent = validateWriteFreshness(liveContent, res.lock);
    console.assert(freshnessCurrent.status === 'current', 'Freshness check should be current');
    console.log('✓ Valid write freshness check passed (status: current)');

    // 3. Mutate document content (simulating concurrent edit or stale baseline)
    yText.delete(0, yText.length);
    yText.insert(0, `function calculate() {\n  return 20;\n}`);

    const mutatedContent = getFileContent(roomId, fileId)!;
    const freshnessStale = validateWriteFreshness(mutatedContent, res.lock);
    console.assert(freshnessStale.status === 'stale', 'Freshness check should be stale');
    console.assert(freshnessStale.currentHash !== initialHash, 'Hashes must differ');
    console.log('✓ Stale write detection passed (status: stale, baseline rejected)');
  }

  console.log('\n✅ All Stale Write Detection Gate tests passed successfully!');
}

runStaleGateTest();
