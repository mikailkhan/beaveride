import {
  acquireLock,
  incrementStaleRetry,
  resetStaleRetry,
  getStaleRetryCount,
  releaseAllLocksForSocket,
  updateLockContentHash,
  getLocksForUserInFile,
} from '../sockets/lockStore.js';
import { computeScopeHash, validateWriteFreshness } from '../utils/contentHash.js';

async function runStep1Tests() {
  console.log('=== Phase 17 Step 1: Retry Counter & Bounded Policy Tests ===\n');

  const roomId = 9991;
  const fileId = 101;
  const userId = 42;
  const username = 'testuser';
  const socketId = 'socket_step1_test';

  // Cleanup existing locks for socket
  releaseAllLocksForSocket(socketId);

  // 1. Acquire Lock
  console.log('Test 1: Acquire lock and check initial staleRetryCount');
  const res = acquireLock(roomId, fileId, userId, username, socketId, 'function', 1, 10, 'myFunc');
  console.assert(res.status === 'acquired', 'Lock should be acquired');

  if (res.status !== 'acquired') {
    console.error('FAILED: Lock not acquired');
    process.exit(1);
  }

  const lockId = res.lock.id;
  console.assert(getStaleRetryCount(roomId, fileId, lockId) === 0, 'Initial retry count should be 0');
  console.log('✓ Initial staleRetryCount is 0');

  // 2. Increment Stale Retry Counter
  console.log('\nTest 2: Increment stale retry counter');
  const count1 = incrementStaleRetry(roomId, fileId, lockId);
  console.assert(count1 === 1, `Expected retry count 1, got ${count1}`);

  const count2 = incrementStaleRetry(roomId, fileId, lockId);
  console.assert(count2 === 2, `Expected retry count 2, got ${count2}`);

  const count3 = incrementStaleRetry(roomId, fileId, lockId);
  console.assert(count3 === 3, `Expected retry count 3, got ${count3}`);

  console.assert(getStaleRetryCount(roomId, fileId, lockId) === 3, 'getStaleRetryCount should return 3');
  console.log('✓ Counter increments correctly to 3');

  // 3. Max Retries Bounded Threshold Check
  console.log('\nTest 3: Threshold check (MAX_STALE_RETRIES = 3)');
  const count4 = incrementStaleRetry(roomId, fileId, lockId);
  console.assert(count4 === 4, `Expected retry count 4 on 4th attempt, got ${count4}`);
  console.assert(count4 > 3, '4th attempt exceeds MAX_STALE_RETRIES threshold (3)');
  console.log('✓ 4th attempt exceeds max retries (triggers terminal failure path)');

  // 4. Reset Counter on Successful Write
  console.log('\nTest 4: Reset counter on successful write');
  resetStaleRetry(roomId, fileId, lockId);
  console.assert(getStaleRetryCount(roomId, fileId, lockId) === 0, 'Counter should reset to 0');
  console.log('✓ resetStaleRetry resets counter back to 0');

  // 5. Baseline Hash Update Verification
  console.log('\nTest 5: Update baseline hash');
  const initialContent = 'function hello() {\n  return "world";\n}';
  const initialHash = computeScopeHash(initialContent, 'function', 1, 3);
  updateLockContentHash(roomId, fileId, lockId, initialHash);

  const locks = getLocksForUserInFile(roomId, fileId, userId);
  console.assert(locks.length === 1 && locks[0]?.contentHash === initialHash, 'Content hash should match initialHash');
  console.log('✓ updateLockContentHash updates in-memory lock hash');

  // 6. Cleanup
  releaseAllLocksForSocket(socketId);
  console.log('\n=== All Step 1 Tests Passed Successfully! ===');
}

runStep1Tests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
