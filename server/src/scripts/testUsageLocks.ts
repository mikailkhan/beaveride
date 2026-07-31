import { scanUsages } from '../utils/usageScanner.js';
import { acquireUsageLock, releaseLock, releaseGroupLocks, getLocksForRoom, acquireLock } from '../sockets/lockStore.js';

console.log('=== Phase 14: Usage Lock Test Suite ===\n');

// Test 1: Usage scanner
console.log('--- Test 1: Usage Scanner ---');
const files = [
  { fileId: 1, fileName: 'math.js', content: 'export function calculateTotal(items) {\n  return items.reduce((a, b) => a + b, 0);\n}' },
  { fileId: 2, fileName: 'cart.js', content: 'import { calculateTotal } from "./math";\n\nconst total = calculateTotal(prices);\nconsole.log(total);' },
  { fileId: 3, fileName: 'report.js', content: '// Uses calculateTotal for reports\nconst sum = calculateTotal(data);' },
  { fileId: 4, fileName: 'readme.md', content: 'This file mentions calculateTotal in docs.' },
];

const result = scanUsages('calculateTotal', 1, files);
console.log(`Found ${result.usages.length} usages:`);
for (const u of result.usages) {
  console.log(`  - ${u.fileName}:${u.startLine} → "${u.lineContent}"`);
}
if (result.usages.length < 3) {
  console.error('FAIL: Expected at least 3 usages across cart.js, report.js, and readme.md');
  process.exit(1);
}
console.log('PASS: Usage scanner test passed.\n');

// Test 2: Atomic acquisition
console.log('--- Test 2: Atomic Usage Lock Acquisition ---');
const spans = result.usages.map(u => ({ fileId: u.fileId, startLine: u.startLine, endLine: u.endLine }));
const acquireResult = acquireUsageLock(999, 1, 100, 'alice', 'sock1', 'calculateTotal', 1, 3, spans, 'group-1');
console.log(`Status: ${acquireResult.status}`);
if (acquireResult.status === 'acquired') {
  console.log(`Acquired ${acquireResult.locks.length} locks`);
  for (const l of acquireResult.locks) {
    console.log(`  - File ${l.fileId}: L${l.startLine}-L${l.endLine} (${l.unitName})`);
  }
} else {
  console.error('FAIL: Lock should have been acquired');
  process.exit(1);
}
console.log('PASS: Atomic usage lock acquisition passed.\n');

// Test 3: Conflict check
console.log('--- Test 3: Conflict Check (Bob tries to lock file 2) ---');
const bobResult = acquireLock(999, 2, 200, 'bob', 'sock2', 'file');
console.log(`Bob file lock on file 2: ${bobResult.status}`);
if (bobResult.status !== 'queued') {
  console.error('FAIL: Bob request should have queued due to usage lock on file 2');
  process.exit(1);
}
console.log('PASS: Conflict check passed.\n');

// Test 4: Group release
console.log('--- Test 4: Group Release ---');
const releaseResult = releaseGroupLocks(999, 'group-1', 100);
console.log(`Released ${releaseResult.releasedLocks.length} locks`);

// Simulate socket event queue promotion (roomNamespace.ts does this on lock release)
for (const rel of releaseResult.releasedLocks) {
  for (const next of rel.nextInQueue) {
    acquireLock(rel.roomId, rel.fileId, next.userId, next.username, next.socketId, next.lockScope, next.startLine, next.endLine, next.unitName);
  }
}

const remainingLocks = getLocksForRoom(999);
console.log(`Remaining locks in room: ${remainingLocks.length}`);
if (remainingLocks.length !== 1 || remainingLocks[0]?.userId !== 200) {
  console.error('FAIL: Bob should have been promoted after Alice group release');
  process.exit(1);
}
console.log('PASS: Group release & auto-promotion passed.\n');

console.log('=== ALL PHASE 14 TESTS PASSED SUCCESSFULLY ===');
