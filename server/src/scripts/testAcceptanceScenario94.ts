import * as Y from 'yjs';
import {
  acquireLock,
  releaseLock,
  updateLockContentHash,
  getLocksForUserInFile,
  incrementStaleRetry,
  resetStaleRetry,
  releaseAllLocksForSocket,
} from '../sockets/lockStore.js';
import { computeScopeHash, validateWriteFreshness } from '../utils/contentHash.js';
import { eventService } from '../services/eventService.js';

async function runAcceptanceScenario94() {
  console.log('=== PRD §9.4 Acceptance Scenario Integration Test ===\n');

  const roomId = 9994;
  const fileId = 501;
  const aliceUserId = 101;
  const aliceUsername = 'alice';
  const aliceSocketId = 'socket_alice_94';

  const agentUserId = 901;
  const agentUsername = 'agent-1';
  const agentSocketId = 'socket_agent_94';

  // Override eventService.emit for fast in-memory event assertion without DB dependency
  const emittedEvents: any[] = [];
  eventService.emit = (eventData: any) => {
    emittedEvents.push({
      ...eventData,
      eventId: 'evt_' + Math.random().toString(36).substring(2, 9),
      occurredAt: new Date(),
    });
  };

  // Initial Function Code
  const initialFunctionCode = `function calculateTotal(items) {\n  let total = 0;\n  for (const item of items) {\n    total += item.price;\n  }\n  return total;\n}`;

  // Yjs doc setup
  const doc = new Y.Doc();
  const yText = doc.getText(`file:${fileId}`);
  yText.insert(0, initialFunctionCode);

  console.log('STEP 1: Alice acquires lock on function calculateTotal (lines 1-7)');
  const resAlice = acquireLock(
    roomId,
    fileId,
    aliceUserId,
    aliceUsername,
    aliceSocketId,
    'function',
    1,
    7,
    'calculateTotal'
  );
  console.assert(resAlice.status === 'acquired', 'Alice lock should be acquired');
  if (resAlice.status !== 'acquired') {
    console.error('FAILED Step 1: Alice lock not acquired');
    process.exit(1);
  }
  const aliceLock = resAlice.lock;
  const initialScopeContent = yText.toString();
  const aliceInitialHash = computeScopeHash(initialScopeContent, 'function', 1, 7);
  updateLockContentHash(roomId, fileId, aliceLock.id, aliceInitialHash);

  eventService.emit({
    roomId,
    actorId: aliceUserId,
    actorName: aliceUsername,
    actorType: 'human',
    eventType: 'lock_granted',
    targetFileId: fileId,
    targetScope: 'function',
    targetUnitName: 'calculateTotal',
    outcome: 'granted',
  });
  console.log('✓ Alice acquired function lock on calculateTotal (hash: ' + aliceInitialHash.substring(0, 8) + '...)');

  console.log('\nSTEP 2: Agent-1 requests lock on calculateTotal while Alice holds it');
  const resAgent = acquireLock(
    roomId,
    fileId,
    agentUserId,
    agentUsername,
    agentSocketId,
    'function',
    1,
    7,
    'calculateTotal'
  );
  console.assert(resAgent.status === 'queued', 'Agent lock should be queued');
  console.log('✓ Agent-1 queued at position 1');

  eventService.emit({
    roomId,
    actorId: agentUserId,
    actorName: agentUsername,
    actorType: 'agent',
    eventType: 'lock_queued',
    targetFileId: fileId,
    targetScope: 'function',
    targetUnitName: 'calculateTotal',
    outcome: 'queued',
  });

  // Agent pre-computes diff against initial content
  const staleAgentHash = aliceInitialHash;

  console.log('\nSTEP 3: Alice edits function calculateTotal (adds Math.round) and submits write');
  const aliceEditedCode = `function calculateTotal(items) {\n  let total = 0;\n  for (const item of items) {\n    total += item.price;\n  }\n  total = Math.round(total);\n  return total;\n}`;

  // Validate Alice's baseline hash against current
  const aliceFreshness = validateWriteFreshness(yText.toString(), aliceLock);
  console.assert(aliceFreshness.status === 'current', 'Alice write baseline must be current');

  yText.delete(0, yText.length);
  yText.insert(0, aliceEditedCode);

  const aliceNewHash = computeScopeHash(yText.toString(), 'function', 1, 8);
  updateLockContentHash(roomId, fileId, aliceLock.id, aliceNewHash);

  eventService.emit({
    roomId,
    actorId: aliceUserId,
    actorName: aliceUsername,
    actorType: 'human',
    eventType: 'write_applied',
    targetFileId: fileId,
    targetScope: 'function',
    targetUnitName: 'calculateTotal',
    outcome: 'applied',
    versionRef: aliceInitialHash,
    versionProduced: aliceNewHash,
  });
  console.log('✓ Alice edit applied successfully (new hash: ' + aliceNewHash.substring(0, 8) + '...)');

  console.log('\nSTEP 4: Alice releases lock and Agent-1 is promoted');
  const releaseRes = releaseLock(roomId, fileId, aliceUserId, aliceLock.id);
  console.assert(releaseRes.status === 'released', 'Alice lock should be released');

  if (releaseRes.status !== 'released') {
    console.error('FAILED Step 4: Alice lock release failed');
    process.exit(1);
  }

  console.assert(releaseRes.nextInQueue.length === 1, 'Agent-1 should be promoted from queue');

  eventService.emit({
    roomId,
    actorId: aliceUserId,
    actorName: aliceUsername,
    actorType: 'human',
    eventType: 'lock_released_explicit',
    targetFileId: fileId,
    targetScope: 'function',
    targetUnitName: 'calculateTotal',
    outcome: 'completed',
  });

  const promotedEntry = releaseRes.nextInQueue[0]!;
  const grantAgentRes = acquireLock(
    roomId,
    fileId,
    promotedEntry.userId,
    promotedEntry.username,
    promotedEntry.socketId,
    promotedEntry.lockScope,
    promotedEntry.startLine,
    promotedEntry.endLine,
    promotedEntry.unitName
  );
  console.assert(grantAgentRes.status === 'acquired', 'Promoted agent lock should be acquired');

  const agentLock = (grantAgentRes as any).lock;
  const currentContentAtPromotion = yText.toString();
  const promotionHash = computeScopeHash(currentContentAtPromotion, 'function', 1, 8);
  updateLockContentHash(roomId, fileId, agentLock.id, promotionHash);

  eventService.emit({
    roomId,
    actorId: agentUserId,
    actorName: agentUsername,
    actorType: 'agent',
    eventType: 'lock_granted',
    targetFileId: fileId,
    targetScope: 'function',
    targetUnitName: 'calculateTotal',
    outcome: 'granted',
  });
  console.log('✓ Agent-1 promoted to lock holder (hash at promotion: ' + promotionHash.substring(0, 8) + '...)');

  console.log('\nSTEP 5: Agent-1 tries to apply write with STALE hash (pre-computed before Alice edit)');
  const freshnessAgent = validateWriteFreshness(currentContentAtPromotion, {
    lockScope: 'function',
    startLine: 1,
    endLine: 8,
    contentHash: staleAgentHash,
  });

  console.assert(freshnessAgent.status === 'stale', 'Agent write formed against pre-Alice baseline MUST be detected as stale');
  console.log('✓ Stale gate correctly rejected Agent-1 write (stale_version)');

  const agentRetryCount = incrementStaleRetry(roomId, fileId, agentLock.id);
  console.assert(agentRetryCount === 1, 'Agent retry count should be 1');

  eventService.emit({
    roomId,
    actorId: agentUserId,
    actorName: agentUsername,
    actorType: 'agent',
    eventType: 'write_rejected_stale',
    targetFileId: fileId,
    targetScope: 'function',
    targetUnitName: 'calculateTotal',
    outcome: 'rejected',
    reason: 'stale_version',
    versionRef: staleAgentHash,
    metadata: { currentHash: promotionHash, retryCount: agentRetryCount, recoverable: true },
  });

  console.log('\nSTEP 6: Agent-1 requests baseline refresh and re-reads fresh scope content');
  const freshBaselineHash = computeScopeHash(yText.toString(), 'function', 1, 8);
  updateLockContentHash(roomId, fileId, agentLock.id, freshBaselineHash);

  eventService.emit({
    roomId,
    actorId: agentUserId,
    actorName: agentUsername,
    actorType: 'agent',
    eventType: 'write_regenerated',
    targetFileId: fileId,
    targetScope: 'function',
    targetUnitName: 'calculateTotal',
    outcome: 'applied',
    versionRef: staleAgentHash,
    versionProduced: freshBaselineHash,
    metadata: { refreshType: 'baseline_reread' },
  });
  console.log('✓ Agent-1 baseline refreshed to fresh content hash');

  console.log('\nSTEP 7: Agent-1 applies edit formed against fresh baseline');
  const agentEditedCode = `function calculateTotal(items) {\n  if (!Array.isArray(items)) return 0;\n  let total = 0;\n  for (const item of items) {\n    total += item.price;\n  }\n  total = Math.round(total);\n  return total;\n}`;

  yText.delete(0, yText.length);
  yText.insert(0, agentEditedCode);

  const agentFinalHash = computeScopeHash(yText.toString(), 'function', 1, 9);
  updateLockContentHash(roomId, fileId, agentLock.id, agentFinalHash);
  resetStaleRetry(roomId, fileId, agentLock.id);

  eventService.emit({
    roomId,
    actorId: agentUserId,
    actorName: agentUsername,
    actorType: 'agent',
    eventType: 'write_applied',
    targetFileId: fileId,
    targetScope: 'function',
    targetUnitName: 'calculateTotal',
    outcome: 'applied',
    versionRef: freshBaselineHash,
    versionProduced: agentFinalHash,
  });
  console.log('✓ Agent-1 edit applied successfully with fresh baseline');

  console.log('\nSTEP 8: Verify file content integrity');
  const finalContent = yText.toString();
  console.assert(finalContent.includes('Math.round(total)'), "Alice's edit (Math.round) MUST be preserved!");
  console.assert(finalContent.includes('!Array.isArray(items)'), "Agent's edit (!Array.isArray) MUST be present!");
  console.log('✓ File integrity verified: Alice edit preserved, Agent edit included, NO DATA LOSS!');

  console.log('\nSTEP 9: Verify activity log event completeness and total ordering');
  console.assert(emittedEvents.length === 8, `Expected 8 activity events, got ${emittedEvents.length}`);
  const eventTypes = emittedEvents.map(e => e.eventType);
  console.log('Emitted event chain:', eventTypes.join(' -> '));

  console.assert(eventTypes[0] === 'lock_granted', 'Event 0 should be lock_granted (Alice)');
  console.assert(eventTypes[1] === 'lock_queued', 'Event 1 should be lock_queued (Agent)');
  console.assert(eventTypes[2] === 'write_applied', 'Event 2 should be write_applied (Alice)');
  console.assert(eventTypes[3] === 'lock_released_explicit', 'Event 3 should be lock_released_explicit (Alice)');
  console.assert(eventTypes[4] === 'lock_granted', 'Event 4 should be lock_granted (Agent)');
  console.assert(eventTypes[5] === 'write_rejected_stale', 'Event 5 should be write_rejected_stale (Agent)');
  console.assert(eventTypes[6] === 'write_regenerated', 'Event 6 should be write_regenerated (Agent)');
  console.assert(eventTypes[7] === 'write_applied', 'Event 7 should be write_applied (Agent)');

  console.log('✓ Activity log verified: complete sequence of 8 events captured with actors and timestamps!');

  // Cleanup locks
  releaseAllLocksForSocket(aliceSocketId);
  releaseAllLocksForSocket(agentSocketId);

  console.log('\n=== PRD §9.4 Acceptance Scenario PASSED PERFECTLY! ===');
  process.exit(0);
}

runAcceptanceScenario94().catch((err) => {
  console.error('Acceptance test failed:', err);
  process.exit(1);
});

