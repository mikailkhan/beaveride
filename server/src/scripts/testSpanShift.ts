import { acquireLock, adjustLockSpansOnEdit, FileLock } from '../sockets/lockStore.js';

console.log('====================================');
console.log('Testing Span Shift Tracking (Phase 13 Step 3)');
console.log('====================================\n');

let errors = 0;
const roomId = 888;
const fileId = 202;

// 1. Acquire initial lock on calculateTotal (lines 10-15)
const acqRes = acquireLock(roomId, fileId, 1, 'Alice', 'socket-1', 'function', 10, 15, 'calculateTotal');

if (acqRes.status !== 'acquired') {
  console.error('❌ Lock acquisition failed');
  process.exit(1);
}

const lock = acqRes.lock;
console.log(`Initial Lock: ${lock.unitName} at lines ${lock.startLine}-${lock.endLine}`);

// 2. Simulate inserting 3 lines above at line 4 (editStartLine = 4, lineDelta = +3)
adjustLockSpansOnEdit(roomId, fileId, 4, 3);
console.log(`After inserting 3 lines at line 4 -> Lock at lines ${lock.startLine}-${lock.endLine}`);

if (lock.startLine === 13 && lock.endLine === 18) {
  console.log('✅ Correctly shifted span down (+3) when edit occurred above span');
} else {
  console.error(`❌ Expected lines 13-18, got ${lock.startLine}-${lock.endLine}`);
  errors++;
}

// 3. Simulate holder adding 2 lines inside at line 15 (editStartLine = 15, lineDelta = +2)
adjustLockSpansOnEdit(roomId, fileId, 15, 2);
console.log(`After adding 2 lines inside at line 15 -> Lock at lines ${lock.startLine}-${lock.endLine}`);

if (lock.startLine === 13 && lock.endLine === 20) {
  console.log('✅ Correctly expanded endLine (+2) when edit occurred inside span');
} else {
  console.error(`❌ Expected lines 13-20, got ${lock.startLine}-${lock.endLine}`);
  errors++;
}

// 4. Simulate deleting 2 lines above at line 2 (editStartLine = 2, lineDelta = -2)
adjustLockSpansOnEdit(roomId, fileId, 2, -2);
console.log(`After deleting 2 lines at line 2 -> Lock at lines ${lock.startLine}-${lock.endLine}`);

if (lock.startLine === 11 && lock.endLine === 18) {
  console.log('✅ Correctly shifted span up (-2) when deletion occurred above span');
} else {
  console.error(`❌ Expected lines 11-18, got ${lock.startLine}-${lock.endLine}`);
  errors++;
}

if (errors === 0) {
  console.log('\n🎉 ALL SPAN SHIFT TRACKING TESTS PASSED SUCCESSFULLY!');
} else {
  process.exit(1);
}
