import { acquireLock, releaseLock, FileLock } from '../sockets/lockStore.js';

console.log('====================================');
console.log('Testing Scoped Lock Overlap (Phase 13 Step 2)');
console.log('====================================\n');

let errors = 0;
const roomId = 999;
const fileId = 101;

// Test 1: Non-overlapping function locks in same file (User 1: lines 4-6, User 2: lines 10-15)
console.log('--- Test 1: Non-overlapping function locks in same file ---');
const res1 = acquireLock(roomId, fileId, 1, 'Alice', 'socket-1', 'function', 4, 6, 'calculateTotal');
const res2 = acquireLock(roomId, fileId, 2, 'Bob', 'socket-2', 'function', 10, 15, 'fetchUserData');

if (res1.status === 'acquired' && res2.status === 'acquired') {
  console.log('✅ Non-overlapping function locks granted concurrently to Alice & Bob');
} else {
  console.error('❌ Failed: Non-overlapping function locks should both be granted');
  errors++;
}

// Test 2: Overlapping function lock (User 3: lines 5-12 - overlaps with Alice lines 4-6 and Bob lines 10-15)
console.log('\n--- Test 2: Overlapping function lock ---');
const res3 = acquireLock(roomId, fileId, 3, 'Charlie', 'socket-3', 'function', 5, 12, 'overlappingFn');

if (res3.status === 'queued' && res3.position === 1 && res3.heldBy.username === 'Alice') {
  console.log(`✅ Overlapping function lock correctly queued (Position: ${res3.position}, Held By: ${res3.heldBy.username})`);
} else {
  console.error('❌ Failed: Overlapping function lock should be queued');
  errors++;
}

// Test 3: File-scope lock request when function locks exist
console.log('\n--- Test 3: File-scope lock request when function locks exist ---');
const res4 = acquireLock(roomId, fileId, 4, 'Dave', 'socket-4', 'file');

if (res4.status === 'queued') {
  console.log('✅ File-scope lock request correctly queued because function locks exist');
} else {
  console.error('❌ Failed: File lock should be queued');
  errors++;
}

// Test 4: Release Alice lock (lines 4-6) -> Charlie (lines 5-12) still overlaps with Bob (lines 10-15) so Charlie remains queued
console.log('\n--- Test 4: Release Alice lock (lines 4-6) ---');
const aliceLockId = (res1 as { status: 'acquired'; lock: FileLock }).lock.id;
const releaseRes = releaseLock(roomId, fileId, 1, aliceLockId);

if (releaseRes.status === 'released') {
  console.log(`✅ Alice lock released. Next promoted count: ${releaseRes.nextInQueue.length}`);
} else {
  console.error('❌ Failed: Release lock failed');
  errors++;
}

if (errors === 0) {
  console.log('\n🎉 ALL SCOPED LOCK OVERLAP TESTS PASSED SUCCESSFULLY!');
} else {
  process.exit(1);
}
