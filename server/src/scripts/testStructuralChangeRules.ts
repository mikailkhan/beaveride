import { acquireLock, terminateLockOnUnitDeletion, FileLock } from '../sockets/lockStore.js';

console.log('====================================');
console.log('Testing Structural Change Rules (Phase 13 Step 6)');
console.log('====================================\n');

let errors = 0;
const roomId = 666;
const fileId = 404;

// 1. User 1 acquires function lock on calculateTotal (lines 4-6)
const res1 = acquireLock(roomId, fileId, 1, 'Alice', 'socket-1', 'function', 4, 6, 'calculateTotal');

if (res1.status !== 'acquired') {
  console.error('❌ Lock acquisition failed');
  process.exit(1);
}

const aliceLock = res1.lock;
console.log(`Alice acquired lock on ${aliceLock.unitName} (lines ${aliceLock.startLine}-${aliceLock.endLine})`);

// 2. User 2 queues for calculateTotal (lines 4-6)
const res2 = acquireLock(roomId, fileId, 2, 'Bob', 'socket-2', 'function', 4, 6, 'calculateTotal');

if (res2.status === 'queued') {
  console.log(`Bob queued for ${aliceLock.unitName} at position ${res2.position}`);
} else {
  console.error('❌ Failed: Bob should be queued');
  errors++;
}

// 3. User 1 (holder) deletes calculateTotal
console.log('\n--- Simulating Unit Deletion by Holder (Alice) ---');
const termRes = terminateLockOnUnitDeletion(roomId, fileId, 1, aliceLock.id);

if (termRes.status === 'terminated') {
  console.log(`✅ Alice lock on ${termRes.lock.unitName} successfully terminated with reason target_deleted`);
} else {
  console.error('❌ Failed: Unit termination failed');
  errors++;
}

if (termRes.status === 'terminated' && termRes.clearedWaiters.length === 1) {
  console.log(`✅ Queued waiter (${termRes.clearedWaiters[0]?.username}) was removed from queue without being granted deleted target`);
} else {
  console.error('❌ Failed: Queued waiter was not properly cleared');
  errors++;
}

if (errors === 0) {
  console.log('\n🎉 ALL STRUCTURAL CHANGE RULE TESTS PASSED SUCCESSFULLY!');
} else {
  process.exit(1);
}
